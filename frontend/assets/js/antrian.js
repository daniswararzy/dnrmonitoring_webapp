/**
 * Antrian Management Script
 * ========================
 */

// Global Variables
let currentPage = 1;
const itemsPerPage = 10;
let currentMode = 'add'; // 'add' or 'edit'
let currentId = null;
let allData = [];

// Initialize
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

    // Load data
    loadAntrian();

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', Utils.debounce(filterData, 300));
    document.getElementById('statusFilter').addEventListener('change', filterData);
});

/**
 * Load Antrian Data
 */
async function loadAntrian() {
    try {
        Utils.showLoading('Memuat data...');

        const searchTerm  = document.getElementById('searchInput').value.trim();
        const statusFilter = document.getElementById('statusFilter').value;

        const params = { page: currentPage, limit: itemsPerPage };
        if (searchTerm)   params.search = searchTerm;   // BUG-05 FIX: kirim ke backend
        if (statusFilter) params.status = statusFilter;

        const response = await API.client.get('/antrian', { params });

        allData = response.data.data || [];
        const total = response.data.pagination?.total || allData.length;

        Utils.closeLoading();
        displayAntrian(allData);
        generatePagination(total);
    } catch (error) {
        Utils.closeLoading();
        console.error('Error loading antrian:', error);
        Utils.showAlert('Error', 'Gagal memuat data antrian', 'error');
    }
}

/**
 * Display Antrian in Table
 */
function displayAntrian(data) {
    const tbody = document.getElementById('antrianTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <p>Tidak ada data antrian</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach((item, index) => {
        const no = (currentPage - 1) * itemsPerPage + index + 1;
        const row = `
            <tr class="fade-in">
                <td>${no}</td>
                <td><strong>${item.namaPemilik || '-'}</strong></td>
                <td>${item.nomorMotor || '-'}</td>
                <td>${item.jenisMotor || '-'}</td>
                <td>${Utils.formatDate(item.tanggalMasuk)}</td>
                <td>${Utils.getStatusBadge(item.status)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-primary" onclick="openStatusModal(${item.id}, '${(item.namaPemilik || '').replace(/'/g, "\\'")  }', '${item.status}')" title="Update Status">
                            <i class="bi bi-arrow-repeat"></i> Status
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAntrian(${item.id}, '${(item.namaPemilik || '').replace(/'/g, "\\'")  }')" title="Hapus Antrian">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * Filter Data — BUG-05 FIX: delegasi ke backend, bukan filter client-side
 */
function filterData() {
    currentPage = 1;
    loadAntrian();
}

/**
 * Reset Filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 1;
    loadAntrian();
}

/**
 * Open Status Update Modal
 */
function openStatusModal(id, nama, currentStatus) {
    currentId = id;
    const subtitle = document.getElementById('statusModalSubtitle');
    if (subtitle) {
        subtitle.textContent = `Pelanggan: ${nama} — Status saat ini: ${currentStatus}`;
    }
    const modal = new bootstrap.Modal(document.getElementById('statusModal'));
    modal.show();
}

/**
 * Delete Antrian
 */
function deleteAntrian(id, nama) {
    Utils.showConfirm(
        'Hapus Antrian',
        `Yakin ingin menghapus antrian "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
        async () => {
            try {
                Utils.showLoading('Menghapus antrian...');
                await API.client.delete(`/antrian/${id}`);
                Utils.closeLoading();
                Utils.showAlert('Sukses', 'Antrian berhasil dihapus', 'success');
                loadAntrian();
            } catch (error) {
                Utils.closeLoading();
                const message = error.response?.data?.message || 'Gagal menghapus antrian';
                Utils.showAlert('Error', message, 'error');
            }
        }
    );
}

/**
 * Update Status Antrian — BUG-11 FIX: tambah konfirmasi sebelum eksekusi
 */
async function updateStatus(newStatus) {
    if (!currentId) return;

    // Tutup modal status terlebih dahulu, lalu tampilkan konfirmasi
    const modalEl = document.getElementById('statusModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    const statusLabels = { pending: 'Pending', proses: 'Proses', selesai: 'Selesai', batal: 'Batal' };
    const label = statusLabels[newStatus] || newStatus;

    Utils.showConfirm(
        'Konfirmasi Update Status',
        `Ubah status antrian menjadi "${label}"?`,
        async () => {
            try {
                Utils.showLoading('Memperbarui status...');

                const existing = await API.client.get(`/antrian/${currentId}`);
                const data = existing.data.data;

                await API.client.put(`/antrian/${currentId}`, {
                    namaPemilik: data.namaPemilik,
                    nomorMotor:  data.nomorMotor,
                    jenisMotor:  data.jenisMotor,
                    keterangan:  data.keterangan,
                    status:      newStatus
                });

                Utils.closeLoading();
                Utils.showAlert('Sukses', `Status berhasil diubah menjadi "${label}"`, 'success');
                currentId = null;
                loadAntrian();
            } catch (error) {
                Utils.closeLoading();
                const message = error.response?.data?.message || 'Gagal memperbarui status';
                Utils.showAlert('Error', message, 'error');
            }
        }
    );
}

/**
 * Generate Pagination
 */
function generatePagination(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
            <i class="bi bi-chevron-left"></i> Previous
        </a>
    `;
    container.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">
                    ${i}
                </a>
            `;
            container.appendChild(li);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            container.appendChild(li);
        }
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
            Next <i class="bi bi-chevron-right"></i>
        </a>
    `;
    container.appendChild(nextLi);
}

/**
 * Go to Page
 */
function goToPage(page) {
    currentPage = page;
    loadAntrian();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Logout
 */
function logout() {
    Utils.showConfirm('Logout', 'Apakah Anda yakin ingin logout?', () => {
        Auth.logout();
    });
}
