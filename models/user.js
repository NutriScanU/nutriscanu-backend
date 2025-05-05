import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/db.js';

const User = sequelize.define(
  'User',
  {
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
      type: DataTypes.ENUM('student', 'admin'),
      defaultValue: 'student',
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },


    reset_code: {
      type: DataTypes.STRING(6),
      allowNull: true,
      validate: {
        isNumeric: true,
        len: [5, 6]
      }
    },
    reset_code_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    reset_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    about_me: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    social_links: {
      type: DataTypes.JSON,
      allowNull: true
    }
    
    
  },
  {
    timestamps: true,
    paranoid: true, 
    deletedAt: 'deletedAt',
  }
);

export default User;
