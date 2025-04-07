import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, isAdmin, (req, res) => {
  res.json({ message: 'Bienvenido al panel admin 👑', user: req.user });
});

// CRUD USUARIOS
router.get('/users', authMiddleware, isAdmin, getAllUsers);
router.get('/users/:id', authMiddleware, isAdmin, getUserById);
router.put('/users/:id', authMiddleware, isAdmin, updateUser);
router.delete('/users/:id', authMiddleware, isAdmin, deleteUser);

export default router;
