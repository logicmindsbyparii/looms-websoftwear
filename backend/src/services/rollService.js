import crypto from 'crypto';
import { Roll } from '../models/Roll.js';
import { RollMovement } from '../models/RollMovement.js';
import { Location } from '../models/Location.js';
import { Machine } from '../models/Machine.js';
import { ReadyGoods } from '../models/ReadyGoods.js';
import { getNextSequence } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';
import { logAuditEvent } from './auditService.js';
import { emitToAll } from './socketService.js';

/**
 * Generates an atomic sequential roll ID formatted as TK-<YYYY>-<6 digit seq>
 */
export async function generateRollId() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`roll-${year}`);
  return `TK-${year}-${String(seq).padStart(6, '0')}`;
}

/**
 * Generates a cryptographically random, unguessable QR token.
 */
export function generateQrToken() {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * Escapes regex special characters to prevent ReDoS / query injection.
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Allowed status transitions and their prerequisites
 */
const ALLOWED_TRANSITIONS = {
  Ready: ['Reserved', 'Hold', 'Rejected'],
  Reserved: ['Dispatched', 'Ready', 'Hold', 'Rejected'],
  Hold: ['Ready'],
  Rejected: [],
  Dispatched: [],
  Void: []
};

/**
 * Create a single fabric roll
 */
export async function createRoll(rollData, user, req) {
  const { machineId, metres, quality, fabric, shift, locationId, productionLogId, lotId } = rollData;

  // 1. Verify machine exists
  const machine = await Machine.findOne({ id: machineId });
  if (!machine) {
    throw new ApiError(404, `Machine '${machineId}' not found`, 'MACHINE_NOT_FOUND');
  }

  // 2. Resolve or verify location
  let resolvedLocationId = locationId;
  if (!resolvedLocationId) {
    // Default to a production floor location in this machine's shed, or any floor location
    const defaultLoc =
      (await Location.findOne({ type: 'floor', shed: machine.shed, isActive: true })) ||
      (await Location.findOne({ type: 'floor', isActive: true })) ||
      (await Location.findOne({ isActive: true }));

    if (!defaultLoc) {
      throw new ApiError(400, 'No active storage location found. Please seed or create a location first.', 'LOCATION_NOT_FOUND');
    }
    resolvedLocationId = defaultLoc.id;
  } else {
    const loc = await Location.findOne({ id: resolvedLocationId.toUpperCase() });
    if (!loc) {
      throw new ApiError(404, `Location '${resolvedLocationId}' not found`, 'LOCATION_NOT_FOUND');
    }
    if (!loc.isActive) {
      throw new ApiError(400, `Location '${resolvedLocationId}' is inactive`, 'LOCATION_INACTIVE');
    }
    resolvedLocationId = loc.id;
  }

  // 3. Prepare roll data
  const rollId = await generateRollId();
  const qrToken = generateQrToken();
  const cleanMetres = Math.round(Number(metres) * 100) / 100;

  if (isNaN(cleanMetres) || cleanMetres < 0.1) {
    throw new ApiError(400, 'Metres must be a number of at least 0.1', 'INVALID_METRES');
  }

  const roll = await Roll.create({
    id: rollId,
    qrToken,
    fabric: (fabric || machine.fabric || 'Fabric').trim(),
    quality: (quality || 'A-Grade (Export)').trim(),
    metres: cleanMetres,
    originalMetres: cleanMetres,
    machineId: machine.id,
    machineName: machine.name,
    machineShed: machine.shed || '',
    machineModel: machine.model || '',
    locationId: resolvedLocationId,
    status: 'Ready',
    shift: shift || 'Morning',
    operator: user?.displayName || user?.username || 'Operator',
    productionLogId: productionLogId || null,
    lotId: lotId || null,
    createdBy: user?._id || null
  });

  // 4. Create immutable movement ledger record
  await RollMovement.create({
    rollId: roll.id,
    type: 'created',
    toLocationId: resolvedLocationId,
    toStatus: 'Ready',
    metresAfter: cleanMetres,
    note: `Roll ${roll.id} created from machine ${machine.name}`,
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'System',
    at: new Date()
  });

  // 5. Audit & real-time notification
  await logAuditEvent({
    action: 'roll.create',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: roll.id,
    details: { metres: cleanMetres, fabric: roll.fabric, machineId: machine.id, locationId: resolvedLocationId },
    req
  });

  emitToAll('roll:created', roll);

  return roll;
}

/**
 * Bulk create rolls from a lot or list of metres
 */
export async function bulkCreateRolls(data, user, req) {
  const { machineId, lotId, rollsData, shift, locationId } = data;

  if (!Array.isArray(rollsData) || rollsData.length === 0) {
    throw new ApiError(400, 'rollsData must be a non-empty array of roll specifications', 'INVALID_ROLLS_DATA');
  }

  // Verify machine
  const machine = await Machine.findOne({ id: machineId });
  if (!machine) {
    throw new ApiError(404, `Machine '${machineId}' not found`, 'MACHINE_NOT_FOUND');
  }

  // Check lot if provided
  let lot = null;
  if (lotId) {
    lot = await ReadyGoods.findOne({ id: lotId });
    if (!lot) {
      throw new ApiError(404, `ReadyGoods Lot '${lotId}' not found`, 'LOT_NOT_FOUND');
    }

    const totalMetresRequested = rollsData.reduce((acc, r) => acc + (Number(r.metres) || 0), 0);
    if (totalMetresRequested > lot.qty + 0.01) {
      throw new ApiError(
        400,
        `Total requested metres (${totalMetresRequested.toFixed(2)}m) exceeds lot available quantity (${lot.qty.toFixed(2)}m)`,
        'EXCEEDS_LOT_QUANTITY'
      );
    }
  }

  // Create each roll
  const createdRolls = [];
  for (const item of rollsData) {
    const roll = await createRoll(
      {
        machineId: machine.id,
        metres: item.metres,
        quality: item.quality || lot?.quality,
        fabric: item.fabric || lot?.fabric || machine.fabric,
        shift: shift || 'Morning',
        locationId: locationId || undefined,
        lotId: lot?.id || null
      },
      user,
      req
    );
    createdRolls.push(roll);
  }

  return createdRolls;
}

/**
 * Transfer roll to a new location
 */
export async function transferRoll(rollId, { toLocationId, note }, user, req) {
  const roll = await Roll.findOne({ id: rollId });
  if (!roll) {
    throw new ApiError(404, `Roll '${rollId}' not found`, 'ROLL_NOT_FOUND');
  }

  if (roll.status === 'Dispatched') {
    throw new ApiError(400, 'Cannot transfer a dispatched roll. Status is already Dispatched.', 'ROLL_DISPATCHED');
  }

  if (roll.status === 'Void') {
    throw new ApiError(400, 'Cannot transfer a void roll.', 'ROLL_VOID');
  }

  const targetLocation = await Location.findOne({ id: toLocationId.toUpperCase() });
  if (!targetLocation) {
    throw new ApiError(404, `Destination location '${toLocationId}' not found`, 'LOCATION_NOT_FOUND');
  }
  if (!targetLocation.isActive) {
    throw new ApiError(400, `Destination location '${toLocationId}' is inactive`, 'LOCATION_INACTIVE');
  }

  const fromLocationId = roll.locationId;
  if (fromLocationId === targetLocation.id) {
    return roll; // No movement needed
  }

  roll.locationId = targetLocation.id;
  await roll.save();

  await RollMovement.create({
    rollId: roll.id,
    type: 'transfer',
    fromLocationId,
    toLocationId: targetLocation.id,
    fromStatus: roll.status,
    toStatus: roll.status,
    note: (note || `Transferred to ${targetLocation.name}`).trim(),
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'Staff',
    at: new Date()
  });

  await logAuditEvent({
    action: 'roll.transfer',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: roll.id,
    details: { fromLocationId, toLocationId: targetLocation.id, note },
    req
  });

  emitToAll('roll:updated', roll);

  return roll;
}

/**
 * Update roll status following strict state machine rules
 */
export async function updateRollStatus(rollId, { status: newStatus, note, orderId }, user, req) {
  const roll = await Roll.findOne({ id: rollId });
  if (!roll) {
    throw new ApiError(404, `Roll '${rollId}' not found`, 'ROLL_NOT_FOUND');
  }

  const currentStatus = roll.status;

  // Verify transition validity
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Cannot transition roll status from '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ') || 'None'}]`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Business validations for specific transitions
  if (newStatus === 'Reserved' && !orderId && !note) {
    throw new ApiError(400, 'An Order ID or a note/reason is required to reserve a roll', 'ORDER_REQUIRED');
  }

  if (['Hold', 'Rejected'].includes(newStatus) && (!note || !note.trim())) {
    throw new ApiError(400, `A reason note is required when marking a roll as ${newStatus}`, 'NOTE_REQUIRED');
  }

  if (currentStatus === 'Hold' && newStatus === 'Ready' && (!note || !note.trim())) {
    throw new ApiError(400, 'A resolution note is required when releasing a roll from Hold to Ready', 'NOTE_REQUIRED');
  }

  // Atomic conditional update to guard against concurrent transitions
  const updateFields = { status: newStatus };
  if (orderId !== undefined) {
    updateFields.orderId = orderId || null;
  }

  const updatedRoll = await Roll.findOneAndUpdate(
    { id: rollId, status: currentStatus },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedRoll) {
    throw new ApiError(409, 'Roll status changed concurrently or was modified. Please refresh.', 'CONCURRENT_UPDATE');
  }

  await RollMovement.create({
    rollId: updatedRoll.id,
    type: 'status_change',
    fromStatus: currentStatus,
    toStatus: newStatus,
    note: (note || `Status changed from ${currentStatus} to ${newStatus}`).trim(),
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'Staff',
    at: new Date()
  });

  await logAuditEvent({
    action: 'roll.status_change',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: updatedRoll.id,
    details: { fromStatus: currentStatus, toStatus: newStatus, note, orderId },
    req
  });

  emitToAll('roll:updated', updatedRoll);

  return updatedRoll;
}

/**
 * Reissue a QR sticker (generates a new QR token and increments version)
 */
export async function reissueQr(rollId, { reason }, user, req) {
  const roll = await Roll.findOne({ id: rollId });
  if (!roll) {
    throw new ApiError(404, `Roll '${rollId}' not found`, 'ROLL_NOT_FOUND');
  }

  if (roll.status === 'Void') {
    throw new ApiError(400, 'Cannot reissue QR for a void roll', 'ROLL_VOID');
  }

  const oldVersion = roll.qrVersion || 1;
  const newQrToken = generateQrToken();

  roll.qrToken = newQrToken;
  roll.qrVersion = oldVersion + 1;
  await roll.save();

  await RollMovement.create({
    rollId: roll.id,
    type: 'qr_reissued',
    note: (reason || `QR sticker reissued (version ${roll.qrVersion})`).trim(),
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'Staff',
    at: new Date()
  });

  await logAuditEvent({
    action: 'roll.qr_reissued',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: roll.id,
    details: { qrVersion: roll.qrVersion, reason },
    req
  });

  emitToAll('roll:updated', roll);

  return roll;
}

/**
 * Correct length in metres (Admin only, mandatory reason)
 */
export async function correctMetres(rollId, { metres, reason }, user, req) {
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Reason is mandatory for metres correction', 'REASON_REQUIRED');
  }

  const cleanMetres = Math.round(Number(metres) * 100) / 100;
  if (isNaN(cleanMetres) || cleanMetres < 0.1) {
    throw new ApiError(400, 'Metres must be a valid number of at least 0.1', 'INVALID_METRES');
  }

  const roll = await Roll.findOne({ id: rollId });
  if (!roll) {
    throw new ApiError(404, `Roll '${rollId}' not found`, 'ROLL_NOT_FOUND');
  }

  if (roll.status === 'Void') {
    throw new ApiError(400, 'Cannot correct metres of a void roll', 'ROLL_VOID');
  }

  const metresBefore = roll.metres;
  roll.metres = cleanMetres;
  await roll.save();

  await RollMovement.create({
    rollId: roll.id,
    type: 'metres_correction',
    metresBefore,
    metresAfter: cleanMetres,
    note: reason.trim(),
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'Admin',
    at: new Date()
  });

  await logAuditEvent({
    action: 'roll.metres_correction',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: roll.id,
    details: { metresBefore, metresAfter: cleanMetres, reason: reason.trim() },
    req
  });

  emitToAll('roll:updated', roll);

  return roll;
}

/**
 * Mark a roll as Void (Admin only, mandatory reason, never deleted)
 */
export async function voidRoll(rollId, { reason }, user, req) {
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Reason is mandatory to void a roll', 'REASON_REQUIRED');
  }

  const roll = await Roll.findOne({ id: rollId });
  if (!roll) {
    throw new ApiError(404, `Roll '${rollId}' not found`, 'ROLL_NOT_FOUND');
  }

  if (roll.status === 'Void') {
    throw new ApiError(400, 'Roll is already marked as Void', 'ALREADY_VOID');
  }

  const fromStatus = roll.status;
  roll.status = 'Void';
  await roll.save();

  await RollMovement.create({
    rollId: roll.id,
    type: 'void',
    fromStatus,
    toStatus: 'Void',
    note: reason.trim(),
    byUserId: user?._id || null,
    byName: user?.displayName || user?.username || 'Admin',
    at: new Date()
  });

  await logAuditEvent({
    action: 'roll.void',
    performedBy: user ? { userId: user._id, username: user.username, role: user.role } : null,
    targetEntity: 'Roll',
    targetId: roll.id,
    details: { fromStatus, reason: reason.trim() },
    req
  });

  emitToAll('roll:updated', roll);

  return roll;
}

/**
 * Staff Scan: Returns complete rich detail including live machine, location, and movement timeline
 */
export async function scanRollStaff(code, user) {
  const query = code.startsWith('TK-')
    ? { id: code.toUpperCase() }
    : { $or: [{ qrToken: code }, { id: code.toUpperCase() }] };

  const roll = await Roll.findOne(query);
  if (!roll) {
    throw new ApiError(404, `Roll not found matching '${code}'`, 'ROLL_NOT_FOUND');
  }

  // Update scan metrics
  roll.scanCount = (roll.scanCount || 0) + 1;
  roll.lastScannedAt = new Date();
  if (user) {
    roll.lastScannedBy = {
      userId: user._id,
      username: user.username,
      role: user.role
    };
  }
  await roll.save();

  // Fetch related details
  const [liveMachine, location, movements] = await Promise.all([
    Machine.findOne({ id: roll.machineId }),
    Location.findOne({ id: roll.locationId }),
    RollMovement.find({ rollId: roll.id }).sort({ at: -1 })
  ]);

  return {
    roll,
    machine: liveMachine
      ? {
          id: liveMachine.id,
          name: liveMachine.name,
          shed: liveMachine.shed,
          model: liveMachine.model,
          status: liveMachine.status,
          rpm: liveMachine.rpm,
          efficiency: liveMachine.efficiency
        }
      : {
          id: roll.machineId,
          name: roll.machineName,
          shed: roll.machineShed,
          model: roll.machineModel,
          status: 'unknown'
        },
    location: location
      ? {
          id: location.id,
          name: location.name,
          code: location.code,
          type: location.type,
          shed: location.shed
        }
      : {
          id: roll.locationId,
          name: roll.locationId,
          type: 'rack',
          shed: 'Main Shed'
        },
    movements
  };
}

/**
 * Public Scan: strictly whitelisted info, no internal leak, uniform 404
 */
export async function scanRollPublic(code) {
  if (process.env.PUBLIC_ROLL_LOOKUP === 'false') {
    throw new ApiError(404, 'Public roll verification is disabled', 'ROLL_NOT_FOUND');
  }

  const query = code.startsWith('TK-')
    ? { id: code.toUpperCase() }
    : { $or: [{ qrToken: code }, { id: code.toUpperCase() }] };

  const roll = await Roll.findOne(query);
  if (!roll || roll.status === 'Void') {
    throw new ApiError(404, 'Roll not found or inactive', 'ROLL_NOT_FOUND');
  }

  // Increment scan metric silently
  await Roll.updateOne({ _id: roll._id }, { $inc: { scanCount: 1 }, $set: { lastScannedAt: new Date() } });

  let locationInfo = null;
  if (process.env.PUBLIC_ROLL_SHOW_LOCATION !== 'false') {
    const loc = await Location.findOne({ id: roll.locationId });
    if (loc) {
      locationInfo = {
        name: loc.name,
        shed: loc.shed
      };
    }
  }

  // Strict whitelist return
  return {
    id: roll.id,
    fabric: roll.fabric,
    quality: roll.quality,
    metres: roll.metres,
    machine: {
      id: roll.machineId,
      name: roll.machineName
    },
    location: locationInfo,
    status: roll.status,
    producedAt: roll.producedAt
  };
}

/**
 * List rolls with filters, pagination, and sorting
 */
export async function getRolls({
  search,
  status,
  machineId,
  locationId,
  fabric,
  from,
  to,
  page = 1,
  limit = 50,
  sort = '-createdAt'
}) {
  const query = {};

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { id: { $regex: escaped, $options: 'i' } },
      { fabric: { $regex: escaped, $options: 'i' } },
      { machineName: { $regex: escaped, $options: 'i' } },
      { machineId: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (status) query.status = status;
  if (machineId) query.machineId = machineId;
  if (locationId) query.locationId = locationId.toUpperCase();
  if (fabric) query.fabric = fabric;

  if (from || to) {
    query.producedAt = {};
    if (from) query.producedAt.$gte = new Date(from);
    if (to) query.producedAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [rolls, total] = await Promise.all([
    Roll.find(query).sort(sort).skip(skip).limit(limitNum),
    Roll.countDocuments(query)
  ]);

  return {
    rolls,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Aggregated summary for rolls
 */
export async function getRollsSummary() {
  const [totalRolls, totalMetresResult, byStatus, byLocation, byMachine] = await Promise.all([
    Roll.countDocuments({ status: { $ne: 'Void' } }),
    Roll.aggregate([
      { $match: { status: { $ne: 'Void' } } },
      { $group: { _id: null, totalMetres: { $sum: '$metres' } } }
    ]),
    Roll.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalMetres: { $sum: '$metres' } } }
    ]),
    Roll.aggregate([
      { $match: { status: { $ne: 'Void' } } },
      { $group: { _id: '$locationId', count: { $sum: 1 }, totalMetres: { $sum: '$metres' } } }
    ]),
    Roll.aggregate([
      { $match: { status: { $ne: 'Void' } } },
      { $group: { _id: '$machineId', machineName: { $first: '$machineName' }, count: { $sum: 1 }, totalMetres: { $sum: '$metres' } } }
    ])
  ]);

  const totalMetres = totalMetresResult[0]?.totalMetres
    ? Math.round(totalMetresResult[0].totalMetres * 100) / 100
    : 0;

  return {
    totalRolls,
    totalMetres,
    byStatus: byStatus.reduce((acc, curr) => {
      acc[curr._id] = { count: curr.count, metres: Math.round(curr.totalMetres * 100) / 100 };
      return acc;
    }, {}),
    byLocation,
    byMachine
  };
}
