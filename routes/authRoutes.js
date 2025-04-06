import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// 🔐 NUEVA RUTA protegida para perfil
router.get('/profile', authMiddleware, getProfile);

export default router;
