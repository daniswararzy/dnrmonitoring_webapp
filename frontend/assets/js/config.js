/**
 * Global Configuration & Utilities
 * ================================
 */

// API Configuration
// RISK-1 FIX: URL backend otomatis menyesuaikan environment
// - Development (localhost/127.0.0.1) → http://localhost:3000/api
// - Production (server lain)          → /api (same-origin, wajib pakai reverse proxy)
const _isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_CONFIG = {
    BASE_URL: _isLocal
        ? 'http://localhost:3000/api'
        : `${window.location.protocol}//${window.location.hostname}/api`,
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

// Axios Instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

// Add token to requests if exists
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            // BUG-A FIX: Gunakan path relatif dinamis — cari kedalaman path saat ini
            // /admin/dashboard.html → redirect ke login.html (1 level)
            // Jika sudah di login.html, jangan redirect lagi (cegah infinite loop)
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login.html')) {
                // Hitung prefix path relatif berdasarkan kedalaman folder
                const depth = currentPath.split('/').filter(Boolean).length;
                const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
                // Selalu arahkan ke admin/login.html dari root
                const loginUrl = currentPath.includes('/admin/')
                    ? 'login.html'
                    : 'admin/login.html';
                window.location.href = loginUrl;
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Utility Functions
 */

// Show Alert
function showAlert(title, message, type = 'info') {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonColor: '#007bff',
        confirmButtonText: 'OK'
    });
}

// Show Confirmation Dialog
function showConfirm(title, message, onConfirm) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(result => {
        if (result.isConfirmed) {
            onConfirm();
        }
    });
}

// Show Loading Toast
function showLoading(message = 'Loading...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Close Loading Toast
function closeLoading() {
    Swal.close();
}

// Format Date
// BUG-H FIX: Parse manual untuk menghindari konversi UTC → local time yang
// bisa menggeser tanggal 1 hari ke belakang di timezone WIB (+07:00).
// String DATEONLY dari backend "YYYY-MM-DD" harus diperlakukan sebagai local date.
function formatDate(date) {
    if (!date) return '-';
    // Jika sudah dalam format string YYYY-MM-DD, parse langsung
    const str = String(date);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [year, month, day] = str.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }
    // Fallback untuk format lain (misal ISO datetime)
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format DateTime
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Get Status Badge
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-pending">Pending</span>',
        'proses': '<span class="badge badge-proses">Proses</span>',
        'selesai': '<span class="badge badge-selesai">Selesai</span>',
        'batal': '<span class="badge badge-batal">Batal</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

// Get Status Color
function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'proses': 'info',
        'selesai': 'success',
        'batal': 'danger'
    };
    return colors[status] || 'secondary';
}

// Validate Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Phone
function validatePhone(phone) {
    const re = /^(\+62|0)[0-9]{9,12}$/;
    return re.test(phone);
}

// Truncate Text
function truncateText(text, length = 50) {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// Escape HTML — RISK-2 FIX: Cegah XSS saat data dari API dirender ke innerHTML
// Wajib digunakan di halaman publik (cek-status) dan semua innerHTML interpolasi
function escapeHtml(str) {
    if (str === null || str === undefined) return '-';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Check Authentication
function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

// Get Current User
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Logout
// BUG-A FIX: Gunakan path relatif — admin pages ada di /admin/
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
    // Path relatif: dari /admin/*.html → login.html (same directory)
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'admin/login.html';
    }
}

// Set Active Nav Link
function setActiveNavLink(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other files
window.API = {
    client: apiClient,
    config: API_CONFIG
};

window.Utils = {
    showAlert,
    showConfirm,
    showLoading,
    closeLoading,
    formatDate,
    formatDateTime,
    getStatusBadge,
    getStatusColor,
    validateEmail,
    validatePhone,
    truncateText,
    escapeHtml,
    isAuthenticated,
    getCurrentUser,
    logout,
    setActiveNavLink,
    debounce,
    throttle
};

// ─── Format Currency ──────────────────────────────────────────────────────────
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '-';
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}
window.Utils.formatCurrency = formatCurrency;

// ─── Change Password (auto-inject modal + handler) ────────────────────────────
function openChangePasswordModal() {
    Swal.fire({
        title: '<i class="bi bi-key-fill me-2"></i>Ganti Password',
        html: `
            <div class="text-start">
                <div class="mb-3">
                    <label class="form-label fw-semibold">Password Lama <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="swal-old-pass" placeholder="Masukkan password lama">
                        <button class="btn btn-outline-secondary" type="button" onclick="toggleSwalPass('swal-old-pass', this)">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Password Baru <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="swal-new-pass" placeholder="Min. 6 karakter">
                        <button class="btn btn-outline-secondary" type="button" onclick="toggleSwalPass('swal-new-pass', this)">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-1">
                    <label class="form-label fw-semibold">Konfirmasi Password Baru <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="swal-confirm-pass" placeholder="Ulangi password baru">
                        <button class="btn btn-outline-secondary" type="button" onclick="toggleSwalPass('swal-confirm-pass', this)">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Simpan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        focusConfirm: false,
        preConfirm: async () => {
            const oldPass     = document.getElementById('swal-old-pass').value.trim();
            const newPass     = document.getElementById('swal-new-pass').value.trim();
            const confirmPass = document.getElementById('swal-confirm-pass').value.trim();

            if (!oldPass || !newPass || !confirmPass) {
                Swal.showValidationMessage('Semua field wajib diisi');
                return false;
            }
            if (newPass.length < 6) {
                Swal.showValidationMessage('Password baru minimal 6 karakter');
                return false;
            }
            if (newPass !== confirmPass) {
                Swal.showValidationMessage('Konfirmasi password tidak cocok');
                return false;
            }

            try {
                // BUG-C FIX: Backend mendefinisikan route ini sebagai POST, bukan PUT
                const response = await apiClient.post('/auth/change-password', {
                    currentPassword: oldPass,
                    newPassword:     newPass
                });
                return response.data;
            } catch (error) {
                const msg = error.response?.data?.message || 'Gagal mengganti password';
                Swal.showValidationMessage(msg);
                return false;
            }
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            Swal.fire({
                icon: 'success',
                title: 'Password Berhasil Diubah',
                text: 'Silakan gunakan password baru Anda untuk login berikutnya.',
                confirmButtonColor: '#0d6efd'
            });
        }
    });
}

// Toggle show/hide password di dalam SweetAlert
function toggleSwalPass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = `<i class="bi bi-eye${isPass ? '-slash' : ''}"></i>`;
}

window.openChangePasswordModal = openChangePasswordModal;
window.toggleSwalPass = toggleSwalPass;
