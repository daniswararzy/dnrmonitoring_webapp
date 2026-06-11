/**
 * Antrian Routes — Database Version
 * ===================================
 * CRUD antrian menggunakan Sequelize + MySQL.
 * Route search (/search/byMotor) bersifat PUBLIC (untuk halaman cek-status klien).
 * Semua route lain PROTECTED (butuh login admin).
 */

const express      = require('express');
const router       = express.Router();
const { Op }       = require('sequelize');
const { Antrian }  = require('../models');
const { verifyToken } = require('../middleware/auth');

// ─── PUBLIC ROUTES (tanpa auth — diakses oleh halaman cek-status klien) ──────

/**
 * GET /api/antrian/search/byMotor?nomorMotor=H1234ABC
 * Cari antrian berdasarkan nomor motor (public)
 */
router.get('/search/byMotor', async (req, res) => {
    try {
        const nomorMotor = req.query.nomorMotor?.toUpperCase();

        if (!nomorMotor) {
            return res.status(400).json({
                success: false,
                message: 'Parameter nomorMotor harus diisi'
            });
        }

        const results = await Antrian.findAll({
            where: {
                nomorMotor: { [Op.like]: `%${nomorMotor}%` }
            },
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data:    results,
            total:   results.length
        });
    } catch (error) {
        console.error('Search antrian error:', error);
        res.status(500).json({ success: false, message: 'Gagal mencari antrian' });
    }
});

// ─── PROTECTED ROUTES (butuh JWT token admin) ─────────────────────────────────

/**
 * GET /api/antrian?page=1&limit=10
 * Ambil semua antrian dengan pagination
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Filter opsional berdasarkan status dan/atau pencarian teks
        const where = {};
        if (req.query.status) where.status = req.query.status;

        if (req.query.search) {
            const term = `%${req.query.search}%`;
            where[Op.or] = [
                { namaPemilik: { [Op.like]: term } },
                { nomorMotor:  { [Op.like]: term } }
            ];
        }

        const { count, rows } = await Antrian.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get antrian error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data antrian' });
    }
});

/**
 * GET /api/antrian/:id
 * Ambil satu antrian berdasarkan ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const antrian = await Antrian.findByPk(req.params.id);

        if (!antrian) {
            return res.status(404).json({
                success: false,
                message: 'Antrian tidak ditemukan'
            });
        }

        res.json({ success: true, data: antrian });
    } catch (error) {
        console.error('Get antrian by id error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data antrian' });
    }
});

/**
 * POST /api/antrian
 * Tambah antrian baru
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nomorMotor, namaPemilik, nomorTelepon, jenisMotor, keterangan, status } = req.body;

        // Validasi field wajib
        if (!nomorMotor || !namaPemilik || !nomorTelepon) {
            return res.status(400).json({
                success: false,
                message: 'Nomor motor, nama pemilik, dan nomor telepon harus diisi'
            });
        }

        const antrian = await Antrian.create({
            nomorMotor,
            namaPemilik,
            nomorTelepon,
            jenisMotor:      jenisMotor || '-',
            status:          status || 'pending',
            tanggalMasuk:    new Date().toISOString().split('T')[0],
            estimasiSelesai: req.body.estimasiSelesai || null,
            keterangan:      keterangan || '-'
        });

        res.status(201).json({
            success: true,
            message: 'Antrian berhasil ditambahkan',
            data:    antrian
        });
    } catch (error) {
        console.error('Create antrian error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: error.errors.map(e => e.message).join(', ')
            });
        }
        res.status(500).json({ success: false, message: 'Gagal menambahkan antrian' });
    }
});

/**
 * PUT /api/antrian/:id
 * Update antrian
 */
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const antrian = await Antrian.findByPk(req.params.id);

        if (!antrian) {
            return res.status(404).json({
                success: false,
                message: 'Antrian tidak ditemukan'
            });
        }

        // Hanya update field yang dikirim (tidak override yang lain)
        const allowedFields = ['nomorMotor', 'namaPemilik', 'nomorTelepon',
                               'jenisMotor', 'status', 'estimasiSelesai', 'keterangan'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        await antrian.update(updates);

        res.json({
            success: true,
            message: 'Antrian berhasil diperbarui',
            data:    antrian
        });
    } catch (error) {
        console.error('Update antrian error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui antrian' });
    }
});

/**
 * DELETE /api/antrian/:id
 * Hapus antrian
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const antrian = await Antrian.findByPk(req.params.id);

        if (!antrian) {
            return res.status(404).json({
                success: false,
                message: 'Antrian tidak ditemukan'
            });
        }

        await antrian.destroy();

        res.json({
            success: true,
            message: 'Antrian berhasil dihapus',
            data:    antrian
        });
    } catch (error) {
        console.error('Delete antrian error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus antrian' });
    }
});

module.exports = router;
