# DNR.412 Workshop — Monitoring System

Sistem monitoring servis kendaraan berbasis web untuk bengkel DNR.412. Memungkinkan admin mengelola antrian, pelanggan, dan order servis, serta memberi akses publik kepada klien untuk memantau status kendaraan mereka secara real-time.

---

## 🗂️ Struktur Proyek

```
dnrmonitoring_webapp/
├── backend/        → Express.js + Sequelize + MySQL
└── frontend/       → HTML + CSS + Vanilla JS (Bootstrap 5)
```

## ✨ Fitur

| Modul | Deskripsi |
|-------|-----------|
| **Cek Status (Publik)** | Klien dapat melacak status servis berdasarkan nomor plat motor tanpa login |
| **Login Admin** | Autentikasi JWT dengan bcrypt |
| **Dashboard** | Statistik real-time: total antrian, pelanggan, order, dan pendapatan |
| **Manajemen Antrian** | CRUD antrian dengan update status (Pending → Proses → Selesai) |
| **Manajemen Pelanggan** | CRUD data pelanggan beserta data kendaraan |
| **Buat Order Servis** | Form order dengan smart search pelanggan terdaftar, auto-create antrian |
| **List Order** | Tabel order dengan filter, search, pagination, dan update status |
| **Ganti Password** | Admin dapat mengubah password dari dalam dashboard |

---

## 🚀 Cara Menjalankan (Development)

### 1. Clone & Setup Backend

```bash
git clone https://github.com/daniswararzy/dnrmonitoring_webapp.git
cd dnrmonitoring_webapp/backend

# Install dependencies
npm install

# Salin dan isi konfigurasi
cp .env.example .env
# Edit .env: isi DB_PASSWORD dan JWT_SECRET

# Jalankan server (otomatis buat tabel & seed data awal)
npm run dev
```

Server berjalan di: `http://localhost:3000`

### 2. Jalankan Frontend

Buka `frontend/index.html` dengan **Live Server** (VS Code extension) atau server statis lainnya.

> ⚠️ Jangan buka langsung via `file://` — CORS akan ditolak. Gunakan `http://localhost:5500`.

### 3. Login Default

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> Segera ganti password setelah login pertama.

---

## 🔑 Environment Variables

Lihat [`backend/.env.example`](backend/.env.example) untuk daftar lengkap konfigurasi yang dibutuhkan.

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- Sequelize ORM + MySQL2
- JWT (jsonwebtoken) + bcryptjs

**Frontend**
- HTML5 + Vanilla JavaScript
- Bootstrap 5.3 + Bootstrap Icons
- Axios + SweetAlert2

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login admin |
| GET | `/api/antrian/search/byMotor` | ❌ | Cek status publik |
| GET | `/api/order/search/byMotor` | ❌ | Cek riwayat order publik |
| GET | `/api/dashboard/stats` | ✅ | Statistik dashboard |
| CRUD | `/api/antrian` | ✅ | Manajemen antrian |
| CRUD | `/api/pelanggan` | ✅ | Manajemen pelanggan |
| CRUD | `/api/order` | ✅ | Manajemen order |

---

## 📄 Lisensi

ISC © 2026 DNR.412 Workshop
