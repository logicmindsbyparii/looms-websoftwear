import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { logAuditEvent } from './auditService.js';
import jwt from 'jsonwebtoken';

// Constant dummy hash to mitigate timing attacks when user does not exist
const DUMMY_HASH = '$2a$12$e80yq9l.C/UfO8bB2Y4Qme1yN1YQ5w43wZ7lGvD2cI63bS1rZ9Z8S';

export class AuthService {
  static async login({ username, password, portalRole, ip, userAgent, req }) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      // Run dummy compare to balance execution time
      await bcrypt.compare(password || '', DUMMY_HASH);
      await logAuditEvent({
        action: 'AUTH_LOGIN_FAILED_UNKNOWN_USER',
        targetEntity: 'User',
        targetId: cleanUsername,
        details: { attemptedUsername: cleanUsername },
        req
      });
      throw new ApiError(401, 'Invalid username or password', 'AUTH_INVALID_CREDENTIALS');
    }

    // Check if account is currently locked
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      await logAuditEvent({
        action: 'AUTH_LOGIN_LOCKED_ATTEMPT',
        performedBy: { userId: user._id, username: user.username, role: user.role },
        targetEntity: 'User',
        targetId: user._id.toString(),
        details: { remainingMinutes },
        req
      });
      throw new ApiError(
        423,
        `Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMinutes} minute(s).`,
        'AUTH_ACCOUNT_LOCKED',
        { remainingMinutes, lockUntil: user.lockUntil }
      );
    }

    // Verify account active status
    if (!user.isActive) {
      throw new ApiError(403, 'Account has been deactivated. Please contact your mill manager.', 'AUTH_ACCOUNT_DEACTIVATED');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      const attemptsLeft = Math.max(0, 5 - user.failedLoginAttempts);

      await logAuditEvent({
        action: 'AUTH_LOGIN_FAILED_PASSWORD',
        performedBy: { userId: user._id, username: user.username, role: user.role },
        targetEntity: 'User',
        targetId: user._id.toString(),
        details: { failedAttempts: user.failedLoginAttempts },
        req
      });

      if (user.isLocked()) {
        throw new ApiError(
          423,
          'Maximum failed attempts reached. Account has been locked for 15 minutes.',
          'AUTH_ACCOUNT_LOCKED',
          { lockUntil: user.lockUntil, remainingMinutes: 15 }
        );
      }

      throw new ApiError(
        401,
        'Invalid username or password',
        'AUTH_INVALID_CREDENTIALS',
        { attemptsLeft }
      );
    }

    // Verify Portal Role Access
    if (portalRole && user.role !== portalRole && user.role !== 'Admin') {
      throw new ApiError(
        403,
        `You do not have permission to access the ${portalRole} Portal with your ${user.role} credentials.`,
        'AUTH_PORTAL_FORBIDDEN'
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactor && user.twoFactor.enabled) {
      const tempToken = jwt.sign(
        { sub: user._id.toString(), stage: '2FA_PENDING' },
        process.env.JWT_ACCESS_SECRET || 'secret',
        { expiresIn: '5m' }
      );
      return {
        twoFactorRequired: true,
        tempToken,
        user: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        }
      };
    }

    // Successful login: reset failed attempts
    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    user.lastLoginIp = String(ip || '');
    await user.save();

    // Create Refresh Token
    const { rawToken, tokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const deviceName = userAgent ? (userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser') : 'Workstation';

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      userAgent: String(userAgent || ''),
      ip: String(ip || ''),
      deviceName,
      expiresAt
    });

    const accessToken = generateAccessToken(user);

    await logAuditEvent({
      action: 'AUTH_LOGIN_SUCCESS',
      performedBy: { userId: user._id, username: user.username, role: user.role },
      targetEntity: 'User',
      targetId: user._id.toString(),
      details: { role: user.role, ip },
      req
    });

    return {
      twoFactorRequired: false,
      accessToken,
      refreshToken: rawToken,
      user
    };
  }

  static async refreshTokens({ rawRefreshToken, ip, userAgent, req }) {
    if (!rawRefreshToken) {
      throw new ApiError(401, 'Refresh token required', 'AUTH_REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await RefreshToken.findOne({ tokenHash });

    if (!existingToken) {
      throw new ApiError(401, 'Invalid refresh token session', 'AUTH_TOKEN_INVALID');
    }

    const user = await User.findById(existingToken.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account unavailable', 'AUTH_USER_UNAVAILABLE');
    }

    // Token Reuse / Theft Detection:
    // If an already revoked token is used again, someone may have stolen it!
    if (existingToken.revokedAt) {
      // Invalidate all tokens for this user!
      await RefreshToken.updateMany(
        { userId: user._id, revokedAt: null },
        { revokedAt: new Date(), replacedBy: 'SECURITY_ALERT_TOKEN_FAMILY_REVOCATION' }
      );
      user.tokenVersion += 1;
      await user.save();

      await logAuditEvent({
        action: 'AUTH_TOKEN_THEFT_DETECTED',
        performedBy: { userId: user._id, username: user.username, role: user.role },
        targetEntity: 'RefreshToken',
        targetId: existingToken._id.toString(),
        details: { tokenHash: existingToken.tokenHash },
        req
      });

      throw new ApiError(401, 'Security violation: Expired or reused token detected. All sessions revoked.', 'AUTH_TOKEN_REUSE_DETECTED');
    }

    if (existingToken.expiresAt < new Date()) {
      existingToken.revokedAt = new Date();
      await existingToken.save();
      throw new ApiError(401, 'Refresh token has expired', 'AUTH_TOKEN_EXPIRED');
    }

    // Rotate refresh token: revoke current and issue new
    const { rawToken: newRawToken, tokenHash: newTokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    existingToken.revokedAt = new Date();
    existingToken.replacedBy = newTokenHash;
    await existingToken.save();

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      userAgent: String(userAgent || ''),
      ip: String(ip || ''),
      deviceName: existingToken.deviceName,
      expiresAt
    });

    const accessToken = generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRawToken,
      user
    };
  }

  static async logout({ rawRefreshToken, user, req }) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date() }
      );
    }

    if (user) {
      await logAuditEvent({
        action: 'AUTH_LOGOUT',
        performedBy: { userId: user._id, username: user.username, role: user.role },
        targetEntity: 'User',
        targetId: user._id.toString(),
        req
      });
    }
  }

  static async logoutAll({ user, req }) {
    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date(), replacedBy: 'LOGOUT_ALL_DEVICES' }
    );
    user.tokenVersion += 1;
    await user.save();

    await logAuditEvent({
      action: 'AUTH_LOGOUT_ALL_SESSIONS',
      performedBy: { userId: user._id, username: user.username, role: user.role },
      targetEntity: 'User',
      targetId: user._id.toString(),
      req
    });
  }

  static async getActiveSessions(userId) {
    return RefreshToken.find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .select('_id deviceName ip userAgent createdAt updatedAt')
      .sort({ createdAt: -1 });
  }

  static async revokeSession({ userId, sessionId, req }) {
    const session = await RefreshToken.findOne({
      _id: sessionId,
      userId,
      revokedAt: null
    });

    if (!session) {
      throw new ApiError(404, 'Session not found or already terminated', 'SESSION_NOT_FOUND');
    }

    session.revokedAt = new Date();
    session.replacedBy = 'USER_MANUAL_REVOCATION';
    await session.save();

    await logAuditEvent({
      action: 'AUTH_SESSION_REVOKED',
      performedBy: { userId, role: 'User' },
      targetEntity: 'RefreshToken',
      targetId: sessionId,
      req
    });
  }
}

