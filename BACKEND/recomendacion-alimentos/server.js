// server.js (versión actualizada)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const swaggerDocument = yaml.load('./swagger.yaml');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);

// 🚨 Este bloque crea las tablas si no existen
sequelize.sync({ alter: true })  // alter = actualiza estructuras sin borrar datos
  .then(() => {
    console.log('🗄️ Tablas sincronizadas con éxito');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar tablas:', err);
  });
