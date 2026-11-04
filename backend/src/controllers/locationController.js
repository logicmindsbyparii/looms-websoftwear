import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Location } from '../models/Location.js';
import { Roll } from '../models/Roll.js';
import { emitToAll } from '../services/socketService.js';
import { logAuditEvent } from '../services/auditService.js';

export const getLocations = asyncHandler(async (req, res) => {
  const { type, shed, active } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (shed) filter.shed = shed;
  if (active !== undefined) filter.isActive = active === 'true';

  const locations = await Location.find(filter).sort({ type: 1, name: 1 });
  res.status(200).json(new ApiResponse(200, locations, 'Locations retrieved successfully'));
});

export const getLocationById = asyncHandler(async (req, res) => {
  const location = await Location.findOne({ id: req.params.id.toUpperCase() });
  if (!location) {
    throw new ApiError(404, `Location '${req.params.id}' not found`, 'LOCATION_NOT_FOUND');
  }
  res.status(200).json(new ApiResponse(200, location, 'Location retrieved'));
});

export const createLocation = asyncHandler(async (req, res) => {
  const { id, name, code, type, shed, isActive } = req.body;
  if (!id || !name) {
    throw new ApiError(400, 'id and name are required', 'VALIDATION_ERROR');
  }

  const existing = await Location.findOne({ id: id.toUpperCase().trim() });
  if (existing) {
    throw new ApiError(409, `Location with ID '${id}' already exists`, 'DUPLICATE_LOCATION');
  }

  const location = await Location.create({
    id: id.toUpperCase().trim(),
    name: name.trim(),
    code: code ? code.toUpperCase().trim() : undefined,
    type: type || 'rack',
    shed: shed || 'Main Shed',
    isActive: isActive !== undefined ? !!isActive : true
  });

  emitToAll('location:created', location);
  await logAuditEvent({
    action: 'location.create',
    targetEntity: 'Location',
    targetId: location.id,
    details: { name: location.name, type: location.type },
    req
  });

  res.status(201).json(new ApiResponse(201, location, 'Location created successfully'));
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { name, code, type, shed, isActive } = req.body;
  const location = await Location.findOne({ id: req.params.id.toUpperCase() });
  if (!location) {
    throw new ApiError(404, `Location '${req.params.id}' not found`, 'LOCATION_NOT_FOUND');
  }

  if (name !== undefined) location.name = name.trim();
  if (code !== undefined) location.code = code ? code.toUpperCase().trim() : '';
  if (type !== undefined) location.type = type;
  if (shed !== undefined) location.shed = shed;
  if (isActive !== undefined) location.isActive = !!isActive;

  await location.save();
  emitToAll('location:updated', location);

  res.status(200).json(new ApiResponse(200, location, 'Location updated successfully'));
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findOne({ id: id.toUpperCase() });
  if (!location) {
    throw new ApiError(404, `Location '${id}' not found`, 'LOCATION_NOT_FOUND');
  }

  // Check if any rolls are located here
  const rollsCount = await Roll.countDocuments({ locationId: location.id, status: { $ne: 'Void' } });
  if (rollsCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete location '${location.name}' because ${rollsCount} active roll(s) are stored here. Deactivate it instead.`,
      'LOCATION_HAS_ROLLS'
    );
  }

  await Location.deleteOne({ _id: location._id });
  emitToAll('location:deleted', { id: location.id });

  res.status(200).json(new ApiResponse(200, { id: location.id }, 'Location deleted successfully'));
});

