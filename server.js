// server.js
import dotenv from 'dotenv';
import open from 'open';
import fs from 'fs';
import path from 'path';
import sequelize from './config/db.js';
import app from './app.js';
import User from './models/user.js';
import './models/AuditLog.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ Crear carpeta de uploads si no existe
const uploadDir = path.join(process.cwd(), 'uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Carpeta creada: ${uploadDir}`);
}

async function crearAdminInicial() {
  const adminEmail = 'alexjosu21@gmail.com';

  const existente = await User.findOne({ where: { email: adminEmail } });

  if (!existente) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('123456', 10);

    await User.create({
      first_name: 'Alexander Josue',
      last_name: 'Suclupe',
      middle_name: 'Paucar',
      document_number: '72689104',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin creado automáticamente');
  } else {
    console.log('ℹ️ Admin ya existe.');
  }
}

sequelize.authenticate()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => crearAdminInicial())
  .then(() => {
    app.listen(PORT, () => {
      const swaggerURL = `http://localhost:${PORT}/api-docs`;
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Swagger UI → ${swaggerURL}`);
      open(swaggerURL);
    });
  })
  .catch((err) => {
    console.error('❌ Error al iniciar:', err);
  });
