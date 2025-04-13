import ClinicalProfile from '../models/ClinicalProfile.js';

export const registerClinic = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existing = await ClinicalProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'Perfil clínico ya registrado' });
    }

    const profile = await ClinicalProfile.create({
      userId,
      ...req.body
    });

    res.status(201).json({ message: 'Perfil clínico guardado correctamente', profile });
  } catch (error) {
    console.error('❌ Error al guardar perfil clínico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
