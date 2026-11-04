import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing or invalid', 'AUTH_TOKEN_MISSING');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded || !decoded.sub) {
    throw new ApiError(401, 'Access token expired or malformed', 'AUTH_TOKEN_EXPIRED');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new ApiError(401, 'User account no longer exists', 'AUTH_USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact Administrator.', 'AUTH_ACCOUNT_DISABLED');
  }

  // Token version invalidation (e.g. after logout-all or role demotion)
  if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
    throw new ApiError(401, 'Session invalidated, please login again', 'AUTH_SESSION_REVOKED');
  }

  // Password changed after token issued check
  if (user.passwordChangedAt && decoded.iat) {
    const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedTimestamp) {
      throw new ApiError(401, 'Password was recently updated. Please login again.', 'AUTH_PASSWORD_CHANGED');
    }
  }

  req.user = user;
  next();
});

