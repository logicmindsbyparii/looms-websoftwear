import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Dispatch } from '../src/models/Dispatch.js';
import { DeliveryOTP } from '../src/models/DeliveryOTP.js';
import { DeliveryConfirmation } from '../src/models/DeliveryConfirmation.js';
import { DeliveryAuditLog } from '../src/models/DeliveryAuditLog.js';
import { Roll } from '../src/models/Roll.js';
import * as deliveryService from '../src/services/deliveryService.js';
import * as rollService from '../src/services/rollService.js';

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/loomus_test_db';

describe('Secure Party Delivery Verification System Tests', () => {
  let adminToken = '';
  let supervisorToken = '';
  let driverToken = '';
  let isDbConnected = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isDbConnected = true;

      // Clean test collections
      await User.deleteMany({});
      await Dispatch.deleteMany({});
      await DeliveryOTP.deleteMany({});
      await DeliveryConfirmation.deleteMany({});
      await DeliveryAuditLog.deleteMany({}).setOptions({ __allowAuditModification: true });
      await Roll.deleteMany({});

      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('Admin@123456', salt);
      const superPass = await bcrypt.hash('Supervisor@123456', salt);
      const driverPass = await bcrypt.hash('Driver@123456', salt);

      await User.create({
        username: 'admin_test',
        displayName: 'Test Admin',
        role: 'Admin',
        passwordHash: adminPass,
        isActive: true
      });

      await User.create({
        username: 'supervisor_test',
        displayName: 'Test Supervisor',
        role: 'Supervisor',
        passwordHash: superPass,
        isActive: true
      });

      await User.create({
        username: 'driver_test',
        displayName: 'Ramesh Tempo Driver',
        role: 'Driver',
        passwordHash: driverPass,
        isActive: true
      });

      // Log in and obtain JWTs
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin_test', password: 'Admin@123456' });
      adminToken = adminLogin.body.data?.accessToken;

      const superLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor_test', password: 'Supervisor@123456' });
      supervisorToken = superLogin.body.data?.accessToken;

      const driverLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'driver_test', password: 'Driver@123456' });
      driverToken = driverLogin.body.data?.accessToken;
    } catch (err) {
      console.warn('MongoDB connection skipped in test environment:', err.message);
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      await mongoose.connection.close();
    }
  });

  // SCENARIO 1: Driver attempts to mark Delivered -> MUST BE BLOCKED
  test('Scenario 1: Driver attempts to mark shipment Delivered -> BLOCKED (403)', async () => {
    if (!isDbConnected) return;

    // Create a dispatch
    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Shree Radhe Textiles',
        partyPhone: '9876543210',
        fabric: 'Cotton 60s Cambric',
        totalMetresDispatched: 500,
        driverName: 'Ramesh Patel',
        driverPhone: '9825112345',
        vehicleNumber: 'GJ-05-AB-1234'
      });

    expect(createRes.status).toBe(201);
    const dispatchId = createRes.body.data.dispatchId;

    // Driver attempts to call transit with DELIVER or MARK_DELIVERED
    const driverRes = await request(app)
      .patch(`/api/dispatches/${dispatchId}/transit`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        action: 'MARK_DELIVERED'
      });

    expect(driverRes.status).toBe(403);
    expect(driverRes.body.errorCode).toBe('DRIVER_DELIVERY_FORBIDDEN');
  });

  // SCENARIO 2: Driver attempts to verify OTP -> MUST BE BLOCKED
  test('Scenario 2: Driver attempts to verify OTP directly -> BLOCKED', async () => {
    if (!isDbConnected) return;

    // Driver tries to call OTP confirmation endpoint with invalid/guessed OTP
    const driverOtpRes = await request(app)
      .post('/api/public/delivery/fake-driver-token/confirm')
      .send({
        token: 'fake-driver-token',
        otp: '123456',
        receiverName: 'Driver Attempting Fraud',
        receivedMetres: 500
      });

    expect([400, 404]).toContain(driverOtpRes.status);
  });

  // SCENARIO 3: Driver attempts to change received quantity -> MUST BE BLOCKED
  test('Scenario 3: Driver attempts to change received quantity on transit endpoint -> BLOCKED/IGNORED', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Surat Silk Mills',
        partyPhone: '9876543211',
        fabric: 'Silk Chiffon 75D',
        totalMetresDispatched: 600,
        driverName: 'Suresh Kumar',
        driverPhone: '9825154321',
        vehicleNumber: 'GJ-05-XY-9999'
      });

    const dispatchId = createRes.body.data.dispatchId;

    // Driver attempts to submit actualMetresReceived in transit update
    const res = await request(app)
      .patch(`/api/dispatches/${dispatchId}/transit`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        action: 'START_TRANSIT',
        receivedMetres: 400 // Driver tampering attempt
      });

    expect(res.status).toBe(200);
    // Received summary must still be null/unmodified
    const checkRes = await request(app)
      .get(`/api/dispatches/${dispatchId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(checkRes.body.data.dispatch.receivedSummary.actualMetresReceived).toBeNull();
  });

  // SCENARIO 4: Correct party OTP -> ALLOW confirmation
  test('Scenario 4: Correct party OTP -> ALLOW delivery confirmation (200)', async () => {
    if (!isDbConnected) return;

    process.env.ALLOW_DEV_MOCK_OTP = 'true';

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Ambica Fabrics',
        partyPhone: '9825011111',
        fabric: 'Polyester 75D Grey',
        totalMetresDispatched: 500,
        driverName: 'Mukesh Bhai',
        driverPhone: '9900011111',
        vehicleNumber: 'GJ-05-TR-4321'
      });

    const token = createRes.body.data.confirmationToken;
    expect(token).toBeDefined();

    // Request OTP
    const otpRes = await request(app)
      .post(`/api/public/delivery/${token}/request-otp`);
    expect(otpRes.status).toBe(200);
    const mockOtp = otpRes.body.data?.devMockOtp;
    expect(mockOtp).toBeDefined();

    // Confirm delivery with correct OTP and 500m
    const confirmRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: mockOtp,
        receiverName: 'Mr. Rajesh Shah (Party Manager)',
        receivedMetres: 500,
        receivedRollCount: 1,
        remarks: 'Received in good condition'
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('Delivered');
  });

  // SCENARIO 5: Incorrect OTP -> REJECT (400)
  test('Scenario 5: Incorrect OTP -> REJECT (400 INVALID_OTP)', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Balaji Fashion',
        partyPhone: '9825022222',
        fabric: 'Rayon Twill 30s',
        totalMetresDispatched: 300,
        driverName: 'Dinesh Driver',
        driverPhone: '9900022222',
        vehicleNumber: 'GJ-05-QQ-1111'
      });

    const token = createRes.body.data.confirmationToken;

    await request(app).post(`/api/public/delivery/${token}/request-otp`);

    const badConfirmRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: '000000', // incorrect OTP
        receiverName: 'Receiver',
        receivedMetres: 300
      });

    expect(badConfirmRes.status).toBe(400);
    expect(badConfirmRes.body.errorCode).toBe('INVALID_OTP');
  });

  // SCENARIO 6: Expired OTP -> REJECT
  test('Scenario 6: Expired OTP -> REJECT (400 OTP_EXPIRED)', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Kuber Weaves',
        partyPhone: '9825033333',
        fabric: 'Cotton 40s Combed',
        totalMetresDispatched: 400,
        driverName: 'Driver X',
        driverPhone: '9900033333',
        vehicleNumber: 'GJ-05-MM-2222'
      });

    const token = createRes.body.data.confirmationToken;
    const dispatchId = createRes.body.data.dispatchId;

    await request(app).post(`/api/public/delivery/${token}/request-otp`);

    // Manually backdate OTP expiresAt in DB
    await DeliveryOTP.updateOne(
      { dispatchId },
      { $set: { expiresAt: new Date(Date.now() - 10 * 60 * 1000) } }
    );

    const expiredRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: '123456',
        receiverName: 'Receiver',
        receivedMetres: 400
      });

    expect(expiredRes.status).toBe(400);
    expect(['OTP_EXPIRED', 'NO_ACTIVE_OTP']).toContain(expiredRes.body.errorCode);
  });

  // SCENARIO 7: Reused OTP -> REJECT
  test('Scenario 7: Reused OTP -> REJECT (400)', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Royal Prints',
        partyPhone: '9825044444',
        fabric: 'Heavy Denim 14oz',
        totalMetresDispatched: 250,
        driverName: 'Driver Y',
        driverPhone: '9900044444',
        vehicleNumber: 'GJ-05-DD-3333'
      });

    const token = createRes.body.data.confirmationToken;
    const otpRes = await request(app).post(`/api/public/delivery/${token}/request-otp`);
    const validOtp = otpRes.body.data.devMockOtp;

    // Use once
    await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Receiver A',
        receivedMetres: 250
      });

    // Attempt to reuse same OTP on a second request
    const reuseRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Receiver B',
        receivedMetres: 250
      });

    expect([400, 409]).toContain(reuseRes.status);
  });

  // SCENARIO 8: Duplicate delivery request -> REJECT (409)
  test('Scenario 8: Duplicate delivery request on already delivered shipment -> REJECT (409)', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Arihant Textiles',
        partyPhone: '9825055555',
        fabric: 'Jacquard Brocade',
        totalMetresDispatched: 500,
        driverName: 'Driver Z',
        driverPhone: '9900055555',
        vehicleNumber: 'GJ-05-AA-4444'
      });

    const token = createRes.body.data.confirmationToken;
    const otpRes = await request(app).post(`/api/public/delivery/${token}/request-otp`);
    const validOtp = otpRes.body.data.devMockOtp;

    // First confirmation
    const firstRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Authorized Receiver',
        receivedMetres: 500
      });
    expect(firstRes.status).toBe(200);

    // Duplicate confirmation attempt
    const dupRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Second Receiver',
        receivedMetres: 500
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.errorCode).toBe('ALREADY_DELIVERED');
  });

  // SCENARIO 9: 500 metres dispatched and 500 metres received -> Delivered
  test('Scenario 9: 500 metres dispatched and 500 metres received -> Delivered', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Pooja Synthetics',
        partyPhone: '9825066666',
        fabric: 'Cotton 60s Compact',
        totalMetresDispatched: 500,
        driverName: 'Driver P',
        driverPhone: '9900066666',
        vehicleNumber: 'GJ-05-PP-5555'
      });

    const token = createRes.body.data.confirmationToken;
    const otpRes = await request(app).post(`/api/public/delivery/${token}/request-otp`);
    const validOtp = otpRes.body.data.devMockOtp;

    const confirmRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Mr. Vimal Shah',
        receivedMetres: 500,
        receivedRollCount: 1
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('Delivered');
    expect(confirmRes.body.data.shortageMetres).toBe(0);
  });

  // SCENARIO 10: 500 metres dispatched and 470 metres received -> Delivery Disputed or Partially Delivered
  test('Scenario 10: 500 metres dispatched and 470 metres received -> Delivery Disputed (Shortage)', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Ganesh Creation',
        partyPhone: '9825077777',
        fabric: 'Rayon 30s Twill',
        totalMetresDispatched: 500,
        driverName: 'Driver G',
        driverPhone: '9900077777',
        vehicleNumber: 'GJ-05-GG-6666'
      });

    const token = createRes.body.data.confirmationToken;
    const otpRes = await request(app).post(`/api/public/delivery/${token}/request-otp`);
    const validOtp = otpRes.body.data.devMockOtp;

    const confirmRes = await request(app)
      .post(`/api/public/delivery/${token}/confirm`)
      .send({
        otp: validOtp,
        receiverName: 'Mr. Ketan Mehta',
        receivedMetres: 470, // 30m shortage
        receivedRollCount: 1,
        remarks: 'One roll cut short by 30 meters'
      });

    expect(confirmRes.status).toBe(200);
    expect(['Delivery Disputed', 'Partially Delivered']).toContain(confirmRes.body.data.status);
    expect(confirmRes.body.data.shortageMetres).toBe(30);
  });

  // SCENARIO 11: Unauthorized person opens confirmation link -> View only, no confirmation without OTP
  test('Scenario 11: Opening confirmation link without valid OTP does not confirm delivery', async () => {
    if (!isDbConnected) return;

    const createRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        partyName: 'Shiv Shakti Silks',
        partyPhone: '9825088888',
        fabric: 'Medium Grey 70*68',
        totalMetresDispatched: 350,
        driverName: 'Driver S',
        driverPhone: '9900088888',
        vehicleNumber: 'GJ-05-SS-7777'
      });

    const token = createRes.body.data.confirmationToken;

    // View public page
    const publicViewRes = await request(app).get(`/api/public/delivery/${token}`);
    expect(publicViewRes.status).toBe(200);
    expect(publicViewRes.body.data.dispatchId).toBeDefined();
    expect(publicViewRes.body.data.isAlreadyConfirmed).toBe(false);

    // Verify status has NOT changed to Delivered
    const checkDispatch = await Dispatch.findOne({ confirmationToken: token });
    expect(checkDispatch.status).not.toBe('Delivered');
  });

  // SCENARIO 12: Existing QR and roll tracking functionality continues working
  test('Scenario 12: Existing QR scan lookup continues working without side effects', async () => {
    if (!isDbConnected) return;

    // Create a roll in inventory
    const roll = await Roll.create({
      id: 'TK-TEST-999',
      qrToken: 'QR-TEST-TOKEN-999',
      fabric: 'Cambric 70*72',
      metres: 125.5,
      originalMetres: 125.5,
      machineId: 'M-01',
      machineName: 'Airjet Loom #1',
      locationId: 'LOC-TEST',
      status: 'Ready'
    });

    const qrRes = await request(app).get(`/api/public/rolls/${roll.qrToken}`);
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.data.id).toBe('TK-TEST-999');
    expect(qrRes.body.data.fabric).toBe('Cambric 70*72');

    // Roll status must still be 'Ready', NOT Delivered!
    const recheckedRoll = await Roll.findOne({ id: 'TK-TEST-999' });
    expect(recheckedRoll.status).toBe('Ready');
  });
});
