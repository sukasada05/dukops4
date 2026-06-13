// ============================================
// SUPABASE INTEGRATION UNTUK DUKOPS
// TANPA MERUBAH HTML YANG SUDAH ADA
// ============================================

const SUPABASE_URL = 'https://qthoexsadattfnnzcawh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aG9leHNhZGF0dGZubnpjYXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTMzNTAsImV4cCI6MjA5NjEyOTM1MH0.qZBFjrN8F8vwxoaPKIPLDQIOWbt58BNlPWLOn4J_5_4';

const supabaseDukops = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ FUNGSI MENDAPATKAN NILAI DARI FORM ============
function getNilaiForm() {
    const selectDesa = document.getElementById('selectDesa');
    const previewKoordinat = document.getElementById('previewKordinat');
    const tanggalWaktu = document.getElementById('tanggalWaktu');
    const narasi = document.getElementById('narasi');
    
    let koordinat = '';
    if (previewKoordinat) {
        koordinat = previewKoordinat.textContent || '';
        koordinat = koordinat.replace('📌 ', '').trim();
    }
    
    let tanggalKegiatan = '';
    let waktuKegiatan = '';
    if (tanggalWaktu && tanggalWaktu.value) {
        const tanggal = new Date(tanggalWaktu.value);
        tanggalKegiatan = tanggal.toISOString().split('T')[0];
        waktuKegiatan = tanggal.toTimeString().split(' ')[0];
    }
    
    return {
        namaDesa: selectDesa ? selectDesa.options[selectDesa.selectedIndex]?.text || '' : '',
        koordinat: koordinat,
        narasiKegiatan: narasi ? narasi.value : '',
        tanggalKegiatan: tanggalKegiatan,
        waktuKegiatan: waktuKegiatan,
        namaBabinsa: '',  // bisa diisi manual nanti
        pangkat: '',
        nrp: ''
    };
}

// ============ SIMPAN LAPORAN KE SUPABASE ============
async function simpanLaporanKeSupabase(dataLaporan) {
    try {
        console.log('📡 Menyimpan laporan ke Supabase...');
        
        const { data, error } = await supabaseDukops
            .from('laporan_dukops')
            .insert({
                nama_desa: dataLaporan.namaDesa,
                koordinat: dataLaporan.koordinat,
                tanggal_kegiatan: dataLaporan.tanggalKegiatan,
                waktu_kegiatan: dataLaporan.waktuKegiatan,
                narasi_kegiatan: dataLaporan.narasiKegiatan,
                nama_babinsa: dataLaporan.namaBabinsa || dataLaporan.namaDesa,
                pangkat: dataLaporan.pangkat || 'Babinsa',
                nrp: dataLaporan.nrp || '-',
                status_kirim: 'terkirim',
                nama_file_zip: dataLaporan.namaFileZip || '',
                ukuran_file: dataLaporan.ukuranFile || '',
                tanggal_kirim: new Date().toISOString()
            });
        
        if (error) throw error;
        
        console.log('✅ Laporan berhasil disimpan ke Supabase!');
        return { success: true, data: data };
        
    } catch (error) {
        console.error('❌ Gagal menyimpan ke Supabase:', error);
        return { success: false, error: error.message };
    }
}

// ============ HITUNG LAPORAN PER DESA PER BULAN ============
async function hitungLaporanPerBulan(namaDesa, tahun, bulan) {
    try {
        const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
        const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-31`;
        
        const { count, error } = await supabaseDukops
            .from('laporan_dukops')
            .select('id', { count: 'exact', head: true })
            .eq('nama_desa', namaDesa)
            .gte('tanggal_kegiatan', startDate)
            .lte('tanggal_kegiatan', endDate);
        
        if (error) throw error;
        return { success: true, jumlah: count };
    } catch (error) {
        console.error('Gagal hitung laporan:', error);
        return { success: false, jumlah: 0 };
    }
}

// ============ AMBIL SEMUA LAPORAN ============
async function ambilSemuaLaporan() {
    try {
        const { data, error } = await supabaseDukops
            .from('laporan_dukops')
            .select('*')
            .order('tanggal_kirim', { ascending: false });
        
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('Gagal ambil laporan:', error);
        return { success: false, error: error.message };
    }
}

// ============ AMBIL LAPORAN PER DESA ============
async function ambilLaporanPerDesa(namaDesa) {
    try {
        const { data, error } = await supabaseDukops
            .from('laporan_dukops')
            .select('*')
            .eq('nama_desa', namaDesa)
            .order('tanggal_kirim', { ascending: false });
        
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('Gagal ambil laporan per desa:', error);
        return { success: false, error: error.message };
    }
}

// ============ HOOK KE FUNGSI PROCESS SUBMISSION YANG SUDAH ADA ============
// Menangkap event submit dari tombol submitBtn
function hookSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        console.log('Tombol submit belum ada, coba lagi nanti...');
        setTimeout(hookSubmitButton, 1000);
        return;
    }
    
    console.log('🔗 Menghubungkan ke tombol submit yang sudah ada...');
    
    // Simpan fungsi asli
    const originalOnclick = submitBtn.onclick;
    
    // Bungkus dengan fungsi baru
    submitBtn.onclick = async function(e) {
        console.log('📝 Tombol submit diklik - menyimpan ke Supabase...');
        
        // Ambil data dari form
        const dataForm = getNilaiForm();
        
        // Dapatkan nama file ZIP dari proses yang akan berjalan
        const selectDesa = document.getElementById('selectDesa');
        const desaName = selectDesa ? selectDesa.options[selectDesa.selectedIndex]?.text || '' : '';
        const tanggalInput = document.getElementById('tanggalWaktu');
        let zipFileName = '';
        if (tanggalInput && tanggalInput.value) {
            const date = new Date(tanggalInput.value);
            const day = String(date.getDate()).padStart(2, '0');
            const monthNum = String(date.getMonth() + 1);
            const year = date.getFullYear();
            zipFileName = `${desaName} ${day} ${monthNum} ${year}.zip`;
        }
        
        dataForm.namaFileZip = zipFileName;
        
        // Simpan ke Supabase (tanpa menunggu proses asli)
        const result = await simpanLaporanKeSupabase(dataForm);
        
        if (result.success) {
            console.log('✅ Data laporan tersimpan di Supabase!');
            // Tambahkan badge atau indikator (opsional)
            showSaveIndicator();
        }
        
        // Jalankan fungsi asli (download ZIP, dll)
        if (typeof originalOnclick === 'function') {
            originalOnclick.call(submitBtn, e);
        }
    };
    
    console.log('✅ Supabase terhubung ke tombol submit!');
}

// ============ INDIKATOR SAVING ============
function showSaveIndicator() {
    let indicator = document.getElementById('supabaseSaveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'supabaseSaveIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2ecc71;
            color: #0a1a0a;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        indicator.innerHTML = '✅ Tersimpan di Supabase';
        document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 3000);
}

// ============ TAMBAHKAN TOMBOL LIHAT LAPORAN ============
function tambahTombolLihatLaporan() {
    // Cari container tombol aksi
    const actionButtons = document.querySelector('.action-buttons');
    if (!actionButtons) {
        setTimeout(tambahTombolLihatLaporan, 1000);
        return;
    }
    
    // Cek apakah tombol sudah ada
    if (document.getElementById('btnLihatLaporan')) return;
    
    const btnLihat = document.createElement('button');
    btnLihat.id = 'btnLihatLaporan';
    btnLihat.innerHTML = '<i class="fas fa-database"></i> LIHAT LAPORAN TERSIMPAN';
    btnLihat.style.background = '#3498db';
    btnLihat.style.marginTop = '10px';
    btnLihat.onclick = async () => {
        const result = await ambilSemuaLaporan();
        if (result.success && result.data.length > 0) {
            tampilkanModalLaporan(result.data);
        } else {
            alert('Belum ada laporan yang tersimpan di Supabase');
        }
    };
    
    actionButtons.appendChild(btnLihat);
    console.log('✅ Tombol Lihat Laporan ditambahkan');
}

// ============ MODAL LIHAT LAPORAN ============
function tampilkanModalLaporan(data) {
    // Hapus modal lama jika ada
    const modalLama = document.getElementById('modalLaporanSupabase');
    if (modalLama) modalLama.remove();
    
    let html = `
        <div id="modalLaporanSupabase" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: #1a2a1f;
                border-radius: 16px;
                width: 95%;
                max-width: 800px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                border: 1px solid #2ecc71;
            ">
                <div style="
                    padding: 15px 20px;
                    background: #0d2a1d;
                    border-bottom: 1px solid #2ecc71;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="color: #2ecc71; margin:0;">
                        <i class="fas fa-database"></i> LAPORAN TERSIMPAN DI SUPABASE
                    </h3>
                    <button onclick="this.closest('#modalLaporanSupabase').remove()" style="
                        background: none;
                        border: none;
                        color: #ff6666;
                        font-size: 24px;
                        cursor: pointer;
                        width: auto;
                        margin:0;
                    ">✕</button>
                </div>
                <div style="padding: 15px; overflow-y: auto; flex:1;">
                    <table style="width:100%; border-collapse: collapse; font-size:12px;">
                        <thead>
                            <tr>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #2ecc71;">Desa</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #2ecc71;">Tanggal</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #2ecc71;">Narasi</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #2ecc71;">Waktu Kirim</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    data.forEach(laporan => {
        const tanggal = laporan.tanggal_kegiatan || '-';
        const waktuKirim = laporan.tanggal_kirim ? new Date(laporan.tanggal_kirim).toLocaleString('id-ID') : '-';
        const narasiSingkat = laporan.narasi_kegiatan ? laporan.narasi_kegiatan.substring(0, 50) + (laporan.narasi_kegiatan.length > 50 ? '...' : '') : '-';
        
        html += `
            <tr style="border-bottom:1px solid #2a4a2a;">
                <td style="padding:8px;">${laporan.nama_desa || '-'}</td>
                <td style="padding:8px;">${tanggal}</td>
                <td style="padding:8px;">${narasiSingkat}</td>
                <td style="padding:8px;">${waktuKirim}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                    <div style="margin-top:15px; text-align:center; color:#888; font-size:11px;">
                        Total: ${data.length} laporan tersimpan
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// ============ INISIALISASI ============
function init() {
    console.log('🚀 Supabase DUKOPS integration starting...');
    
    // Tunggu DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(hookSubmitButton, 500);
            setTimeout(tambahTombolLihatLaporan, 1000);
        });
    } else {
        setTimeout(hookSubmitButton, 500);
        setTimeout(tambahTombolLihatLaporan, 1000);
    }
}

// Mulai
init();
