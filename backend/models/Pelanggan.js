/**
 * Model: Pelanggan (Customer)
 * ============================
 * Menggantikan mock array `pelanggans` di routes/pelanggan.js
 *
 * Field mapping (JS → DB):
 *   nomorTelepon → nomor_telepon
 *   nomorMotor   → nomor_motor
 *   jenisMotor   → jenis_motor
 *   tahunMotor   → tahun_motor
 *   tanggalDaftar → tanggal_daftar
 */

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Pelanggan = sequelize.define('Pelanggan', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true
    },
    nama: {
        type:      DataTypes.STRING(100),
        allowNull: false
    },
    nomorTelepon: {
        type:      DataTypes.STRING(15),
        allowNull: false
    },
    email: {
        type:    DataTypes.STRING(100),
        validate: {
            isEmail: true
        }
    },
    alamat: {
        type: DataTypes.TEXT
    },
    nomorMotor: {
        type: DataTypes.STRING(20),
        set(value) {
            this.setDataValue('nomorMotor', value?.toUpperCase() || '-');
        }
    },
    jenisMotor: {
        type:         DataTypes.STRING(50),
        defaultValue: '-'
    },
    tahunMotor: {
        type:         DataTypes.SMALLINT,  // PostgreSQL tidak support UNSIGNED
        defaultValue: new Date().getFullYear()
    },
    tanggalDaftar: {
        type:         DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'pelanggan',
    indexes: [
        { fields: ['nomor_telepon'] },
        { fields: ['nama'] }
    ]
});

module.exports = Pelanggan;
