/**
 * Model: Order (Service Order)
 * ============================
 * Menggantikan mock array `orders` di routes/order.js
 *
 * Field mapping (JS → DB):
 *   nomorMotor    → nomor_motor
 *   namaPemilik   → nama_pemilik
 *   jenisServis   → jenis_servis
 *   tanggalOrder  → tanggal_order
 *   tanggalSelesai → tanggal_selesai
 */

const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true
    },
    nomorMotor: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        set(value) {
            this.setDataValue('nomorMotor', value?.toUpperCase());
        }
    },
    namaPemilik: {
        type:      DataTypes.STRING(100),
        allowNull: false
    },
    jenisServis: {
        type:      DataTypes.STRING(100),
        allowNull: false
    },
    deskripsi: {
        type:         DataTypes.TEXT,
        defaultValue: '-'
    },
    biaya: {
        type:         DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        // Pastikan biaya tidak negatif
        validate: {
            min: 0
        }
    },
    status: {
        type:         DataTypes.ENUM('pending', 'proses', 'selesai', 'batal'),
        defaultValue: 'pending'
    },
    tanggalOrder: {
        type:         DataTypes.DATEONLY,
        allowNull:    false,
        defaultValue: DataTypes.NOW
    },
    tanggalSelesai: {
        type: DataTypes.DATEONLY
        // null = belum selesai, diisi otomatis saat status = 'selesai'
    },
    teknisi: {
        type:         DataTypes.STRING(100),
        defaultValue: '-'
    }
}, {
    tableName: 'orders',
    indexes: [
        { fields: ['nomor_motor'] },
        { fields: ['status'] },
        { fields: ['tanggal_order'] }
    ],
    hooks: {
        // Auto-set tanggalSelesai saat status diubah ke 'selesai'
        beforeUpdate(order) {
            if (order.changed('status') && order.status === 'selesai' && !order.tanggalSelesai) {
                order.tanggalSelesai = new Date().toISOString().split('T')[0];
            }
        }
    }
});

module.exports = Order;
