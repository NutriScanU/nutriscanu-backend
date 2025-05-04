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
  deleteAnalysisById,
  getLatestRecommendation,
  getUserProfile,
  updateUserProfile
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




// 📚 Nueva ruta para obtener la última recomendación generad
router.get('/recommendations', authMiddleware, isStudent, getLatestRecommendation);






// 🧑‍🎓 Obtener y actualizar datos del estudiante autenticado
router.get('/profile', authMiddleware, isStudent, getUserProfile);
router.put('/profile', authMiddleware, isStudent, updateUserProfile);


export default router;
