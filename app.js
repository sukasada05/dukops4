// ================= KONFIGURASI AMAN =================
const GOOGLE_APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbyiJ0uO36CdtGUiy8m03jzwMAUWWMwIILpdBLt5J41ne6aQWHYIp_Cr_Ke6K8iqn4gZ/exec";
const TARGET_LAPORAN = 9;

// ================= VARIABEL GLOBAL =================
let img = new Image();
let selectedDesa = "";
let kordinatList = [];
let currentKoordinat = "";
let tanggalWaktu = "";
let submittedDates = [];
let desaCounter = {};
let deferredPrompt = null;
let swWaiting = null;
const canvasPlaceholderImage = new Image();
canvasPlaceholderImage.src = 'icons/favicon-96x96.png';

canvasPlaceholderImage.onload = function() {
    const canvas = document.getElementById('canvas');
    if (canvas && (!img || !img.src)) updatePreview();
};

function getInstallButton() {
    return document.getElementById('installButton');
}

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallButtonState() {
    const btn = getInstallButton();
    if (!btn) return;

    if (swWaiting) {
        btn.style.display = 'flex';
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Update';
        return;
    }

    if (!isStandaloneMode() && deferredPrompt) {
        btn.style.display = 'flex';
        btn.innerHTML = '<i class="fas fa-download"></i> Install App';
        return;
    }

    btn.style.display = 'none';
}

function setWaitingServiceWorker(worker) {
    swWaiting = worker;
    updateInstallButtonState();
    showNotification('⚡ Update tersedia! Tekan tombol untuk memperbarui.', 'success');
}

let currentApp = null;

// ================= LAYAR PILIH DESA =================
document.addEventListener('DOMContentLoaded', function () {
    console.log("🚀 DOM Content Loaded");
    const startupSelect = document.getElementById('startupDesa');
    const continueButton = document.getElementById('startupContinue');
    const status = document.getElementById('startupStatus');
    if (!startupSelect || !continueButton) return;

    continueButton.addEventListener('click', async function () {
        const mainSelect = document.getElementById('selectDesa');
        if (!startupSelect.value || !mainSelect) {
            if (status) status.textContent = 'Pilih desa/kelurahan terlebih dahulu.';
            return;
        }

        startupSelect.disabled = true;
        continueButton.disabled = true;
        if (status) status.textContent = 'Memuat koordinat desa...';
        mainSelect.value = startupSelect.value;

        const loaded = await loadSelectedDesa();
        if (!loaded) {
            startupSelect.disabled = false;
            continueButton.disabled = false;
            if (status) status.textContent = 'Koordinat gagal dimuat. Silakan coba lagi.';
            return;
        }

        currentApp = 'dukops';
        showApp();
    });

    (async function prepareStartup() {
        try {
            if (window.location.protocol === 'file:') await loadLocalDataBundle();
            await initializeApp();

            const mainSelect = document.getElementById('selectDesa');
            if (!mainSelect || mainSelect.options.length <= 1 || mainSelect.disabled) {
                throw new Error('Daftar desa/kelurahan gagal dimuat.');
            }

            startupSelect.replaceChildren(...Array.from(mainSelect.options, option => option.cloneNode(true)));
            startupSelect.value = '';
            startupSelect.disabled = false;
            continueButton.disabled = false;
            if (status) status.textContent = 'Silakan pilih desa/kelurahan untuk melanjutkan.';
        } catch (error) {
            console.error('❌ Error preparing village selection screen:', error);
            startupSelect.innerHTML = '<option value="">-- Gagal memuat desa --</option>';
            startupSelect.disabled = true;
            continueButton.disabled = true;
            if (status) status.textContent = error.message;
        }
    })();
});

// ================= LOAD APP =================
function loadLocalDataBundle() {
    return new Promise((resolve, reject) => {
        if (window.DUKOPS_LOCAL_DATA) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'data/local-data.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Gagal memuat data lokal aplikasi.'));
        document.head.appendChild(script);
    });
}

function exitApplication() {
    window.close();

    setTimeout(() => {
        if (window.closed) return;

        const message = document.createElement('main');
        message.style.cssText = [
            'position:fixed',
            'inset:0',
            'z-index:1000000',
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'justify-content:center',
            'gap:16px',
            'padding:24px',
            'background:#081008',
            'color:#e6ffe6',
            'font:16px/1.5 sans-serif',
            'text-align:center'
        ].join(';');

        const heading = document.createElement('h1');
        heading.textContent = 'Aplikasi siap ditutup';
        const instructions = document.createElement('p');
        instructions.textContent = 'Browser tidak mengizinkan aplikasi menutup tab ini. Silakan tutup tab browser atau jendela aplikasi secara manual.';
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = 'Coba tutup lagi';
        closeButton.style.cssText = 'padding:12px 20px;border:0;border-radius:8px;background:#8a3030;color:#fff;font-weight:700;';
        closeButton.addEventListener('click', () => window.close());

        message.append(heading, instructions, closeButton);
        document.body.replaceChildren(message);
    }, 250);
}

function showApp() {
    const splash = document.getElementById('splashScreen');
    const app = document.getElementById('appContainer');
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.8s ease';
    setTimeout(() => {
        splash.style.display = 'none';
        app.style.display = 'block';
        setTimeout(() => {
            app.style.opacity = '1';
            if (currentApp === 'dukops') {
                document.getElementById('btnDukops').classList.add('active');
                document.getElementById('dukopsContent').style.display = 'block';
                document.getElementById('absenContent').style.display = 'none';
                document.getElementById('hanpanganContent').style.display = 'none';
                document.getElementById('hanpanganContent').classList.remove('active');
            } else {
                document.getElementById('btnDukops').classList.remove('active');
                document.getElementById('dukopsContent').style.display = 'none';
                document.getElementById('absenContent').style.display = 'block';
                document.getElementById('hanpanganContent').style.display = 'none';
                document.getElementById('hanpanganContent').classList.remove('active');
            }
        }, 100);
    }, 800);
}

// ================= NAVIGASI TAB =================
window.showDukops = function() {
    document.getElementById('dukopsContent').style.display = 'block';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.getElementById('hanpanganContent').classList.remove('active');
    document.getElementById('btnDukops').classList.add('active');
    document.getElementById('btnAbsen').classList.remove('active');
    document.getElementById('btnHanpangan').classList.remove('active');
    currentApp = 'dukops';
};

window.showAbsenTab = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('absenContent').style.display = 'block';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.getElementById('hanpanganContent').classList.remove('active');
    document.getElementById('btnDukops').classList.remove('active');
    document.getElementById('btnAbsen').classList.add('active');
    document.getElementById('btnHanpangan').classList.remove('active');
    const selectedWilayah = document.getElementById('absenSelectedWilayah');
    if (selectedWilayah) selectedWilayah.textContent = selectedDesa ? `Absensi wilayah: ${selectedDesa}` : 'Desa/kelurahan belum dipilih.';
    if (typeof loadAbsenTahun === 'function') loadAbsenTahun();
};

window.showHanpangan = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'block';
    document.getElementById('hanpanganContent').classList.add('active');
    document.getElementById('btnDukops').classList.remove('active');
    document.getElementById('btnAbsen').classList.remove('active');
    document.getElementById('btnHanpangan').classList.add('active');
};

// ================= BACKEND =================
async function sendToBackend(action, data = {}) {
    try {
        const allowedActions = [
            'listFiles', 'getConfig', 'test', 'uploadDrive',
            'getJadwalData', 'getDesaList', 'getPetugas', 
            'getPetugasByDate', 'getJadwalEpoch', 'cekGiliran',
            'getPersonelList', 'status', 'saveFile', 'getFile'
        ];
        
        if (!allowedActions.includes(action)) {
            console.warn(`⚠️ Action "${action}" tidak tersedia di backend`);
            return { success: false, error: `Action "${action}" tidak tersedia` };
        }
        
        if (action === 'listFiles' || action === 'getConfig' || action === 'test') {
            let url = `${GOOGLE_APPS_SCRIPT_WEBHOOK}?action=${action}`;
            if (action === 'listFiles') {
                if (data.desaFilter) url += `&desaFilter=${encodeURIComponent(data.desaFilter)}`;
                if (data.monthFilter) url += `&monthFilter=${encodeURIComponent(data.monthFilter)}`;
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

async function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}

// ================= PWA INSTALL =================
function setupInstallPrompt() {
    const btn = getInstallButton();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        updateInstallButtonState();
    });

    if (btn) {
        btn.addEventListener('click', async () => {
            if (swWaiting) {
                swWaiting.postMessage({ type: 'SKIP_WAITING' });
                return;
            }
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                showNotification('✅ Aplikasi berhasil diinstall!', 'success');
            }
            updateInstallButtonState();
        });
    }

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        updateInstallButtonState();
    });

    window.addEventListener('load', updateInstallButtonState);
    document.addEventListener('visibilitychange', updateInstallButtonState);
    window.addEventListener('focus', updateInstallButtonState);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            swWaiting = null;
            updateInstallButtonState();
            window.location.reload();
        });
    }
}

// ================= FUNGSI DUKOPS =================
async function initializeApp() {
    console.log("🔄 Initializing DUKOPS app...");
    try {
        console.log('initializeApp: before loadDesaList');
        try {
            const desaListLoaded = await loadDesaList();
            if (desaListLoaded) console.log('initializeApp: loadDesaList OK');
            else console.warn('initializeApp: loadDesaList failed; see the error above');
        } catch (e) {
            console.error('initializeApp: loadDesaList error', e);
        }
        try { loadLastSubmittedDates(); } catch(e){ console.error('initializeApp: loadLastSubmittedDates error', e); }
        try { loadDesaCounter(); } catch(e){ console.error('initializeApp: loadDesaCounter error', e); }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        try {
            const tanggalEl = document.getElementById('tanggalWaktu');
            if (tanggalEl) tanggalEl.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            updateDatePreview();
            console.log('initializeApp: set tanggalWaktu and updated preview');
        } catch (e) {
            console.error('initializeApp: error setting tanggalWaktu/updateDatePreview', e);
        }

        setupInstallPrompt();
        resetCanvas();

        setTimeout(() => {
            showNotification('✅ Sistem DUKOPS BABINSA siap digunakan!', 'success');
        }, 500);

        console.log("✅ DUKOPS App initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing DUKOPS app:", error);
        showNotification('❌ Gagal memuat aplikasi DUKOPS', 'error');
    }
}

async function loadDesaList() {
    const select = document.getElementById('selectDesa');
    const loading = document.getElementById('loadingDesa');
    if (!select) return false;
    if (loading) loading.style.display = 'block';

    try {
        let data;
        if (isFileProtocol) {
            data = window.DUKOPS_LOCAL_DATA;
            if (!data) throw new Error('Data lokal belum tersedia. Muat ulang aplikasi.');
        } else {
            const response = await fetch('data/desa-list.json?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            data = await response.json();
        }
        const desaList = (data.desaList || []).map(name => ({ name, type: 'Desa' }));
        const kelurahanList = (data.kelurahanList || []).map(name => ({ name, type: 'Kelurahan' }));
        const wilayahList = [...desaList, ...kelurahanList];

        select.innerHTML = '<option value="">-- Pilih Desa/Kelurahan --</option>';
        wilayahList.forEach(wilayah => {
            const desaName = wilayah.name;
            const option = document.createElement('option');
            const jsonPath = `data/coordinates/${desaName}.json`;
            option.value = jsonPath;
            option.textContent = `${wilayah.type} ${desaName}`;
            option.setAttribute('data-raw-name', `${wilayah.type} ${desaName}`);
            select.appendChild(option);
        });
        console.log(`✅ Loaded ${wilayahList.length} wilayah (${desaList.length} desa, ${kelurahanList.length} kelurahan)`);
        showNotification('✅ Daftar desa berhasil dimuat', 'success');
        return true;
    } catch (error) {
        console.error("❌ Error loading desa list:", error);
        select.innerHTML = '<option value="">-- Gagal memuat desa --</option>';
        select.disabled = true;
        showNotification(`❌ ${error.message}`, 'error');
        return false;
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function normalizeDesaName(desaName) {
    if (!desaName) return { original: "", normalized: "", forTelegram: "", cleanName: "" };
    let normalized = desaName.replace(/^Desa\s+/i, '').replace(/^Kelurahan\s+/i, '').replace(/Kel\.\s*/gi, '').replace(/Kel\s/gi, '').trim();
    const forTelegram = normalized.replace(/_/g, ' ');
    return {
        original: desaName,
        normalized: normalized,
        forTelegram: forTelegram,
        cleanName: forTelegram.trim()
    };
}

async function loadSelectedDesa() {
    const select = document.getElementById('selectDesa');
    const jsonPath = select.value;
    const loading = document.getElementById('loadingKoordinat');

    if (!jsonPath) { resetForm(); return false; }

    const selectedOption = select.options[select.selectedIndex];
    selectedDesa = selectedOption.getAttribute('data-raw-name') || selectedOption.text;
    const narasiWilayahLabel = document.getElementById('narasiWilayahLabel');
    if (narasiWilayahLabel) narasiWilayahLabel.textContent = selectedDesa;

    updateDesaHeaderImage(selectedDesa);

    const desaInfo = normalizeDesaName(selectedDesa);
    const previewDesaEl = document.getElementById('previewDesa');
    if (previewDesaEl) {
        previewDesaEl.textContent = desaInfo.cleanName;
        previewDesaEl.style.display = 'block';
    }

    const fotoLabel = document.getElementById('labelFotoKegiatan');
    if (fotoLabel) fotoLabel.innerHTML = `<i class="fas fa-camera"></i> Foto Kegiatan: ${selectedDesa}`;

    if (loading) loading.style.display = 'block';
    const previewKordinatEl = document.getElementById('previewKordinat');
    if (previewKordinatEl) previewKordinatEl.textContent = "Memuat koordinat...";

    try {
        console.log(`📂 Fetching coordinates from: ${jsonPath}`);
        let jsonData;
        if (isFileProtocol) {
            jsonData = window.DUKOPS_LOCAL_DATA?.coordinates?.[desaInfo.cleanName];
            if (!jsonData) throw new Error(`Data koordinat ${desaInfo.cleanName} tidak tersedia di data lokal`);
        } else {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            jsonData = await response.json();
        }
        if (!jsonData.coordinates || !Array.isArray(jsonData.coordinates)) {
            throw new Error("Format JSON koordinat tidak valid");
        }
        kordinatList = jsonData.coordinates.map(coord => `${coord.lat},${coord.lon},${coord.elevation}`);
        console.log(`📌 Loaded ${kordinatList.length} coordinates`);
        if (kordinatList.length === 0) throw new Error("File koordinat kosong");
        pickRandomKoordinat();
        showNotification(`Koordinat ${desaInfo.cleanName} dimuat (${kordinatList.length} titik)`, "success");
        return true;
    } catch (error) {
        console.error("❌ Error loading coordinates:", error);
        if (previewKordinatEl) previewKordinatEl.textContent = "Gagal memuat koordinat";
        showNotification("Gagal memuat koordinat: " + error.message, "error");
        return false;
    } finally {
        if (loading) loading.style.display = 'none';
        updatePreview();
        checkInputCompletion();
    }
}

function pickRandomKoordinat() {
    if (kordinatList.length === 0) {
        showNotification("Tidak ada data koordinat tersedia", "warning");
        return;
    }
    if (!selectedDesa) {
        showNotification("Pilih desa terlebih dahulu", "warning");
        return;
    }
    const coordElement = document.getElementById('previewKordinat');
    coordElement.style.transition = "opacity 0.3s";
    coordElement.style.opacity = "0";
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * kordinatList.length);
        currentKoordinat = kordinatList[randomIndex];
        coordElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + currentKoordinat;
        setTimeout(() => { coordElement.style.opacity = "1"; }, 50);
        updatePreview();
        checkInputCompletion();
    }, 300);
}

function previewImage() {
    const gambarInput = document.getElementById("gambar");
    const file = gambarInput.files[0];
    const gambarNama = document.getElementById("gambarNama");

    if (gambarNama) gambarNama.textContent = file ? file.name : "Belum ada foto dipilih";

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                try {
                    if (img.height > img.width) {
                        gambarInput.value = "";
                        if (gambarNama) gambarNama.textContent = "Belum ada foto dipilih";
                        img = new Image();
                        showNotification("Foto portrait tidak diperbolehkan. Gunakan foto landscape.", "warning");
                        checkInputCompletion();
                        return;
                    }
                } catch (e) {}
                if (kordinatList.length > 0) pickRandomKoordinat();
                updatePreview();
            };
            img.onerror = function() {
                showNotification("Gagal memuat gambar", "error");
                gambarInput.value = "";
                if (gambarNama) gambarNama.textContent = "Belum ada foto dipilih";
            };
        };
        reader.onerror = function() { showNotification("Gagal membaca file", "error"); };
        reader.readAsDataURL(file);
    } else {
        img = new Image();
        updatePreview();
    }
    checkInputCompletion();
}

function updateDatePreview() {
    const tglEl = document.getElementById("tanggalWaktu");
    const label = document.getElementById('tanggalWaktuLabelText');
    const tglInput = tglEl ? tglEl.value : '';

    if (tglInput) {
        let date = new Date(tglInput);
        date.setSeconds(Math.floor(Math.random() * 60));
        tanggalWaktu = date.toISOString();
        const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const displayText = date.toLocaleString('id-ID', options).replace(/:/g, '.');
        if (label) label.textContent = displayText;
    } else {
        if (!tglEl) {
            if (tanggalWaktu) {
                try {
                    const date = new Date(tanggalWaktu);
                    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                    const displayText = date.toLocaleString('id-ID', options).replace(/:/g, '.');
                    if (label) label.textContent = displayText;
                } catch (e) {}
            } else {
                if (label) label.textContent = 'Pilih tanggal & waktu';
            }
        } else {
            tanggalWaktu = "";
            if (label) label.textContent = 'Pilih tanggal & waktu';
        }
    }
    updatePreview();
    checkInputCompletion();
}

function updatePreview() {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    if (img && img.src && img.complete) {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (img.height / img.width));
    } else {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (9 / 16));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img && img.src && img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#0a120a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (canvasPlaceholderImage.complete && canvasPlaceholderImage.naturalWidth > 0) {
            const iconSize = Math.min(160, canvas.width * 0.3);
            const iconX = (canvas.width - iconSize) / 2;
            const iconY = (canvas.height - iconSize) / 2;
            ctx.drawImage(canvasPlaceholderImage, iconX, iconY, iconSize, iconSize);
        }
    }

    if (selectedDesa || currentKoordinat || tanggalWaktu) {
        ctx.textAlign = "right";
        ctx.font = "bold 36px Arial";
        const bottomMargin = 20;
        const lineHeight = 44;
        const rightMargin = 10;

        // Fungsi untuk menggambar teks dengan shadow dan outline
        function drawTextWithShadow(text, x, y, color = "#FFFFFF") {
            // Simpan state ctx
            ctx.save();
            
            // Shadow untuk efek bayangan
            ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            
            // Gambar teks dengan shadow
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            
            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Gambar outline hitam di sekeliling teks
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
            ctx.lineWidth = 3;
            ctx.strokeText(text, x, y);
            
            // Gambar ulang teks di atas outline
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            
            // Tambahkan shadow tipis di sisi lain untuk efek 3D
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = -1;
            ctx.shadowOffsetY = -1;
            ctx.fillText(text, x, y);
            
            // Restore state ctx
            ctx.restore();
        }

        // Teks desa
        if (selectedDesa) {
            const desaInfo = normalizeDesaName(selectedDesa);
            const displayDesaName = desaInfo.cleanName;
            const watermarkText = (displayDesaName === "Sukasada" || displayDesaName === "SUKASADA")
                ? "Babinsa Kelurahan Sukasada"
                : "Babinsa " + displayDesaName;
            
            drawTextWithShadow(
                watermarkText, 
                canvas.width - rightMargin, 
                canvas.height - bottomMargin - (lineHeight * 2)
            );
        }

        // Teks koordinat
        if (currentKoordinat) {
            drawTextWithShadow(
                currentKoordinat, 
                canvas.width - rightMargin, 
                canvas.height - bottomMargin - lineHeight
            );
        }

        // Teks tanggal
        if (tanggalWaktu) {
            const date = new Date(tanggalWaktu);
            let dateText = date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
                ", " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            
            drawTextWithShadow(
                dateText, 
                canvas.width - rightMargin, 
                canvas.height - bottomMargin
            );
        }
    }
}

async function processSubmission() {
    if (!validateSubmission()) return;
    if (isSameDateMonthSubmission()) {
        showNotification("⚠ Sudah ada laporan di tanggal dan bulan yang sama!", "warning");
        return;
    }

    const button = document.getElementById("submitBtn");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    showLoading();

    try {
        const canvas = document.getElementById("canvas");
        const imgData = canvas.toDataURL("image/png");
        const narasi = document.getElementById("narasi").value;
        const date = new Date(tanggalWaktu);

        const day = String(date.getDate()).padStart(2, '0');
        const monthNum = String(date.getMonth() + 1);
        const monthName = date.toLocaleDateString('id-ID', { month: 'long' });
        const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const year = date.getFullYear();

        const desaInfo = normalizeDesaName(selectedDesa);

        const fileNameInsideZipImage = `${desaInfo.cleanName} ${day} ${monthName} ${year} Dukops.png`;
        const fileNameInsideZipNarasi = `${desaInfo.cleanName} ${day} ${monthName} ${year} Narasi.txt`;
        const zipFileNameForDownload = `${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`;
        const zipFileNameForBackend = `${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`;

        const formattedDate = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const narasiContent = `${formattedDate}\tBabinsa ${desaInfo.cleanName} ${narasi}`;

        const zip = new JSZip();
        zip.file(fileNameInsideZipNarasi, narasiContent);
        zip.file(fileNameInsideZipImage, imgData.split("base64,")[1], { base64: true });

        const content = await zip.generateAsync({ type: "blob" });

        // Download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = zipFileNameForDownload;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Upload Drive
        const driveUploaded = await uploadToGoogleDrive(content, zipFileNameForBackend, selectedDesa, date);

        // Update counter
        const desaData = updateDesaCounter(selectedDesa, zipFileNameForBackend);

        if (driveUploaded) {
            showNotification(`✔ Laporan berhasil disimpan (${desaData.count}/${TARGET_LAPORAN} laporan)`, "success");
        } else {
            showNotification(`⚠ Laporan hanya didownload, gagal simpan ke Drive`, "warning");
        }

        if (desaData.count === TARGET_LAPORAN) {
            speakTargetReached(selectedDesa, monthYear);
            showThankYouPopup(desaInfo.cleanName, desaData.count);
        }

        saveSubmittedDate(tanggalWaktu);

    } catch (error) {
        console.error("Error:", error);
        showNotification("❌ Gagal mengirim laporan", "error");
    } finally {
        hideLoading();
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function validateSubmission() {
    if (!selectedDesa) { showNotification("Masukkan nama desa terlebih dahulu", "warning"); return false; }
    if (!currentKoordinat) { showNotification("Koordinat tidak valid", "warning"); return false; }
    if (!tanggalWaktu) { showNotification("Isi tanggal dan waktu", "warning"); return false; }
    if (!img.src || !img.complete) { showNotification("Upload foto kegiatan", "warning"); return false; }
    const narasi = document.getElementById("narasi").value.trim();
    if (!narasi) { showNotification("Isi narasi kegiatan", "warning"); return false; }

    const desaInfo = normalizeDesaName(selectedDesa);
    const date = new Date(tanggalWaktu);
    const day = String(date.getDate()).padStart(2, '0');
    const monthName = date.toLocaleDateString('id-ID', { month: 'long' });
    const monthNum = String(date.getMonth() + 1);
    const year = date.getFullYear();

    let confirmMsg = `Anda yakin ingin mengirim laporan untuk ${desaInfo.cleanName}?\n\n`;
    confirmMsg += `File ZIP akan:\n`;
    confirmMsg += `1. Didownload: ${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip\n`;
    confirmMsg += `2. Berisi file:\n   - ${desaInfo.cleanName} ${day} ${monthName} ${year} Dukops.png\n`;
    confirmMsg += `   - ${desaInfo.cleanName} ${day} ${monthName} ${year} Narasi.txt\n`;
    confirmMsg += `3. Dikirim ke Drive: ${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`;

    return confirm(confirmMsg);
}

function isSameDateMonthSubmission() {
    if (!tanggalWaktu) return false;
    const currentDate = new Date(tanggalWaktu);
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    return submittedDates.some(dateStr => {
        const date = new Date(dateStr);
        return date.getDate() === currentDay && date.getMonth() === currentMonth;
    });
}

function resetCanvas() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = Math.round(canvas.width / (16 / 9));
    ctx.fillStyle = "#0a120a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (canvasPlaceholderImage.complete && canvasPlaceholderImage.naturalWidth > 0) {
        const iconSize = Math.min(160, canvas.width * 0.3);
        ctx.drawImage(canvasPlaceholderImage, (canvas.width - iconSize) / 2,
            (canvas.height - iconSize) / 2, iconSize, iconSize);
    }
}

function resetAll() {
    if (confirm("Apakah Anda yakin ingin mereset SEMUA data?\n\n• Log pengiriman\n• Tanggal terakhir\n• Counter per desa\n• Form input\n\nAksi ini tidak dapat dibatalkan!")) {
        submittedDates = [];
        localStorage.removeItem('dukopsSubmittedDates');
        desaCounter = {};
        localStorage.removeItem('dukopsDesaCounter');
        resetForm();
        showNotification("Semua data telah direset", "success");
    }
}

function resetForm() {
    selectedDesa = "";
    kordinatList = [];
    currentKoordinat = "";
    const selectEl = document.getElementById('selectDesa');
    if (selectEl) selectEl.value = "";
    const previewDesaEl = document.getElementById('previewDesa');
    if (previewDesaEl) previewDesaEl.textContent = "";
    const previewKordinatEl = document.getElementById('previewKordinat');
    if (previewKordinatEl) previewKordinatEl.textContent = "";
    const narasiEl = document.getElementById('narasi');
    if (narasiEl) narasiEl.value = "";
    const narasiWilayahLabel = document.getElementById('narasiWilayahLabel');
    if (narasiWilayahLabel) narasiWilayahLabel.textContent = "";
    const gambarEl = document.getElementById('gambar');
    if (gambarEl) gambarEl.value = "";
    const tanggalWaktuEl = document.getElementById('tanggalWaktu');
    if (tanggalWaktuEl) tanggalWaktuEl.value = "";
    const label = document.getElementById('tanggalWaktuLabelText');
    if (label) label.textContent = 'Pilih tanggal & waktu';
    updateDesaHeaderImage("");
    checkInputCompletion();
    updatePreview();
    resetCanvas();
}

function loadDesaCounter() {
    const saved = localStorage.getItem('dukopsDesaCounter');
    desaCounter = saved ? JSON.parse(saved) : {};
}

function updateDesaCounter(desaName, fileName) {
    const date = new Date(tanggalWaktu);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    if (!desaCounter[desaName]) {
        desaCounter[desaName] = { count: 0, files: [], month: monthYear };
    }

    if (desaCounter[desaName].month !== monthYear) {
        desaCounter[desaName] = { count: 1, files: [fileName], month: monthYear };
    } else {
        desaCounter[desaName].count++;
        desaCounter[desaName].files.push(fileName);
        if (desaCounter[desaName].files.length > TARGET_LAPORAN) {
            desaCounter[desaName].files.shift();
        }
    }

    localStorage.setItem('dukopsDesaCounter', JSON.stringify(desaCounter));
    return desaCounter[desaName];
}

function saveSubmittedDate(dateStr) {
    submittedDates.push(dateStr);
    localStorage.setItem('dukopsSubmittedDates', JSON.stringify(submittedDates));
}

function loadLastSubmittedDates() {
    const saved = localStorage.getItem('dukopsSubmittedDates');
    submittedDates = saved ? JSON.parse(saved) : [];
}

function checkInputCompletion() {
    const narasiEl = document.getElementById("narasi");
    const narasiVal = narasiEl ? (narasiEl.value || '').trim() : '';
    const hasImage = img && img.src && img.complete;
    const isComplete = selectedDesa && currentKoordinat && tanggalWaktu && hasImage && narasiVal;

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = !isComplete;
}

function autoResizeNarasi(target) {
    const textarea = target instanceof HTMLTextAreaElement ? target : document.getElementById('narasi');
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.overflowY = 'hidden';
    const desiredHeight = Math.max(textarea.scrollHeight, textarea.offsetHeight);
    textarea.style.height = `${desiredHeight}px`;
    textarea.style.minHeight = '150px';
}

function updateDesaHeaderImage(desaName) {
    const headerImage = document.getElementById('desaProfileImgHeader');
    if (!headerImage) return;
    const defaultUrl = 'icons/favicon-96x96.png';
    headerImage.src = defaultUrl;
}

function speakTargetReached(wilayahName, monthYear) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

    const wilayahInfo = normalizeDesaName(wilayahName);
    const speech = new SpeechSynthesisUtterance(
        `Babinsa ${wilayahInfo.original}, target laporan bulan ${monthYear}, tercapai.`
    );
    speech.lang = 'id-ID';
    speech.rate = 0.9;
    speech.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
}

// ================= POPUP UCAPAN TERIMA KASIH =================
function showThankYouPopup(desaName, count) {
    const date = new Date(tanggalWaktu);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const modal = document.createElement('div');
    modal.className = 'thankyou-popup';
    modal.style.cssText = `
        position: fixed; top:0; left:0; right:0; bottom:0;
        background: rgba(0,0,0,0.85); z-index:999999;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s;
    `;
    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #1a3a1a, #0a1a0a);
            border: 2px solid #4CAF50; border-radius: 20px; padding: 40px;
            max-width: 450px; width: 90%; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);">
            <div style="font-size: 80px; color: #4CAF50; margin-bottom: 20px;">
                <i class="fas fa-trophy"></i>
            </div>
            <h2 style="color: #9fd49f; margin-bottom: 15px; font-size: 28px;">🎉 SELAMAT! 🎉</h2>
            <p style="color: #f5f5f5; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">
                <strong>Babinsa ${desaName}</strong><br>
                Telah menyelesaikan <strong>${count} laporan</strong> untuk <strong>${monthYear}</strong>!
            </p>
            <div style="background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50;
                border-radius: 10px; padding: 15px; margin: 20px 0; font-size: 16px; color: #b2d8b2;">
                <i class="fas fa-check-circle"></i> Target 9 laporan per bulan TERCAPAI!
            </div>
            <button onclick="this.closest('.thankyou-popup').remove()"
                style="background: linear-gradient(135deg, #4CAF50, #2b4d2b); color: white;
                border: none; padding: 12px 25px; border-radius: 8px; font-size: 16px;
                font-weight: bold; cursor: pointer; width: 100%;">
                <i class="fas fa-thumbs-up"></i> TERIMA KASIH
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 10000);
}

function showNotification(message, type) {
    const toast = document.getElementById('win98Toast');
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

// ================= TAB ABSEN (Google Apps Script) =================
(function() {
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcKBFM8Mm0A8e_hWfl48uEUuDhlmxK8okgXF4M-102HLEuROZPN9YZlpmKnkRo8b_SKA/exec';
    var CACHE_KEY_ABSEN = 'absensi_dukops_data';
    var CACHE_EXPIRY = 30 * 60 * 1000;
    var isOnlineAbsen = navigator.onLine;
    var currentDataAbsen = null;
    var tahunSelect = document.getElementById('absenTahunSelect');
    var bulanSelect = document.getElementById('absenBulanSelect');
    var resultContainer = document.getElementById('absenResultContainer');
    var screenshotArea = document.getElementById('absenScreenshotArea');

    if (tahunSelect) tahunSelect.onchange = onTahunChange;

    window.addEventListener('online', function() { isOnlineAbsen = true; loadAbsenTahun(); });
    window.addEventListener('offline', function() { isOnlineAbsen = false; });

    function loadAbsenTahun() {
        if (!tahunSelect) return;
        var cached = getCacheAbsen();
        var hasCachedYears = cached && cached.years && cached.years.length > 0;
        var yearsCacheFresh = hasCachedYears && cached.yearsUpdatedAt &&
            Date.now() - cached.yearsUpdatedAt < CACHE_EXPIRY;

        if (!hasCachedYears) {
            tahunSelect.disabled = true;
            tahunSelect.innerHTML = '<option>⏳ Mohon tunggu....</option>';
        }
        if (cached && cached.years && cached.years.length > 0) {
            populateTahunSelect(cached.years);
            tahunSelect.disabled = false;
        }
        if (yearsCacheFresh) return;
        if (!isOnlineAbsen) {
            if (!cached || !cached.years) tahunSelect.innerHTML = '<option>❌ Offline - no data</option>';
            return;
        }
        fetch(SCRIPT_URL + '?action=getYears').then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function(y) {
            if (y && y.length > 0) {
                populateTahunSelect(y);
                var updatedCache = getCacheAbsen() || {};
                updatedCache.years = y;
                updatedCache.yearsUpdatedAt = Date.now();
                saveToCacheAbsen(updatedCache);
            } else throw new Error('Tidak ada data');
        }).catch(function() {
            if (!cached || !cached.years) tahunSelect.innerHTML = '<option>❌ Gagal memuat</option>';
        }).finally(function() {
            if (tahunSelect) tahunSelect.disabled = false;
        });
    }

    function populateTahunSelect(y) {
        if (!tahunSelect) return;
        var previousYear = tahunSelect.value;
        tahunSelect.innerHTML = '<option value="">-- Pilih Tahun --</option>';
        for (var i = 0; i < y.length; i++) {
            var o = document.createElement('option');
            o.value = y[i];
            o.textContent = y[i];
            tahunSelect.appendChild(o);
        }
        if (y.length > 0) {
            tahunSelect.value = y.indexOf(previousYear) !== -1 ? previousYear : y[0];
            if (tahunSelect.value !== previousYear) onTahunChange();
        }
    }

    function onTahunChange() {
        if (!tahunSelect || !bulanSelect) return;
        var t = tahunSelect.value;
        if (!t) { bulanSelect.innerHTML = '<option>Pilih tahun dulu</option>'; bulanSelect.disabled = true; return; }
        bulanSelect.disabled = true;
        bulanSelect.innerHTML = '<option>⏳ Memuat...</option>';
        var c = getCacheAbsen();
        if (c && c.months && c.months[t]) {
            populateBulanSelect(c.months[t]);
            bulanSelect.disabled = false;
            return;
        }
        if (!isOnlineAbsen) {
            bulanSelect.innerHTML = '<option>❌ Offline</option>';
            bulanSelect.disabled = false;
            return;
        }
        fetch(SCRIPT_URL + '?action=getMonths&tahun=' + encodeURIComponent(t)).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function(m) {
            if (m && m.length > 0) {
                populateBulanSelect(m);
                var uc = getCacheAbsen() || {};
                uc.months = uc.months || {};
                uc.months[t] = m;
                saveToCacheAbsen(uc);
            } else bulanSelect.innerHTML = '<option>Tidak ada data</option>';
            bulanSelect.disabled = false;
        }).catch(function() {
            bulanSelect.innerHTML = '<option>❌ Gagal memuat</option>';
            bulanSelect.disabled = false;
        });
    }

    function populateBulanSelect(m) {
        if (!bulanSelect) return;
        bulanSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>';
        for (var i = 0; i < m.length; i++) {
            var o = document.createElement('option');
            o.value = m[i].num || m[i];
            o.textContent = m[i].name || m[i];
            bulanSelect.appendChild(o);
        }
        bulanSelect.onchange = function() {
            if (this.value) { loadDataAbsen(); } else { if (resultContainer) resultContainer.innerHTML = ''; }
        };
        if (bulanSelect.value) { loadDataAbsen(); }
    }

    function loadDataAbsen() {
        if (!tahunSelect || !bulanSelect) return;
        var t = tahunSelect.value, b = bulanSelect.value;
        if (!t || !b) { if (resultContainer) resultContainer.innerHTML = '<div class="absen-card">Pilih tahun dan bulan</div>'; return; }
        var c = getCacheAbsen(), ck = t + '_' + b;
        var cachedData = null;
        if (c && c.data && c.data[ck]) {
            cachedData = c.data[ck];
            displayDataAbsen(cachedData.data);
            currentDataAbsen = cachedData.data;
            if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) return;
        }
        if (!isOnlineAbsen) {
            if (!cachedData) showErrorAbsen('Tidak ada koneksi');
            return;
        }
        if (!cachedData) showLoadingAbsen();
        fetch(SCRIPT_URL + '?action=getData&tahun=' + encodeURIComponent(t) + '&bulan=' + encodeURIComponent(b))
            .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function(d) {
                currentDataAbsen = d;
                displayDataAbsen(d);
                var uc = getCacheAbsen() || {};
                uc.data = uc.data || {};
                uc.data[ck] = { data: d, timestamp: Date.now() };
                saveToCacheAbsen(uc);
            }).catch(function(e) {
                if (cachedData) {
                    console.error('Gagal memperbarui data absensi; data tersimpan tetap ditampilkan:', e);
                    showNotification('Data absensi tersimpan ditampilkan; pembaruan gagal.', 'warning');
                } else {
                    showErrorAbsen('Gagal: ' + e.message);
                }
            });
    }

    function displayDataAbsen(d) {
        if (!resultContainer) return;
        if (d.error) { showErrorAbsen(d.error); return; }
        var selectedName = normalizeDesaName(selectedDesa).cleanName.replace(/_/g, ' ').trim();
        if (!selectedName) {
            showErrorAbsen('Desa/kelurahan belum dipilih.');
            return;
        }

        var normalizedSelectedName = selectedName.toLocaleLowerCase('id-ID');
        var villageDetails = Array.isArray(d.details) ? d.details.filter(function(detail) {
            var detailName = normalizeDesaName(detail.nama || '').cleanName.replace(/_/g, ' ').trim();
            return detailName.toLocaleLowerCase('id-ID') === normalizedSelectedName;
        }) : [];
        var noAttendanceRecord = villageDetails.length === 0;
        if (noAttendanceRecord) {
            villageDetails = [{
                nama: selectedDesa,
                jumlah_file: 0,
                persentase: 0,
                status: 'BELUM'
            }];
        }

        var dh = '';
        for (var i = 0; i < villageDetails.length; i++) {
            var de = villageDetails[i], cls = '', txt = '', icon = '';
            if (de.status === 'LENGKAP') { cls = 'absen-status-lengkap'; icon = '✅'; txt = 'LENGKAP'; }
            else if (de.status === 'BELUM_LENGKAP') { cls = 'absen-status-belum-lengkap'; icon = '⚠️'; txt = 'BL'; }
            else { cls = 'absen-status-belum'; icon = '❌'; txt = noAttendanceRecord ? 'BELUM KIRIM' : 'BELUM'; }
            var w = (de.status === 'LENGKAP') ? '#4caf50' : ((de.status === 'BELUM_LENGKAP') ? '#ff9800' : '#f44336');
            dh += '<div class="absen-desa-item" onclick="window.showDetailAbsen(\'' + escapeHtml(de.nama) +
                '\',' + de.jumlah_file + ',' + de.persentase + ',\'' + de.status +
                '\')"><div class="absen-desa-name">' + icon + ' ' + escapeHtml(de.nama) +
                '</div><div class="absen-desa-stats">' + de.jumlah_file +
                '/9</div><div class="absen-desa-progress"><div class="absen-desa-progress-bar"><div class="absen-desa-progress-fill" style="width:' +
                de.persentase + '%;background:' + w +
                '"></div></div></div><div class="absen-status-badge ' + cls + '">' + txt + '</div></div>';
        }
        var selectedWilayah = document.getElementById('absenSelectedWilayah');
        if (selectedWilayah) selectedWilayah.textContent = 'Absensi wilayah: ' + selectedDesa;
        resultContainer.innerHTML =
            '<div class="absen-card"><div class="absen-desa-list">' + dh +
            '</div></div>';
    }

    function getCacheAbsen() {
        try { var c = localStorage.getItem(CACHE_KEY_ABSEN); if (c) return JSON.parse(c); } catch (e) {}
        return null;
    }

    function saveToCacheAbsen(d) {
        try { localStorage.setItem(CACHE_KEY_ABSEN, JSON.stringify(d)); } catch (e) {}
    }

    function showLoadingAbsen() {
        if (resultContainer) resultContainer.innerHTML =
            '<div class="absen-loading"><div class="absen-spinner"></div><p>Mohon Tunggu ...</p></div>';
    }

    function showErrorAbsen(m) {
        if (resultContainer) resultContainer.innerHTML =
            '<div class="absen-card" style="color:#f44336;">⚠️ ' + escapeHtml(m) + '</div>';
    }

    function escapeHtml(t) {
        if (!t) return '';
        return t.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    window.showDetailAbsen = function(n, j, p, s) {
        alert((s === 'LENGKAP' ? '✅ ' : (s === 'BELUM_LENGKAP' ? '⚠️ ' : '❌ ')) + n + '\n' + j + '/9 (' + p + '%)');
    };

    window.loadAbsenTahun = loadAbsenTahun;
})();

// ================= SERVICE WORKER =================
const isFileProtocol = window.location.protocol === 'file:';

if ('serviceWorker' in navigator && !isFileProtocol) {
    window.addEventListener('load', function() {
        console.log('🔧 Registering Service Worker...');
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered successfully!');
                console.log('📦 Scope:', registration.scope);
                if (registration.active) console.log('✅ Service Worker is active!');

                if (registration.waiting) {
                    setWaitingServiceWorker(registration.waiting);
                }

                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setWaitingServiceWorker(newWorker);
                            }
                        });
                    }
                });
            })
            .catch(function(error) {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
} else if (isFileProtocol) {
    console.log('⚠️ Service Worker skipped on file:// origin.');
} else {
    console.log('⚠️ Service Worker not supported in this browser.');
}
