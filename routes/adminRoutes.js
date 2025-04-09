// 📁 routes/adminRoutes.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAuditLogsByAdmin
} from '../controllers/adminController.js';

const router = express.Router();

/* ────────────────────────────────────────────────
 ✅ RUTA PRINCIPAL DE ADMIN (Dashboard)
──────────────────────────────────────────────── */
router.get('/dashboard', authMiddleware, isAdmin, (req, res) => {
  res.json({
    message: 'Bienvenido al panel admin 👑',
    user: req.user
  });
});

/* ────────────────────────────────────────────────
 📦 GESTIÓN DE USUARIOS (CRUD Admin)
──────────────────────────────────────────────── */
router.get('/users', authMiddleware, isAdmin, getAllUsers);           // 📄 Listar usuarios (con paginación)
router.get('/users/:id', authMiddleware, isAdmin, getUserById);       // 🔍 Obtener usuario por ID
router.put('/users/:id', authMiddleware, isAdmin, updateUser);        // ✏️ Actualizar usuario
router.delete('/users/:id', authMiddleware, isAdmin, deleteUser);     // ❌ Eliminar usuario (soft delete)

/* ────────────────────────────────────────────────
 🧾 AUDITORÍA: HISTORIAL DE ACCIONES DEL ADMIN
──────────────────────────────────────────────── */
router.get('/audit-logs', authMiddleware, isAdmin, getAuditLogsByAdmin); // 📊 Ver historial de acciones

export default router;
