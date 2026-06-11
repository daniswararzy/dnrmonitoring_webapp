/**
 * Dashboard Script
 * ================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication using Auth module
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Set user name
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.username || 'Admin';
    }

    // Load dashboard data
    loadDashboardData();
});

/**
 * Load Dashboard Data
 */
async function loadDashboardData() {
    try {
        // Load stats
        await loadStats();
        
        // Load recent data
        await loadRecentAntrian();
        await loadRecentPelanggan();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load Statistics
 */
async function loadStats() {
    try {
        const response = await API.client.get('/dashboard/stats');
        // FIX #8: Backend membungkus data dalam { success: true, data: {...} }
        const stats = response.data.data;

        document.getElementById('totalAntrian').textContent = stats.totalAntrian || 0;
        document.getElementById('totalPelanggan').textContent = stats.totalPelanggan || 0;
        document.getElementById('orderProses').textContent = stats.orderProses || 0;
        document.getElementById('orderSelesai').textContent = stats.orderSelesai || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load Recent Antrian
 */
async function loadRecentAntrian() {
    try {
        // BUG-08 FIX: Pakai dedicated endpoint yang lebih efisien
        const response = await API.client.get('/dashboard/recent-antrian');
        const data = response.data.data || [];

        const tbody = document.getElementById('recentAntrianBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i> Tidak ada data
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.namaPemilik || '-'}</td>
                    <td>${item.nomorMotor || '-'}</td>
                    <td>${Utils.getStatusBadge(item.status)}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading recent antrian:', error);
    }
}

/**
 * Load Recent Pelanggan
 */
async function loadRecentPelanggan() {
    try {
        // BUG-08 FIX: Pakai dedicated endpoint yang lebih efisien
        const response = await API.client.get('/dashboard/recent-pelanggan');
        const data = response.data.data || [];

        const tbody = document.getElementById('recentPelangganBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i> Tidak ada data
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const alamat = item.alamat && item.alamat !== '-'
                ? (item.alamat.length > 25 ? item.alamat.substring(0, 25) + '...' : item.alamat)
                : '<span class="text-muted">-</span>';
            const row = `
                <tr>
                    <td><strong>${item.nama || '-'}</strong></td>
                    <td>${item.nomorTelepon || '-'}</td>
                    <td>${alamat}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading recent pelanggan:', error);
    }
}

/**
 * Logout Function
 */
function logout() {
    Utils.showConfirm('Logout', 'Apakah Anda yakin ingin logout?', () => {
        Auth.logout();
    });
}
