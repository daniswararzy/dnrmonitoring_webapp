/**
 * Cek Status Script
 * =================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Event listener for search form (single handler — no inline onsubmit needed)
    document.getElementById('searchForm').addEventListener('submit', searchStatus);
});

/**
 * Search Status
 */
async function searchStatus(event) {
    event.preventDefault();

    const nomorMotor = document.getElementById('nomorMotor').value.trim();

    if (!nomorMotor) {
        Utils.showAlert('Validasi', 'Masukkan nomor motor terlebih dahulu', 'warning');
        return;
    }

    try {
        Utils.showLoading('Mencari data...');

        // FIX #4: Endpoint yang benar adalah /search/byMotor
        const antrianResponse = await API.client.get('/antrian/search/byMotor', {
            params: { nomorMotor: nomorMotor }
        });

        // FIX #4: Endpoint yang benar adalah /search/byMotor
        const orderResponse = await API.client.get('/order/search/byMotor', {
            params: { nomorMotor: nomorMotor }
        });

        Utils.closeLoading();

        // FIX #5: Backend membungkus data dalam { success, data: [...] }
        const antrianList = antrianResponse.data.data || [];
        const orders = orderResponse.data.data || [];

        // Ambil antrian pertama yang ditemukan (bisa multiple)
        const antrian = antrianList.length > 0 ? antrianList[0] : null;

        // Display results
        displayResults(antrian, orders);
    } catch (error) {
        Utils.closeLoading();
        console.error('Error searching status:', error);

        // Show no results
        document.getElementById('resultsContainer').style.display = 'block';
        document.getElementById('antrianResults').style.display = 'none';
        document.getElementById('orderResults').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
    }
}

/**
 * Display Results
 */
function displayResults(antrian, orders) {
    const resultsContainer = document.getElementById('resultsContainer');
    const antrianResults = document.getElementById('antrianResults');
    const orderResults = document.getElementById('orderResults');
    const noResults = document.getElementById('noResults');

    resultsContainer.style.display = 'block';

    // FIX #1: Gunakan field name sesuai backend (namaPemilik, tanggalMasuk, keterangan)
    if (antrian && antrian.id) {
        antrianResults.style.display = 'block';
        document.getElementById('antrianNama').textContent = antrian.namaPemilik || '-';
        document.getElementById('antrianMotor').textContent = antrian.nomorMotor || '-';
        document.getElementById('antrianJenis').textContent = antrian.jenisMotor || '-';
        document.getElementById('antrianTanggal').textContent = Utils.formatDate(antrian.tanggalMasuk) || '-';
        document.getElementById('antrianKeluhan').textContent = antrian.keterangan || '-';
        document.getElementById('antrianStatus').innerHTML = Utils.getStatusBadge(antrian.status);
    } else {
        antrianResults.style.display = 'none';
    }

    // FIX #2: Gunakan field name sesuai backend untuk order (namaPemilik, tanggalOrder, tanggalSelesai)
    if (orders && orders.length > 0) {
        orderResults.style.display = 'block';
        const orderList = document.getElementById('orderList');
        orderList.innerHTML = '';

        orders.forEach(order => {
            const orderItem = `
                <div class="order-item fade-in">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0">Order #${order.id}</h6>
                        ${Utils.getStatusBadge(order.status)}
                    </div>
                    <p class="mb-1">
                        <strong>Nama Pemilik:</strong> ${order.namaPemilik || '-'}
                    </p>
                    <p class="mb-1">
                        <strong>Jenis Servis:</strong> ${order.jenisServis || '-'}
                    </p>
                    <p class="mb-1">
                        <strong>Tanggal Order:</strong> ${Utils.formatDate(order.tanggalOrder)}
                    </p>
                    <p class="mb-1">
                        <strong>Deskripsi:</strong> ${order.deskripsi || '-'}
                    </p>
                    <p class="mb-0 text-muted">
                        <strong>Tanggal Selesai:</strong> ${order.tanggalSelesai ? Utils.formatDate(order.tanggalSelesai) : 'Belum selesai'}
                    </p>
                </div>
            `;
            orderList.innerHTML += orderItem;
        });
    } else {
        orderResults.style.display = 'none';
    }

    // Show no results if both are empty
    if (!antrian && (!orders || orders.length === 0)) {
        noResults.style.display = 'block';
        antrianResults.style.display = 'none';
        orderResults.style.display = 'none';
    } else {
        noResults.style.display = 'none';
    }
}
