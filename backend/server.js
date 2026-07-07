/**
 * DNR.412 Workshop Monitoring System - Backend Server
 * ====================================================
 */

const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const helmet       = require('helmet');       // RISK-3 FIX: Security headers
const rateLimit    = require('express-rate-limit'); // RISK-4 FIX: Brute-force protection

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Vercel & proxy environment: trust first proxy untuk IP detection yang benar
// Wajib agar express-rate-limit bisa baca X-Forwarded-For dengan benar
app.set('trust proxy', 1);

// Middleware — CORS
const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || ['*']).map(o => o.trim());

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || allowedOrigins.includes('null')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// RISK-3 FIX: Helmet — set security headers (X-Frame-Options, CSP, dll)
// contentSecurityPolicy dinonaktifkan sementara agar CDN Bootstrap/Axios/Swal tetap bisa load
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RISK-4 FIX: Rate limiting untuk endpoint login (maks 10 percobaan per 15 menit)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max:      10,              // maks 10 request per window
    standardHeaders: true,
    legacyHeaders:   false,
    // Diperlukan saat berjalan di balik proxy (Vercel) — trust proxy sudah di-set di atas
    validate: { xForwardedForHeader: false },
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
    }
});

// Request logging middleware (hanya aktif saat development)
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// ─── Lazy DB Initialization (aman untuk Vercel Serverless) ───────────────────
let dbInitialized = false;
let dbInitPromise  = null;

async function initDB() {
    if (dbInitialized) return;
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = (async () => {
        const { syncDatabase } = require('./models');
        await syncDatabase();
        dbInitialized = true;
    })();

    return dbInitPromise;
}

// Middleware: pastikan DB siap sebelum tiap request ke /api (kecuali health check)
app.use('/api', async (req, res, next) => {
    if (req.path === '/health') return next();
    try {
        await initDB();
        next();
    } catch (err) {
        console.error('❌ DB init gagal:', err.message);
        res.status(503).json({
            success: false,
            message: 'Database tidak tersedia. Silakan coba lagi.'
        });
    }
});

// API Routes
app.use('/api/auth/login',  loginLimiter); // Rate limit khusus login
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/antrian',   require('./routes/antrian'));
app.use('/api/pelanggan', require('./routes/pelanggan'));
app.use('/api/order',     require('./routes/order'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check endpoint (tidak butuh DB)
app.get('/api/health', (req, res) => {
    res.json({
        status:    'OK',
        timestamp: new Date().toISOString(),
        uptime:    process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan',
        path:    req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error:   process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ─── Start Server (hanya untuk development lokal) ────────────────────────────
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    const { syncDatabase } = require('./models');
    syncDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`
╔════════════════════════════════════════════════════════════╗
║  DNR.412 Workshop Monitoring System - Backend Server       ║
║  ✅ Server berjalan  : http://localhost:${PORT}             ║
║  🗄️  Database        : MySQL (${process.env.DB_NAME})       ║
║  🔧 Environment     : ${process.env.NODE_ENV}               ║
╚════════════════════════════════════════════════════════════╝
                `);
            });
        })
        .catch(err => {
            console.error('❌ Gagal memulai server:', err.message);
            process.exit(1);
        });
}

module.exports = app;
