import express from 'express';
import axios from 'axios';

const router = express.Router();

// 🔍 Verifica si Flask está activo
router.get('/ping', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8000/ping');
    res.json({ flask: 'conectado', mensaje: response.data });
  } catch (error) {
    res.status(500).json({ flask: 'no conectado', error: error.message });
  }
});

export default router;
