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


// Cargar variables de entorno
dotenv.config();

// Crear app
const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Conexión y sincronización con DB
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión con la base de datos establecida');
    return sequelize.sync({ alter: true }); // crea o ajusta las tablas
  })
  .then(() => {
    console.log('🗄️ Tablas sincronizadas con éxito');

    app.listen(PORT, () => {
      const swaggerURL = `http://localhost:${PORT}/api-docs`;
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Swagger UI → ${swaggerURL}`);
      open(swaggerURL); // Abre la documentación
    });
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar tablas o conectar a la DB:', err);
  });
