import { Alarm } from '../models/Alarm.js';
import { Machine } from '../models/Machine.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';
import { checkCriticalAlarmAlert } from '../services/whatsappAlertService.js';

export const getAlarms = asyncHandler(async (req, res) => {
  const { type, acknowledged } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';

  const alarms = await Alarm.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, alarms, 'Alarms retrieved'));
});

export const createAlarm = asyncHandler(async (req, res) => {
  const { id, type, title, machine, shed, code } = req.body;
  if (!title) throw new ApiError(400, 'Alarm title is required', 'VALIDATION_ERROR');

  const newAlarm = await Alarm.create({
    id: id || `AL-${Date.now().toString().slice(-4)}`,
    type: type || 'warning',
    title,
    machine: machine || 'FACTORY-WIDE',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    shed: shed || 'Main Shed',
    code: code || 'W-001'
  });

  emitToAll('alarm:created', newAlarm);

  if (newAlarm.type === 'critical') {
    checkCriticalAlarmAlert({
      id: newAlarm.id,
      code: newAlarm.code,
      message: newAlarm.title,
      loomId: newAlarm.machine,
      severity: 'critical'
    }).catch(err => console.warn('WhatsApp alarm alert failed:', err.message));
  }

  res.status(201).json(new ApiResponse(201, newAlarm, 'Alarm created'));
});

export const addTestAlarm = asyncHandler(async (req, res) => {
  const machines = await Machine.find().select('id');
  const randomLoom = machines.length > 0 ? machines[Math.floor(Math.random() * machines.length)].id : 'M-01';

  const testAlarms = [
    { title: `${randomLoom}: Weft Yarn Sensor Tripped`, type: 'warning', code: 'W-081' },
    { title: `${randomLoom}: Lubrication Pressure Warning`, type: 'warning', code: 'W-033' },
    { title: `${randomLoom}: Warp Tension Exceeded 85%`, type: 'critical', code: 'E-012' }
  ];

  const picked = testAlarms[Math.floor(Math.random() * testAlarms.length)];
  const newAlarm = await Alarm.create({
    id: `AL-${Date.now().toString().slice(-4)}`,
    type: picked.type,
    title: picked.title,
    machine: randomLoom,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    shed: 'Main Shed',
    code: picked.code
  });

  emitToAll('alarm:created', newAlarm);

  if (newAlarm.type === 'critical') {
    checkCriticalAlarmAlert({
      id: newAlarm.id,
      code: newAlarm.code,
      message: newAlarm.title,
      loomId: newAlarm.machine,
      severity: 'critical'
    }).catch(err => console.warn('WhatsApp alarm alert failed:', err.message));
  }

  res.status(201).json(new ApiResponse(201, newAlarm, `New ${picked.type.toUpperCase()} Alarm: ${picked.title}`));
});

export const ackAlarm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alarm = await Alarm.findOneAndDelete({ id });
  if (!alarm) throw new ApiError(404, 'Alarm not found', 'ALARM_NOT_FOUND');

  emitToAll('alarm:cleared', { id });

  res.status(200).json(new ApiResponse(200, { id }, 'Alarm acknowledged and cleared'));
});

export const ackAllAlarms = asyncHandler(async (req, res) => {
  await Alarm.deleteMany({});
  emitToAll('alarm:cleared_all', {});
  res.status(200).json(new ApiResponse(200, null, 'All alarms cleared'));
});

