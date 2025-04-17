//models/AnalysisLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const AnalysisLog = sequelize.define('AnalysisLog', {
  condition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recommendations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  habits: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true
});


User.hasMany(AnalysisLog, { foreignKey: 'userId' });
AnalysisLog.belongsTo(User, { foreignKey: 'userId' });

export default AnalysisLog;