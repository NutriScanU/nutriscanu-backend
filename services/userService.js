import User from '../models/user.js';

export const findUserByEmail = async (email) => {
  if (!email) throw new Error('Email es requerido');
  return await User.findOne({ where: { email } });
};
