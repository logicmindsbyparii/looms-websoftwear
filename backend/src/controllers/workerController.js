import { Worker } from '../models/Worker.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getWorkers = asyncHandler(async (req, res) => {
  const workers = await Worker.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, workers, 'Workers retrieved'));
});

export const createWorker = asyncHandler(async (req, res) => {
  const { id, name, role, machine, shift, phone, status, shed } = req.body;
  if (!name) throw new ApiError(400, 'Worker name is required', 'VALIDATION_ERROR');

  const newWorker = await Worker.create({
    id: id || `W-${Date.now().toString().slice(-3)}`,
    name,
    role: role || 'Loom Operator',
    machine: machine || 'Unassigned',
    shift: shift || 'Morning (6AM - 2PM)',
    phone: phone || '',
    status: status || 'active',
    shed: shed || 'Shed A'
  });

  emitToAll('worker:created', newWorker);

  res.status(201).json(new ApiResponse(201, newWorker, `Worker ${newWorker.name} registered`));
});

export const updateWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!worker) throw new ApiError(404, 'Worker not found', 'WORKER_NOT_FOUND');

  emitToAll('worker:updated', worker);

  res.status(200).json(new ApiResponse(200, worker, 'Worker updated'));
});

export const updateWorkerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'break', 'off'].includes(status)) {
    throw new ApiError(400, 'Invalid status value', 'VALIDATION_ERROR');
  }

  const worker = await Worker.findOneAndUpdate(
    { id: req.params.id },
    { $set: { status } },
    { new: true }
  );
  if (!worker) throw new ApiError(404, 'Worker not found', 'WORKER_NOT_FOUND');

  emitToAll('worker:updated', worker);

  res.status(200).json(new ApiResponse(200, worker, `Worker status updated to ${status}`));
});

export const deleteWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findOneAndDelete({ id: req.params.id });
  if (!worker) throw new ApiError(404, 'Worker not found', 'WORKER_NOT_FOUND');

  emitToAll('worker:deleted', { id: worker.id });

  res.status(200).json(new ApiResponse(200, { id: worker.id }, 'Worker removed'));
});

