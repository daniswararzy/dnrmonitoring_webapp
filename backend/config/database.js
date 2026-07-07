/**
 * Database Configuration — Sequelize + PostgreSQL (Supabase)
 * ===========================================================
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Supabase menyediakan DATABASE_URL langsung (format: postgresql://...)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',

    // Tampilkan query di console saat development
    logging: process.env.NODE_ENV === 'development'
        ? (msg) => console.log(`[SQL] ${msg}`)
        : false,

    // SSL wajib untuk Supabase (baik lokal maupun production)
    dialectOptions: {
        ssl: {
            require:            true,
            rejectUnauthorized: false  // Supabase pakai self-signed cert
        }
    },

    // Connection pool — dikecilkan agar aman di Vercel serverless
    pool: {
        max:     3,
        min:     0,
        acquire: 30000,
        idle:    10000
    },

    // Semua model pakai snake_case di DB, camelCase di JS
    define: {
        underscored: true,
        timestamps:  true
    }
});

module.exports = sequelize;
