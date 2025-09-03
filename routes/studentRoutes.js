import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isStudent from '../middleware/isStudent.js';
import upload from '../middleware/uploadMiddleware.js'; // ✅ Importante para subir imagen

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
  updateUserName,
  updateUserEmail,
  updateProfileImage,
  updateAboutMe,
  updateSocialLinks,
  getStudentProfile,
  confirmEmailChange,
  getHealthStatus,
  getBloodAnalysis
} from '../controllers/studentController.js';

const router = express.Router();

// 🧠 Recomendaciones
router.post('/analyze-recommendation', authMiddleware, isStudent, analyzeRecommendation);
router.get('/analysis-history', authMiddleware, isStudent, getAnalysisHistory);
router.get('/analysis/:id', authMiddleware, isStudent, getAnalysisById);
router.delete('/analysis/:id', authMiddleware, isStudent, deleteAnalysisById);
router.get('/recommendations', authMiddleware, isStudent, getLatestRecommendation);

// 🩺 Perfil clínico
router.post('/register-clinic', authMiddleware, isStudent, registerClinic);
router.get('/clinic-profile', authMiddleware, isStudent, getClinicProfile);
router.put('/clinic-profile', authMiddleware, isStudent, updateClinicProfile);
router.delete('/clinic-profile', authMiddleware, isStudent, deleteClinicProfile);
router.get('/blood-analysis', authMiddleware, isStudent, getBloodAnalysis);

// 👤 Perfil de usuario
router.get('/profile', authMiddleware, isStudent, getStudentProfile);
router.put('/update-name', authMiddleware, isStudent, updateUserName);
router.put('/update-email', authMiddleware, isStudent, updateUserEmail);
router.put('/update-about', authMiddleware, isStudent, updateAboutMe);
router.put('/update-socials', authMiddleware, isStudent, updateSocialLinks);
router.get('/health-status', authMiddleware, isStudent, getHealthStatus);
router.get('/confirm-email-change', confirmEmailChange);

// 🖼️ Subida de imagen de perfil
router.put('/update-photo', authMiddleware, isStudent, upload.single('image'), updateProfileImage);

export default router;
