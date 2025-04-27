import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isStudent from '../middleware/isStudent.js';

import {
  registerClinic,
  getAnalysisHistory,
  analyzeRecommendation,
  getClinicProfile,
  updateClinicProfile,
  deleteClinicProfile,
  getAnalysisById,
  deleteAnalysisById
} from '../controllers/studentController.js';



const router = express.Router();

// Rutas existentes
router.post('/analyze-recommendation', authMiddleware, isStudent, analyzeRecommendation);
router.get('/analysis-history', authMiddleware, isStudent, getAnalysisHistory);
router.get('/analysis/:id', authMiddleware, isStudent, getAnalysisById);
router.delete('/analysis/:id', authMiddleware, isStudent, deleteAnalysisById);


// ✅ Nuevas rutas para CRUD del perfil clínico
router.post('/register-clinic', authMiddleware, isStudent, registerClinic);
router.get('/clinic-profile', authMiddleware, isStudent, getClinicProfile);
router.put('/clinic-profile', authMiddleware, isStudent, updateClinicProfile);
router.delete('/clinic-profile', authMiddleware, isStudent, deleteClinicProfile);

export default router;
