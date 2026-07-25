// ============================================================
// app.js - DUKOPS BABINSA
// VERSI FINAL - DENGAN PERBAIKAN DOWNLOAD PNG
// ============================================================

// ================= KONFIGURASI =================
const GOOGLE_APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbz3sB1d0PRRzlvAJwdr8nl5dQa6qpyfHQCJbYxBMz0Jpj2o-i1_WnwMzJEy3Z4GA9uh/exec";
const TARGET_LAPORAN = 9;

// ================= VARIABEL GLOBAL =================
let img = new Image();
let selectedDesa = "";
let kordinatList = [];
let currentKoordinat = "";
let tanggalWaktu = "";
let submissionCount = 0;
let submittedDates = [];
let desaCounter = {};
let attendanceData = [];
let deferredPrompt = null;
let currentDataAbsen = null;

// ================= FUNGSI NORMALISASI =================
function normalizeDesaName(desaName) {
    if (!desaName) return { original: "", normalized: "", forTelegram: "", cleanName: "" };
    let normalized = desaName;
    normalized = normalized.replace(/^Desa\s+/i, '');
    normalized = normalized.replace(/^Kelurahan\s+/i, '');
    normalized = normalized.replace(/Kel\.\s*/gi, '');
    normalized = normalized.replace(/Kel\s/gi, '');
    normalized = normalized.trim();
    const forTelegram = normalized.replace(/_/g, ' ');
    return {
        original: desaName,
        normalized: normalized,
        forTelegram: forTelegram,
        cleanName: forTelegram.trim()
    };
}

// ================= NOTIFIKASI =================
function showNotification(message, type) {
    const toast = document.getElementById('win98Toast') || document.getElementById('j_toastNotificationBaru');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'win98-toast show';
    if (type === 'success') toast.className += ' success';
    else if (type === 'error') toast.className += ' error';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================= SEND TO BACKEND =================
async function sendToBackend(action, data = {}) {
    try {
        if (action === 'listFiles' || action === 'getConfig' || action === 'test' || action === 'telegramTest' || action === 'getJadwalData') {
            let url = `${GOOGLE_APPS_SCRIPT_WEBHOOK}?action=${action}`;
            if (action === 'listFiles') {
                if (data.desaFilter) url += `&desaFilter=${encodeURIComponent(data.desaFilter)}`;
                if (data.monthFilter) url += `&monthFilter=${encodeURIComponent(data.monthFilter)}`;
                if (data.readZips) url += `&readZips=true`;
            } else if (action === 'getJadwalData') {
                if (data.type) url += `&type=${encodeURIComponent(data.type)}`;
            }
            const response = await fetch(url);
            return await response.json();
        } else {
            const formData = new FormData();
            formData.append('action', action);
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    if (key === 'fileData' && typeof data[key] === 'string') {
                        formData.append(key, data[key]);
                    } else {
                        formData.append(key, String(data[key]));
                    }
                }
            });
            const response = await fetch(GOOGLE_APPS_SCRIPT_WEBHOOK, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        }
    } catch (error) {
        console.error(`Error in ${action}:`, error);
        return { success: false, error: error.message };
    }
}

// ================= UPLOAD FUNCTIONS =================
async function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}

async function uploadToGoogleDrive(zipBlob, zipFileName, desaName, date) {
    try {
        const base64Data = await blobToBase64(zipBlob);
        const desaInfo = normalizeDesaName(desaName);
        const result = await sendToBackend('uploadDrive', {
            fileName: zipFileName,
            desaName: desaInfo.cleanName,
            fileData: base64Data,
            year: date.getFullYear().toString(),
            month: date.toLocaleDateString('id-ID', { month: 'long' }),
            desa: desaInfo.cleanName,
            mimeType: 'application/zip'
        });
        return result.success === true;
    } catch (error) {
        console.error('Error upload ke Drive:', error);
        return false;
    }
}

// ================= FUNGSI DUKOPS =================
function previewImage() {
    const file = document.getElementById("gambar").files[0];
    const preview = document.getElementById("previewGambar");
    if (!file) {
        if (preview) preview.textContent = "";
        resetCanvas();
        checkInputCompletion();
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = 800;
            canvas.height = Math.round(canvas.width / (16 / 9));
            const headerImg = new Image();
            headerImg.crossOrigin = 'anonymous';
            headerImg.src = 'header/header-background.png?t=' + Date.now();
            headerImg.onload = function() {
                ctx.drawImage(headerImg, 0, 0, canvas.width, canvas.height);
                const maxWidth = canvas.width - 40;
                const maxHeight = canvas.height - 80;
                let width = img.width, height = img.height;
                if (width > maxWidth) { height = height * (maxWidth / width); width = maxWidth; }
                if (height > maxHeight) { width = width * (maxHeight / height); height = maxHeight; }
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2 - 10;
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
                ctx.strokeStyle = '#808080';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
                ctx.drawImage(img, x, y, width, height);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('📸 DUKOPS BABINSA', canvas.width / 2, canvas.height - 12);
                if (preview) {
                    preview.innerHTML = '';
                    const thumb = document.createElement('img');
                    thumb.src = e.target.result;
                    thumb.style.maxWidth = '100%';
                    thumb.style.maxHeight = '200px';
                    thumb.style.border = '1px solid #808080';
                    preview.appendChild(thumb);
                }
                checkInputCompletion();
            };
            headerImg.onerror = function() {
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const maxWidth = canvas.width - 40;
                const maxHeight = canvas.height - 80;
                let width = img.width, height = img.height;
                if (width > maxWidth) { height = height * (maxWidth / width); width = maxWidth; }
                if (height > maxHeight) { width = width * (maxHeight / height); height = maxHeight; }
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2 - 10;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
                ctx.strokeStyle = '#808080';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
                ctx.drawImage(img, x, y, width, height);
                if (preview) {
                    preview.innerHTML = '';
                    const thumb = document.createElement('img');
                    thumb.src = e.target.result;
                    thumb.style.maxWidth = '100%';
                    thumb.style.maxHeight = '200px';
                    thumb.style.border = '1px solid #808080';
                    preview.appendChild(thumb);
                }
                checkInputCompletion();
            };
        };
    };
    reader.readAsDataURL(file);
}

function updateDatePreview() {
    const input = document.getElementById('tanggalWaktu');
    const label = document.getElementById('tanggalWaktuLabelText');
    if (!label) return;
    if (input && input.value) {
        const d = new Date(input.value);
        label.textContent = d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
        label.textContent = 'Pilih tanggal & waktu';
    }
    checkInputCompletion();
}

function autoResizeNarasi() {
    const el = document.getElementById('narasi');
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function checkInputCompletion() {
    const desa = document.getElementById('selectDesa');
    const tanggal = document.getElementById('tanggalWaktu');
    const narasi = document.getElementById('narasi');
    const gambar = document.getElementById('gambar');
    const submitBtn = document.getElementById('submitBtn');
    const attendanceBtn = document.getElementById('showAttendanceBtn');

    if (!submitBtn) return;
    const isComplete = desa && desa.value && desa.value !== "" &&
        tanggal && tanggal.value &&
        narasi && narasi.value && narasi.value.trim() !== "" &&
        gambar && gambar.files && gambar.files.length > 0;
    submitBtn.disabled = !isComplete;
    if (attendanceBtn) {
        attendanceBtn.disabled = !desa || !desa.value || desa.value === "";
    }
}

function resetCanvas() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = Math.round(canvas.width / (16 / 9));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'header/header-background.png';
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📸 DUKOPS BABINSA', canvas.width / 2, canvas.height - 30);
    };
    img.onerror = function() {
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4CAF50';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📸 Preview gambar akan muncul di sini', canvas.width / 2, canvas.height / 2);
    };
}

function resetAll() {
    if (!confirm("Apakah Anda yakin ingin mereset form?")) return;
    document.getElementById('gambar').value = '';
    document.getElementById('tanggalWaktu').value = '';
    document.getElementById('narasi').value = '';
    const preview = document.getElementById('previewGambar');
    if (preview) preview.innerHTML = '';
    resetCanvas();
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;
    const dateLabel = document.getElementById('tanggalWaktuLabelText');
    if (dateLabel) dateLabel.textContent = 'Pilih tanggal & waktu';
    showNotification('🔄 Form telah direset', 'info');
}

async function processSubmission() {
    const desa = document.getElementById('selectDesa');
    const tanggal = document.getElementById('tanggalWaktu');
    const narasi = document.getElementById('narasi');
    const gambar = document.getElementById('gambar');
    if (!desa || !desa.value || !tanggal || !tanggal.value || !narasi || !narasi.value.trim() || !gambar || !gambar.files || !gambar.files.length) {
        showNotification('⚠️ Lengkapi semua data!', 'error');
        return;
    }
    const button = document.getElementById('submitBtn');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    try {
        const canvas = document.getElementById('canvas');
        const imgData = canvas.toDataURL('image/png');
        const date = new Date(tanggalWaktu);
        const day = String(date.getDate()).padStart(2, '0');
        const monthNum = String(date.getMonth() + 1);
        const monthName = date.toLocaleDateString('id-ID', { month: 'long' });
        const year = date.getFullYear();
        const desaInfo = normalizeDesaName(selectedDesa);
        const zip = new JSZip();
        zip.file(`${desaInfo.cleanName} ${day} ${monthName} ${year} Narasi.txt`, narasi.value);
        zip.file(`${desaInfo.cleanName} ${day} ${monthName} ${year} Dukops.png`, imgData.split('base64,')[1], { base64: true });
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await uploadToGoogleDrive(content, `${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`, selectedDesa, date);
        showNotification('✅ Laporan berhasil dikirim!', 'success');
        const counter = document.getElementById('submissionCounter');
        if (counter) {
            const count = parseInt(counter.getAttribute('data-count') || '0') + 1;
            counter.setAttribute('data-count', count);
            counter.textContent = count;
            counter.style.display = 'inline-block';
        }
        resetAll();
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Gagal mengirim laporan', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// ================= ATTENDANCE =================
function showAttendance() {
    const panel = document.getElementById('attendancePanel');
    const desa = document.getElementById('selectDesa');
    const name = document.getElementById('attendanceSelectedDesaName');
    if (!panel) return;
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
    if (desa && desa.value && desa.value !== "") {
        const opt = desa.options[desa.selectedIndex];
        if (name) name.textContent = opt ? opt.text : '';
    } else {
        if (name) name.textContent = 'Silahkan Pilih Desa';
        showNotification('⚠️ Pilih desa terlebih dahulu!', 'error');
        return;
    }
    panel.style.display = 'block';
    loadAttendanceData();
}

function hideAttendance() {
    const panel = document.getElementById('attendancePanel');
    if (panel) panel.style.display = 'none';
}

async function loadAttendanceData() {
    const loading = document.getElementById('attendanceLoading');
    const summary = document.getElementById('attendanceSummary');
    const list = document.getElementById('attendanceList');
    if (!loading || !summary || !list) return;
    loading.style.display = 'block';
    summary.style.display = 'none';
    list.innerHTML = '';
    try {
        const result = await sendToBackend('listFiles', {
            desaFilter: selectedDesa ? normalizeDesaName(selectedDesa).cleanName : '',
            monthFilter: document.getElementById('attendanceMonthFilter')?.value || '',
            readZips: true
        });
        if (result.success && result.files) {
            attendanceData = result.files;
            displayAttendanceList(attendanceData);
            displayAttendanceSummary(attendanceData);
        } else {
            list.innerHTML = '<div style="text-align:center;padding:20px;color:#889988;">Tidak ada data laporan</div>';
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#889988;">Gagal memuat data</div>';
    } finally {
        loading.style.display = 'none';
        summary.style.display = 'flex';
    }
}

function displayAttendanceList(files) {
    const list = document.getElementById('attendanceList');
    if (!list) return;
    if (!files || files.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#889988;">Tidak ada data laporan</div>';
        return;
    }
    let html = '';
    files.forEach((file, index) => {
        const date = new Date(file.createdTime);
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        html += `
            <div class="attendance-item">
                <span>${index + 1}. ${file.name}</span>
                <span>${dateStr}</span>
            </div>
        `;
    });
    list.innerHTML = html;
}

function displayAttendanceSummary(files) {
    const summary = document.getElementById('attendanceSummary');
    const totalReports = document.getElementById('totalReports');
    const totalDesa = document.getElementById('totalDesa');
    const targetStatus = document.getElementById('targetStatus');
    if (!summary || !files) return;
    summary.style.display = 'flex';
    if (totalReports) totalReports.textContent = files.length;
    const uniqueDesas = new Set();
    files.forEach(file => {
        const desaName = file.desa || 'Desa';
        uniqueDesas.add(desaName);
    });
    if (totalDesa) totalDesa.textContent = uniqueDesas.size;
    if (targetStatus) {
        const p = uniqueDesas.size > 0 ? Math.round((files.length / (uniqueDesas.size * 9)) * 100) : 0;
        targetStatus.textContent = p + '%';
    }
}

// ================= NAVIGASI =================
window.showDukops = function() {
    document.getElementById('dukopsContent').style.display = 'block';
    document.getElementById('jadwalPiketContainerBaru').style.display = 'none';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btnDukops').classList.add('active');
    if (typeof window.triggerPlayMusic === 'function') window.triggerPlayMusic();
};

window.showAbsenTab = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('jadwalPiketContainerBaru').style.display = 'none';
    document.getElementById('absenContent').style.display = 'block';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btnAbsen').classList.add('active');
    if (typeof loadAbsenTahun === 'function') loadAbsenTahun();
    if (typeof window.triggerPlayMusic === 'function') window.triggerPlayMusic();
};

window.showHanpangan = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('jadwalPiketContainerBaru').style.display = 'none';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btnHanpangan').classList.add('active');
    if (typeof window.triggerPlayMusic === 'function') window.triggerPlayMusic();
};

// ================= DOM READY =================
document.addEventListener('DOMContentLoaded', function() {
    resetCanvas();
    const counter = document.getElementById('submissionCounter');
    if (counter) {
        const saved = localStorage.getItem('dukopsSubmissionCount');
        const count = saved ? parseInt(saved) : 0;
        counter.setAttribute('data-count', count);
        counter.textContent = count;
        if (count > 0) counter.style.display = 'inline-block';
    }
    // Set default date
    const now = new Date();
    const tglInput = document.getElementById('tanggalWaktu');
    if (tglInput) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        tglInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        updateDatePreview();
    }
});

console.log('✅ DUKOPS app.js loaded');
