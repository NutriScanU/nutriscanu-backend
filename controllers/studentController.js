import axios from 'axios';
import ClinicalProfile from '../models/ClinicalProfile.js';
import AnalysisLog from '../models/AnalysisLog.js';
import { sendEmailChangeVerification } from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import path from 'path';

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

    const flaskResponse = await axios.post(`${process.env.FLASK_URL}/predict`, {//CAMBIAR CUANDO SE DESPLIEGUE
      age, gender, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells, smoking_history
    });

    const { condition, probabilities } = flaskResponse.data;


    const profile = await ClinicalProfile.create({
      userId, age, gender, bmi, hbA1c, blood_glucose_level,
      hemoglobin, insulin, triglycerides,
      hematocrit, red_blood_cells, smoking_history, condition,
      probabilidades: probabilities
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
 📚 OBTENER HISTORIAL DE ANÁLISIS DEL STUDENT
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

    const flaskResponse = await axios.post(`${process.env.FLASK_URL}/recommend`, {//CAMBIAR CUANDO SE DESPLIEGUE
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

/* ────────────────────────────────────────────────
 ✏️ ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO
──────────────────────────────────────────────── */
const updateUserName = async (req, res) => {
  const { first_name, middle_name, last_name } = req.body;
  const userId = req.user.userId;

  if (!first_name || !middle_name || !last_name) {
    return res.status(400).json({ error: 'Todos los campos de nombre son requeridos.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    await user.update({ first_name, middle_name, last_name });
    return res.status(200).json({ message: 'Nombre actualizado correctamente.', user });
  } catch (error) {
    console.error('❌ Error al actualizar nombre:', error.message);
    return res.status(500).json({ error: 'Error interno al actualizar nombre.' });
  }
};


const updateUserEmail = async (req, res) => {
  const { new_email } = req.body;
  const userId = req.user.userId;

  if (!new_email) return res.status(400).json({ error: 'El nuevo correo es requerido.' });

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const exists = await User.findOne({ where: { email: new_email } });
    if (exists) return res.status(400).json({ error: 'El nuevo correo ya está en uso.' });

    // 🔐 Generar token temporal
    const token = jwt.sign(
      { userId, new_email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 📩 Enviar correo con enlace de verificación
    await sendEmailChangeVerification(new_email, `${user.first_name} ${user.last_name}`, token);

    return res.status(200).json({
      message: 'Revisa tu nuevo correo para confirmar el cambio.'
    });

  } catch (error) {
    console.error('❌ Error al solicitar cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error interno al solicitar cambio de correo.' });
  }
};

const updateProfileImage = async (req, res) => {
  const userId = req.user.userId;

  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

  const filePath = `/uploads/profile-images/${req.file.filename}`;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    user.profile_image = filePath;
    await user.save();

    return res.status(200).json({ message: 'Foto actualizada correctamente.', profile_image: filePath });
  } catch (error) {
    console.error('❌ Error al guardar la imagen:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};




const updateAboutMe = async (req, res) => {
  const { about_me } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    await user.update({ about_me });
    return res.status(200).json({ message: 'Sección "Sobre mí" actualizada.', about_me });
  } catch (error) {
    console.error('❌ Error al actualizar "Sobre mí":', error.message);
    return res.status(500).json({ error: 'Error interno al actualizar descripción.' });
  }
};

const updateSocialLinks = async (req, res) => {
  const { facebook, instagram, twitter, linkedin } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const currentLinks = user.social_links || {};
    const updatedLinks = {
      ...currentLinks,
      ...(facebook && { facebook }),
      ...(instagram && { instagram }),
      ...(twitter && { twitter }),
      ...(linkedin && { linkedin })
    };

    await user.update({ social_links: updatedLinks });
    return res.status(200).json({ message: 'Redes sociales actualizadas.', social_links: updatedLinks });
  } catch (error) {
    console.error('❌ Error al actualizar redes sociales:', error.message);
    return res.status(500).json({ error: 'Error interno al actualizar redes.' });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obtener datos del usuario
    const user = await User.findByPk(userId, {
      attributes: [
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'document_number',
        'profile_image',
        'about_me',
        'social_links'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener el análisis clínico más reciente
    const latestAnalysis = await ClinicalProfile.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    let condition = 'No disponible';
    let probability = 0;
    let hasRecommendation = false;

    if (latestAnalysis) {
      condition = latestAnalysis.condition || 'No disponible';

      if (
        latestAnalysis.probabilidades &&
        typeof latestAnalysis.probabilidades === 'object' &&
        latestAnalysis.probabilidades[condition] !== undefined
      ) {
        probability = latestAnalysis.probabilidades[condition];
      }

      // Si tienes recomendaciones, lo validas desde AnalysisLog (no desde ClinicalProfile)
      const recommendationRecord = await AnalysisLog.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      if (recommendationRecord && recommendationRecord.recommendations?.length > 0) {
        hasRecommendation = true;
      }
    }

    return res.status(200).json({
      profile: user,
      health_condition: condition,
      probability,
      has_recommendation: hasRecommendation
    });

  } catch (error) {
    
    return res.status(500).json({ error: 'No se pudo cargar tu información en este momento. Intenta nuevamente más tarde.' });
  }
};

const requestEmailChange = async (req, res) => {
  const userId = req.user.userId;
  const { new_email } = req.body;

  if (!new_email) {
    return res.status(400).json({ error: 'El nuevo correo es requerido.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const token = jwt.sign(
      { userId, new_email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    await sendEmailChangeVerification(new_email, `${user.first_name} ${user.last_name}`, token);

    return res.status(200).json({ message: 'Revisa tu nuevo correo para confirmar el cambio.' });
  } catch (error) {
    console.error('❌ Error solicitando cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const confirmEmailChange = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect('https://nutriscanu.com/confirmacion-error?reason=missing_token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, new_email } = decoded;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.redirect('https://nutriscanu.com/confirmacion-error?reason=user_not_found');
    }

    user.email = new_email;
    await user.save();

    return res.redirect('https://nutriscanu.com/confirmacion-exitosa');
  } catch (error) {
    console.error('❌ Error al confirmar correo:', error.message);
    return res.redirect('https://nutriscanu.com/confirmacion-error?reason=invalid_token');
  }
};

const getHealthStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar el análisis clínico más reciente para el usuario
    const analysis = await ClinicalProfile.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']] // Obtiene el más reciente
    });

    if (!analysis) {
      return res.status(404).json({ error: 'No se ha registrado análisis clínico para este usuario' });
    }

    const { condition, probabilidades } = analysis; // Condición de salud y probabilidades

    // Verificamos la probabilidad de la condición
    const probability = probabilidades && probabilidades[condition] !== undefined ? probabilidades[condition] : 0;

    return res.status(200).json({
      health_condition: condition,
      probability: probability // Devolvemos también la probabilidad
    });
  } catch (error) {
    console.error('Error al obtener el estado de salud:', error.message);
    return res.status(500).json({ error: 'Error inesperado' });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen.' });
    }

    const userId = req.user.userId;
    const imageUrl = `/uploads/profile_images/${req.file.filename}`;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.update({ profile_image: imageUrl });

    return res.status(200).json({ message: 'Imagen actualizada correctamente', profile_image: imageUrl });
  } catch (err) {
    console.error('❌ Error al actualizar imagen:', err.message);
    return res.status(500).json({ error: 'Error interno al actualizar imagen' });
  }
};

const getBloodAnalysis = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const profile = await ClinicalProfile.findOne({ where: { userId } });
    
    if (!profile) {
      return res.status(404).json({ error: 'Perfil clínico no encontrado' });
    }

    // Extraer solo los datos de análisis de sangre (sin predicciones ML)
    const bloodAnalysis = {
      age: profile.age,
      gender: profile.gender,
      bmi: profile.bmi,
      hbA1c: profile.hbA1c,
      blood_glucose_level: profile.blood_glucose_level,
      hemoglobin: profile.hemoglobin,
      insulin: profile.insulin,
      triglycerides: profile.triglycerides,
      hematocrit: profile.hematocrit,
      red_blood_cells: profile.red_blood_cells,
      smoking_history: profile.smoking_history
    };

    return res.status(200).json({
      success: true,
      bloodAnalysis
    });

  } catch (error) {
    console.error('❌ Error al obtener análisis de sangre:', error.message);
    return res.status(500).json({ error: 'Error del servidor' });
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
  getLatestRecommendation,
  updateUserName,
  updateUserEmail,
  updateProfileImage,
  updateAboutMe,
  updateSocialLinks,
  getStudentProfile,
  requestEmailChange,
  confirmEmailChange,
  getHealthStatus,
  updateProfilePhoto,
  getBloodAnalysis
};

