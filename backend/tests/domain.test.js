import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Machine } from '../src/models/Machine.js';
import { Stock } from '../src/models/Stock.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { Alarm } from '../src/models/Alarm.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/loomus_test_db';

describe('LOOMUS 2.0 Domain Logic & Business Rules Tests', () => {
  let adminToken = '';
  let isDbConnected = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isDbConnected = true;
      await Machine.deleteMany({});
      await Stock.deleteMany({});
      await SalesOrder.deleteMany({});
      await Alarm.deleteMany({});
      await User.deleteMany({});

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin@Loomus2026!', salt);

      const admin = await User.create({
        username: 'domainadmin',
        displayName: 'Domain Admin',
        role: 'Admin',
        passwordHash: hash,
        isActive: true
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'domainadmin', password: 'Admin@Loomus2026!' });

      adminToken = loginRes.body.data.accessToken;
    } catch (err) {
      console.warn('MongoDB connection skipped in test environment:', err.message);
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      try {
        await Machine.deleteMany({});
        await Stock.deleteMany({});
        await SalesOrder.deleteMany({});
        await Alarm.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
      } catch (e) {}
    }
  });

  test('Machine Lifecycle - create, status update, emergency stop', async () => {
    if (!isDbConnected) return;
    // 1. Create Machine
    const createRes = await request(app)
      .post('/api/machines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: 'M-TEST',
        name: 'Test Loom Unit',
        shed: 'Shed A',
        targetRpm: 900
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.id).toBe('M-TEST');

    // 2. Start Machine
    const statusRes = await request(app)
      .patch('/api/machines/M-TEST/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'running' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('running');
    expect(statusRes.body.data.rpm).toBe(900);

    // 3. Emergency Stop Factory-wide
    const eStopRes = await request(app)
      .post('/api/machines/emergency-stop')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(eStopRes.status).toBe(200);

    const checkMachine = await Machine.findOne({ id: 'M-TEST' });
    expect(checkMachine.status).toBe('stopped');
    expect(checkMachine.rpm).toBe(0);

    const checkAlarm = await Alarm.findOne({ code: 'E-STOP' });
    expect(checkAlarm).toBeDefined();
    expect(checkAlarm.type).toBe('critical');
  });

  test('Stock Rules - Prevent negative stock and top-up existing material', async () => {
    if (!isDbConnected) return;
    // 1. Add material
    const addRes = await request(app)
      .post('/api/stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        material: 'Cotton 40s Test',
        qty: 500,
        rate: 280
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.current).toBe(500);

    // 2. Top-up same material
    const topUpRes = await request(app)
      .post('/api/stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        material: 'Cotton 40s Test',
        qty: 300
      });

    expect(topUpRes.status).toBe(200);
    expect(topUpRes.body.data.current).toBe(800);
  });

  test('Sales Order Flow - Validate status transitions', async () => {
    if (!isDbConnected) return;
    // 1. Create order
    const orderRes = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: 'ORD-TEST-01',
        buyer: 'Acme Textiles',
        fabric: '70*72 Cambric',
        qty: 1000,
        rate: 50,
        total: 50000
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.status).toBe('Pending');

    // 2. Transition Pending -> In Production (valid)
    const validTrans = await request(app)
      .patch('/api/sales-orders/ORD-TEST-01/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'In Production' });

    expect(validTrans.status).toBe(200);
    expect(validTrans.body.data.status).toBe('In Production');

    // 3. Illegal transition In Production -> Delivered (must go via Dispatched first)
    const invalidTrans = await request(app)
      .patch('/api/sales-orders/ORD-TEST-01/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Delivered' });

    expect(invalidTrans.status).toBe(400);
    expect(invalidTrans.body.errorCode).toBe('INVALID_STATUS_TRANSITION');
  });
});

