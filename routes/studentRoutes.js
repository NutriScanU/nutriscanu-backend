import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isStudent from '../middleware/isStudent.js';

import {
  registerClinic,
  getAnalysisHistory,
  analyzeRecommendation
} from '../controllers/studentController.js';

const router = express.Router();

router.post('/register-clinic', authMiddleware, isStudent, registerClinic);
router.get('/analysis-history', authMiddleware, isStudent, getAnalysisHistory);
router.post('/analyze-recommendation', authMiddleware, isStudent, analyzeRecommendation);


export default router;
