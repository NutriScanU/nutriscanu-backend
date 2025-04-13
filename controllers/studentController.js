import axios from 'axios';
import ClinicalProfile from '../models/ClinicalProfile.js';
import AnalysisLog from '../models/AnalysisLog.js';

export const registerClinic = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existing = await ClinicalProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'Perfil clínico ya registrado' });
    }

    const profile = await ClinicalProfile.create({
      userId,
      ...req.body,
      condition: 'Anemia' // ⚠️ TEMPORAL hasta que conectemos con Flask
    });

    res.status(201).json({ message: 'Perfil clínico guardado correctamente', profile });
  } catch (error) {
    console.error('❌ Error al guardar perfil clínico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const logs = await AnalysisLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ history: logs });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de análisis' });
  }
};

export const analyzeRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { habits } = req.body;

    if (!habits || typeof habits !== 'object') {
      return res.status(400).json({ error: 'Las respuestas de hábitos son requeridas' });
    }

    const profile = await ClinicalProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(400).json({ error: 'El estudiante no tiene datos clínicos registrados' });
    }

    const condicion = profile.condition;
    const respuestas = Object.values(habits);
    const payload = [condicion, ...respuestas];

    // 🔁 Simulación temporal de recomendaciones
    const recommendations = [
      "Verduras verdes",
      "Fibra",
      "Hierro",
      "Evitar azúcares"
    ];

    const log = await AnalysisLog.create({
      userId,
      condition: condicion,
      recommendations,
      habits
    });

    res.status(201).json({
      message: 'Recomendaciones generadas y guardadas correctamente 🧠🍽️',
      condition: condicion,
      recommendations
    });

  } catch (error) {
    console.error('❌ Error al generar recomendación:', error);
    res.status(500).json({ error: 'Error al generar la recomendación' });
  }
};
