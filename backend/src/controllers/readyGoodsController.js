import { ReadyGoods } from '../models/ReadyGoods.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getReadyGoods = asyncHandler(async (req, res) => {
  const goods = await ReadyGoods.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, goods, 'Ready goods retrieved'));
});

export const addReadyGoods = asyncHandler(async (req, res) => {
  const { id, fabric, qty, rollCount, quality, rate, location, status } = req.body;
  if (!fabric || !qty) throw new ApiError(400, 'Fabric and quantity are required', 'VALIDATION_ERROR');

  const newGoods = await ReadyGoods.create({
    id: id || `RG-${Date.now().toString().slice(-4)}`,
    fabric,
    qty: parseFloat(qty) || 0,
    rollCount: parseInt(rollCount, 10) || 1,
    quality: quality || 'A-Grade (Export)',
    rate: parseFloat(rate) || 45,
    location: location || 'Rack A-01',
    status: status || 'Ready'
  });

  emitToAll('ready_goods:created', newGoods);

  res.status(201).json(new ApiResponse(201, newGoods, `Ready goods roll lot logged (${newGoods.qty}m)`));
});

export const deleteReadyGoods = asyncHandler(async (req, res) => {
  const item = await ReadyGoods.findOneAndDelete({ id: req.params.id });
  if (!item) throw new ApiError(404, 'Ready goods entry not found', 'GOODS_NOT_FOUND');

  emitToAll('ready_goods:deleted', { id: item.id });

  res.status(200).json(new ApiResponse(200, { id: item.id }, 'Ready goods entry deleted'));
});

