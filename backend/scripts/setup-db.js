/**
 * scripts/setup-db.js
 * ====================
 * Script sekali jalan untuk membuat database MySQL jika belum ada.
 * Jalankan sebelum pertama kali memulai server:
 *
 *   node scripts/setup-db.js
 *   npm run setup-db
 */

const mysql  = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    const dbName = process.env.DB_NAME || 'dnr_monitoring';

    console.log('🔄 Menghubungkan ke MySQL...');

    // Koneksi TANPA database (untuk membuat database baru)
    const connection = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 3306,
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Koneksi berhasil');

    // Buat database jika belum ada
    await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\`
         CHARACTER SET utf8mb4
         COLLATE utf8mb4_unicode_ci`
    );

    console.log(`✅ Database '${dbName}' siap`);
    console.log('');
    console.log('Langkah selanjutnya:');
    console.log('  npm run dev    → Jalankan server (tabel otomatis dibuat + data awal di-seed)');

    await connection.end();
}

setupDatabase().catch(err => {
    console.error('');
    console.error('❌ Gagal membuat database:', err.message);
    console.error('');
    console.error('Kemungkinan penyebab:');
    console.error('  • MySQL belum berjalan (jalankan: brew services start mysql)');
    console.error('  • Username/password salah di file .env');
    console.error('  • Port MySQL bukan 3306 (cek DB_PORT di .env)');
    process.exit(1);
});
