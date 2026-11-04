import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Machine } from '../src/models/Machine.js';
import { Location } from '../src/models/Location.js';
import { Roll } from '../src/models/Roll.js';
import { RollMovement } from '../src/models/RollMovement.js';
import { Counter } from '../src/models/Counter.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/loomus_test_db';

describe('LOOMUS 2.0 Roll QR Tracking & Ledger Tests', () => {
  let adminToken = '';
  let supervisorToken = '';
  let operatorToken = '';
  let testMachineId = 'M-TEST-01';
  let testLocationId = 'LOC-TEST-01';
  let testLocationId2 = 'LOC-TEST-02';

  beforeAll(async () => {
    await mongoose.connect(TEST_MONGO_URI);
    await Roll.deleteMany({});
    await RollMovement.deleteMany({ __forceLedgerPurge: true });
    await Location.deleteMany({});
    await Machine.deleteMany({});
    await User.deleteMany({});
    await Counter.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('TestPass@2026!', salt);

    await User.create([
      { username: 'testadmin', displayName: 'Admin User', role: 'Admin', passwordHash: hash, isActive: true },
      { username: 'testsupervisor', displayName: 'Supervisor User', role: 'Supervisor', passwordHash: hash, isActive: true },
      { username: 'testoperator', displayName: 'Operator User', role: 'Operator', assignedMachines: ['M-TEST-01'], passwordHash: hash, isActive: true }
    ]);

    // Admin login
    const adminLogin = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'TestPass@2026!' });
    adminToken = adminLogin.body.data.accessToken;

    // Supervisor login
    const supervisorLogin = await request(app).post('/api/auth/login').send({ username: 'testsupervisor', password: 'TestPass@2026!' });
    supervisorToken = supervisorLogin.body.data.accessToken;

    // Operator login
    const operatorLogin = await request(app).post('/api/auth/login').send({ username: 'testoperator', password: 'TestPass@2026!' });
    operatorToken = operatorLogin.body.data.accessToken;

    // Create test machine and locations
    await Machine.create({
      id: testMachineId,
      name: 'Test Airjet Loom #1',
      shed: 'Shed A',
      fabric: '70*72 Plain Cambric',
      status: 'running'
    });

    await Location.create([
      { id: testLocationId, name: 'Production Floor Shed A', code: 'FLR-A', type: 'floor', shed: 'Shed A', isActive: true },
      { id: testLocationId2, name: 'Rack Test 02', code: 'RCK-02', type: 'rack', shed: 'Main Shed', isActive: true }
    ]);
  });

  afterAll(async () => {
    await Roll.deleteMany({});
    await RollMovement.deleteMany({ __forceLedgerPurge: true });
    await Location.deleteMany({});
    await Machine.deleteMany({});
    await User.deleteMany({});
    await Counter.deleteMany({});
    await mongoose.connection.close();
  });

  let createdRoll = null;

  test('POST /api/rolls - Create a single roll & verify immutable created movement', async () => {
    const res = await request(app)
      .post('/api/rolls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        machineId: testMachineId,
        metres: 105.75,
        quality: 'A-Grade (Export)',
        shift: 'Morning',
        locationId: testLocationId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^TK-\d{4}-\d{6}$/);
    expect(res.body.data.qrToken).toBeDefined();
    expect(res.body.data.metres).toBe(105.75);
    expect(res.body.data.status).toBe('Ready');

    createdRoll = res.body.data;

    // Verify created movement ledger entry
    const movements = await RollMovement.find({ rollId: createdRoll.id });
    expect(movements.length).toBe(1);
    expect(movements[0].type).toBe('created');
    expect(movements[0].toLocationId).toBe(testLocationId);
    expect(movements[0].toStatus).toBe('Ready');
  });

  test('GET /api/public/rolls/:code - Strict whitelist public view without auth', async () => {
    // 1. By qrToken
    const res = await request(app).get(`/api/public/rolls/${createdRoll.qrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['x-robots-tag']).toContain('noindex');
    expect(res.headers['cache-control']).toContain('no-store');

    const data = res.body.data;
    expect(data.id).toBe(createdRoll.id);
    expect(data.fabric).toBe(createdRoll.fabric);
    expect(data.quality).toBe(createdRoll.quality);
    expect(data.metres).toBe(105.75);
    expect(data.machine.name).toBe('Test Airjet Loom #1');
    expect(data.location.name).toBe('Production Floor Shed A');
    expect(data.status).toBe('Ready');

    // Security check: Must NOT leak internal IDs, rates, customers, brokers, operators
    expect(data._id).toBeUndefined();
    expect(data.rate).toBeUndefined();
    expect(data.operator).toBeUndefined();
    expect(data.buyer).toBeUndefined();
    expect(data.broker).toBeUndefined();
    expect(data.lotId).toBeUndefined();

    // 2. By roll ID
    const resById = await request(app).get(`/api/public/rolls/${createdRoll.id}`);
    expect(resById.status).toBe(200);
    expect(resById.body.data.id).toBe(createdRoll.id);

    // 3. Unknown code returns uniform 404
    const resNotFound = await request(app).get('/api/public/rolls/UNKNOWN_RANDOM_CODE');
    expect(resNotFound.status).toBe(404);
  });

  test('GET /api/rolls/scan/:code - Staff scan returns rich details and movements', async () => {
    const res = await request(app)
      .get(`/api/rolls/scan/${createdRoll.qrToken}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roll.id).toBe(createdRoll.id);
    expect(res.body.data.machine).toBeDefined();
    expect(res.body.data.location).toBeDefined();
    expect(Array.isArray(res.body.data.movements)).toBe(true);
    expect(res.body.data.movements.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/rolls/:id/transfer - Transfer location & append ledger entry', async () => {
    const res = await request(app)
      .post(`/api/rolls/${createdRoll.id}/transfer`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        toLocationId: testLocationId2,
        note: 'Moved to warehouse storage rack'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.locationId).toBe(testLocationId2);

    const movements = await RollMovement.find({ rollId: createdRoll.id }).sort({ at: -1 });
    expect(movements.length).toBe(2);
    expect(movements[0].type).toBe('transfer');
    expect(movements[0].fromLocationId).toBe(testLocationId);
    expect(movements[0].toLocationId).toBe(testLocationId2);
  });

  test('POST /api/rolls/:id/status - State machine validation', async () => {
    // 1. Invalid jump directly from Ready to Dispatched -> 400
    const invalidRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/status`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ status: 'Dispatched' });

    expect(invalidRes.status).toBe(400);

    // 2. Valid transition: Ready -> Reserved
    const reserveRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/status`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ status: 'Reserved', orderId: 'ORD-TEST-99' });

    expect(reserveRes.status).toBe(200);
    expect(reserveRes.body.data.status).toBe('Reserved');

    // 3. Valid transition: Reserved -> Dispatched
    const dispatchRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/status`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ status: 'Dispatched', note: 'Loaded on delivery truck' });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.data.status).toBe('Dispatched');

    // 4. Dispatched rolls cannot be transferred
    const blockedTransfer = await request(app)
      .post(`/api/rolls/${createdRoll.id}/transfer`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ toLocationId: testLocationId });

    expect(blockedTransfer.status).toBe(400);
  });

  test('POST /api/rolls/:id/reissue-qr - Generates new token & increments qrVersion', async () => {
    const oldQrToken = createdRoll.qrToken;
    const res = await request(app)
      .post(`/api/rolls/${createdRoll.id}/reissue-qr`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Sticker torn during handling' });

    expect(res.status).toBe(200);
    expect(res.body.data.qrToken).not.toBe(oldQrToken);
    expect(res.body.data.qrVersion).toBe(2);

    // Old QR token should now 404 in public lookup
    const oldLookup = await request(app).get(`/api/public/rolls/${oldQrToken}`);
    expect(oldLookup.status).toBe(404);

    // New QR token should work
    const newLookup = await request(app).get(`/api/public/rolls/${res.body.data.qrToken}`);
    expect(newLookup.status).toBe(200);
  });

  test('POST /api/rolls/:id/correct-metres - Admin only with mandatory reason', async () => {
    // Fails without reason
    const failRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/correct-metres`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ metres: 102.00 });

    expect(failRes.status).toBe(400);

    // Succeeds with reason
    const successRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/correct-metres`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ metres: 102.00, reason: 'Physical recount revealed slight shrinkage' });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.metres).toBe(102.00);

    // Forbidden for Supervisor
    const forbiddenRes = await request(app)
      .post(`/api/rolls/${createdRoll.id}/correct-metres`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ metres: 100.00, reason: 'Supervisor attempt' });

    expect(forbiddenRes.status).toBe(403);
  });

  test('POST /api/rolls/:id/void - Admin only, sets status Void and hides from public scan', async () => {
    const res = await request(app)
      .post(`/api/rolls/${createdRoll.id}/void`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Fabric defect completely spoiled taka' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Void');

    // Public scan of void roll returns 404
    const publicRes = await request(app).get(`/api/public/rolls/${createdRoll.id}`);
    expect(publicRes.status).toBe(404);
  });
});

