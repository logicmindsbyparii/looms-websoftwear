import { Machine } from '../models/Machine.js';
import { MachineStatusEvent } from '../models/MachineStatusEvent.js';
import { Alarm } from '../models/Alarm.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAuditEvent } from '../services/auditService.js';
import { emitToAll } from '../services/socketService.js';
import { checkLoomStopAlert } from '../services/whatsappAlertService.js';

export const getMachines = asyncHandler(async (req, res) => {
  const { shed, status, search } = req.query;
  const filter = {};

  if (shed) filter.shed = shed;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { fabric: { $regex: search, $options: 'i' } }
    ];
  }

  const machines = await Machine.find(filter).sort({ id: 1 });
  res.status(200).json(new ApiResponse(200, machines, 'Machines retrieved'));
});

export const getMachineById = asyncHandler(async (req, res) => {
  const machine = await Machine.findOne({ id: req.params.id });
  if (!machine) throw new ApiError(404, 'Machine not found', 'MACHINE_NOT_FOUND');
  res.status(200).json(new ApiResponse(200, machine, 'Machine details retrieved'));
});

export const createMachine = asyncHandler(async (req, res) => {
  const { id, name, shed, model, targetRpm, fabric, targetOutput, operator } = req.body;
  if (!id) throw new ApiError(400, 'Machine ID is required', 'VALIDATION_ERROR');

  const cleanId = id.trim();
  const existing = await Machine.findOne({ id: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
  if (existing) {
    throw new ApiError(409, `Machine with ID ${cleanId} already exists!`, 'DUPLICATE_MACHINE_ID');
  }

  const newMachine = await Machine.create({
    id: cleanId,
    name: name || `Loom Unit ${cleanId}`,
    shed: shed || 'Main Shed',
    model: model || 'Airjet Weaving Loom',
    status: 'idle',
    rpm: 0,
    targetRpm: parseInt(targetRpm, 10) || 850,
    fabric: fabric || '70*72 Plain Cambric',
    output: 0,
    targetOutput: parseInt(targetOutput, 10) || 75,
    efficiency: 0,
    temp: 28,
    tension: 0,
    pressure: 0,
    picksPerMin: 0,
    weftStops: 0,
    warpStops: 0,
    operator: operator || 'Unassigned',
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  await logAuditEvent({
    action: 'MACHINE_CREATED',
    targetEntity: 'Machine',
    targetId: newMachine.id,
    details: { name: newMachine.name, shed: newMachine.shed },
    req
  });

  emitToAll('machine:created', newMachine);

  res.status(201).json(new ApiResponse(201, newMachine, `Machine ${newMachine.id} added to ${newMachine.shed}`));
});

export const updateMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!machine) throw new ApiError(404, 'Machine not found', 'MACHINE_NOT_FOUND');

  emitToAll('machine:updated', machine);

  res.status(200).json(new ApiResponse(200, machine, `Machine ${machine.id} updated`));
});

export const deleteMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findOneAndDelete({ id: req.params.id });
  if (!machine) throw new ApiError(404, 'Machine not found', 'MACHINE_NOT_FOUND');

  await logAuditEvent({
    action: 'MACHINE_DELETED',
    targetEntity: 'Machine',
    targetId: machine.id,
    req
  });

  emitToAll('machine:deleted', { id: machine.id });

  res.status(200).json(new ApiResponse(200, { id: machine.id }, `Machine ${machine.id} deleted`));
});

export const updateMachineStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['running', 'stopped', 'idle', 'maintenance'].includes(status)) {
    throw new ApiError(400, 'Invalid machine status value', 'VALIDATION_ERROR');
  }

  if (id === 'all') {
    if (req.user.role === 'Operator') {
      throw new ApiError(403, 'Operators cannot change status for all machines', 'PERMISSION_DENIED');
    }

    const isRunning = status === 'running';
    await Machine.updateMany(
      {},
      {
        $set: {
          status,
          rpm: isRunning ? 850 : 0,
          pressure: isRunning ? 4.5 : 0,
          tension: isRunning ? 65 : 0
        }
      }
    );

    const updatedMachines = await Machine.find().sort({ id: 1 });
    emitToAll('machines:mass_updated', { status, machines: updatedMachines });

    await logAuditEvent({
      action: 'MACHINES_MASS_STATUS_UPDATE',
      details: { targetStatus: status },
      req
    });

    return res.status(200).json(new ApiResponse(200, updatedMachines, `All looms updated to ${status.toUpperCase()}`));
  }

  const machine = await Machine.findOne({ id });
  if (!machine) throw new ApiError(404, 'Machine not found', 'MACHINE_NOT_FOUND');

  const prevStatus = machine.status;
  const isRunning = status === 'running';

  machine.status = status;
  machine.rpm = isRunning ? (machine.targetRpm || 850) : 0;
  machine.pressure = isRunning ? 4.5 : 0;
  machine.tension = isRunning ? 65 : 0;
  if (!isRunning) {
    machine.efficiency = Math.max(0, Math.round((machine.efficiency || 82) * 0.5));
  } else if (!machine.efficiency || machine.efficiency < 70) {
    machine.efficiency = Math.floor(Math.random() * 8 + 88);
  }
  await machine.save();

  await MachineStatusEvent.create({
    machineId: machine.id,
    previousStatus: prevStatus,
    newStatus: status,
    changedBy: {
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role
    }
  });

  emitToAll('machine:updated', machine);

  // Trigger real-time WhatsApp alert if loom unexpectedly stopped
  if (status === 'stopped' && prevStatus === 'running') {
    checkLoomStopAlert(machine, prevStatus).catch(err => {
      console.warn('Failed to dispatch loom stop WhatsApp alert:', err.message);
    });
  }

  res.status(200).json(new ApiResponse(200, machine, `Machine ${machine.id} set to ${status.toUpperCase()}`));
});

export const startAllMachines = asyncHandler(async (req, res) => {
  const count = await Machine.countDocuments();
  if (count === 0) {
    throw new ApiError(400, 'No machines configured yet', 'NO_MACHINES');
  }

  // Set running with realistic starting efficiencies (88% - 94%)
  const machines = await Machine.find();
  for (const m of machines) {
    m.status = 'running';
    m.rpm = m.targetRpm || 850;
    m.pressure = 4.5;
    m.tension = 65;
    m.efficiency = Math.floor(Math.random() * 8 + 88);
    await m.save();
  }

  const updatedMachines = await Machine.find().sort({ id: 1 });
  emitToAll('machines:mass_updated', { status: 'running', machines: updatedMachines });

  await logAuditEvent({
    action: 'MACHINES_START_ALL',
    details: { count },
    req
  });

  res.status(200).json(new ApiResponse(200, updatedMachines, `All ${count} loom units activated`));
});

export const stopAllMachines = asyncHandler(async (req, res) => {
  const count = await Machine.countDocuments();
  if (count === 0) return res.status(200).json(new ApiResponse(200, [], 'No machines to stop'));

  await Machine.updateMany(
    {},
    {
      $set: {
        status: 'stopped',
        rpm: 0,
        pressure: 0,
        tension: 0,
        efficiency: 0
      }
    }
  );

  const machines = await Machine.find().sort({ id: 1 });
  emitToAll('machines:mass_updated', { status: 'stopped', machines });

  await logAuditEvent({
    action: 'MACHINES_STOP_ALL',
    details: { count },
    req
  });

  res.status(200).json(new ApiResponse(200, machines, 'All Loom units halted safely'));
});

export const emergencyStopAll = asyncHandler(async (req, res) => {
  await Machine.updateMany(
    {},
    {
      $set: {
        status: 'stopped',
        rpm: 0,
        pressure: 0,
        tension: 0
      }
    }
  );

  // Prevent duplicate E-STOP alarms if triggered in rapid succession (< 10 seconds)
  let emergencyAlarm = await Alarm.findOne({
    code: 'E-STOP',
    createdAt: { $gte: new Date(Date.now() - 10000) }
  });

  if (!emergencyAlarm) {
    const alarmId = `AL-${Date.now().toString().slice(-4)}`;
    emergencyAlarm = await Alarm.create({
      id: alarmId,
      type: 'critical',
      title: `EMERGENCY STOP TRIGGERED BY ${req.user.username.toUpperCase()}`,
      machine: 'FACTORY-WIDE',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      shed: 'All Sheds',
      code: 'E-STOP'
    });
  }

  const machines = await Machine.find().sort({ id: 1 });

  emitToAll('emergency:stop', {
    alarm: emergencyAlarm,
    machines,
    triggeredBy: req.user.username
  });

  await logAuditEvent({
    action: 'EMERGENCY_STOP_FACTORY_WIDE',
    performedBy: { userId: req.user._id, username: req.user.username, role: req.user.role },
    details: { alarmId: emergencyAlarm.id },
    req
  });

  res.status(200).json(
    new ApiResponse(200, { alarm: emergencyAlarm, machines }, 'FACTORY EMERGENCY STOP ACTIVATED!')
  );
});

