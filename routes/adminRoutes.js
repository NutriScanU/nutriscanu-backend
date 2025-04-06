import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, isAdmin, (req, res) => {
  res.json({ message: `Bienvenido al panel admin, ${req.user.userId}` });
});

export default router;
