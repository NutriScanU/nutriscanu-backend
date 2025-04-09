import User from '../models/user.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import capitalize from '../utils/capitalize.js';
import AuditLog from '../models/AuditLog.js';

export const getAllUsers = async (req, res) => {
  try {
    const currentAdminId = req.user.userId;

    // 🧠 Extraer query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const orderBy = req.query.orderBy || 'createdAt'; // campo de orden
    const orderDir = req.query.orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 📦 Consulta total sin admin actual
    const { count, rows } = await User.findAndCountAll({
      where: {
        id: { [Op.not]: currentAdminId }
      },
      limit,
      offset,
      order: [[orderBy, orderDir]],
      attributes: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'role']
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users: rows,
      page,
      total: count,
      pages: totalPages,
      limit
    });
  } catch (error) {
    console.error('Error al obtener usuarios paginados:', error);
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

    await user.destroy(); 
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

export const getAuditLogsByAdmin = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { action } = req.query;

    const where = { performedById: adminId };
    if (action) {
      where.action = action; // delete o restore
    }

    // 👇 Logs de depuración
    console.log('🕵️‍♂️ Admin ID que consulta:', adminId);
    console.log('📌 Filtro aplicado:', where);

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ logs });
  } catch (error) {
    console.error('❌ Error al obtener historial de acciones:', error);
    res.status(500).json({ error: 'Error al obtener historial de acciones.' });
  }
};
