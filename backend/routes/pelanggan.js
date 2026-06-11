/**
 * Pelanggan Routes — Database Version
 * =====================================
 * CRUD pelanggan menggunakan Sequelize + MySQL.
 * Semua route PROTECTED (butuh login admin).
 */

const express         = require('express');
const router          = express.Router();
const { Op }          = require('sequelize');
const { Pelanggan }   = require('../models');
const { verifyToken } = require('../middleware/auth');

// Semua route pelanggan membutuhkan autentikasi
router.use(verifyToken);

/**
 * GET /api/pelanggan?page=1&limit=10&search=budi
 * Ambil semua pelanggan dengan pagination dan search opsional
 */
router.get('/', async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Search opsional berdasarkan nama atau nomor telepon
        const where = {};
        if (req.query.search) {
            where[Op.or] = [
                { nama:         { [Op.like]: `%${req.query.search}%` } },
                { nomorTelepon: { [Op.like]: `%${req.query.search}%` } },
                { nomorMotor:   { [Op.like]: `%${req.query.search}%` } }
            ];
        }

        const { count, rows } = await Pelanggan.findAndCountAll({
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
        console.error('Get pelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggan' });
    }
});

/**
 * GET /api/pelanggan/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const pelanggan = await Pelanggan.findByPk(req.params.id);

        if (!pelanggan) {
            return res.status(404).json({
                success: false,
                message: 'Pelanggan tidak ditemukan'
            });
        }

        res.json({ success: true, data: pelanggan });
    } catch (error) {
        console.error('Get pelanggan by id error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggan' });
    }
});

/**
 * POST /api/pelanggan
 * Tambah pelanggan baru
 */
router.post('/', async (req, res) => {
    try {
        const { nama, nomorTelepon, email, alamat, nomorMotor, jenisMotor, tahunMotor } = req.body;

        if (!nama || !nomorTelepon) {
            return res.status(400).json({
                success: false,
                message: 'Nama dan nomor telepon harus diisi'
            });
        }

        const pelanggan = await Pelanggan.create({
            nama,
            nomorTelepon,
            email:       email       || null,
            alamat:      alamat      || '-',
            nomorMotor:  nomorMotor  || '-',
            jenisMotor:  jenisMotor  || '-',
            tahunMotor:  tahunMotor  || new Date().getFullYear(),
            tanggalDaftar: new Date().toISOString().split('T')[0]
        });

        res.status(201).json({
            success: true,
            message: 'Pelanggan berhasil ditambahkan',
            data:    pelanggan
        });
    } catch (error) {
        console.error('Create pelanggan error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: error.errors.map(e => e.message).join(', ')
            });
        }
        res.status(500).json({ success: false, message: 'Gagal menambahkan pelanggan' });
    }
});

/**
 * PUT /api/pelanggan/:id
 * Update data pelanggan
 */
router.put('/:id', async (req, res) => {
    try {
        const pelanggan = await Pelanggan.findByPk(req.params.id);

        if (!pelanggan) {
            return res.status(404).json({
                success: false,
                message: 'Pelanggan tidak ditemukan'
            });
        }

        const allowedFields = ['nama', 'nomorTelepon', 'email', 'alamat',
                               'nomorMotor', 'jenisMotor', 'tahunMotor'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        await pelanggan.update(updates);

        res.json({
            success: true,
            message: 'Pelanggan berhasil diperbarui',
            data:    pelanggan
        });
    } catch (error) {
        console.error('Update pelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui pelanggan' });
    }
});

/**
 * DELETE /api/pelanggan/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const pelanggan = await Pelanggan.findByPk(req.params.id);

        if (!pelanggan) {
            return res.status(404).json({
                success: false,
                message: 'Pelanggan tidak ditemukan'
            });
        }

        await pelanggan.destroy();

        res.json({
            success: true,
            message: 'Pelanggan berhasil dihapus',
            data:    pelanggan
        });
    } catch (error) {
        console.error('Delete pelanggan error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus pelanggan' });
    }
});

module.exports = router;
