import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { AuthService } from '../services/authService.js';
import { generateAccessToken, generateRefreshToken, getRefreshCookieOptions, hashToken } from '../config/jwt.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';
import { generate2FASecret, generateQRCode, verifyTOTP, generateRecoveryCodes } from '../utils/totp.js';
import { sendPasswordResetNotice } from '../services/emailService.js';
import { logAuditEvent } from '../services/auditService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLE_PERMISSIONS } from '../config/permissions.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required', 'VALIDATION_ERROR');
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await AuthService.login({
    username,
    password,
    portalRole: role,
    ip,
    userAgent,
    req
  });

  if (result.twoFactorRequired) {
    return res.status(200).json(
      new ApiResponse(200, {
        twoFactorRequired: true,
        tempToken: result.tempToken,
        user: result.user
      }, 'Two-factor authentication required')
    );
  }

  res.cookie('loomus_refresh_token', result.refreshToken, getRefreshCookieOptions());

  res.status(200).json(
    new ApiResponse(200, {
      accessToken: result.accessToken,
      user: result.user,
      permissions: ROLE_PERMISSIONS[result.user.role] || []
    }, 'Login successful')
  );
});

export const login2FA = asyncHandler(async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    throw new ApiError(400, 'Temporary token and 2FA code are required', 'VALIDATION_ERROR');
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET || 'secret');
  } catch (err) {
    throw new ApiError(401, '2FA session expired. Please sign in again.', 'AUTH_2FA_SESSION_EXPIRED');
  }

  if (decoded.stage !== '2FA_PENDING') {
    throw new ApiError(400, 'Invalid token state', 'AUTH_TOKEN_INVALID');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive || !user.twoFactor || !user.twoFactor.enabled) {
    throw new ApiError(400, 'Invalid 2FA state for user', 'AUTH_2FA_INVALID');
  }

  // Check code against TOTP or recovery codes
  const isValidTotp = verifyTOTP(code, user.twoFactor.secretEnc);
  let isRecoveryUsed = false;

  if (!isValidTotp) {
    const codeHash = crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
    const matchIndex = user.twoFactor.recoveryCodesHash.indexOf(codeHash);
    if (matchIndex >= 0) {
      isRecoveryUsed = true;
      user.twoFactor.recoveryCodesHash.splice(matchIndex, 1);
      await user.save();
    } else {
      throw new ApiError(401, 'Invalid 2FA code or recovery code', 'AUTH_2FA_CODE_INVALID');
    }
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const { rawToken, tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    userAgent: String(userAgent || ''),
    ip: String(ip || ''),
    deviceName: userAgent && userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    expiresAt
  });

  const accessToken = generateAccessToken(user);
  res.cookie('loomus_refresh_token', rawToken, getRefreshCookieOptions());

  await logAuditEvent({
    action: isRecoveryUsed ? 'AUTH_2FA_LOGIN_RECOVERY_CODE' : 'AUTH_2FA_LOGIN_SUCCESS',
    performedBy: { userId: user._id, username: user.username, role: user.role },
    targetEntity: 'User',
    targetId: user._id.toString(),
    req
  });

  res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user,
      permissions: ROLE_PERMISSIONS[user.role] || []
    }, '2FA verification successful')
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.loomus_refresh_token;
  if (!rawRefreshToken) {
    throw new ApiError(401, 'Session refresh cookie missing', 'AUTH_NO_REFRESH_COOKIE');
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await AuthService.refreshTokens({
    rawRefreshToken,
    ip,
    userAgent,
    req
  });

  res.cookie('loomus_refresh_token', result.refreshToken, getRefreshCookieOptions());

  res.status(200).json(
    new ApiResponse(200, {
      accessToken: result.accessToken,
      user: result.user,
      permissions: ROLE_PERMISSIONS[result.user.role] || []
    }, 'Tokens refreshed successfully')
  );
});

export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.loomus_refresh_token;
  await AuthService.logout({ rawRefreshToken, user: req.user, req });

  res.clearCookie('loomus_refresh_token', {
    httpOnly: true,
    path: '/api/auth'
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const logoutAll = asyncHandler(async (req, res) => {
  await AuthService.logoutAll({ user: req.user, req });

  res.clearCookie('loomus_refresh_token', {
    httpOnly: true,
    path: '/api/auth'
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out of all devices and active sessions'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      user: req.user,
      permissions: ROLE_PERMISSIONS[req.user.role] || []
    }, 'Profile retrieved')
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required', 'VALIDATION_ERROR');
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect current password', 'AUTH_INCORRECT_CURRENT_PASSWORD');
  }

  const policyCheck = validatePasswordPolicy(newPassword, user.username);
  if (!policyCheck.valid) {
    throw new ApiError(400, policyCheck.message, 'AUTH_WEAK_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();

  // Invalidate all existing refresh tokens
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date(), replacedBy: 'PASSWORD_CHANGED' }
  );

  // Issue new session
  const { rawToken, tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    userAgent: String(req.headers['user-agent'] || ''),
    ip: String(req.ip || ''),
    deviceName: 'Current Session',
    expiresAt
  });

  res.cookie('loomus_refresh_token', rawToken, getRefreshCookieOptions());
  const accessToken = generateAccessToken(user);

  await logAuditEvent({
    action: 'AUTH_PASSWORD_CHANGE',
    performedBy: { userId: user._id, username: user.username, role: user.role },
    targetEntity: 'User',
    targetId: user._id.toString(),
    req
  });

  res.status(200).json(
    new ApiResponse(200, { accessToken, user }, 'Password changed successfully')
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const cleanId = (identifier || '').trim().toLowerCase();

  // Look up user by username or email or phone
  const user = await User.findOne({
    $or: [{ username: cleanId }, { email: cleanId }, { phone: cleanId }]
  });

  if (user && user.isActive) {
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}?resetToken=${rawResetToken}`;
    await sendPasswordResetNotice({
      toEmail: user.email,
      toPhone: user.phone,
      username: user.username,
      resetToken: rawResetToken,
      resetLink,
      lang: user.preferredLanguage || 'en'
    });

    await logAuditEvent({
      action: 'AUTH_FORGOT_PASSWORD_REQUEST',
      targetEntity: 'User',
      targetId: user._id.toString(),
      req
    });
  }

  // Consistent generic response
  res.status(200).json(
    new ApiResponse(
      200,
      null,
      'If an active account matches the details provided, a password reset link has been dispatched.'
    )
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new ApiError(400, 'Reset token and new password are required', 'VALIDATION_ERROR');
  }

  const tokenHash = hashToken(token);
  const resetRecord = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!resetRecord) {
    throw new ApiError(400, 'Password reset link is invalid or has expired', 'AUTH_RESET_TOKEN_INVALID');
  }

  const user = await User.findById(resetRecord.userId);
  if (!user || !user.isActive) {
    throw new ApiError(400, 'User account is invalid or inactive', 'AUTH_USER_UNAVAILABLE');
  }

  const policyCheck = validatePasswordPolicy(newPassword, user.username);
  if (!policyCheck.valid) {
    throw new ApiError(400, policyCheck.message, 'AUTH_WEAK_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();

  resetRecord.used = true;
  await resetRecord.save();

  // Invalidate all active sessions
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date(), replacedBy: 'PASSWORD_RESET' }
  );

  await logAuditEvent({
    action: 'AUTH_PASSWORD_RESET_SUCCESS',
    performedBy: { userId: user._id, username: user.username, role: user.role },
    targetEntity: 'User',
    targetId: user._id.toString(),
    req
  });

  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully. Please log in with your new password.'));
});

export const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { secret, otpauth } = generate2FASecret(user.username);
  const qrCodeDataUrl = await generateQRCode(otpauth);

  res.status(200).json(
    new ApiResponse(200, { secret, qrCode: qrCodeDataUrl }, '2FA secret and QR code generated')
  );
});

export const verifyEnable2FA = asyncHandler(async (req, res) => {
  const { secret, code } = req.body;
  if (!secret || !code) {
    throw new ApiError(400, 'Secret and 6-digit code are required', 'VALIDATION_ERROR');
  }

  const isValid = verifyTOTP(code, secret);
  if (!isValid) {
    throw new ApiError(400, 'Invalid verification code. Please check your authenticator app.', 'AUTH_2FA_CODE_INVALID');
  }

  const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

  const user = await User.findById(req.user._id);
  user.twoFactor = {
    enabled: true,
    secretEnc: secret,
    recoveryCodesHash: hashedCodes
  };
  await user.save();

  await logAuditEvent({
    action: 'AUTH_2FA_ENABLED',
    performedBy: { userId: user._id, username: user.username, role: user.role },
    targetEntity: 'User',
    targetId: user._id.toString(),
    req
  });

  res.status(200).json(
    new ApiResponse(200, { recoveryCodes: plainCodes }, 'Two-Factor Authentication activated successfully. Save your recovery codes.')
  );
});

export const disable2FA = asyncHandler(async (req, res) => {
  const { password, code } = req.body;
  const user = await User.findById(req.user._id);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect password confirmation', 'AUTH_PASSWORD_INCORRECT');
  }

  if (code) {
    const isValid = verifyTOTP(code, user.twoFactor.secretEnc);
    if (!isValid) {
      throw new ApiError(400, 'Invalid 2FA code', 'AUTH_2FA_CODE_INVALID');
    }
  }

  user.twoFactor = {
    enabled: false,
    secretEnc: '',
    recoveryCodesHash: []
  };
  await user.save();

  await logAuditEvent({
    action: 'AUTH_2FA_DISABLED',
    performedBy: { userId: user._id, username: user.username, role: user.role },
    targetEntity: 'User',
    targetId: user._id.toString(),
    req
  });

  res.status(200).json(new ApiResponse(200, null, 'Two-Factor Authentication disabled'));
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await AuthService.getActiveSessions(req.user._id);
  res.status(200).json(new ApiResponse(200, sessions, 'Active sessions retrieved'));
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AuthService.revokeSession({ userId: req.user._id, sessionId: id, req });
  res.status(200).json(new ApiResponse(200, null, 'Session revoked'));
});

export const viewAs = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['Admin', 'Supervisor', 'Operator'].includes(role)) {
    throw new ApiError(400, 'Invalid target role for preview mode', 'VALIDATION_ERROR');
  }

  // Admin exclusive preview token
  const previewToken = jwt.sign(
    {
      sub: req.user._id.toString(),
      username: req.user.username,
      role, // Temporary effective role
      isPreview: true,
      originalRole: 'Admin'
    },
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  await logAuditEvent({
    action: 'AUTH_VIEW_AS_ROLE',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    details: { viewedRole: role },
    req
  });

  res.status(200).json(
    new ApiResponse(200, { previewToken, role }, `Previewing portal as ${role}`)
  );
});

export const updatePreferredLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  if (!['en', 'gu', 'hi', 'mr'].includes(language)) {
    throw new ApiError(400, 'Unsupported language code', 'VALIDATION_ERROR');
  }

  const user = await User.findById(req.user._id);
  user.preferredLanguage = language;
  await user.save();

  res.status(200).json(new ApiResponse(200, { preferredLanguage: language }, 'Language preference updated'));
});

