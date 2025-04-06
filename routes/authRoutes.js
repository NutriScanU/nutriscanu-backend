// routes/authRoutes.js ✅ ES Modules compatible
import express from 'express';
import { register, login } from '../controllers/authController.js';
import capitalize from '../utils/capitalize.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export default router;
