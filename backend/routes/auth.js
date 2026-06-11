/**
 * Authentication Routes — Database Version
 * =========================================
 * Login dari MySQL melalui Sequelize (menggantikan mock array)
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { User }        = require('../models');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            });
        }

        // Cari user di database
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Bandingkan password dengan hash di DB
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id:       user.id,
                username: user.username,
                email:    user.email,
                role:     user.role,
                name:     user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat login' });
    }
});

/**
 * POST /api/auth/logout
 * (Token invalidation dilakukan di client-side)
 */
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logout berhasil' });
});

/**
 * GET /api/auth/me
 * Ambil info user yang sedang login
 */
router.get('/me', verifyToken, async (req, res) => {
    // verifyToken sudah attach user ke req.user
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * POST /api/auth/change-password
 * Ganti password user yang sedang login
 */
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama dan baru harus diisi'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password baru minimal 6 karakter'
            });
        }

        const user = await User.findByPk(req.user.id);
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Password lama tidak sesuai'
            });
        }

        await user.update({
            password: bcrypt.hashSync(newPassword, 10)
        });

        res.json({ success: true, message: 'Password berhasil diubah' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah password' });
    }
});

module.exports = router;
