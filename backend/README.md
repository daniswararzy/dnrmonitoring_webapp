# DNR.412 Workshop Monitoring System - Backend API

Backend API untuk sistem monitoring workshop berbasis Node.js dan Express.

## Quick Start

### Prerequisites
- Node.js v14+ (download dari https://nodejs.org)
- npm atau yarn

### Installation

1. Navigate to backend folder
2. Install dependencies: npm install
3. Start server: npm start

Server akan berjalan di http://localhost:3000

## Development Mode

Untuk development dengan auto-reload:
npm run dev

## API Endpoints

### Authentication
POST   /api/auth/login          # Login user
POST   /api/auth/logout         # Logout user
GET    /api/auth/me             # Get current user

### Antrian (Queue)
GET    /api/antrian             # List all antrian
GET    /api/antrian/:id         # Get single antrian
POST   /api/antrian             # Create new antrian
PUT    /api/antrian/:id         # Update antrian
DELETE /api/antrian/:id         # Delete antrian

### Pelanggan (Customer)
GET    /api/pelanggan           # List all pelanggan
GET    /api/pelanggan/:id       # Get single pelanggan
POST   /api/pelanggan           # Create new pelanggan
PUT    /api/pelanggan/:id       # Update pelanggan
DELETE /api/pelanggan/:id       # Delete pelanggan

### Order (Service Order)
GET    /api/order               # List all orders
GET    /api/order/:id           # Get single order
POST   /api/order               # Create new order
PUT    /api/order/:id           # Update order
DELETE /api/order/:id           # Delete order

### Dashboard
GET    /api/dashboard/stats     # Get statistics

## Configuration

Edit file .env untuk mengubah konfigurasi:
- PORT=3000
- NODE_ENV=development
- JWT_SECRET=your_jwt_secret_key
- CORS_ORIGIN=http://localhost:5500,http://localhost:3000

## Default Credentials

Username: admin
Password: admin123

## Version: 1.0.0
