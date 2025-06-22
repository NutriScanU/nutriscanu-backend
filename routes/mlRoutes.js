import express from 'express';
import axios from 'axios';

const router = express.Router();

// 🔍 Verifica si Flask está activo
router.get('/ping', async (req, res) => {
  try {
    // Utiliza la variable de entorno FLASK_URL
    const response = await axios.get(`${process.env.FLASK_URL}/ping`);
    res.json({ flask: 'conectado', mensaje: response.data });
  } catch (error) {
    res.status(500).json({ flask: 'no conectado', error: error.message });
  }
});

export default router;
