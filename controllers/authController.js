import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/user.js';
import capitalize from '../utils/capitalize.js';
import { v4 as uuidv4 } from 'uuid';
import { sendResetPasswordEmail } from '../services/emailService.js';
import { sendLoginCodeEmail } from '../services/emailService.js';
import { findUserByEmail } from '../services/userService.js';


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
      role
    } = req.body;

    // 🧪 Validar campos obligatorios
    if (!first_name || !last_name || !middle_name || !email || !password || !document_number) {
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
    // if (password !== confirm_password) {
    //   return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    // }

    // 🧩 Validar rol (si se envía)
    const rolesValidos = ['student', 'admin'];
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
      role: role || 'student'
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, token_version: user.token_version },
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


export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
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
        reset_token: token,
        reset_token_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // 🚨 Comparar nueva contraseña con la anterior
    const isSame = await bcrypt.compare(new_password, user.password);
    if (isSame) {
      return res.status(422).json({ error: 'La nueva contraseña no puede ser igual a la anterior contraseña que se registro anteriormente.' });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.reset_token = null;
    user.reset_token_expires = null;
    user.mustChangePassword = false;

    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente ✅' });
  } catch (error) {
    console.error('❌ Error en resetPasswordWithToken:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "El correo es obligatorio" });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({
        message: "Si el correo está registrado, recibirás instrucciones en tu correo.",
        obfuscatedEmail: "*****"
      });
    }

    // 🆕 Generar token único
    const token = uuidv4();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    user.reset_token = token;
    user.reset_token_expires = expires;
    await user.save();

    // 📨 Enviar correo personalizado
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    await sendResetPasswordEmail(user.email, fullName, token);

    // 🟩 Enmascarar email para respuesta
    const partes = email.split("@");
    const visible = partes[0].slice(-2);
    const obfuscated = "*****" + visible + "@" + partes[1];

    res.status(200).json({
      // message: "Correo enviado con enlace de recuperación",
      obfuscatedEmail: obfuscated
    });

  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Error interno al procesar la solicitud" });
  }
};



export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res.status(400).json({ message: "Correo y código son requeridos" });

  try {
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.reset_code ||
      String(user.reset_code) !== String(code) ||
      Date.now() > new Date(user.reset_code_expires)
    ) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    return res.status(200).json({ message: "Código válido" });

  } catch (error) {
    console.error("verifyResetCode error:", error);
    return res.status(500).json({ message: "Error interno al verificar código" });
  }
};



export const resetPasswordWithCode = async (req, res) => {
  const { email, code, password, confirm_password } = req.body;

  if (!email || !code || !password || !confirm_password)
    return res.status(400).json({ message: "Todos los campos son obligatorios" });

  if (password !== confirm_password)
    return res.status(400).json({ message: "Las contraseñas no coinciden" });

  try {
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.reset_code ||
      String(user.reset_code) !== String(code) ||
      Date.now() > new Date(user.reset_code_expires)
    ) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.default.hash(password, 10);

    await user.update({
      password: hashed,
      reset_code: null,
      reset_code_expires: null
    });

    return res.status(200).json({ message: "Contraseña actualizada" });

  } catch (error) {
    console.error("resetPasswordWithCode error:", error);
    return res.status(500).json({ message: "Error al actualizar contraseña" });
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


export const debugGetResetCode = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      email: user.email,
      reset_token: user.reset_token || null,
      reset_token_expires: user.reset_token_expires
        ? new Date(user.reset_token_expires).toISOString()
        : null,
      now: new Date().toISOString()
    });

  } catch (error) {
    console.error("🔥 Error en debugGetResetCode:", error);
    res.status(500).json({ message: "Error interno" });
  }
};



export const checkEmailExists = async (req, res) => {
  const { email } = req.body; // CAMBIO: de req.query a req.body

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(200).json({ exists: true, message: 'El correo ya está registrado ✅' });
    } else {
      return res.status(404).json({ exists: false, message: 'El correo no está registrado ❌' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor al verificar el email' });
  }
};




// 📌 Solicitar código de acceso temporal
export const sendLoginCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Correo es obligatorio' });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: 'Si el correo está registrado, recibirás un código.' });
    }

    // 🔢 Generar código único y fecha de expiración
    const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5 dígitos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    user.reset_code = code;
    user.reset_code_expires = expiresAt;
    await user.save();

    // 📩 Enviar correo
    const fullName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`;
    await sendLoginCodeEmail(user.email, fullName.trim(), code);

    res.status(200).json({ message: 'Código enviado al correo' });
  } catch (error) {
    console.error('❌ Error al enviar código de inicio:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// 📌 Login con código de acceso temporal
export const loginWithCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Correo y código son obligatorios' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.reset_code ||
      user.reset_code !== code ||
      Date.now() > new Date(user.reset_code_expires)
    ) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // ✅ Código válido, limpiar y generar token
    user.reset_code = null;
    user.reset_code_expires = null;
    await user.save();

    const token = jwt.sign(
      { userId: user.id, role: user.role, token_version: user.token_version },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });

  } catch (error) {
    console.error('❌ Error en loginWithCode:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};


export const requestLoginCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'El correo es obligatorio' });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Para evitar revelar si el email existe
      return res.status(200).json({ message: 'Si el correo está registrado, recibirás un código temporal.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // código de 6 dígitos
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    user.reset_code = code;
    user.reset_code_expires = expires;
    await user.save();

    const fullName = `${user.first_name} ${user.middle_name} ${user.last_name}`;
    await sendLoginCodeEmail(email, code, fullName);

    res.status(200).json({ message: 'Código enviado. Revisa tu correo.' });

  } catch (error) {
    console.error('❌ Error al solicitar código de login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


export const verifyLoginCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res.status(400).json({ message: 'Correo y código son requeridos' });

  try {
    const user = await User.findOne({ where: { email } });

    if (
      !user ||
      !user.reset_code ||
      String(user.reset_code) !== String(code) ||
      new Date() > new Date(user.reset_code_expires)
    ) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // ✅ El código es válido: genera token
    const token = jwt.sign(
      { userId: user.id, role: user.role, token_version: user.token_version },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 🔄 Limpiar el código usado
    user.reset_code = null;
    user.reset_code_expires = null;
    await user.save();

    return res.status(200).json({ token });

  } catch (error) {
    console.error('❌ Error al verificar código de login:', error);
    return res.status(500).json({ message: 'Error interno al verificar código' });
  }
};

export const checkDniExists = async (req, res) => {
  const { document_number } = req.body;

  if (!document_number) {
    return res.status(400).json({ error: 'El DNI es requerido' });
  }

  try {
    const user = await User.findOne({ where: { document_number } });
    if (user) {
      return res.status(200).json({ exists: true, message: 'El DNI ya está registrado ✅' });
    } else {
      return res.status(200).json({ exists: false, message: 'El DNI está disponible' }); // Cambiado a 200 en lugar de 404
    }
  } catch (error) {
    console.error('Error al verificar DNI:', error);
    return res.status(500).json({ error: 'Error del servidor al verificar el DNI' });
  }
};



