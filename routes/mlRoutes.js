import express from 'express';
import axios from 'axios';

const router = express.Router();

// 🔍 Verifica si Flask está activo
router.get('/ping', async (req, res) => {
  try {
    const response = await axios.get('https://nutriscanu-ml-api-asc5c0hxdmfdgjac.brazilsouth-01.azurewebsites.net/ping');
    res.json({ flask: 'conectado', mensaje: response.data });
  } catch (error) {
    res.status(500).json({ flask: 'no conectado', error: error.message });
  }
});

export default router;
