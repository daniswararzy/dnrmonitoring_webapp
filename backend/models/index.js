/**
 * Models Index — Inisialisasi + Sync + Seeder
 * ============================================
 * Import semua model di sini, sync ke DB, dan seed data awal.
 */

const sequelize = require('../config/database');
const bcrypt    = require('bcryptjs');

// Import semua model
const User      = require('./User');
const Antrian   = require('./Antrian');
const Pelanggan = require('./Pelanggan');
const Order     = require('./Order');

// ─── Relasi Antar Model (untuk pengembangan selanjutnya) ──────────────────────
// Saat ini belum ada foreign key, tapi bisa ditambah nanti:
// Order.belongsTo(Pelanggan, { foreignKey: 'pelangganId' });
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync semua model ke database
 * alter: true  → sesuaikan tabel yang sudah ada (aman, tidak hapus data)
 * force: false → tidak drop tabel
 */
async function syncDatabase() {
    try {
        // Test koneksi
        await sequelize.authenticate();
        console.log('✅ Koneksi PostgreSQL (Supabase) berhasil');

        // Sync semua model (buat tabel jika belum ada, update kolom jika ada perubahan)
        await sequelize.sync({ alter: true });
        console.log('✅ Semua tabel tersinkronisasi');

        // Jalankan seeder data awal
        await seedDatabase();

    } catch (error) {
        console.error('❌ Gagal koneksi ke database:', error.message);
        throw error; // Lempar error ke caller, jangan process.exit (crash serverless)
    }
}

/**
 * Seed data awal (hanya jika tabel masih kosong)
 */
async function seedDatabase() {
    // ── Seed Admin User ──────────────────────────────────────────────────────
    const userCount = await User.count();
    if (userCount === 0) {
        await User.create({
            username: 'admin',
            password: bcrypt.hashSync('admin123', 10),
            email:    'admin@dnr412.com',
            name:     'Administrator',
            role:     'admin'
        });
        console.log('✅ Admin default dibuat (username: admin, password: admin123)');
    }

    // ── Seed Pelanggan ───────────────────────────────────────────────────────
    const pelangganCount = await Pelanggan.count();
    if (pelangganCount === 0) {
        await Pelanggan.bulkCreate([
            {
                nama: 'Budi Santoso', nomorTelepon: '081234567890',
                email: 'budi@example.com', alamat: 'Jl. Merdeka No. 123, Semarang',
                nomorMotor: 'H 1234 ABC', jenisMotor: 'Honda CB150R', tahunMotor: 2022,
                tanggalDaftar: '2026-01-15'
            },
            {
                nama: 'Siti Nurhaliza', nomorTelepon: '082345678901',
                email: 'siti@example.com', alamat: 'Jl. Sudirman No. 456, Semarang',
                nomorMotor: 'H 5678 DEF', jenisMotor: 'Yamaha NMAX', tahunMotor: 2023,
                tanggalDaftar: '2026-02-20'
            }
        ]);
        console.log('✅ Data pelanggan awal dibuat');
    }

    // ── Seed Antrian ─────────────────────────────────────────────────────────
    const antrianCount = await Antrian.count();
    if (antrianCount === 0) {
        await Antrian.bulkCreate([
            {
                nomorMotor: 'H 1234 ABC', namaPemilik: 'Budi Santoso',
                nomorTelepon: '081234567890', jenisMotor: 'Honda CB150R',
                status: 'pending', tanggalMasuk: '2026-05-30',
                estimasiSelesai: '2026-06-02', keterangan: 'Servis rutin'
            },
            {
                nomorMotor: 'H 5678 DEF', namaPemilik: 'Siti Nurhaliza',
                nomorTelepon: '082345678901', jenisMotor: 'Yamaha NMAX',
                status: 'proses', tanggalMasuk: '2026-05-29',
                estimasiSelesai: '2026-05-31', keterangan: 'Ganti oli dan filter'
            }
        ]);
        console.log('✅ Data antrian awal dibuat');
    }

    // ── Seed Orders ──────────────────────────────────────────────────────────
    const orderCount = await Order.count();
    if (orderCount === 0) {
        await Order.bulkCreate([
            {
                nomorMotor: 'H 1234 ABC', namaPemilik: 'Budi Santoso',
                jenisServis: 'Servis Rutin', deskripsi: 'Ganti oli, filter, dan busi',
                biaya: 250000, status: 'selesai',
                tanggalOrder: '2026-05-25', tanggalSelesai: '2026-05-27',
                teknisi: 'Adi Pratama'
            },
            {
                nomorMotor: 'H 5678 DEF', namaPemilik: 'Siti Nurhaliza',
                jenisServis: 'Perbaikan', deskripsi: 'Perbaikan rem depan',
                biaya: 350000, status: 'proses',
                tanggalOrder: '2026-05-29', teknisi: 'Budi Santoso'
            }
        ]);
        console.log('✅ Data order awal dibuat');
    }
}

module.exports = {
    sequelize,
    syncDatabase,
    User,
    Antrian,
    Pelanggan,
    Order
};
