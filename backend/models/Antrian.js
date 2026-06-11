/**
 * Model: Antrian (Queue)
 * ======================
 * Menggantikan mock array `antrians` di routes/antrian.js
 *
 * Field mapping (JS camelCase → DB snake_case via underscored:true):
 *   nomorMotor      → nomor_motor
 *   namaPemilik     → nama_pemilik
 *   nomorTelepon    → nomor_telepon
 *   jenisMotor      → jenis_motor
 *   tanggalMasuk    → tanggal_masuk
 *   estimasiSelesai → estimasi_selesai
 *   createdAt       → created_at  (auto)
 *   updatedAt       → updated_at  (auto)
 */

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Antrian = sequelize.define('Antrian', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true
    },
    nomorMotor: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        set(value) {
            // Auto uppercase nomor motor saat disimpan
            this.setDataValue('nomorMotor', value?.toUpperCase());
        }
    },
    namaPemilik: {
        type:      DataTypes.STRING(100),
        allowNull: false
    },
    nomorTelepon: {
        type:      DataTypes.STRING(15),
        allowNull: false
    },
    jenisMotor: {
        type:         DataTypes.STRING(50),
        defaultValue: '-'
    },
    status: {
        type:         DataTypes.ENUM('pending', 'proses', 'selesai', 'batal'),
        defaultValue: 'pending'
    },
    tanggalMasuk: {
        type:         DataTypes.DATEONLY,
        allowNull:    false,
        defaultValue: DataTypes.NOW
    },
    estimasiSelesai: {
        type: DataTypes.DATEONLY
    },
    keterangan: {
        type:         DataTypes.TEXT,
        defaultValue: '-'
    }
}, {
    tableName: 'antrian',
    indexes: [
        { fields: ['nomor_motor'] },  // untuk search cepat
        { fields: ['status'] }         // untuk filter status
    ]
});

module.exports = Antrian;
