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
    } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    if (!/^\d{8}$/.test(document_number)) {
      return res.status(400).json({ error: 'El número de documento debe tener 8 dígitos numéricos.' });
    }

    const existing = await User.findOne({ where: { document_number } });
    if (existing) {
      return res.status(400).json({ error: 'Documento ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      first_name: capitalize(first_name),
      last_name: capitalize(last_name),
      middle_name: capitalize(middle_name),
      document_number,
      email,
      password: hashedPassword,
      role: 'estudiante',
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('[❌ ERROR - register]:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
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

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[❌ ERROR - login]:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};
