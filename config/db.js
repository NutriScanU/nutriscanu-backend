import pkg from 'sequelize';
const { Sequelize } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres',
  logging: (msg) => {
    // ✅ Solo muestra INSERTs, errores u operaciones clave
    if (
      msg.startsWith('Executing (default): INSERT') ||
      msg.startsWith('Executing (default): UPDATE') ||
      msg.startsWith('Executing (default): DELETE') ||
      msg.toLowerCase().includes('error')
    ) {
      console.log('[📦 SQL]:', msg);
    }
  }
});

export default sequelize;
