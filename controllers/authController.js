import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import capitalize from '../utils/capitalize.js';

export const register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      document_number,
      email,
      password,
      confirm_password,
      role // opcional: por si se registra desde un panel admin
    } = req.body;

    // Validar número de documento
    if (!/^\d{8}$/.test(document_number)) {
      return res.status(400).json({
        error: 'El número de documento debe tener 8 dígitos numéricos.'
      });
    }

    // Validar coincidencia de contraseñas
    if (password !== confirm_password) {
      return res.status(400).json({
        error: 'Las contraseñas no coinciden.'
      });
    }

    // Validar rol si se envía manualmente
    const rolesValidos = ['estudiante', 'admin'];
    if (role && !rolesValidos.includes(role)) {
      return res.status(400).json({
        error: 'Rol inválido. Comuníquese con el administrador.'
      });
    }

    // Validar si el documento ya existe
    const existing = await User.findOne({ where: { document_number } });
    if (existing) {
      return res.status(400).json({
        error: 'El número de documento ya está registrado.'
      });
    }

    // Capitalizar nombres
    const firstNameCap = capitalize(first_name);
    const lastNameCap = capitalize(last_name);
    const middleNameCap = middle_name ? capitalize(middle_name) : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      first_name: firstNameCap,
      last_name: lastNameCap,
      middle_name: middleNameCap,
      document_number,
      email,
      password: hashedPassword,
      role: role || 'estudiante' // por defecto: estudiante
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente.'
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al registrar el usuario.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { document_number, password } = req.body;

    const user = await User.findOne({ where: { document_number } });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ profile: user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
