// models/AuditLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const AuditLog = sequelize.define('AuditLog', {
  action: {
    type: DataTypes.ENUM('delete', 'restore', 'update'),
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
  performedByName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  performedByEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  restoreCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// 🔗 Asociación directa al modelo User
AuditLog.belongsTo(User, {
  foreignKey: 'performedById',
  as: 'admin'
});

export default AuditLog;
