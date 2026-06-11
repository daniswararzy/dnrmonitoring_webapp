/**
 * Order Routes — Database Version
 * =================================
 * CRUD order servis menggunakan Sequelize + MySQL.
 * Route search (/search/byMotor) PUBLIC (untuk cek-status klien).
 * Semua route lain PROTECTED.
 */

const express         = require('express');
const router          = express.Router();
const { Op }          = require('sequelize');
const { Order, Antrian } = require('../models');
const { verifyToken } = require('../middleware/auth');

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

/**
 * GET /api/order/search/byMotor?nomorMotor=H1234ABC
 * Cari order berdasarkan nomor motor (public — untuk klien cek status)
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

        const results = await Order.findAll({
            where: {
                nomorMotor: { [Op.like]: `%${nomorMotor}%` }
            },
            order: [['tanggal_order', 'DESC']]
        });

        res.json({
            success: true,
            data:    results,
            total:   results.length
        });
    } catch (error) {
        console.error('Search order error:', error);
        res.status(500).json({ success: false, message: 'Gagal mencari order' });
    }
});

// ─── PROTECTED ROUTES ─────────────────────────────────────────────────────────

/**
 * GET /api/order?page=1&limit=10&status=proses
 * Ambil semua order dengan pagination
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.status) where.status = req.query.status;

        if (req.query.search) {
            const term = `%${req.query.search}%`;
            where[Op.or] = [
                { namaPemilik: { [Op.like]: term } },
                { nomorMotor:  { [Op.like]: term } },
                { jenisServis: { [Op.like]: term } }
            ];
        }

        const { count, rows } = await Order.findAndCountAll({
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
        console.error('Get order error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data order' });
    }
});

/**
 * GET /api/order/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan'
            });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get order by id error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data order' });
    }
});

/**
 * POST /api/order
 * Tambah order baru
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nomorMotor, namaPemilik, jenisServis, deskripsi, biaya, teknisi, nomorTelepon, jenisMotor, status, tanggalOrder } = req.body;

        if (!nomorMotor || !namaPemilik || !jenisServis) {
            return res.status(400).json({
                success: false,
                message: 'Nomor motor, nama pemilik, dan jenis servis harus diisi'
            });
        }

        // BUG-13 FIX: Gunakan tanggalOrder dari form jika dikirim, fallback ke hari ini
        const tanggalHariIni = new Date().toISOString().split('T')[0];
        const tanggalOrderFinal = tanggalOrder || tanggalHariIni;

        // BUG-02 FIX: Gunakan status dari form (hanya pending/proses yang valid untuk order baru)
        const allowedNewStatus = ['pending', 'proses'];
        const statusFinal = allowedNewStatus.includes(status) ? status : 'pending';

        // Buat Order Servis
        const order = await Order.create({
            nomorMotor,
            namaPemilik,
            jenisServis,
            deskripsi:    deskripsi || '-',
            biaya:        parseFloat(biaya) || 0,
            status:       statusFinal,
            tanggalOrder: tanggalOrderFinal,
            teknisi:      teknisi || '-'
        });

        // ─── Auto-create Antrian dari Order (BUG-01 FIX: cek duplikat dulu) ───
        try {
            // Cek apakah sudah ada antrian aktif (pending/proses) untuk motor ini
            const antrianAktif = await Antrian.findOne({
                where: {
                    nomorMotor: nomorMotor.toUpperCase(),
                    status: ['pending', 'proses']
                }
            });

            if (antrianAktif) {
                // Antrian aktif sudah ada — update keterangan saja, jangan duplikasi
                await antrianAktif.update({
                    keterangan: `[Order #${order.id}] ${deskripsi || jenisServis || '-'}`
                });
                console.log(`ℹ️  Antrian aktif ditemukan (ID: ${antrianAktif.id}), keterangan diperbarui`);
            } else {
                // Tidak ada antrian aktif — buat baru
                await Antrian.create({
                    nomorMotor,
                    namaPemilik,
                    nomorTelepon: nomorTelepon || '-',
                    jenisMotor:   jenisMotor || '-',
                    status:       statusFinal === 'proses' ? 'proses' : 'pending',
                    tanggalMasuk: tanggalOrderFinal,
                    keterangan:   `[Order #${order.id}] ${deskripsi || jenisServis || '-'}`
                });
            }
        } catch (antrianErr) {
            // Jika gagal proses antrian, order tetap tersimpan (non-blocking)
            console.warn('Peringatan: Order berhasil dibuat, namun gagal memproses antrian:', antrianErr.message);
        }
        // ───────────────────────────────────────────────────────────────────────

        res.status(201).json({
            success: true,
            message: 'Order berhasil ditambahkan dan antrian telah didaftarkan',
            data:    order
        });
    } catch (error) {
        console.error('Create order error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: error.errors.map(e => e.message).join(', ')
            });
        }
        res.status(500).json({ success: false, message: 'Gagal menambahkan order' });
    }
});

/**
 * PUT /api/order/:id
 * Update order (tanggalSelesai otomatis diisi via Sequelize hook di model)
 */
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan'
            });
        }

        const allowedFields = ['nomorMotor', 'namaPemilik', 'jenisServis',
                               'deskripsi', 'biaya', 'status', 'tanggalSelesai', 'teknisi'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        // Normalisasi biaya
        if (updates.biaya !== undefined) {
            updates.biaya = parseFloat(updates.biaya) || 0;
        }

        await order.update(updates);
        // Hook beforeUpdate di model akan otomatis set tanggalSelesai jika status = 'selesai'

        // BUG-E FIX: Sinkronisasi status antrian terkait saat order selesai/batal
        if (updates.status === 'selesai' || updates.status === 'batal') {
            try {
                const antrianAktif = await Antrian.findOne({
                    where: {
                        nomorMotor: order.nomorMotor,
                        status:     ['pending', 'proses']
                    }
                });
                if (antrianAktif) {
                    await antrianAktif.update({ status: updates.status });
                    console.log(`ℹ️  Antrian ID ${antrianAktif.id} di-sync ke status: ${updates.status}`);
                }
            } catch (syncErr) {
                // Non-blocking: order tetap tersimpan meski sync antrian gagal
                console.warn('Peringatan: Gagal sinkronisasi status antrian:', syncErr.message);
            }
        }

        res.json({
            success: true,
            message: 'Order berhasil diperbarui',
            data:    order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui order' });
    }
});

/**
 * DELETE /api/order/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order tidak ditemukan'
            });
        }

        await order.destroy();

        res.json({
            success: true,
            message: 'Order berhasil dihapus',
            data:    order
        });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus order' });
    }
});

module.exports = router;
