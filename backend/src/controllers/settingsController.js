import { Settings } from '../models/Settings.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAuditEvent } from '../services/auditService.js';

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.status(200).json(new ApiResponse(200, settings, 'Settings retrieved'));
});

export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  await logAuditEvent({
    action: 'SETTINGS_UPDATED',
    details: req.body,
    req
  });

  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

