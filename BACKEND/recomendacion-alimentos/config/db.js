// config/db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URI, {
    dialect: 'postgres',
    logging: false,
});

module.exports = sequelize;
