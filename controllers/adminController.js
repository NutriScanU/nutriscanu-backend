import User from '../models/user.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import capitalize from '../utils/capitalize.js';
import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto'; 
import { sendWelcomeEmail } from '../services/emailService.js';


// 📄 Listar usuarios con paginación
export const getAllUsers = async (req, res) => {
  try {
    const currentAdminId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const orderBy = req.query.orderBy || 'createdAt';
    const orderDir = req.query.orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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

// 🔍 Obtener usuario por ID
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

// ✏️ Actualizar usuario
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

    const firstNameCap = first_name ? capitalize(first_name) : user.first_name;
    const lastNameCap = last_name ? capitalize(last_name) : user.last_name;
    const middleNameCap = middle_name ? capitalize(middle_name) : user.middle_name;

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

    if (user.role === 'admin' && role === 'student') {
      return res.status(403).json({
        error: 'No puedes cambiar el rol de un administrador a student'
      });
    }

    const rolesValidos = ['student', 'admin'];
    if (role && !rolesValidos.includes(role)) {
      return res.status(400).json({
        error: 'No existe el rol. Comuníquese con el administrador.'
      });
    }

    const updatedFields = {
      first_name: firstNameCap,
      last_name: lastNameCap,
      middle_name: middleNameCap,
      email,
      document_number,
      role
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    const updatedUser = await user.update(updatedFields);

    // ✅ Loguear auditoría de actualización
    const admin = await User.findByPk(req.user.userId);
    await AuditLog.create({
      action: 'update',
      targetUserId: user.id,
      performedById: admin.id,
      performedByName: `${admin.first_name} ${admin.middle_name} ${admin.last_name}`,
      performedByEmail: admin.email
    });

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

// ❌ Eliminar usuario (Soft Delete)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.destroy();

    const admin = await User.findByPk(req.user.userId);

    await AuditLog.create({
      action: 'delete',
      targetUserId: user.id,
      performedById: admin.id,
      performedByName: `${admin.first_name} ${admin.middle_name} ${admin.last_name}`,
      performedByEmail: admin.email
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// ✅ Restaurar usuario eliminado
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      paranoid: false
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.deletedAt) {
      return res.status(400).json({ error: 'El usuario no está eliminado.' });
    }

    await user.restore();

    const previousLog = await AuditLog.findOne({
      where: {
        action: 'restore',
        targetUserId: user.id,
        performedById: req.user.userId
      },
      order: [['createdAt', 'DESC']]
    });

    let restoreCount = 1;
    if (previousLog) {
      restoreCount = previousLog.restoreCount + 1;
    }

    const admin = await User.findByPk(req.user.userId);

    await AuditLog.create({
      action: 'restore',
      targetUserId: user.id,
      performedById: admin.id,
      performedByName: `${admin.first_name} ${admin.middle_name} ${admin.last_name}`,
      performedByEmail: admin.email,
      restoreCount
    });

    res.json({ message: 'Usuario restaurado correctamente ✅' });
  } catch (error) {
    console.error('❌ Error al restaurar usuario:', error);
    res.status(500).json({ error: 'Error al restaurar el usuario' });
  }
};

// 📊 Obtener historial del admin actual
export const getAuditLogsByAdmin = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { action } = req.query;

    const where = { performedById: adminId };
    if (action) {
      where.action = action;
    }

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

export const changeUserRole = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;
    const validRoles = ['student', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol no permitido' });
    }

    const adminId = req.user.userId;
    const admin = await User.findByPk(adminId);
    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 🛑 Evitar cambiarse a sí mismo a rol inferior
    if (adminId === user.id && role !== 'admin') {
      return res.status(403).json({ error: 'No puedes degradarte a ti mismo' });
    }

    // 🛑 Validar si ya tiene el rol solicitado
    if (user.role === role) {
      return res.status(400).json({
        error: `El usuario ya tiene el rol "${role}".`
      });
    }

    // 🛡️ Evitar degradar a otro admin
    if (user.role === 'admin' && role === 'student') {
      return res.status(403).json({
        error: 'No puedes degradar a un administrador existente'
      });
    }

    const previousRole = user.role;

    // ✅ Actualizar rol
    user.role = role;
    await user.save();

    // 🧾 Auditar
    await AuditLog.create({
      action: 'update',
      targetUserId: user.id,
      performedById: admin.id,
      performedByName: `${admin.first_name} ${admin.middle_name} ${admin.last_name}`,
      performedByEmail: admin.email
    });

    res.status(200).json({
      message: `Rol del usuario actualizado de "${previousRole}" a "${role}"`,
      user: {
        id: user.id,
        nombre: `${user.first_name} ${user.middle_name} ${user.last_name}`,
        nuevo_rol: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error al cambiar rol de usuario:', error);
    res.status(500).json({ error: 'Error al cambiar el rol del usuario' });
  }
};

// ➕ Crear student con contraseña generada automáticamente
export const createStudent = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      document_number,
      email
    } = req.body;

    // Validaciones básicas
    if (!first_name || !last_name || !middle_name || !document_number || !email) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { document_number }]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo o DNI.' });
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(first_name) || !nameRegex.test(last_name) || !nameRegex.test(middle_name)) {
      return res.status(400).json({ error: 'Nombres y apellidos solo pueden contener letras.' });
    }

    // ✅ Generar contraseña temporal segura
    const tempPassword = crypto.randomBytes(6).toString('hex'); // ejemplo: "a1b2c3d4e5f6"
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear student
    const student = await User.create({
      first_name: capitalize(first_name),
      last_name: capitalize(last_name),
      middle_name: capitalize(middle_name),
      document_number,
      email,
      password: hashedPassword,
      role: 'student',
      mustChangePassword: true
    });

    // 🔔 Enviar correo de bienvenida con la contraseña temporal
    await sendWelcomeEmail(
      student.email,
      tempPassword,
      `${student.first_name} ${student.middle_name} ${student.last_name}`
    );

    // ✅ Respuesta al frontend
    res.status(201).json({
      message: 'student registrado correctamente.',
      temporalPassword: tempPassword,
      user: {
        id: student.id,
        name: `${student.first_name} ${student.middle_name} ${student.last_name}`,
        email: student.email
      }
    });

  } catch (error) {
    console.error('❌ Error al crear student:', error);
    res.status(500).json({ error: 'Error interno al crear student.' });
  }
};
