import express from 'express';
import {   register,
    login,
    getProfile,
    changePassword,
    forgotPassword,
    verifyResetCode,
    resetPasswordWithCode,
    debugGetResetCode,
    resetPasswordWithToken,
    checkEmailExists,
    sendLoginCode,
    loginWithCode,
    checkDniExists

} from '../controllers/authController.js';

import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// 🔐 NUEVA RUTA protegida para perfil  
router.get('/profile', authMiddleware, getProfile);

// Cambiar contraseña protegida
router.put('/change-password', authMiddleware, changePassword);


router.post('/forgot-password', forgotPassword);     // Paso 1: Genera y envía código
router.post('/verify-reset-code', verifyResetCode);     // Paso 2: Verifica código ingresado
router.post('/reset-password', resetPasswordWithCode);   // Paso 3: Cambia contraseña


router.get('/debug-reset/:email', debugGetResetCode);
router.post('/reset-password/:token', resetPasswordWithToken);

router.post('/send-login-code', sendLoginCode);
router.post('/login-with-code', loginWithCode);



router.get('/check-email', checkEmailExists);
router.post('/check-email', checkEmailExists); // ✅ Agrega esta línea

router.post('/check-dni', checkDniExists);


export default router;
