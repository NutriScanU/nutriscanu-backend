import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { generateCode } from '../utils/codeGenerator.js';
import { sendLoginCodeEmail } from '../utils/emailSender.js';

export const sendLoginCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Correo requerido' });

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(200).json({ message: 'Si el correo existe, se envió un código' });
  }

  const code = generateCode(6);
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await user.update({ reset_code: code, reset_code_expires: expires });

  await sendLoginCodeEmail(user.email, code, user.first_name);

  res.status(200).json({ message: 'Código enviado al correo' });
};

export const loginWithCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email y código requeridos' });

  const user = await User.findOne({ where: { email } });
  if (!user || user.reset_code !== code || new Date() > user.reset_code_expires) {
    return res.status(400).json({ message: 'Código inválido o expirado' });
  }

  // Limpiar código tras usarlo
  await user.update({ reset_code: null, reset_code_expires: null });

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.status(200).json({ token });
};
