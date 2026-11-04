import { ProductionLog } from '../models/ProductionLog.js';
import { Machine } from '../models/Machine.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getProductionLogs = asyncHandler(async (req, res) => {
  const { machine, shift } = req.query;
  const filter = {};
  if (machine) filter.machine = machine;
  if (shift) filter.shift = shift;

  const logs = await ProductionLog.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, logs, 'Production logs retrieved'));
});

export const addProductionLog = asyncHandler(async (req, res) => {
  const { id, machine, fabric, shift, output, target, quality, defects, operator, remarks } = req.body;
  if (!machine || output === undefined) {
    throw new ApiError(400, 'Machine ID and output meters are required', 'VALIDATION_ERROR');
  }

  const numericOutput = parseFloat(output);
  if (isNaN(numericOutput) || numericOutput < 0) {
    throw new ApiError(400, 'Output must be a non-negative number', 'VALIDATION_ERROR');
  }

  const targetMachine = await Machine.findOne({ id: machine });
  const machineFabric = fabric || targetMachine?.fabric || '70*72 Plain Cambric';

  const newLog = await ProductionLog.create({
    id: id || `PR-${Date.now().toString().slice(-4)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    machine,
    fabric: machineFabric,
    shift: shift || 'Morning',
    output: numericOutput,
    target: target ? parseFloat(target) : (targetMachine?.targetOutput || 75),
    quality: quality || 'A-Grade (Export)',
    defects: defects !== undefined ? parseFloat(defects) : 0,
    operator: operator || (req.user ? req.user.displayName : 'Loom Operator'),
    remarks: remarks || ''
  });

  // Automatically update machine output and efficiency
  if (targetMachine) {
    targetMachine.output += numericOutput;
    targetMachine.efficiency = Math.min(100, Math.round((targetMachine.output / (targetMachine.targetOutput || 75)) * 100));
    await targetMachine.save();
    emitToAll('machine:updated', targetMachine);
  }

  emitToAll('production_log:created', newLog);

  res.status(201).json(new ApiResponse(201, newLog, `Production logged: ${numericOutput}m from ${machine}`));
});

export const deleteProductionLog = asyncHandler(async (req, res) => {
  const log = await ProductionLog.findOneAndDelete({ id: req.params.id });
  if (!log) throw new ApiError(404, 'Production log entry not found', 'LOG_NOT_FOUND');

  emitToAll('production_log:deleted', { id: log.id });

  res.status(200).json(new ApiResponse(200, { id: log.id }, 'Production entry deleted'));
});

