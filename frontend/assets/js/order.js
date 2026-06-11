/**
 * Order Management Script — Form-Based + Smart Pelanggan Search (Opsi C)
 * =========================================================================
 *
 * Fitur utama:
 *  - openPelangganModal()     : buka modal cari pelanggan terdaftar
 *  - searchPelangganModal()   : live search di dalam modal (debounce 300ms)
 *  - renderPelangganModal()   : render tabel hasil pencarian
 *  - selectPelanggan()        : pilih pelanggan → auto-fill form
 *  - clearSelectedPelanggan() : hapus pilihan, kosongkan field pelanggan
 *  - submitOrderForm()        : submit order ke backend
 *  - resetOrderForm()         : reset seluruh form
 *  - loadRecentOrders()       : muat sidebar order terbaru
 */

// ─── State ───────────────────────────────────────────────────────────────────
let _selectedPelangganId = null;   // ID pelanggan yang dipilih (null = manual)
let _allPelangganData    = [];     // cache data dari API saat modal dibuka
let _searchDebounceTimer = null;   // timer untuk debounce search

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.username || 'Admin';
    }

    // Default tanggal masuk = hari ini
    const tanggalEl = document.getElementById('tanggal');
    if (tanggalEl) tanggalEl.valueAsDate = new Date();

    // Default status = pending
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.value = 'pending';

    // Muat order terbaru di sidebar
    loadRecentOrders();

    // Reset search modal setiap kali modal ditutup
    const modalEl = document.getElementById('pelangganSearchModal');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            document.getElementById('pelangganSearchInput').value = '';
        });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — MODAL CARI PELANGGAN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Buka modal & muat semua pelanggan (pertama kali)
 */
async function openPelangganModal() {
    const modal = new bootstrap.Modal(document.getElementById('pelangganSearchModal'));
    modal.show();

    // Reset search input
    document.getElementById('pelangganSearchInput').value = '';

    // Muat data pelanggan
    await fetchPelangganForModal('');
}

/**
 * Fetch pelanggan dari API berdasarkan query search
 */
async function fetchPelangganForModal(query) {
    renderPelangganModal(null); // tampilkan loading

    try {
        const params = { limit: 50 };
        if (query && query.trim()) params.search = query.trim();

        const response = await API.client.get('/pelanggan', { params });
        const data = response.data.data || [];

        _allPelangganData = data;
        renderPelangganModal(data);

        // Update label count
        const label = document.getElementById('pelangganCountLabel');
        if (label) {
            label.textContent = `${data.length} pelanggan ditemukan`;
        }
    } catch (error) {
        console.error('Error fetching pelanggan:', error);
        renderPelangganModal([]);
    }
}

/**
 * Live search dengan debounce 300ms
 */
function searchPelangganModal(query) {
    clearTimeout(_searchDebounceTimer);

    // Jika query dikosongkan via tombol X
    if (!query) {
        document.getElementById('pelangganSearchInput').value = '';
    }

    _searchDebounceTimer = setTimeout(() => {
        fetchPelangganForModal(query);
    }, 300);
}

/**
 * Render tabel pelanggan di dalam modal
 * @param {Array|null} data - null = loading state
 */
function renderPelangganModal(data) {
    const tbody = document.getElementById('pelangganModalBody');

    // Loading state
    if (data === null) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span class="ms-2 text-muted">Memuat data...</span>
                </td>
            </tr>
        `;
        return;
    }

    // Empty state
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="modal-empty-state">
                        <i class="bi bi-person-x-fill d-block mb-2"></i>
                        <p class="mb-1 fw-semibold">Pelanggan tidak ditemukan</p>
                        <p class="small">Coba kata kunci lain, atau tutup modal dan isi form secara manual.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(p => {
        const nomorMotor = p.nomorMotor && p.nomorMotor !== '-' ? p.nomorMotor : '<span class="text-muted">—</span>';
        const jenisMotor = p.jenisMotor && p.jenisMotor !== '-' ? p.jenisMotor : '<span class="text-muted">—</span>';
        // Encode data pelanggan ke atribut data-* agar bisa diambil saat klik
        const dataStr = encodeURIComponent(JSON.stringify(p));
        return `
            <tr class="pelanggan-row" onclick="selectPelangganFromRow('${dataStr}')">
                <td>
                    <strong>${p.nama || '-'}</strong>
                    ${p.email ? `<br><small class="text-muted">${p.email}</small>` : ''}
                </td>
                <td>${p.nomorTelepon || '—'}</td>
                <td>${nomorMotor}</td>
                <td>${jenisMotor}</td>
                <td class="text-center">
                    <button 
                        class="btn btn-sm btn-primary px-3"
                        onclick="selectPelangganFromRow('${dataStr}'); event.stopPropagation();"
                    >
                        <i class="bi bi-check-lg me-1"></i>Pilih
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Dipanggil saat baris / tombol "Pilih" diklik
 * Decode data, lalu jalankan selectPelanggan()
 */
function selectPelangganFromRow(encodedData) {
    try {
        const pelanggan = JSON.parse(decodeURIComponent(encodedData));
        selectPelanggan(pelanggan);
    } catch (e) {
        console.error('Gagal decode data pelanggan:', e);
    }
}

/**
 * Auto-fill form dengan data pelanggan yang dipilih
 */
function selectPelanggan(p) {
    // Isi field Data Pelanggan
    document.getElementById('namaPelanggan').value  = p.nama         || '';
    document.getElementById('nomorTelepon').value   = p.nomorTelepon || '';

    // Isi field Data Kendaraan (dari data pelanggan yang tersimpan)
    document.getElementById('nomorMotor').value = (p.nomorMotor && p.nomorMotor !== '-') ? p.nomorMotor : '';
    document.getElementById('jenisMotor').value = (p.jenisMotor && p.jenisMotor !== '-') ? p.jenisMotor : '';

    // Simpan ID pelanggan terpilih
    _selectedPelangganId = p.id;

    // Tampilkan badge "pelanggan terpilih" di header form
    const badge = document.getElementById('selectedPelangganBadge');
    const badgeName = document.getElementById('selectedPelangganName');
    badge.classList.remove('d-none');
    badgeName.textContent = p.nama;

    // Tutup modal
    const modalEl = document.getElementById('pelangganSearchModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Fokus ke field deskripsi (field berikutnya yang perlu diisi)
    setTimeout(() => document.getElementById('deskripsi').focus(), 300);

    // Notifikasi kecil
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Data <strong>${p.nama}</strong> berhasil dimuat`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });
}

/**
 * Hapus pilihan pelanggan terdaftar → kembali ke mode manual
 */
function clearSelectedPelanggan() {
    _selectedPelangganId = null;

    // Kosongkan field yang di-auto-fill
    ['namaPelanggan', 'nomorTelepon', 'nomorMotor', 'jenisMotor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Sembunyikan badge
    document.getElementById('selectedPelangganBadge').classList.add('d-none');

    // Fokus ke nama
    document.getElementById('namaPelanggan').focus();
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — SUBMIT & RESET FORM ORDER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Submit Order Form → POST /api/order
 */
async function submitOrderForm() {
    const form = document.getElementById('orderForm');
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        namaPemilik:   document.getElementById('namaPelanggan').value.trim(),
        nomorMotor:    document.getElementById('nomorMotor').value.trim(),
        jenisServis:   document.getElementById('deskripsi').value.trim().substring(0, 50) || 'Servis Umum',
        deskripsi:     document.getElementById('deskripsi').value.trim(),
        tanggalOrder:  document.getElementById('tanggal').value || null,   // BUG-13 FIX
        tanggalSelesai: document.getElementById('estimasiSelesai').value || null,
        biaya:         parseInt(document.getElementById('biaya').value) || 0,
        status:        document.getElementById('status').value,             // BUG-02 FIX
        nomorTelepon:  document.getElementById('nomorTelepon').value.trim(),
        jenisMotor:    document.getElementById('jenisMotor').value.trim()
    };

    try {
        Utils.showLoading('Membuat order servis...');
        await API.client.post('/order', payload);
        Utils.closeLoading();

        Utils.showAlert('Sukses', 'Order servis berhasil dibuat dan telah masuk ke antrian!', 'success');

        resetOrderForm();
        loadRecentOrders();

    } catch (error) {
        Utils.closeLoading();
        console.error('Error creating order:', error);
        const message = error.response?.data?.message || 'Gagal membuat order servis';
        Utils.showAlert('Error', message, 'error');
    }
}

/**
 * Reset seluruh form + hapus pilihan pelanggan
 */
function resetOrderForm() {
    const form = document.getElementById('orderForm');
    form.reset();
    form.classList.remove('was-validated');

    // Reset state pelanggan terpilih
    _selectedPelangganId = null;
    document.getElementById('selectedPelangganBadge').classList.add('d-none');

    // Re-set nilai default
    const tanggalEl = document.getElementById('tanggal');
    if (tanggalEl) tanggalEl.valueAsDate = new Date();

    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.value = 'pending';
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — SIDEBAR ORDER TERBARU
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Load daftar order terbaru untuk sidebar
 */
async function loadRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p class="mb-0 small">Memuat order terbaru...</p>
        </div>
    `;

    try {
        const response = await API.client.get('/order', { params: { page: 1, limit: 10 } });
        const orders = response.data.data || [];

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-4"></i>
                    <p class="mb-0 small mt-2">Belum ada order</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(item => `
            <div class="border-bottom px-3 py-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <p class="mb-0 fw-semibold small">${item.namaPemilik || '-'}</p>
                        <p class="mb-0 text-muted" style="font-size:0.78rem;">${item.nomorMotor || '-'}</p>
                    </div>
                    <div>${Utils.getStatusBadge(item.status)}</div>
                </div>
                <p class="mb-0 text-muted mt-1" style="font-size:0.75rem;">
                    <i class="bi bi-calendar3"></i> ${Utils.formatDate(item.tanggalOrder)}
                </p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-exclamation-circle text-danger fs-4"></i>
                <p class="mb-0 small mt-2">Gagal memuat data</p>
            </div>
        `;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 4 — AUTH
// ═════════════════════════════════════════════════════════════════════════════

function logout() {
    Utils.showConfirm('Logout', 'Apakah Anda yakin ingin logout?', () => {
        Auth.logout();
    });
}
