import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Roll } from '../models/Roll.js';
import { Location } from '../models/Location.js';
import { RollMovement } from '../models/RollMovement.js';
import * as rollService from '../services/rollService.js';

export const getRolls = asyncHandler(async (req, res) => {
  const result = await rollService.getRolls(req.query);
  res.status(200).json(new ApiResponse(200, result.rolls, 'Rolls retrieved successfully', result.pagination));
});

export const getRollsSummary = asyncHandler(async (req, res) => {
  const summary = await rollService.getRollsSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Rolls summary retrieved'));
});

export const getRollById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roll = await Roll.findOne({ id: id.toUpperCase() });
  if (!roll) {
    throw new ApiError(404, `Roll '${id}' not found`, 'ROLL_NOT_FOUND');
  }

  const [location, movements] = await Promise.all([
    Location.findOne({ id: roll.locationId }),
    RollMovement.find({ rollId: roll.id }).sort({ at: -1 })
  ]);

  res.status(200).json(new ApiResponse(200, { roll, location, movements }, 'Roll details retrieved'));
});

export const scanStaffRoll = asyncHandler(async (req, res) => {
  const { code } = req.params;
  if (!code) {
    throw new ApiError(400, 'Scan code or Roll ID is required', 'CODE_REQUIRED');
  }
  const result = await rollService.scanRollStaff(code, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Roll staff scan retrieved successfully'));
});

export const createRoll = asyncHandler(async (req, res) => {
  const { machineId, metres } = req.body;
  if (!machineId) {
    throw new ApiError(400, 'machineId is required', 'VALIDATION_ERROR');
  }
  if (!metres || isNaN(Number(metres)) || Number(metres) < 0.1) {
    throw new ApiError(400, 'metres must be a valid number of at least 0.1', 'VALIDATION_ERROR');
  }

  const roll = await rollService.createRoll(req.body, req.user, req);
  res.status(201).json(new ApiResponse(201, roll, `Roll ${roll.id} created successfully`));
});

export const bulkCreateRolls = asyncHandler(async (req, res) => {
  const { machineId, rollsData } = req.body;
  if (!machineId || !Array.isArray(rollsData) || rollsData.length === 0) {
    throw new ApiError(400, 'machineId and non-empty rollsData array are required', 'VALIDATION_ERROR');
  }

  const rolls = await rollService.bulkCreateRolls(req.body, req.user, req);
  res.status(201).json(new ApiResponse(201, rolls, `${rolls.length} rolls generated successfully`));
});

export const transferRoll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { toLocationId, note } = req.body;
  if (!toLocationId) {
    throw new ApiError(400, 'toLocationId is required', 'VALIDATION_ERROR');
  }

  const roll = await rollService.transferRoll(id.toUpperCase(), { toLocationId, note }, req.user, req);
  res.status(200).json(new ApiResponse(200, roll, `Roll ${roll.id} transferred successfully`));
});

export const updateRollStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, orderId } = req.body;
  if (!status) {
    throw new ApiError(400, 'status is required', 'VALIDATION_ERROR');
  }

  const roll = await rollService.updateRollStatus(id.toUpperCase(), { status, note, orderId }, req.user, req);
  res.status(200).json(new ApiResponse(200, roll, `Roll ${roll.id} status updated to ${roll.status}`));
});

export const reissueQr = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const roll = await rollService.reissueQr(id.toUpperCase(), { reason }, req.user, req);
  res.status(200).json(new ApiResponse(200, roll, `QR sticker reissued for roll ${roll.id}`));
});

export const correctMetres = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { metres, reason } = req.body;
  if (!metres) {
    throw new ApiError(400, 'metres is required', 'VALIDATION_ERROR');
  }
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Correction reason is required', 'VALIDATION_ERROR');
  }

  const roll = await rollService.correctMetres(id.toUpperCase(), { metres, reason }, req.user, req);
  res.status(200).json(new ApiResponse(200, roll, `Roll ${roll.id} length corrected to ${roll.metres}m`));
});

export const voidRoll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Void reason is required', 'VALIDATION_ERROR');
  }

  const roll = await rollService.voidRoll(id.toUpperCase(), { reason }, req.user, req);
  res.status(200).json(new ApiResponse(200, roll, `Roll ${roll.id} marked as Void`));
});

