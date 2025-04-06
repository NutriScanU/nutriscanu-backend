// routes/adminRoutes.js ✅ Versión ES Modules
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Zona de administración 🚧');
});

export default router;
