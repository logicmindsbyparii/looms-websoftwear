import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, username, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (action) filter.action = action;
  if (username) filter['performedBy.username'] = username;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  res.status(200).json(
    new ApiResponse(200, logs, 'Audit logs retrieved', {
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    })
  );
});

