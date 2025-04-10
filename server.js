// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import open from 'open';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sequelize from './config/db.js';
import './models/AuditLog.js';
import User from './models/user.js'; // ✅ Importar el modelo User para crear el admin inicial

// ✅ Función para crear admin al iniciar
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

    console.log('✅ Admin creado automáticamente (alexjosu21@gmail.com)');
  } else {
    console.log('ℹ️ Admin ya existe, no se crea uno nuevo.');
  }
}

// 🌱 Cargar variables de entorno
dotenv.config();

// ⚙️ Crear app
const app = express();

// 🧩 Middlewares base
app.use(cors());
app.use(express.json());

// 📚 Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🚦 Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 🚀 Conexión y sincronización con la DB
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión con la base de datos establecida');
    return sequelize.sync({ alter: true }); // Crea o ajusta las tablas
  })
  .then(async () => {
    console.log('🗄️ Tablas sincronizadas con éxito');

    await crearAdminInicial(); // ✅ Ejecutar creación del admin inicial

    app.listen(PORT, () => {
      const swaggerURL = `http://localhost:${PORT}/api-docs`;
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Swagger UI → ${swaggerURL}`);
      open(swaggerURL); // Abre la documentación automáticamente
    });
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar tablas o conectar a la DB:', err);
  });

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      const swaggerURL = `http://localhost:${PORT}/api-docs`;
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      open(swaggerURL);
    });
  }

export default app;