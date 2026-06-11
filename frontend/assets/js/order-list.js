/**
 * Order List Management Script
 * =============================
 * Halaman daftar semua order servis dengan fitur:
 *   - Tabel terstruktur dengan pagination
 *   - Search backend (nama, nomor motor, jenis servis)
 *   - Filter status
 *   - Update status + biaya + teknisi + tanggal selesai
 *   - Hapus order dengan konfirmasi
 */

let currentPage  = 1;
const itemsPerPage = 10;
let currentEditId  = null;

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.username || 'Admin';
    }

    loadOrders();
    document.getElementById('searchInput').addEventListener('input', Utils.debounce(filterData, 350));
    document.getElementById('statusFilter').addEventListener('change', filterData);

    // Auto-set tanggal selesai jika status berubah ke 'selesai'
    document.getElementById('editStatus').addEventListener('change', function () {
        const tglSelesai = document.getElementById('editTanggalSelesai');
        if (this.value === 'selesai' && !tglSelesai.value) {
            tglSelesai.value = new Date().toISOString().split('T')[0];
        }
    });
});

// ─── Load Orders ───────────────────────────────────────────────────────────────
async function loadOrders() {
    try {
        Utils.showLoading('Memuat data order...');

        const searchTerm   = document.getElementById('searchInput').value.trim();
        const statusFilter = document.getElementById('statusFilter').value;

        const params = { page: currentPage, limit: itemsPerPage };
        if (searchTerm)   params.search = searchTerm;
        if (statusFilter) params.status = statusFilter;

        const response = await API.client.get('/order', { params });
        const data     = response.data.data || [];
        const total    = response.data.pagination?.total || data.length;

        Utils.closeLoading();
        displayOrders(data);
        generatePagination(total);
        updateCounter(total);
    } catch (error) {
        Utils.closeLoading();
        console.error('Error loading orders:', error);
        Utils.showAlert('Error', 'Gagal memuat data order', 'error');
    }
}

// ─── Display Table ─────────────────────────────────────────────────────────────
function displayOrders(data) {
    const tbody = document.getElementById('orderTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                        <p class="text-muted mb-0">Tidak ada data order servis</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach((item, index) => {
        const no    = (currentPage - 1) * itemsPerPage + index + 1;
        const biaya = item.biaya > 0 ? Utils.formatCurrency(item.biaya) : '<span class="text-muted">—</span>';
        const teknisi = (item.teknisi && item.teknisi !== '-')
            ? item.teknisi
            : '<span class="text-muted">—</span>';

        const safeName  = (item.namaPemilik || '').replace(/'/g, "\\'");
        const row = `
            <tr class="fade-in">
                <td class="text-muted">${no}</td>
                <td>
                    <strong>${item.namaPemilik || '-'}</strong>
                    <br><small class="text-muted"><i class="bi bi-motorcycle"></i> ${item.nomorMotor || '-'}</small>
                </td>
                <td>
                    <span title="${item.deskripsi || ''}">${Utils.truncateText(item.jenisServis, 30)}</span>
                </td>
                <td class="text-nowrap">${teknisi}</td>
                <td class="text-nowrap fw-semibold">${biaya}</td>
                <td class="text-nowrap">${Utils.formatDate(item.tanggalOrder)}</td>
                <td>${Utils.getStatusBadge(item.status)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-primary" onclick="openUpdateModal(${item.id})" title="Edit Order">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${item.id}, '${safeName}')" title="Hapus Order">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ─── Filter ────────────────────────────────────────────────────────────────────
function filterData() {
    currentPage = 1;
    loadOrders();
}

function resetFilters() {
    document.getElementById('searchInput').value  = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 1;
    loadOrders();
}

// ─── Open Update Modal ─────────────────────────────────────────────────────────
async function openUpdateModal(id) {
    try {
        Utils.showLoading('Memuat data order...');
        const response = await API.client.get(`/order/${id}`);
        const item     = response.data.data;
        Utils.closeLoading();

        currentEditId = id;

        document.getElementById('editModalSubtitle').textContent =
            `${item.namaPemilik || '-'} — ${item.nomorMotor || '-'} | ${item.jenisServis || '-'}`;
        document.getElementById('editStatus').value        = item.status       || 'pending';
        document.getElementById('editBiaya').value         = item.biaya        || 0;
        document.getElementById('editTeknisi').value       = (item.teknisi && item.teknisi !== '-') ? item.teknisi : '';
        document.getElementById('editTanggalSelesai').value = item.tanggalSelesai || '';

        new bootstrap.Modal(document.getElementById('updateModal')).show();
    } catch (error) {
        Utils.closeLoading();
        Utils.showAlert('Error', 'Gagal memuat data order', 'error');
    }
}

// ─── Save Update ───────────────────────────────────────────────────────────────
async function saveOrderUpdate() {
    if (!currentEditId) return;

    const status        = document.getElementById('editStatus').value;
    const biaya         = parseFloat(document.getElementById('editBiaya').value)         || 0;
    const teknisi       = document.getElementById('editTeknisi').value.trim()            || '-';
    const tanggalSelesai = document.getElementById('editTanggalSelesai').value            || null;

    // Validasi: status selesai wajib ada tanggal selesai
    if (status === 'selesai' && !tanggalSelesai) {
        Utils.showAlert('Validasi', 'Isi tanggal selesai untuk status Selesai', 'warning');
        return;
    }

    try {
        Utils.showLoading('Menyimpan perubahan...');
        await API.client.put(`/order/${currentEditId}`, { status, biaya, teknisi, tanggalSelesai });
        Utils.closeLoading();

        bootstrap.Modal.getInstance(document.getElementById('updateModal'))?.hide();
        Utils.showAlert('Sukses', 'Order berhasil diperbarui', 'success');
        currentEditId = null;
        loadOrders();
    } catch (error) {
        Utils.closeLoading();
        const message = error.response?.data?.message || 'Gagal memperbarui order';
        Utils.showAlert('Error', message, 'error');
    }
}

// ─── Delete Order ──────────────────────────────────────────────────────────────
function deleteOrder(id, nama) {
    Utils.showConfirm(
        'Hapus Order',
        `Yakin ingin menghapus order milik "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
        async () => {
            try {
                Utils.showLoading('Menghapus order...');
                await API.client.delete(`/order/${id}`);
                Utils.closeLoading();
                Utils.showAlert('Sukses', 'Order berhasil dihapus', 'success');
                loadOrders();
            } catch (error) {
                Utils.closeLoading();
                const message = error.response?.data?.message || 'Gagal menghapus order';
                Utils.showAlert('Error', message, 'error');
            }
        }
    );
}

// ─── Counter ───────────────────────────────────────────────────────────────────
function updateCounter(total) {
    const el = document.getElementById('orderCount');
    if (el) el.textContent = total;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function generatePagination(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const container  = document.getElementById('paginationContainer');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;"><i class="bi bi-chevron-left"></i></a>`;
    container.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>`;
            container.appendChild(li);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">…</span>';
            container.appendChild(li);
        }
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;"><i class="bi bi-chevron-right"></i></a>`;
    container.appendChild(nextLi);
}

function goToPage(page) {
    currentPage = page;
    loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function logout() {
    Utils.showConfirm('Logout', 'Apakah Anda yakin ingin logout?', () => {
        Auth.logout();
    });
}
