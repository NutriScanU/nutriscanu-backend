import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/user.js';
import capitalize from '../utils/capitalize.js';

// 📌 Registro de usuario
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
      role
    } = req.body;

    // 🧪 Validar campos obligatorios
    if (!first_name || !last_name || !middle_name || !email || !password || !confirm_password || !document_number) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // 🧼 Validación de texto (solo letras y espacios)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(first_name)) {
      return res.status(400).json({ error: 'El nombre solo puede contener letras y espacios.' });
    }
    if (!nameRegex.test(last_name)) {
      return res.status(400).json({ error: 'El apellido paterno solo puede contener letras y espacios.' });
    }
    if (!nameRegex.test(middle_name)) {
      return res.status(400).json({ error: 'El apellido materno solo puede contener letras y espacios.' });
    }

    // 🔠 Validar longitud mínima
    if (first_name.length < 2 || last_name.length < 2 || middle_name.length < 2) {
      return res.status(400).json({ error: 'Nombre y apellidos deben tener al menos 2 caracteres.' });
    }

    // 🔢 Validar formato de documento (DNI 8 dígitos)
    if (!/^\d{8}$/.test(document_number)) {
      return res.status(400).json({ error: 'El número de documento debe tener 8 dígitos.' });
    }

    // 📧 Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Correo electrónico inválido.' });
    }

    // 🔐 Validar contraseñas
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    // 🧩 Validar rol (si se envía)
    const rolesValidos = ['estudiante', 'admin'];
    if (role && !rolesValidos.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Comuníquese con el administrador.' });
    }

    // ❗ Validar que documento o correo no estén repetidos
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { document_number },
          { email }
        ]
      }
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese número de documento o correo.'
      });
    }

    // ✅ Capitalizar nombres y apellidos
    const firstNameCap = capitalize(first_name);
    const lastNameCap = capitalize(last_name);
    const middleNameCap = capitalize(middle_name);

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      first_name: firstNameCap,
      last_name: lastNameCap,
      middle_name: middleNameCap,
      document_number,
      email,
      password: hashedPassword,
      role: role || 'estudiante'
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente.' });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
  }
};

// 🔐 Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email  || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    const user = await User.findOne({ where: { email  } });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      mustChangePassword: user.mustChangePassword // ✅ ¡Aquí está el campo!
    });

  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
};


// 👤 Obtener perfil del usuario logueado
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.status(200).json({ profile: user });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// 🔄 Cambiar contraseña (con validación de mustChangePassword)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    user.password = hashed;
    user.mustChangePassword = false; // ✅ ya no se le pedirá cambiarla
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno al cambiar la contraseña.' });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No existe un usuario con ese correo' });
    }

    // 🎯 Generar token aleatorio y expiración
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 1000 * 60 * 15; // 15 min

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    // En un sistema real enviaríamos esto por correo
    return res.status(200).json({
      message: 'Token de recuperación generado',
      token: token // solo para pruebas
    });
  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Contraseña muy corta' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;

    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente ✅' });
  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};