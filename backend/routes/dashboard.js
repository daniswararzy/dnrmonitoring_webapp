/**
 * Dashboard Routes — Database Version
 * =====================================
 * Statistik REAL dari COUNT/SUM query ke MySQL.
 * Semua route PROTECTED (butuh login admin).
 * Menggantikan data hardcoded sebelumnya.
 */

const express         = require('express');
const router          = express.Router();
const { Op }          = require('sequelize');
const { Antrian, Order, Pelanggan } = require('../models');
const { verifyToken } = require('../middleware/auth');

// Semua route dashboard membutuhkan autentikasi
router.use(verifyToken);

/**
 * GET /api/dashboard/stats
 * Statistik real dari query database
 */
router.get('/stats', async (req, res) => {
    try {
        // Jalankan semua query paralel untuk performa lebih baik
        const [
            totalAntrian,
            antrianPending,
            antrianProses,
            antrianSelesai,
            totalPelanggan,
            totalOrder,
            orderSelesai,
            orderProses,
            orderPending,
            totalBiaya,
            biayaBulanIni
        ] = await Promise.all([
            // Antrian counts
            Antrian.count(),
            Antrian.count({ where: { status: 'pending' } }),
            Antrian.count({ where: { status: 'proses' } }),
            Antrian.count({ where: { status: 'selesai' } }),

            // Pelanggan count
            Pelanggan.count(),

            // Order counts
            Order.count(),
            Order.count({ where: { status: 'selesai' } }),
            Order.count({ where: { status: 'proses' } }),
            Order.count({ where: { status: 'pending' } }),

            // Revenue: total semua order selesai
            Order.sum('biaya', { where: { status: 'selesai' } }),

            // Revenue bulan ini
            Order.sum('biaya', {
                where: {
                    status: 'selesai',
                    tanggalOrder: {
                        // [Op.gte] = Sequelize operator untuk >= (bukan $gte Mongoose)
                        [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                            .toISOString().split('T')[0]
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalAntrian,
                antrianPending,
                antrianProses,
                antrianSelesai,
                totalPelanggan,
                totalOrder,
                orderSelesai,
                orderProses,
                orderPending,
                totalBiaya:    totalBiaya    || 0,
                biayaBulanIni: biayaBulanIni || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
    }
});

/**
 * GET /api/dashboard/recent-orders
 * 5 order terbaru
 */
router.get('/recent-orders', async (req, res) => {
    try {
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'nomorMotor', 'namaPemilik', 'jenisServis',
                         'biaya', 'status', 'tanggalOrder']
        });

        res.json({ success: true, data: recentOrders });
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil recent orders' });
    }
});

/**
 * GET /api/dashboard/recent-antrian
 * 5 antrian terbaru
 */
router.get('/recent-antrian', async (req, res) => {
    try {
        const recentAntrian = await Antrian.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'nomorMotor', 'namaPemilik', 'status', 'tanggalMasuk']
        });

        res.json({ success: true, data: recentAntrian });
    } catch (error) {
        console.error('Recent antrian error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil recent antrian' });
    }
});

/**
 * GET /api/dashboard/recent-pelanggan
 * 5 pelanggan terbaru
 */
router.get('/recent-pelanggan', async (req, res) => {
    try {
        const recentPelanggan = await Pelanggan.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'nama', 'nomorTelepon', 'alamat', 'jenisMotor']
        });

        res.json({ success: true, data: recentPelanggan });
    } catch (error) {
        console.error('Recent pelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil recent pelanggan' });
    }
});

module.exports = router;
