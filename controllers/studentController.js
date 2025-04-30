import axios from 'axios';
import ClinicalProfile from '../models/ClinicalProfile.js';
import AnalysisLog from '../models/AnalysisLog.js';

/* ────────────────────────────────────────────────
 📥 REGISTRO DE DATOS CLÍNICOS (con predicción Flask)
──────────────────────────────────────────────── */
const registerClinic = async (req, res) => {
  try {
    const userId = req.user.userId;
    const existing = await ClinicalProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'Perfil clínico ya registrado' });
    }

    const {
      age, gender, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells, smoking_history
    } = req.body;

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

    const validGenders = ['Male', 'Female'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ error: 'Género inválido. Usa "Male" o "Female".' });
    }

    const validSmoking = ["Never", "Former", "Current", "Ever", "Not Current", "No Info"];
    if (!validSmoking.includes(smoking_history)) {
      return res.status(400).json({ error: 'Historial de tabaquismo inválido' });
    }

    const flaskResponse = await axios.post('http://localhost:8000/predict', {
      age, gender, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells, smoking_history
    });

    const condition = flaskResponse.data.condition;

    const profile = await ClinicalProfile.create({
      userId, age, gender, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells, smoking_history, condition
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
const getAnalysisHistory = async (req, res) => {
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
const analyzeRecommendation = async (req, res) => {
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

const getClinicProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await ClinicalProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil clínico no encontrado' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('❌ Error al obtener el perfil clínico:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

const updateClinicProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await ClinicalProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil clínico no encontrado' });
    }

    const fieldsToUpdate = [
      'age', 'gender', 'bmi', 'hbA1c', 'blood_glucose_level',
      'hemoglobin', 'insulin', 'triglycerides', 'hematocrit',
      'red_blood_cells', 'smoking_history', 'condition'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();
    return res.status(200).json({ message: 'Perfil clínico actualizado', profile });

  } catch (error) {
    console.error('❌ Error al actualizar perfil clínico:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

const deleteClinicProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await ClinicalProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil clínico no encontrado' });
    }

    await profile.destroy();
    return res.status(204).send();

  } catch (error) {
    console.error('❌ Error al eliminar el perfil clínico:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

const getAnalysisById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;

    const analysis = await AnalysisLog.findOne({ where: { id: analysisId, userId } });

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('❌ Error al obtener el análisis:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

const deleteAnalysisById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;

    const analysis = await AnalysisLog.findOne({ where: { id: analysisId, userId } });

    if (!analysis) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }

    await analysis.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('❌ Error al eliminar el análisis:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

// 📚 Nueva función para obtener la última recomendación generada
const getLatestRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;

    const latestAnalysis = await AnalysisLog.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    if (!latestAnalysis) {
      return res.status(404).json({ error: 'No se encontraron recomendaciones para este usuario.' });
    }

    return res.status(200).json({
      condition: latestAnalysis.condition,
      recommendations: latestAnalysis.recommendations
    });

  } catch (error) {
    console.error('❌ Error al obtener la última recomendación:', error.message || error);
    return res.status(500).json({ error: 'Error al obtener la última recomendación' });
  }
};



export {
  registerClinic,
  getAnalysisHistory,
  analyzeRecommendation,
  getClinicProfile,
  updateClinicProfile,
  deleteClinicProfile,
  getAnalysisById,
  deleteAnalysisById,
  getLatestRecommendation
};
