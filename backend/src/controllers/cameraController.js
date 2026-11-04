import { Camera } from '../models/Camera.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getCameras = asyncHandler(async (req, res) => {
  const cameras = await Camera.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, cameras, 'Cameras retrieved'));
});

export const addCamera = asyncHandler(async (req, res) => {
  const { id, name, sn, user, location, connected, ip, fps, channel } = req.body;
  if (!name) throw new ApiError(400, 'Camera name is required', 'VALIDATION_ERROR');

  const newCam = await Camera.create({
    id: id || `cam-${Date.now().toString().slice(-3)}`,
    name,
    sn: sn || 'EV2026-LIVE',
    user: user || 'admin',
    location: location || 'Weaving Shed',
    connected: connected !== undefined ? connected : true,
    ip: ip || '192.168.1.100',
    fps: parseInt(fps, 10) || 30,
    channel: channel || 'CH-01'
  });

  emitToAll('camera:created', newCam);

  res.status(201).json(new ApiResponse(201, newCam, `Camera ${newCam.name} connected to EasyViewer hub`));
});

export const toggleCamera = asyncHandler(async (req, res) => {
  const cam = await Camera.findOne({ id: req.params.id });
  if (!cam) throw new ApiError(404, 'Camera not found', 'CAMERA_NOT_FOUND');

  cam.connected = !cam.connected;
  await cam.save();

  emitToAll('camera:updated', cam);

  res.status(200).json(new ApiResponse(200, cam, `${cam.name}: ${cam.connected ? 'Stream Connected' : 'Stream Disconnected'}`));
});

export const deleteCamera = asyncHandler(async (req, res) => {
  const cam = await Camera.findOneAndDelete({ id: req.params.id });
  if (!cam) throw new ApiError(404, 'Camera not found', 'CAMERA_NOT_FOUND');

  emitToAll('camera:deleted', { id: cam.id });

  res.status(200).json(new ApiResponse(200, { id: cam.id }, 'Camera deleted'));
});

