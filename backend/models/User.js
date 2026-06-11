/**
 * Model: User (Admin)
 * ===================
 * Menggantikan mock array `users` di routes/auth.js
 */

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true
    },
    username: {
        type:      DataTypes.STRING(50),
        allowNull: false,
        unique:    true,
        validate: {
            len: [3, 50]
        }
    },
    password: {
        type:      DataTypes.STRING(255),
        allowNull: false
        // Disimpan sebagai bcrypt hash — JANGAN simpan plain text
    },
    email: {
        type:   DataTypes.STRING(100),
        unique: true,
        validate: {
            isEmail: true
        }
    },
    name: {
        type: DataTypes.STRING(100)
    },
    role: {
        type:         DataTypes.ENUM('admin', 'teknisi'),
        defaultValue: 'admin'
    }
}, {
    tableName: 'users'
    // timestamps: true otomatis dari define global (created_at, updated_at)
    // underscored: true otomatis dari define global
});

module.exports = User;
