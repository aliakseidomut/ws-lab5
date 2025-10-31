const request = require('supertest');
const app = require('../../server');
const db = require('../models');

describe('Auth API', () => {
  let accessToken, refreshToken, sessionId, userId;
  const userData = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'TestPass123',
  };

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  test('POST /api/auth/register should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('sessionId');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    sessionId = res.body.sessionId;
    userId = res.body.id;
  });

  test('POST /api/auth/login should login with username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: userData.username, password: userData.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('POST /api/auth/login wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: userData.username, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me should return user data with JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + accessToken);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', userData.username);
  });

  test('GET /api/auth/me should work with sessionId in hybrid mode', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-session-id', sessionId);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', userData.username);
  });

  test('POST /api/auth/refresh should return new tokens', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken, sessionId });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    sessionId = res.body.sessionId;
  });

  test('POST /api/auth/refresh should reject with wrong refresh', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bad', sessionId: sessionId });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me without auth fails', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/logout should deactivate session', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ sessionId });
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/auth/me after logout (with sessionId) fails', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-session-id', sessionId);
    expect(res.statusCode).toBe(401);
  });
  
});
