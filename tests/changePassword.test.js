import request from 'supertest';
import app from '../app.js';

describe('🔐 Cambio de contraseña del usuario autenticado', () => {
  const email = 'test.change@example.com';
  const originalPassword = 'Original123';
  const newPassword = 'NuevaSegura456';
  let token = '';

  it('✅ Registra un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Cambio',
        middle_name: 'De',
        last_name: 'Clave',
        email,
        password: originalPassword,
        document_number: '11112222',
        role: 'student'  
      });

    expect([201, 400]).toContain(res.statusCode); // 400 si ya existe
  });

  it('✅ Inicia sesión y obtiene token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: originalPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('🔄 Cambia la contraseña correctamente', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        current_password: originalPassword,
        new_password: newPassword,
        confirm_password: newPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Contraseña actualizada/i);
  });

  it('🔓 Permite iniciar sesión con la nueva contraseña', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
