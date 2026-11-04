import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const logAuditEvent = async ({
  action,
  performedBy = null,
  targetEntity = '',
  targetId = '',
  details = {},
  req = null
}) => {
  try {
    const ip = req?.ip || req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers['user-agent'] || '';

    const actor = performedBy || (req?.user ? {
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role
    } : {
      username: 'anonymous',
      role: 'Guest'
    });

    await AuditLog.create({
      action,
      performedBy: actor,
      targetEntity,
      targetId,
      details,
      ip: String(ip),
      userAgent: String(userAgent)
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err.message);
  }
};

