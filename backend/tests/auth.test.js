import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/loomus_test_db';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await User.deleteMany({});
  await RefreshToken.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Admin@Loomus2026!', salt);

  await User.create({
    username: 'testadmin',
    displayName: 'Test Admin',
    email: 'admin@test.com',
    role: 'Admin',
    passwordHash: hash,
    isActive: true
  });

  const opHash = await bcrypt.hash('Operator@Loomus2026!', salt);
  await User.create({
    username: 'testoperator',
    displayName: 'Test Operator',
    role: 'Operator',
    passwordHash: opHash,
    isActive: true,
    assignedMachines: ['M-01']
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
  await mongoose.connection.close();
});

describe('LOOMUS 2.0 Auth & Security Integration Tests', () => {
  let adminToken = '';
  let adminRefreshCookie = '';
  let operatorToken = '';

  test('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
  });

  test('POST /api/auth/login - should succeed with valid credentials and return access token + set httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'Admin@Loomus2026!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('Admin');

    adminToken = res.body.data.accessToken;
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    adminRefreshCookie = cookies.find(c => c.startsWith('loomus_refresh_token='));
    expect(adminRefreshCookie).toBeDefined();
    expect(adminRefreshCookie).toContain('HttpOnly');
  });

  test('POST /api/auth/refresh - should rotate refresh token and issue new access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [adminRefreshCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Check that new refresh token cookie was issued
    const newCookies = res.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newRefreshCookie = newCookies.find(c => c.startsWith('loomus_refresh_token='));
    expect(newRefreshCookie).toBeDefined();

    // Attempting to reuse the OLD refresh token should trigger token reuse / theft detection
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [adminRefreshCookie]);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.errorCode).toBe('AUTH_TOKEN_REUSE_DETECTED');
  });

  test('RBAC - Operator cannot access Admin-only /api/users', async () => {
    const opLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testoperator', password: 'Operator@Loomus2026!' });

    operatorToken = opLogin.body.data.accessToken;

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('RBAC - Admin CAN access /api/users', async () => {
    // Re-login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'Admin@Loomus2026!' });
    const token = adminLogin.body.data.accessToken;

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Brute Force - Account locks after 5 failed login attempts', async () => {
    // Create dedicated user for lockout test
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('LockMe@12345!', salt);
    await User.create({
      username: 'lockoutuser',
      displayName: 'Lockout User',
      role: 'Operator',
      passwordHash: hash,
      isActive: true
    });

    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'lockoutuser', password: 'BadPassword!1' });
    }

    // 5th attempt locks the account
    const fifthAttempt = await request(app)
      .post('/api/auth/login')
      .send({ username: 'lockoutuser', password: 'BadPassword!1' });

    expect(fifthAttempt.status).toBe(423);
    expect(fifthAttempt.body.errorCode).toBe('AUTH_ACCOUNT_LOCKED');

    // Subsequent attempt even with correct password should be rejected while locked
    const correctWhileLocked = await request(app)
      .post('/api/auth/login')
      .send({ username: 'lockoutuser', password: 'LockMe@12345!' });

    expect(correctWhileLocked.status).toBe(423);
    expect(correctWhileLocked.body.errorCode).toBe('AUTH_ACCOUNT_LOCKED');
  });
});

