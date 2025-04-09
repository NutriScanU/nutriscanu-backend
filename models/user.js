import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  middle_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  document_number: {
    type: DataTypes.CHAR(8),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('estudiante', 'admin'),
    defaultValue: 'estudiante',
  }
}, {
  timestamps: true,
});

export default User;
