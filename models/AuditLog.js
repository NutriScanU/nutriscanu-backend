// models/AuditLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js'; // Importar el modelo User para relacionarlo

const AuditLog = sequelize.define('AuditLog', {
  action: {
    type: DataTypes.ENUM('delete', 'restore'),
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  performedById: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  restoreCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// 🔗 Asociar con el modelo User
AuditLog.associate = () => {
  AuditLog.belongsTo(User, {
    foreignKey: 'performedById',
    as: 'admin'
  });
};

export default AuditLog;
