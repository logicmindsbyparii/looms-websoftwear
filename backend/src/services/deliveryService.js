import crypto from 'crypto';
import { Dispatch, VALID_DELIVERY_STATUSES } from '../models/Dispatch.js';
import { DeliveryOTP } from '../models/DeliveryOTP.js';
import { DeliveryConfirmation } from '../models/DeliveryConfirmation.js';
import { DeliveryAuditLog } from '../models/DeliveryAuditLog.js';
import { Roll } from '../models/Roll.js';
import { RollMovement } from '../models/RollMovement.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToAll } from './socketService.js';
import { sendPartyDeliveryOTP, notifyAdminEvent } from './notificationService.js';

// Helper to hash OTP with salt
function hashOTP(otp, dispatchId) {
  return crypto.createHash('sha256').update(`${otp}:${dispatchId}:${process.env.JWT_ACCESS_SECRET || 'loomus_otp_secret'}`).digest('hex');
}

// Generate secure 6-digit numeric OTP
function generateSecureOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * 1. Create a new Factory Dispatch
 * Admin or Supervisor only.
 */
export async function createDispatch(data, user, req) {
  const {
    salesOrderId,
    partyName,
    partyPhone,
    partyAddress,
    fabric,
    rolls: inputRolls,
    driverName,
    driverPhone,
    vehicleNumber,
    licenseNumber
  } = data;

  if (!partyName || !partyPhone) {
    throw new ApiError(400, 'Party name and registered mobile number are required', 'PARTY_INFO_REQUIRED');
  }

  if (!driverName || !driverPhone || !vehicleNumber) {
    throw new ApiError(400, 'Driver name, phone, and vehicle number are required', 'DRIVER_INFO_REQUIRED');
  }

  if (!fabric) {
    throw new ApiError(400, 'Fabric description is required', 'FABRIC_REQUIRED');
  }

  // Resolve roll items
  let validatedRolls = [];
  let totalMetres = 0;

  if (Array.isArray(inputRolls) && inputRolls.length > 0) {
    const rollIds = inputRolls.map(r => (typeof r === 'string' ? r.trim().toUpperCase() : r.rollId?.trim().toUpperCase()));
    
    // Check for duplicate roll IDs in request
    const uniqueRollIds = new Set(rollIds);
    if (uniqueRollIds.size !== rollIds.length) {
      throw new ApiError(400, 'Duplicate roll IDs detected in dispatch request', 'DUPLICATE_ROLL_INPUT');
    }

    const foundRolls = await Roll.find({ id: { $in: rollIds } });
    if (foundRolls.length !== rollIds.length) {
      const foundIds = new Set(foundRolls.map(r => r.id));
      const missing = rollIds.filter(id => !foundIds.has(id));
      throw new ApiError(404, `Rolls not found in inventory: ${missing.join(', ')}`, 'ROLLS_NOT_FOUND');
    }

    for (const roll of foundRolls) {
      if (roll.status === 'Void') {
        throw new ApiError(400, `Roll ${roll.id} is void and cannot be dispatched`, 'ROLL_VOID');
      }
      if (roll.status === 'Dispatched') {
        throw new ApiError(400, `Roll ${roll.id} is already dispatched in another shipment`, 'ROLL_ALREADY_DISPATCHED');
      }

      const metres = roll.metres;
      totalMetres += metres;
      validatedRolls.push({
        rollId: roll.id,
        qrToken: roll.qrToken,
        metres,
        quality: roll.quality || 'A-Grade (Export)'
      });
    }
  } else {
    // If rolls specified as custom metres or direct quantity
    const qty = parseFloat(data.totalMetresDispatched || data.qty);
    if (!qty || qty <= 0) {
      throw new ApiError(400, 'Valid fabric quantity in metres or roll IDs must be provided', 'QUANTITY_REQUIRED');
    }
    totalMetres = qty;
    validatedRolls.push({
      rollId: `ROLL-${Date.now().toString().slice(-6)}`,
      qrToken: `QR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      metres: qty,
      quality: 'Standard A-Grade'
    });
  }

  totalMetres = Math.round(totalMetres * 100) / 100;
  const totalRollsCount = validatedRolls.length;

  // Auto-generate unique Dispatch ID: DSP-YYYYMMDD-XXXX
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomInt(1000, 9999).toString();
  const dispatchId = `DSP-${todayStr}-${randomSuffix}`;

  // Generate unique, cryptographically random, single-use confirmation token
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const confirmationTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours validity

  const newDispatch = await Dispatch.create({
    dispatchId,
    salesOrderId: salesOrderId || null,
    partyName: partyName.trim(),
    partyPhone: partyPhone.trim(),
    partyAddress: partyAddress?.trim() || '',
    fabric: fabric.trim(),
    rolls: validatedRolls,
    totalMetresDispatched: totalMetres,
    totalRollsDispatched: totalRollsCount,
    driver: {
      name: driverName.trim(),
      phone: driverPhone.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      licenseNumber: licenseNumber?.trim() || ''
    },
    status: 'Dispatched',
    dispatchedAt: new Date(),
    dispatchedBy: {
      userId: user?._id || null,
      username: user?.username || 'admin',
      role: user?.role || 'Admin'
    },
    confirmationToken,
    confirmationTokenExpiresAt,
    confirmationTokenUsed: false
  });

  // Mark all dispatched rolls as Reserved in inventory during transit
  if (Array.isArray(inputRolls) && inputRolls.length > 0) {
    const rollIds = validatedRolls.map(r => r.rollId);
    await Roll.updateMany(
      { id: { $in: rollIds } },
      { $set: { status: 'Reserved', orderId: salesOrderId || dispatchId } }
    );

    for (const r of validatedRolls) {
      await RollMovement.create({
        rollId: r.rollId,
        type: 'status_change',
        toStatus: 'Reserved',
        metresAfter: r.metres,
        note: `Dispatched to ${partyName} via ${vehicleNumber} (Shipment: ${dispatchId})`,
        byUserId: user?._id || null,
        byName: user?.displayName || user?.username || 'Admin',
        at: new Date()
      });
    }
  }

  // If sales order linked, update sales order status to Dispatched
  if (salesOrderId) {
    const order = await SalesOrder.findOne({ id: salesOrderId });
    if (order && SalesOrder.isValidTransition(order.status, 'Dispatched')) {
      order.status = 'Dispatched';
      await order.save();
    }
  }

  // Create immutable audit log
  await DeliveryAuditLog.create({
    dispatchId,
    action: 'DISPATCH_CREATED',
    performedBy: {
      type: user?.role === 'Supervisor' ? 'SUPERVISOR' : 'ADMIN',
      userId: user?._id || null,
      name: user?.displayName || user?.username || 'Admin',
      role: user?.role || 'Admin',
      phone: user?.phone || ''
    },
    statusFrom: 'Draft',
    statusTo: 'Dispatched',
    details: {
      salesOrderId,
      partyName,
      partyPhone,
      fabric,
      rollsCount: totalRollsCount,
      driverName,
      vehicleNumber
    },
    dispatchedQty: totalMetres,
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  emitToAll('dispatch:created', newDispatch);

  await notifyAdminEvent({
    eventType: 'DISPATCH_CREATED',
    dispatch: newDispatch,
    details: { totalMetres, driverName, vehicleNumber }
  });

  return newDispatch;
}

/**
 * 2. Tempo Driver Transit Updates
 * Permitted actions: PICK_UP, START_TRANSIT, UPDATE_GPS, ARRIVED.
 * STRICT SECURITY INVARIANT:
 * Driver can NEVER set status to 'Delivered' or confirm delivery!
 */
export async function driverUpdateTransit({ dispatchId, action, latitude, longitude, address }, user, req) {
  // Fraud Prevention Invariant 1:
  if (action === 'DELIVER' || action === 'CONFIRM_DELIVERY' || action === 'MARK_DELIVERED') {
    throw new ApiError(
      403,
      'FRAUD_PREVENTION_VIOLATION: Tempo drivers are strictly prohibited from marking shipments Delivered. Delivery can only be confirmed by the authorized party receiver through OTP verification.',
      'DRIVER_DELIVERY_FORBIDDEN'
    );
  }

  const dispatch = await Dispatch.findOne({ dispatchId: dispatchId.toUpperCase() });
  if (!dispatch) {
    throw new ApiError(404, 'Dispatch shipment not found', 'DISPATCH_NOT_FOUND');
  }

  if (['Delivered', 'Cancelled'].includes(dispatch.status)) {
    throw new ApiError(400, `Shipment is already ${dispatch.status} and cannot be modified`, 'TERMINAL_STATE');
  }

  const previousStatus = dispatch.status;
  let newStatus = dispatch.status;

  switch (action) {
    case 'PICK_UP':
      if (dispatch.status !== 'Dispatched') {
        throw new ApiError(400, `Cannot pick up shipment from status "${dispatch.status}"`, 'INVALID_STATUS_TRANSITION');
      }
      newStatus = 'Picked Up';
      dispatch.status = 'Picked Up';
      dispatch.collectionTime = new Date();
      break;

    case 'START_TRANSIT':
      if (!['Dispatched', 'Picked Up'].includes(dispatch.status)) {
        throw new ApiError(400, `Cannot start transit from status "${dispatch.status}"`, 'INVALID_STATUS_TRANSITION');
      }
      newStatus = 'In Transit';
      dispatch.status = 'In Transit';
      dispatch.transitStartedAt = new Date();
      break;

    case 'UPDATE_GPS':
      // Status remains in transit, records GPS ping
      if (latitude && longitude) {
        dispatch.currentLocation = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: address || '',
          updatedAt: new Date()
        };
        dispatch.locationHistory.push({
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: address || '',
          recordedAt: new Date()
        });
      }
      break;

    case 'ARRIVED':
      if (!['Picked Up', 'In Transit'].includes(dispatch.status)) {
        throw new ApiError(400, `Cannot mark arrived from status "${dispatch.status}"`, 'INVALID_STATUS_TRANSITION');
      }
      newStatus = 'Awaiting Receiver Confirmation';
      dispatch.status = 'Awaiting Receiver Confirmation';
      break;

    default:
      throw new ApiError(400, `Invalid transit action "${action}"`, 'INVALID_TRANSIT_ACTION');
  }

  await dispatch.save();

  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: `TRANSIT_${action}`,
    performedBy: {
      type: user?.role === 'Driver' ? 'DRIVER' : (user?.role === 'Supervisor' ? 'SUPERVISOR' : 'ADMIN'),
      userId: user?._id || null,
      name: user?.displayName || user?.username || dispatch.driver.name,
      role: user?.role || 'Driver',
      phone: dispatch.driver.phone
    },
    statusFrom: previousStatus,
    statusTo: newStatus,
    details: { action, address },
    gps: latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude), address: address || '' } : undefined,
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  emitToAll('dispatch:status_changed', {
    dispatchId: dispatch.dispatchId,
    status: dispatch.status,
    currentLocation: dispatch.currentLocation
  });

  await notifyAdminEvent({
    eventType: `TRANSIT_${action}`,
    dispatch,
    details: { action, location: address }
  });

  return dispatch;
}

/**
 * 3. Public Party Link Lookup
 * Read-only summary for receiver verification page.
 * Does NOT require staff login.
 */
export async function getPublicDeliveryByToken(token, req) {
  if (!token || typeof token !== 'string') {
    throw new ApiError(400, 'Invalid delivery token', 'INVALID_TOKEN');
  }

  const dispatch = await Dispatch.findOne({ confirmationToken: token.trim() });
  if (!dispatch) {
    throw new ApiError(404, 'Delivery confirmation link is invalid or expired', 'DISPATCH_NOT_FOUND');
  }

  if (new Date() > new Date(dispatch.confirmationTokenExpiresAt)) {
    throw new ApiError(410, 'This delivery confirmation link has expired. Please contact the mill office.', 'LINK_EXPIRED');
  }

  // Mask party mobile for privacy (e.g., +91 98*** **321)
  const phone = dispatch.partyPhone;
  const maskedPhone = phone.length > 5
    ? phone.slice(0, 5) + '*** **' + phone.slice(-3)
    : '***';

  // Audit log public page access
  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: 'CONFIRMATION_LINK_ACCESSED',
    performedBy: {
      type: 'PARTY_RECEIVER',
      name: dispatch.partyName,
      phone: dispatch.partyPhone
    },
    statusFrom: dispatch.status,
    statusTo: dispatch.status,
    details: { tokenAccessed: true },
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  return {
    factoryName: 'LoomTrack / LOOMUS Textile Suite',
    dispatchId: dispatch.dispatchId,
    salesOrderId: dispatch.salesOrderId,
    partyName: dispatch.partyName,
    partyPhoneMasked: maskedPhone,
    partyAddress: dispatch.partyAddress,
    fabric: dispatch.fabric,
    totalMetresDispatched: dispatch.totalMetresDispatched,
    totalRollsDispatched: dispatch.totalRollsDispatched,
    rolls: dispatch.rolls.map(r => ({
      rollId: r.rollId,
      metres: r.metres,
      quality: r.quality
    })),
    driver: {
      name: dispatch.driver.name,
      phone: dispatch.driver.phone,
      vehicleNumber: dispatch.driver.vehicleNumber
    },
    status: dispatch.status,
    dispatchedAt: dispatch.dispatchedAt,
    collectionTime: dispatch.collectionTime,
    isAlreadyConfirmed: ['Delivered', 'Partially Delivered'].includes(dispatch.status),
    receivedSummary: ['Delivered', 'Partially Delivered', 'Delivery Disputed'].includes(dispatch.status)
      ? dispatch.receivedSummary
      : null
  };
}

/**
 * 4. Request Receiver OTP
 * Generates single-use 6-digit OTP, hashes it, and sends it to the party's registered mobile.
 */
export async function requestReceiverOTP({ token }, req) {
  if (!token) throw new ApiError(400, 'Confirmation token is required', 'TOKEN_REQUIRED');

  const dispatch = await Dispatch.findOne({ confirmationToken: token.trim() });
  if (!dispatch) {
    throw new ApiError(404, 'Invalid confirmation link', 'DISPATCH_NOT_FOUND');
  }

  if (['Delivered', 'Partially Delivered'].includes(dispatch.status)) {
    throw new ApiError(400, 'This delivery has already been verified and confirmed.', 'ALREADY_DELIVERED');
  }

  if (new Date() > new Date(dispatch.confirmationTokenExpiresAt)) {
    throw new ApiError(410, 'Delivery confirmation link has expired', 'LINK_EXPIRED');
  }

  // Rate-limit: Check if an active OTP was created in the last 60 seconds (anti-spam)
  const recentOtp = await DeliveryOTP.findOne({
    dispatchId: dispatch.dispatchId,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
  });

  if (recentOtp) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another OTP', 'OTP_COOLDOWN');
  }

  // Invalidate any previously unused OTPs for this dispatch
  await DeliveryOTP.updateMany(
    { dispatchId: dispatch.dispatchId, isUsed: false },
    { $set: { isUsed: true } }
  );

  const otp = generateSecureOTP();
  const otpHash = hashOTP(otp, dispatch.dispatchId);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

  await DeliveryOTP.create({
    dispatchId: dispatch.dispatchId,
    partyPhone: dispatch.partyPhone,
    otpHash,
    attempts: 0,
    maxAttempts: 5,
    isUsed: false,
    expiresAt
  });

  // Automatically update status to Awaiting Receiver Confirmation if currently In Transit
  if (dispatch.status === 'In Transit' || dispatch.status === 'Picked Up') {
    dispatch.status = 'Awaiting Receiver Confirmation';
    await dispatch.save();
  }

  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: 'OTP_REQUESTED',
    performedBy: {
      type: 'PARTY_RECEIVER',
      name: dispatch.partyName,
      phone: dispatch.partyPhone
    },
    statusFrom: dispatch.status,
    statusTo: dispatch.status,
    details: { expiresAt },
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  // Dispatch OTP via SMS Service
  const sendResult = await sendPartyDeliveryOTP({
    phone: dispatch.partyPhone,
    otp,
    dispatchId: dispatch.dispatchId,
    partyName: dispatch.partyName
  });

  const responsePayload = {
    message: `Verification OTP dispatched to registered mobile ${dispatch.partyPhone.slice(0, 5)}***`,
    expiresInSeconds: 300
  };

  // Development/Test simulation helper: Only expose mock hint when strictly running in development/test and simulated
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && process.env.ALLOW_DEV_MOCK_OTP === 'true' && sendResult.simulated) {
    responsePayload.devMockOtp = otp;
  }

  return responsePayload;
}

/**
 * 5. Party Receiver OTP Verification & Delivery Confirmation
 * STRICT FRAUD PREVENTION:
 * - Driver is BLOCKED from this endpoint.
 * - OTP must match hash.
 * - Max 5 attempts.
 * - Dispatched and Received quantities recorded separately.
 * - If discrepancy/shortage/damage exists, status set to Partially Delivered or Delivery Disputed.
 */
export async function confirmReceiverDelivery(data, req) {
  const {
    token,
    otp,
    receivedMetres,
    receivedRollCount,
    damagedRolls = [],
    remarks = '',
    receiverName,
    photos = []
  } = data;

  if (!token || !otp || !receiverName) {
    throw new ApiError(400, 'Confirmation token, OTP, and receiver name are required', 'MISSING_VERIFICATION_FIELDS');
  }

  const dispatch = await Dispatch.findOne({ confirmationToken: token.trim() });
  if (!dispatch) {
    throw new ApiError(404, 'Invalid delivery token', 'DISPATCH_NOT_FOUND');
  }

  // Idempotency: Shipment cannot be confirmed or delivered twice!
  if (['Delivered', 'Partially Delivered'].includes(dispatch.status) || dispatch.confirmationTokenUsed) {
    throw new ApiError(409, 'This shipment has already been confirmed and completed.', 'ALREADY_DELIVERED');
  }

  if (new Date() > new Date(dispatch.confirmationTokenExpiresAt)) {
    throw new ApiError(410, 'Delivery confirmation link has expired', 'LINK_EXPIRED');
  }

  // Validate numeric input
  const actualMetres = parseFloat(receivedMetres);
  if (isNaN(actualMetres) || actualMetres < 0) {
    throw new ApiError(400, 'Valid received metres quantity is required', 'INVALID_QUANTITY');
  }

  const actualRolls = parseInt(receivedRollCount, 10) || dispatch.totalRollsDispatched;

  // Find active OTP record
  const otpRecord = await DeliveryOTP.findOne({
    dispatchId: dispatch.dispatchId,
    isUsed: false
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, 'No active OTP found. Please request a new OTP.', 'NO_ACTIVE_OTP');
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new ApiError(400, 'OTP has expired. Please request a new OTP.', 'OTP_EXPIRED');
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new ApiError(429, 'Maximum OTP verification attempts exceeded. Please request a new OTP.', 'MAX_ATTEMPTS_EXCEEDED');
  }

  // Verify OTP hash
  const computedHash = hashOTP(otp.trim(), dispatch.dispatchId);
  if (computedHash !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    await DeliveryAuditLog.create({
      dispatchId: dispatch.dispatchId,
      action: 'OTP_VERIFY_FAILED',
      performedBy: {
        type: 'PARTY_RECEIVER',
        name: receiverName,
        phone: dispatch.partyPhone
      },
      statusFrom: dispatch.status,
      statusTo: dispatch.status,
      details: { attempt: otpRecord.attempts, maxAttempts: otpRecord.maxAttempts },
      ip: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
      timestamp: new Date()
    });

    const remaining = otpRecord.maxAttempts - otpRecord.attempts;
    throw new ApiError(
      400,
      `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      'INVALID_OTP'
    );
  }

  // OTP is correct! Invalidate OTP immediately to ensure single-use
  otpRecord.isUsed = true;
  await otpRecord.save();

  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: 'OTP_VERIFIED_SUCCESS',
    performedBy: {
      type: 'PARTY_RECEIVER',
      name: receiverName,
      phone: dispatch.partyPhone
    },
    statusFrom: dispatch.status,
    statusTo: dispatch.status,
    details: { verified: true },
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  // Evaluate Shortage & Damage Discrepancy
  const dispatchedMetres = dispatch.totalMetresDispatched;
  const shortageMetres = Math.round(Math.max(0, dispatchedMetres - actualMetres) * 100) / 100;
  const hasDamage = Array.isArray(damagedRolls) && damagedRolls.length > 0;
  const hasShortage = shortageMetres > 0.05; // tolerates small decimal rounding
  const hasRollDiscrepancy = actualRolls < dispatch.totalRollsDispatched;

  let finalStatus = 'Delivered';
  let isDisputed = false;

  if (hasShortage || hasDamage || hasRollDiscrepancy) {
    if (shortageMetres > 10 || hasDamage) {
      finalStatus = 'Delivery Disputed';
      isDisputed = true;
    } else {
      finalStatus = 'Partially Delivered';
    }
  }

  // Update Dispatch Record
  dispatch.status = finalStatus;
  dispatch.confirmationTokenUsed = true;
  dispatch.receivedSummary = {
    actualMetresReceived: actualMetres,
    actualRollsReceived: actualRolls,
    shortageMetres,
    damagedRolls,
    remarks: remarks.trim(),
    receiverName: receiverName.trim(),
    receiverPhone: dispatch.partyPhone,
    photos: Array.isArray(photos) ? photos : [],
    confirmedAt: new Date()
  };

  if (isDisputed) {
    dispatch.disputeDetails = {
      isDisputed: true,
      disputedAt: new Date(),
      reason: `Shortage: ${shortageMetres}m | Damage items: ${damagedRolls.length} | Notes: ${remarks.slice(0, 100)}`,
      resolved: false
    };
  }

  await dispatch.save();

  // Create permanent DeliveryConfirmation certificate
  const confirmationId = `DC-${Date.now().toString().slice(-8)}`;
  const confirmationDoc = await DeliveryConfirmation.create({
    confirmationId,
    dispatchId: dispatch.dispatchId,
    salesOrderId: dispatch.salesOrderId,
    partyName: dispatch.partyName,
    partyPhone: dispatch.partyPhone,
    fabric: dispatch.fabric,
    dispatchedMetres,
    receivedMetres: actualMetres,
    dispatchedRolls: dispatch.totalRollsDispatched,
    receivedRolls: actualRolls,
    shortageMetres,
    damagedRolls,
    status: finalStatus,
    receiverName: receiverName.trim(),
    receiverPhone: dispatch.partyPhone,
    remarks: remarks.trim(),
    photos,
    verifiedVia: 'RECEIVER_OTP',
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    confirmedAt: new Date()
  });

  // Update inventory rolls status to Dispatched
  const realRollIds = dispatch.rolls.map(r => r.rollId).filter(id => !id.startsWith('ROLL-'));
  if (realRollIds.length > 0) {
    await Roll.updateMany(
      { id: { $in: realRollIds } },
      { $set: { status: 'Dispatched' } }
    );

    for (const r of dispatch.rolls.filter(ro => !ro.rollId.startsWith('ROLL-'))) {
      await RollMovement.create({
        rollId: r.rollId,
        type: 'status_change',
        toStatus: 'Dispatched',
        metresAfter: r.metres,
        note: `Delivery confirmed by ${receiverName} (${finalStatus}). Shipment: ${dispatch.dispatchId}`,
        byUserId: null,
        byName: `${receiverName} (Party Receiver)`,
        at: new Date()
      });
    }
  }

  // Update sales order if linked
  if (dispatch.salesOrderId) {
    const order = await SalesOrder.findOne({ id: dispatch.salesOrderId });
    if (order) {
      if (finalStatus === 'Delivered' && SalesOrder.isValidTransition(order.status, 'Delivered')) {
        order.status = 'Delivered';
        await order.save();
      }
    }
  }

  // Immutable audit trail
  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: isDisputed ? 'DELIVERY_DISPUTED' : 'DELIVERY_CONFIRMED',
    performedBy: {
      type: 'PARTY_RECEIVER',
      name: receiverName,
      phone: dispatch.partyPhone
    },
    statusFrom: 'Awaiting Receiver Confirmation',
    statusTo: finalStatus,
    details: {
      dispatchedMetres,
      receivedMetres: actualMetres,
      shortageMetres,
      damageCount: damagedRolls.length,
      remarks,
      confirmationId
    },
    dispatchedQty: dispatchedMetres,
    receivedQty: actualMetres,
    shortage: shortageMetres,
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  emitToAll('delivery:confirmed', {
    dispatchId: dispatch.dispatchId,
    status: finalStatus,
    dispatchedMetres,
    receivedMetres: actualMetres,
    shortageMetres,
    receiverName
  });

  await notifyAdminEvent({
    eventType: isDisputed ? 'DELIVERY_DISPUTED' : 'DELIVERY_COMPLETED',
    dispatch,
    details: { shortageMetres, damageCount: damagedRolls.length, receiverName }
  });

  return {
    success: true,
    status: finalStatus,
    confirmationId,
    dispatchId: dispatch.dispatchId,
    dispatchedMetres,
    receivedMetres: actualMetres,
    shortageMetres,
    message: finalStatus === 'Delivered'
      ? 'Delivery successfully verified and confirmed.'
      : `Delivery verified with recorded discrepancies (${finalStatus}). Admin alerted.`
  };
}

/**
 * 6. Admin Dispute Resolution
 * Only authorized Admin can resolve disputes.
 */
export async function resolveDispute({ dispatchId, action, resolutionNote }, user, req) {
  if (user?.role !== 'Admin') {
    throw new ApiError(403, 'Only administrators can resolve delivery disputes', 'FORBIDDEN_ROLE');
  }

  const dispatch = await Dispatch.findOne({ dispatchId: dispatchId.toUpperCase() });
  if (!dispatch) {
    throw new ApiError(404, 'Dispatch shipment not found', 'DISPATCH_NOT_FOUND');
  }

  if (dispatch.status !== 'Delivery Disputed' && dispatch.status !== 'Partially Delivered') {
    throw new ApiError(400, `Shipment is currently "${dispatch.status}" and has no active dispute`, 'NO_ACTIVE_DISPUTE');
  }

  const previousStatus = dispatch.status;
  let newStatus = dispatch.status;

  switch (action) {
    case 'ACCEPT_SHORTAGE':
      newStatus = 'Partially Delivered';
      break;
    case 'CONFIRM_RECOUNT':
    case 'REJECT_CLAIM':
      newStatus = 'Delivered';
      break;
    case 'MARK_FAILED':
      newStatus = 'Delivery Failed';
      break;
    default:
      throw new ApiError(400, `Invalid resolution action "${action}"`, 'INVALID_ACTION');
  }

  dispatch.status = newStatus;
  dispatch.disputeDetails.resolved = true;
  dispatch.disputeDetails.resolvedBy = {
    userId: user._id,
    username: user.username,
    role: user.role
  };
  dispatch.disputeDetails.resolvedAt = new Date();
  dispatch.disputeDetails.resolutionAction = action;
  dispatch.disputeDetails.resolutionNote = resolutionNote || '';

  await dispatch.save();

  await DeliveryAuditLog.create({
    dispatchId: dispatch.dispatchId,
    action: 'DISPUTE_RESOLVED',
    performedBy: {
      type: 'ADMIN',
      userId: user._id,
      name: user.displayName || user.username,
      role: user.role
    },
    statusFrom: previousStatus,
    statusTo: newStatus,
    details: { action, resolutionNote },
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    timestamp: new Date()
  });

  emitToAll('dispatch:dispute_resolved', {
    dispatchId: dispatch.dispatchId,
    status: newStatus,
    action,
    resolutionNote
  });

  return dispatch;
}

/**
 * 7. List Dispatches with Filters
 */
export async function getDispatches(filters = {}) {
  const query = {};

  if (filters.status && filters.status !== 'All') {
    query.status = filters.status;
  }

  if (filters.party) {
    query.partyName = { $regex: filters.party, $options: 'i' };
  }

  if (filters.driver) {
    query['driver.name'] = { $regex: filters.driver, $options: 'i' };
  }

  if (filters.vehicle) {
    query['driver.vehicleNumber'] = { $regex: filters.vehicle, $options: 'i' };
  }

  if (filters.dispatchId) {
    query.dispatchId = { $regex: filters.dispatchId, $options: 'i' };
  }

  if (filters.startDate || filters.endDate) {
    query.dispatchedAt = {};
    if (filters.startDate) query.dispatchedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.dispatchedAt.$lte = new Date(filters.endDate);
  }

  const dispatches = await Dispatch.find(query).sort({ createdAt: -1 });

  // Calculate summary counts
  const total = await Dispatch.countDocuments();
  const inTransit = await Dispatch.countDocuments({ status: 'In Transit' });
  const awaiting = await Dispatch.countDocuments({ status: 'Awaiting Receiver Confirmation' });
  const delivered = await Dispatch.countDocuments({ status: 'Delivered' });
  const partial = await Dispatch.countDocuments({ status: 'Partially Delivered' });
  const disputed = await Dispatch.countDocuments({ status: 'Delivery Disputed' });
  const failed = await Dispatch.countDocuments({ status: 'Delivery Failed' });

  return {
    dispatches,
    metrics: {
      total,
      inTransit,
      awaiting,
      delivered,
      partial,
      disputed,
      failed
    }
  };
}

/**
 * 8. Get Single Dispatch Details & History
 */
export async function getDispatchById(dispatchId) {
  const dispatch = await Dispatch.findOne({ dispatchId: dispatchId.toUpperCase() });
  if (!dispatch) {
    throw new ApiError(404, 'Dispatch not found', 'DISPATCH_NOT_FOUND');
  }

  const auditLogs = await DeliveryAuditLog.find({ dispatchId: dispatch.dispatchId }).sort({ timestamp: 1 });
  const confirmation = await DeliveryConfirmation.findOne({ dispatchId: dispatch.dispatchId });

  return {
    dispatch,
    auditLogs,
    confirmation
  };
}
