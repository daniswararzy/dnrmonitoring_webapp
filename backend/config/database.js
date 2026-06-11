/**
 * Database Configuration — Sequelize + MySQL
 * ==========================================
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME     || 'dnr_monitoring',
    process.env.DB_USER     || 'root',
    process.env.DB_PASSWORD || '',
    {
        host:    process.env.DB_HOST || 'localhost',
        port:    parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',

        // Tampilkan query di console saat development
        logging: process.env.NODE_ENV === 'development'
            ? (msg) => console.log(`[SQL] ${msg}`)
            : false,

        // Connection pool
        pool: {
            max:     5,
            min:     0,
            acquire: 30000,
            idle:    10000
        },

        // Semua model pakai snake_case di DB, camelCase di JS
        define: {
            underscored: true,
            timestamps:  true
        }
    }
);

module.exports = sequelize;
