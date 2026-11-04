import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';
import { logAuditEvent } from '../services/auditService.js';

// List all users with filtering, search, pagination
export const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (status !== undefined) filter.isActive = status === 'active' || status === 'true';
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-twoFactor.secretEnc -twoFactor.recoveryCodesHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  res.status(200).json(
    new ApiResponse(200, users, 'Users retrieved', {
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    })
  );
});

// Create new user (Admin created -> temporary password, mustChangePassword: true)
export const createUser = asyncHandler(async (req, res) => {
  const { username, displayName, email, phone, role, password, assignedMachines } = req.body;

  if (!username || !displayName || !role) {
    throw new ApiError(400, 'Username, display name, and role are required', 'VALIDATION_ERROR');
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = await User.findOne({ username: cleanUsername });
  if (existing) {
    throw new ApiError(409, `User with username "${cleanUsername}" already exists`, 'DUPLICATE_USERNAME');
  }

  const initialPassword = password || `Loomus@${crypto.randomInt(1000, 9999)}!`;
  const policy = validatePasswordPolicy(initialPassword, cleanUsername);
  if (!policy.valid) {
    throw new ApiError(400, policy.message, 'AUTH_WEAK_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(initialPassword, salt);

  const newUser = await User.create({
    username: cleanUsername,
    displayName: displayName.trim(),
    email: (email || '').trim().toLowerCase(),
    phone: (phone || '').trim(),
    role,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
    assignedMachines: Array.isArray(assignedMachines) ? assignedMachines : [],
    createdBy: req.user._id
  });

  await logAuditEvent({
    action: 'USER_CREATED',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: newUser._id.toString(),
    details: { username: newUser.username, role: newUser.role },
    req
  });

  res.status(201).json(
    new ApiResponse(201, {
      user: newUser,
      temporaryPassword: initialPassword
    }, 'User created successfully with temporary password')
  );
});

// Update user details / role / machines
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { displayName, email, phone, role, isActive, assignedMachines } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Check last remaining admin protection
  if (targetUser.role === 'Admin' && (role && role !== 'Admin' || isActive === false)) {
    const adminCount = await User.countDocuments({ role: 'Admin', isActive: true });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot demote or deactivate the last remaining active Administrator', 'CANNOT_DEMOTE_LAST_ADMIN');
    }
  }

  if (displayName) targetUser.displayName = displayName.trim();
  if (email !== undefined) targetUser.email = (email || '').trim().toLowerCase();
  if (phone !== undefined) targetUser.phone = (phone || '').trim();
  if (role) targetUser.role = role;
  if (isActive !== undefined) targetUser.isActive = Boolean(isActive);
  if (assignedMachines) targetUser.assignedMachines = assignedMachines;

  await targetUser.save();

  await logAuditEvent({
    action: 'USER_UPDATED',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: targetUser._id.toString(),
    details: { role: targetUser.role, isActive: targetUser.isActive },
    req
  });

  res.status(200).json(new ApiResponse(200, targetUser, 'User updated successfully'));
});

// Admin reset user password
export const adminResetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');

  const tempPass = newPassword || `Loomus@${crypto.randomInt(1000, 9999)}!`;
  const policy = validatePasswordPolicy(tempPass, targetUser.username);
  if (!policy.valid) {
    throw new ApiError(400, policy.message, 'AUTH_WEAK_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  targetUser.passwordHash = await bcrypt.hash(tempPass, salt);
  targetUser.passwordChangedAt = new Date();
  targetUser.mustChangePassword = true;
  targetUser.tokenVersion += 1;
  targetUser.failedLoginAttempts = 0;
  targetUser.lockUntil = null;
  await targetUser.save();

  // Revoke all sessions for this user
  await RefreshToken.updateMany(
    { userId: targetUser._id, revokedAt: null },
    { revokedAt: new Date(), replacedBy: 'ADMIN_RESET_PASSWORD' }
  );

  await logAuditEvent({
    action: 'USER_PASSWORD_RESET_BY_ADMIN',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: targetUser._id.toString(),
    req
  });

  res.status(200).json(
    new ApiResponse(200, { temporaryPassword: tempPass }, 'User password reset. User will be forced to change it on login.')
  );
});

// Admin unlock account
export const adminUnlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUser = await User.findById(id);
  if (!targetUser) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');

  targetUser.failedLoginAttempts = 0;
  targetUser.lockUntil = null;
  await targetUser.save();

  await logAuditEvent({
    action: 'USER_UNLOCKED_BY_ADMIN',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: targetUser._id.toString(),
    req
  });

  res.status(200).json(new ApiResponse(200, null, 'User account unlocked successfully'));
});

// Admin force logout user from all devices
export const adminForceLogoutUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUser = await User.findById(id);
  if (!targetUser) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');

  targetUser.tokenVersion += 1;
  await targetUser.save();

  await RefreshToken.updateMany(
    { userId: targetUser._id, revokedAt: null },
    { revokedAt: new Date(), replacedBy: 'ADMIN_FORCE_LOGOUT' }
  );

  await logAuditEvent({
    action: 'USER_FORCE_LOGOUT_BY_ADMIN',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: targetUser._id.toString(),
    req
  });

  res.status(200).json(new ApiResponse(200, null, 'User logged out of all active sessions'));
});

// Admin delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUser = await User.findById(id);
  if (!targetUser) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');

  if (targetUser.role === 'Admin') {
    const adminCount = await User.countDocuments({ role: 'Admin' });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot delete the last remaining Administrator', 'CANNOT_DELETE_LAST_ADMIN');
    }
  }

  await RefreshToken.deleteMany({ userId: targetUser._id });
  await User.findByIdAndDelete(id);

  await logAuditEvent({
    action: 'USER_DELETED',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    targetEntity: 'User',
    targetId: id,
    details: { username: targetUser.username },
    req
  });

  res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

