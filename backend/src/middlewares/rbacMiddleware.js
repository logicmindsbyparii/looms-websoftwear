import { ApiError } from '../utils/ApiError.js';
import { hasPermission } from '../config/permissions.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }

    // Admin has universal permission
    if (req.user.role === 'Admin') {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => hasPermission(req.user.role, perm));
    if (!hasAll) {
      return next(
        new ApiError(
          403,
          `Access denied: missing required permissions: ${requiredPermissions.join(', ')}`,
          'PERMISSION_DENIED'
        )
      );
    }

    next();
  };
};

export const checkMachineOwnership = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));

  // Admin and Supervisor can control all machines
  if (req.user.role === 'Admin' || req.user.role === 'Supervisor') {
    return next();
  }

  // Operator can only control their assigned machines
  const machineId = req.params.id || req.body.machineId || req.body.machine;
  if (!machineId) return next();

  if (machineId === 'all') {
    return next(new ApiError(403, 'Operators are not permitted to execute factory-wide machine controls', 'FORBIDDEN_MASS_CONTROL'));
  }

  const assigned = req.user.assignedMachines || [];
  if (assigned.length > 0 && !assigned.includes(machineId)) {
    return next(
      new ApiError(
        403,
        `Access denied: Loom ${machineId} is not assigned to operator ${req.user.username}`,
        'FORBIDDEN_MACHINE_NOT_ASSIGNED'
      )
    );
  }

  next();
};

