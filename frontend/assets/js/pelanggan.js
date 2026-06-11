/**
 * Pelanggan Management Script
 * ==========================
 */

// Global Variables
let currentPage = 1;
const itemsPerPage = 10;
let currentMode = 'add';
let currentId = null;
let allData = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.username || 'Admin';
    }

    loadPelanggan();
    document.getElementById('searchInput').addEventListener('input', Utils.debounce(filterData, 300));
});

/**
 * Load Pelanggan Data
 */
async function loadPelanggan() {
    try {
        Utils.showLoading('Memuat data...');
        
        // BUG-B FIX: sertakan search term ke backend (bukan filter client-side)
        const searchTerm = document.getElementById('searchInput').value.trim();
        const params = { page: currentPage, limit: itemsPerPage };
        if (searchTerm) params.search = searchTerm;

        const response = await API.client.get('/pelanggan', { params });

        allData = response.data.data || [];
        // FIX #13: pagination total ada di response.data.pagination.total
        const total = response.data.pagination?.total || allData.length;

        Utils.closeLoading();
        displayPelanggan(allData);
        generatePagination(total);
    } catch (error) {
        Utils.closeLoading();
        console.error('Error loading pelanggan:', error);
        Utils.showAlert('Error', 'Gagal memuat data pelanggan', 'error');
    }
}

/**
 * Display Pelanggan in Table
 */
function displayPelanggan(data) {
    const tbody = document.getElementById('pelangganTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <p>Tidak ada data pelanggan</p>
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
                <td><strong>${item.nama || '-'}</strong></td>
                <td>${item.nomorTelepon || '-'}</td>
                <td>${Utils.truncateText(item.email, 30) || '-'}</td>
                <td>${Utils.truncateText(item.alamat, 30) || '-'}</td>
                <td>
                    <div class="btn-group-sm">
                        <button class="btn btn-sm btn-warning" onclick="editPelanggan(${item.id})" title="Edit">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletePelanggan(${item.id})" title="Hapus">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * Filter Data
 * BUG-B FIX: Delegasi ke backend (server-side search), bukan filter dari allData
 * yang hanya berisi data page saat ini (maks 10 item).
 */
function filterData() {
    currentPage = 1;
    loadPelanggan(); // loadPelanggan() sudah membaca searchInput secara otomatis
}

/**
 * Reset Filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    loadPelanggan();
}

/**
 * Show Add Form
 */
function showAddForm() {
    currentMode = 'add';
    currentId = null;
    document.getElementById('formTitle').textContent = 'Tambah Pelanggan';
    document.getElementById('pelangganForm').reset();
    // Reset field kendaraan (field baru yang tidak otomatis ter-reset jika ada prefill sebelumnya)
    ['nomorMotor', 'jenisMotor', 'tahunMotor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
}

/**
 * Edit Pelanggan
 */
async function editPelanggan(id) {
    try {
        Utils.showLoading('Memuat data...');
        
        const response = await API.client.get(`/pelanggan/${id}`);
        // FIX #7: Backend membungkus data dalam { success: true, data: {...} }
        const data = response.data.data;

        Utils.closeLoading();

        currentMode = 'edit';
        currentId = id;
        document.getElementById('formTitle').textContent = 'Edit Pelanggan';
        
        document.getElementById('nama').value          = data.nama         || '';
        document.getElementById('nomorTelepon').value  = data.nomorTelepon || '';
        document.getElementById('email').value         = data.email        || '';
        document.getElementById('alamat').value        = data.alamat       || '';
        // BUG-06 FIX: Isi juga field kendaraan saat edit
        document.getElementById('nomorMotor').value    = (data.nomorMotor && data.nomorMotor !== '-') ? data.nomorMotor : '';
        document.getElementById('jenisMotor').value    = (data.jenisMotor && data.jenisMotor !== '-') ? data.jenisMotor : '';
        document.getElementById('tahunMotor').value    = data.tahunMotor   || '';

        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        modal.show();
    } catch (error) {
        Utils.closeLoading();
        console.error('Error loading pelanggan:', error);
        Utils.showAlert('Error', 'Gagal memuat data pelanggan', 'error');
    }
}

/**
 * Save Pelanggan
 */
async function savePelanggan() {
    const form = document.getElementById('pelangganForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        nama:         document.getElementById('nama').value.trim(),
        nomorTelepon: document.getElementById('nomorTelepon').value.trim(),
        email:        document.getElementById('email').value.trim(),
        alamat:       document.getElementById('alamat').value.trim(),
        // BUG-12 FIX: Sertakan field kendaraan
        nomorMotor:   document.getElementById('nomorMotor').value.trim() || null,
        jenisMotor:   document.getElementById('jenisMotor').value.trim() || null,
        tahunMotor:   parseInt(document.getElementById('tahunMotor').value) || null
    };

    // Validate phone
    if (!Utils.validatePhone(payload.nomorTelepon)) {
        Utils.showAlert('Validasi', 'Nomor telepon tidak valid', 'warning');
        return;
    }

    // Validate email if provided
    if (payload.email && !Utils.validateEmail(payload.email)) {
        Utils.showAlert('Validasi', 'Email tidak valid', 'warning');
        return;
    }

    try {
        Utils.showLoading('Menyimpan data...');

        if (currentMode === 'add') {
            await API.client.post('/pelanggan', payload);
            Utils.closeLoading();
            Utils.showAlert('Sukses', 'Data pelanggan berhasil ditambahkan', 'success');
        } else {
            await API.client.put(`/pelanggan/${currentId}`, payload);
            Utils.closeLoading();
            Utils.showAlert('Sukses', 'Data pelanggan berhasil diperbarui', 'success');
        }

        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
        currentPage = 1;
        loadPelanggan();
    } catch (error) {
        Utils.closeLoading();
        console.error('Error saving pelanggan:', error);
        const message = error.response?.data?.message || 'Gagal menyimpan data';
        Utils.showAlert('Error', message, 'error');
    }
}

/**
 * Delete Pelanggan
 */
function deletePelanggan(id) {
    Utils.showConfirm(
        'Hapus Data',
        'Apakah Anda yakin ingin menghapus data ini?',
        async () => {
            try {
                Utils.showLoading('Menghapus data...');
                
                await API.client.delete(`/pelanggan/${id}`);
                
                Utils.closeLoading();
                Utils.showAlert('Sukses', 'Data pelanggan berhasil dihapus', 'success');
                
                loadPelanggan();
            } catch (error) {
                Utils.closeLoading();
                console.error('Error deleting pelanggan:', error);
                Utils.showAlert('Error', 'Gagal menghapus data', 'error');
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

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
            <i class="bi bi-chevron-left"></i> Previous
        </a>
    `;
    container.appendChild(prevLi);

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
    loadPelanggan();
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
