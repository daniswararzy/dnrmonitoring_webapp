/**
 * Database Configuration — Sequelize + PostgreSQL (Supabase)
 * ===========================================================
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Explicit require agar Vercel ncc bundler bisa mendeteksi pg secara statis
// Tanpa ini, Sequelize melakukan dynamic require('pg') yang tidak bisa di-trace ncc
const pg = require('pg');

// Supabase menyediakan DATABASE_URL langsung (format: postgresql://...)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',

    // Berikan pg module secara eksplisit — bypass dynamic require Sequelize
    dialectModule: pg,

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
