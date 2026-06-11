/**
 * Middleware: JWT Authentication
 * ===============================
 * Digunakan untuk melindungi semua route admin.
 * Route publik (cek-status, login) TIDAK menggunakan middleware ini.
 */

const jwt  = require('jsonwebtoken');
const { User } = require('../models');

/**
 * verifyToken — Cek dan validasi JWT dari Authorization header
 *
 * Usage di route:
 *   router.get('/data', verifyToken, handler);
 *   router.use(verifyToken); // proteksi semua route di router ini
 */
async function verifyToken(req, res, next) {
    try {
        // Ambil token dari header: "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Akses ditolak. Token tidak ditemukan.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Cek user masih ada di database
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'name', 'role'] // exclude password
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan. Silakan login ulang.'
            });
        }

        // Lampirkan user ke request untuk digunakan di handler berikutnya
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token sudah kadaluarsa. Silakan login ulang.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token tidak valid.'
        });
    }
}

/**
 * requireAdmin — Cek role admin (gunakan SETELAH verifyToken)
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya admin yang diizinkan.'
        });
    }
    next();
}

module.exports = { verifyToken, requireAdmin };
