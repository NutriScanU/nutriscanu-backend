import User from '../models/user.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import capitalize from '../utils/capitalize.js';

export const getAllUsers = async (req, res) => {
  try {
    const currentAdminId = req.user.userId;

    const users = await User.findAll({
      where: {
        id: {
          [Op.not]: currentAdminId
        }
      },
      attributes: ['id', 'first_name', 'last_name','middle_name', 'email', 'role']
    });

    res.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'first_name', 'last_name','middle_name', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const {
      first_name,
      last_name,
      middle_name,
      email,
      document_number,
      role,
      password
    } = req.body;

    // Capitalizar datos si llegan
    const firstNameCap = first_name ? capitalize(first_name) : user.first_name;
    const lastNameCap = last_name ? capitalize(last_name) : user.last_name;
    const middleNameCap = middle_name ? capitalize(middle_name) : user.middle_name;

    // Validar campos si vienen en el body
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      
    if (first_name && !nameRegex.test(first_name)) {
      return res.status(400).json({ error: 'Nombre inválido: solo letras y espacios.' });
    }
    if (last_name && !nameRegex.test(last_name)) {
      return res.status(400).json({ error: 'Apellido paterno inválido.' });
    }
    if (middle_name && !nameRegex.test(middle_name)) {
      return res.status(400).json({ error: 'Apellido materno inválido.' });
    }

    // 🔐 Validar que no se degrade a otro admin
    if (user.role === 'admin' && role === 'estudiante') {
      return res.status(403).json({
        error: 'No puedes cambiar el rol de un administrador a estudiante'
      });
    }

    // ✅ Validar que el rol sea uno permitido
    const rolesValidos = ['estudiante', 'admin'];
    if (role && !rolesValidos.includes(role)) {
      return res.status(400).json({
        error: 'No existe el rol. Comuníquese con el administrador.'
      });
    }

    // 🔁 Construir campos a actualizar
    const updatedFields = {
      first_name: firstNameCap,
      last_name: lastNameCap,
      middle_name: middleNameCap,
      email,
      document_number,
      role
    };
    
    // 🔒 Si hay nueva contraseña, la encriptamos
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    // 🔨 Actualizar usuario
    const updatedUser = await user.update(updatedFields);

    // 🚫 No devolver la contraseña en la respuesta
    const { password: _, ...safeUser } = updatedUser.toJSON();

    res.json({
      message: 'Usuario actualizado correctamente',
      user: safeUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error interno al actualizar el usuario'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.id === req.user.userId) {
      return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta como administrador.' });
    }

    await user.destroy();

    console.log(`[ADMIN ACTION] Admin ID ${req.user.userId} eliminó al usuario ID ${user.id}`);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await User.count();
    const admins = await User.count({ where: { role: 'admin' } });
    const estudiantes = await User.count({ where: { role: 'estudiante' } });

    res.json({
      total,
      admins,
      estudiantes
    });

    console.log(`[ADMIN ACTION] Admin ID ${req.user.userId} consultó las estadísticas.`);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
