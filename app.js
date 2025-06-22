// app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import mlRoutes from './routes/mlRoutes.js';

const app = express();

// 🥇 1. Habilitar CORS con credenciales
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, // URL del frontend (ajustado para producción o desarrollo)
    'http://localhost:3000'   // Desarrollo local (si se necesita para pruebas locales)
  ],
  credentials: true
}));

// 🥈 2. Parsear cookies y JSON
app.use(cookieParser());
app.use(express.json());

// 🏥 Ruta de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Application is healthy' });
});

// 📚 Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 📦 Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/ml', mlRoutes);

// 🖼️ Servir imágenes de perfil
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // esto sirve las imágenes

export default app;
