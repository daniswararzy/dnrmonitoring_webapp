/**
 * DNR.412 Workshop Monitoring System - Backend Server
 * ====================================================
 */

const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/antrian',   require('./routes/antrian'));
app.use('/api/pelanggan', require('./routes/pelanggan'));
app.use('/api/order',     require('./routes/order'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check endpoint
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

// ─── Start Server (setelah database siap) ────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // 1. Sync database & seed data awal
        const { syncDatabase } = require('./models');
        await syncDatabase();

        // 2. Start HTTP server
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
    } catch (error) {
        console.error('❌ Gagal memulai server:', error.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
