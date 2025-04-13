import express from 'express';
import { register, login, getProfile, changePassword,forgotPassword,resetPassword } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// 🔐 NUEVA RUTA protegida para perfil
router.get('/profile', authMiddleware, getProfile);

// Cambiar contraseña protegida
router.put('/change-password', authMiddleware, changePassword);


router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


export default router;
