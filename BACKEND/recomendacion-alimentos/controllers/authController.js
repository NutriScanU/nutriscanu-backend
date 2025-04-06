const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { first_name, last_name, middle_name, document_number, email, password } = req.body;

    if (!/^\d{8}$/.test(document_number)) {
      return res.status(400).json({ error: 'El número de documento debe tener 8 dígitos numéricos.' });
    }

    const existing = await User.findOne({ where: { document_number } });
    if (existing) {
      return res.status(400).json({ error: 'Documento ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      first_name,
      last_name,
      middle_name,
      document_number,
      email,
      password: hashedPassword
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { register, login };
