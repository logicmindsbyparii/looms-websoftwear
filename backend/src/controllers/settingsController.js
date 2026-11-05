import os from 'os';
import { Settings } from '../models/Settings.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAuditEvent } from '../services/auditService.js';

function getLocalNetworkIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {}
  return 'localhost';
}

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  const networkIp = getLocalNetworkIp();
  const settingsObj = settings.toObject();
  settingsObj.networkIp = networkIp;
  settingsObj.networkUrl = `http://${networkIp}:5173`;

  res.status(200).json(new ApiResponse(200, settingsObj, 'Settings retrieved'));
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

