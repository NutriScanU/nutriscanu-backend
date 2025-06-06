import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const ClinicalProfile = sequelize.define('ClinicalProfile', {
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false
  },
  bmi: DataTypes.FLOAT,
  hbA1c: DataTypes.FLOAT,
  blood_glucose_level: DataTypes.INTEGER,
  hemoglobin: DataTypes.FLOAT,
  insulin: DataTypes.FLOAT,
  triglycerides: DataTypes.INTEGER,
  hematocrit: DataTypes.FLOAT,
  red_blood_cells: DataTypes.FLOAT,
  smoking_history: {
    type: DataTypes.STRING,
    allowNull: true
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false // 🔥 IMPORTANTE para que no falle el AnalysisLog
  },
  probabilidades: {
    type: DataTypes.JSONB,
    allowNull: true
  } 
});

User.hasOne(ClinicalProfile, { foreignKey: 'userId' });
ClinicalProfile.belongsTo(User, { foreignKey: 'userId' });

export default ClinicalProfile;
