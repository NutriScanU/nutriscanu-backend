import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { registerClinic } from '../controllers/studentController.js';
import { getAnalysisHistory } from '../controllers/studentController.js';

const router = express.Router();

router.post('/register-clinic', authMiddleware, registerClinic);
router.get('/analysis-history', authMiddleware, getAnalysisHistory);

export default router;
