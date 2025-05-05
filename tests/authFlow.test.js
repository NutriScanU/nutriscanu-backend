import request from 'supertest';
import app from '../app.js';

describe('🔐 Autenticación - Registro y Login', () => {
  const email = 'test.login@example.com';
  const password = 'Test1234';

  it('✅ Registra un nuevo estudiante', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Test',
        middle_name: 'Login',
        last_name: 'User',
        email,
        password,
        role: 'student',
        document_number: '12345678'
      });

    expect([201, 400]).toContain(res.statusCode); // 400 si ya existe
  });

  it('✅ Inicia sesión y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    console.log('🪪 JWT Token:', res.body.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
