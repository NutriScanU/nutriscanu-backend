import axios from 'axios';
import ClinicalProfile from '../models/ClinicalProfile.js';
import AnalysisLog from '../models/AnalysisLog.js';

/* ────────────────────────────────────────────────
 📥 REGISTRO DE DATOS CLÍNICOS (con predicción Flask)
──────────────────────────────────────────────── */
export const registerClinic = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar si ya existe un perfil clínico
    const existing = await ClinicalProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'Perfil clínico ya registrado' });
    }

    // Extraer datos del body
    const {
      age,
      gender,
      bmi,
      hbA1c,
      blood_glucose_level,
      hemoglobin,
      insulin,
      triglycerides,
      hematocrit,
      red_blood_cells,
      smoking_history
    } = req.body;

    // Validar campos numéricos
    const camposNumericos = {
      age, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells
    };

    for (const [key, value] of Object.entries(camposNumericos)) {
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return res.status(400).json({ error: `El campo ${key} debe ser un número válido.` });
      }
    }

    // Validar género
    const validGenders = ['Male', 'Female'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ error: 'Género inválido. Usa "Male" o "Female".' });
    }

    // Validar tabaquismo
    const validSmoking = ["Never", "Former", "Current", "Ever", "Not Current", "No Info"];
    if (!validSmoking.includes(smoking_history)) {
      return res.status(400).json({ error: 'Historial de tabaquismo inválido' });
    }

    // Enviar JSON a Flask (no como array)
    const flaskResponse = await axios.post('http://localhost:8000/predict', {
      age,
      gender,
      bmi,
      hbA1c,
      blood_glucose_level,
      hemoglobin,
      insulin,
      triglycerides,
      hematocrit,
      red_blood_cells,
      smoking_history
    });

    const condition = flaskResponse.data.condition;

    // Guardar perfil clínico en DB
    const profile = await ClinicalProfile.create({
      userId,
      age,
      gender,
      bmi,
      hbA1c,
      blood_glucose_level,
      hemoglobin,
      insulin,
      triglycerides,
      hematocrit,
      red_blood_cells,
      smoking_history,
      condition
    });

    return res.status(201).json({
      message: 'Perfil clínico registrado correctamente',
      condition,
      profile
    });

  } catch (error) {
    console.error('❌ Error en registro clínico:', error.message || error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ────────────────────────────────────────────────
 📚 OBTENER HISTORIAL DE ANÁLISIS DEL ESTUDIANTE
──────────────────────────────────────────────── */
export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const logs = await AnalysisLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ history: logs });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error.message || error);
    return res.status(500).json({ error: 'Error al obtener el historial de análisis' });
  }
};

/* ────────────────────────────────────────────────
 🤖 ENVIAR HÁBITOS Y OBTENER RECOMENDACIONES
──────────────────────────────────────────────── */
export const analyzeRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { habits } = req.body;

    if (!habits || typeof habits !== 'object') {
      return res.status(400).json({ error: 'Las respuestas de hábitos son requeridas' });
    }

    const profile = await ClinicalProfile.findOne({ where: { userId } });
    if (!profile || !profile.condition) {
      return res.status(400).json({ error: 'Primero debes registrar tus datos clínicos' });
    }

    const condition = profile.condition;
    const respuestas = Object.values(habits);
    const payload = [condition, ...respuestas];

    const flaskResponse = await axios.post('http://localhost:8000/recommend', {
      input: payload
    });

    const recommendations = flaskResponse.data.recommendations || [];

    await AnalysisLog.create({
      userId,
      condition,
      recommendations,
      habits
    });

    return res.status(201).json({
      message: 'Recomendaciones generadas correctamente 🧠🍽️',
      condition,
      recommendations
    });

  } catch (error) {
    console.error('❌ Error al generar recomendación:', error.message || error);
    return res.status(500).json({ error: 'Error al generar la recomendación' });
  }
};

export default {
  registerClinic,
  getAnalysisHistory,
  analyzeRecommendation
};
