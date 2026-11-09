const request = require('supertest');
const app = require('../../src/app');
const { runMigrations } = require('../../database/migrator');

beforeAll(async () => {
  await runMigrations();
});

describe('Integration: Authentication & Authorization API Endpoints', () => {
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@campus360.internal`;
  const testUser = `student${timestamp.toString().slice(-6)}`;
  const testPass = 'ComplexPass@2026';
  let accessToken = '';
  let refreshToken = '';

  test('POST /api/v1/auth/register -> successfully registers new student account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: testUser,
        password: testPass,
        firstName: 'Integration',
        lastName: 'Tester',
        role: 'student'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.role).toBe('student');
  });

  test('POST /api/v1/auth/register -> rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: `diff${Date.now().toString().slice(-6)}`,
        password: testPass,
        firstName: 'Duplicate',
        lastName: 'Tester'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login -> logs in with valid credentials and issues JWT pair', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testEmail,
        password: testPass
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toBeDefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  test('POST /api/v1/auth/login -> rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testEmail,
        password: 'IncorrectPassword!999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/v1/auth/me -> accesses protected user profile with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  test('GET /api/v1/auth/me -> fails when token is missing', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/refresh -> rotates refresh token successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });
});
