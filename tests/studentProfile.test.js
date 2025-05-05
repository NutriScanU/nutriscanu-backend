import request from 'supertest';
import app from '../app.js';

describe('🔁 Perfil del estudiante - Flujo completo', () => {
  let token = '';
  const testEmail = 'test.user@example.com';
  const testPassword = 'Test1234';

  // 🧪 Paso 1: Registrar usuario
  it('✅ Registra un nuevo estudiante', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Test',
        middle_name: 'User',
        last_name: 'Profile',
        email: testEmail,
        password: testPassword,
        role: 'student',
        document_number: '99999999'
      });

    expect([200, 201, 400]).toContain(res.statusCode); // 400 si ya existe
  });

  // 🔐 Paso 2: Iniciar sesión y guardar token
  it('✅ Inicia sesión y obtiene token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.statusCode).toBe(200);
    token = res.body.token;
    expect(token).toBeDefined();
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  // 🧪 Paso 3: Pruebas de actualización de perfil
  it('✅ Actualiza nombre completo', async () => {
    const res = await request(app)
      .put('/api/students/update-name')
      .set(authHeader())
      .send({
        first_name: 'Juan',
        middle_name: 'Carlos',
        last_name: 'López'
      });
    expect(res.statusCode).toBe(200);
  });

  it('✅ Actualiza correo electrónico', async () => {
    const res = await request(app)
      .put('/api/students/update-email')
      .set(authHeader())
      .send({ email: 'juan.carlos.updated@example.com' });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('✅ Actualiza foto de perfil', async () => {
    const res = await request(app)
      .put('/api/students/update-photo')
      .set(authHeader())
      .send({ profile_image: 'https://example.com/juan.jpg' });
    expect(res.statusCode).toBe(200);
  });

  it('✅ Actualiza sección "Sobre mí"', async () => {
    const res = await request(app)
      .put('/api/students/update-about')
      .set(authHeader())
      .send({ about_me: 'Apasionado por la salud y el aprendizaje.' });
    expect(res.statusCode).toBe(200);
  });

  it('✅ Actualiza redes sociales', async () => {
    const res = await request(app)
      .put('/api/students/update-socials')
      .set(authHeader())
      .send({
        facebook: 'https://facebook.com/juan',
        twitter: 'https://twitter.com/juan'
      });
    expect(res.statusCode).toBe(200);
  });
});
