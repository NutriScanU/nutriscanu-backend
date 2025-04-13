import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/db.js';

beforeAll(async () => {
  await sequelize.sync(); // para asegurar que la DB está lista
});

describe('Auth API', () => {
  it('should fail login with wrong credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      document_number: '00000000',
      password: 'wrongpass'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Usuario no encontrado.');
  });
});

afterAll(async () => {
    await sequelize.close(); // Cierra la conexión con la DB
  });
  