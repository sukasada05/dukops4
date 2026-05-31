// ========================================
// PIKET.JS - JADWAL PIKET Module
// ========================================
// Semua fungsi untuk fitur JADWAL PIKET (penjadwalan dinas)
// Requires: common.js (loaded first)

console.log("📦 PIKET Module loading...");

// ================= INITIALIZE JADWAL PIKET =================
/**
 * Initialize Jadwal Piket module
 * Load data dari backend atau GitHub
 * Setup dropdowns dan event listeners
 */
async function initJadwalPiket() {
    showJadwalToast("Memuat data jadwal piket...");

    try {
        // Coba ambil data dari backend Google Apps Script dulu
        const backendResult = await sendToBackend('getJadwalData', { type: 'piket' });

        if (backendResult.success && backendResult.data) {
            // Gunakan data dari backend
            JadwalData.daftarNama = backendResult.data.split('\n')
                .filter(line => line.trim() !== "")
                .map(nama => nama.trim());

            console.log("Data piket dimuat dari backend:", JadwalData.daftarNama.length, "nama");
        } else {
            // Fallback ke GitHub
            await loadJadwalPiketFromGitHub();
        }

        // Load hanpangan dari GitHub
        await loadJadwalHanpanganFromGitHub();

        // Setup dropdown
        setupJadwalDropdowns();
        loadJadwalSelections();

        // Tambahkan event listener
        const jadwalDropdownIds = [
            'j_nama1a', 'j_nama1b', 'j_nama2a', 'j_nama2b',
            'j_nama3a', 'j_nama3b', 'j_nama3c', 'j_nama3d',
            'j_nama4a', 'j_nama4b', 'j_nama4c', 'j_nama4d'
        ];

        jadwalDropdownIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', updateJadwalPreview);
            }
        });

        updateJadwalPreview();
        showJadwalToast("Jadwal piket siap digunakan");

    } catch (error) {
        console.error("Error in jadwal piket initialization:", error);
        showJadwalToast("Gagal memuat data jadwal piket");
    }
}

// ================= LOAD JADWAL DATA =================
/**
 * Load roster piket dari lokal
 * Source: data/piket.txt
 */
async function loadJadwalPiketFromGitHub() {
    try {
        const response = await fetch(GITHUB_URLS.PIKET + '?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Gagal mengambil data dari GitHub');

        const data = await response.text();
        JadwalData.daftarNama = data.trim().split('\n')
            .filter(line => line.trim() !== "")
            .map(nama => nama.trim());

        console.log("Data piket dimuat dari GitHub:", JadwalData.daftarNama.length, "nama");
        return true;
    } catch (error) {
        console.error("Error loading piket data from GitHub:", error);
        return false;
    }
}

/**
 * Load hanpangan (jaga kediaman) roster dari lokal
 * Source: data/hanpangan.txt
 * Rotate based on day of month
 */
async function loadJadwalHanpanganFromGitHub() {
    try {
        const response = await fetch(GITHUB_URLS.HANPANGAN + '?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Gagal mengambil data');

        const data = await response.text();
        const lines = data.trim().split('\n').filter(line => line.trim() !== "");

        if (lines.length > 0) {
            JadwalData.daftarHanpangan = lines;
            const today = new Date();
            const dayOfMonth = today.getDate();
            JadwalData.currentHanpangan = lines[(dayOfMonth - 1) % lines.length];
            console.log("Data hanpangan dimuat:", JadwalData.daftarHanpangan.length, "item");
        }

        return true;
    } catch (error) {
        console.error("Error loading hanpangan data:", error);
        return false;
    }
}

// ================= SETUP DROPDOWNS =================
/**
 * Setup semua jadwal dropdown dengan data nama
 * Populate 12 dropdowns: j_nama1a, j_nama1b, j_nama2a, j_nama2b, etc
 */
function setupJadwalDropdowns() {
    const jadwalDropdownIds = [
        'j_nama1a', 'j_nama1b', 'j_nama2a', 'j_nama2b',
        'j_nama3a', 'j_nama3b', 'j_nama3c', 'j_nama3d',
        'j_nama4a', 'j_nama4b', 'j_nama4c', 'j_nama4d'
    ];

    jadwalDropdownIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        // Hapus semua opsi kecuali placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Tambahkan semua nama
        JadwalData.daftarNama.forEach(nama => {
            const option = document.createElement('option');
            option.value = nama;
            option.textContent = nama;
            select.appendChild(option);
        });

        select.selectedIndex = 0;
    });
}

// ================= LOAD/SAVE SELECTIONS =================
/**
 * Load jadwal selections dari localStorage
 * Restore previous selections saat user buka jadwal piket lagi
 */
function loadJadwalSelections() {
    try {
        const savedSelections = localStorage.getItem('jadwalSelections');
        if (savedSelections) {
            const selections = JSON.parse(savedSelections);

            const jadwalDropdownIds = [
                'j_nama1a', 'j_nama1b', 'j_nama2a', 'j_nama2b',
                'j_nama3a', 'j_nama3b', 'j_nama3c', 'j_nama3d',
                'j_nama4a', 'j_nama4b', 'j_nama4c', 'j_nama4d'
            ];

            jadwalDropdownIds.forEach(id => {
                const select = document.getElementById(id);
                if (select && selections[id]) {
                    select.value = selections[id];
                }
            });
        }
    } catch (e) {
        console.warn("Tidak dapat memuat pilihan jadwal dari localStorage:", e);
    }
}

/**
 * Save jadwal selections ke localStorage
 */
function saveJadwalSelections() {
    const selections = {};

    const jadwalDropdownIds = [
        'j_nama1a', 'j_nama1b', 'j_nama2a', 'j_nama2b',
        'j_nama3a', 'j_nama3b', 'j_nama3c', 'j_nama3d',
        'j_nama4a', 'j_nama4b', 'j_nama4c', 'j_nama4d'
    ];

    jadwalDropdownIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            selections[id] = select.value;
        }
    });

    try {
        localStorage.setItem('jadwalSelections', JSON.stringify(selections));
    } catch (e) {
        console.warn("Tidak dapat menyimpan pilihan jadwal ke localStorage:", e);
    }
}

// ================= UPDATE JADWAL PREVIEW =================
/**
 * Update preview message untuk jadwal piket
 * Format: daftar dinas dalam, jaga kediaman, makodim
 * Generate formatted message untuk Telegram/WhatsApp
 */
function updateJadwalPreview() {
    saveJadwalSelections();

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const formatTanggal = function (date) {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        return days[date.getDay()] + ", " + date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
    };

    let result = "=======================\n" +
        "KORAMIL 1609-05/SUKASADA\n" +
        "    JADWAL DINAS DALAM\n" +
        "=======================\n\n";

    const sections = [
        {
            title: formatTanggal(now) + "",
            names: [
                document.getElementById('j_nama1a').value,
                document.getElementById('j_nama1b').value
            ]
        },
        {
            title: formatTanggal(tomorrow) + "",
            names: [
                document.getElementById('j_nama2a').value,
                document.getElementById('j_nama2b').value
            ]
        },
        {
            title: formatTanggal(now) + " (Kediaman)",
            names: [
                document.getElementById('j_nama3a').value,
                document.getElementById('j_nama3b').value
            ]
        },
        {
            title: formatTanggal(tomorrow) + " (Kediaman)",
            names: [
                document.getElementById('j_nama3c').value,
                document.getElementById('j_nama3d').value
            ]
        },
        {
            title: formatTanggal(now) + " (Makodim)",
            names: [
                document.getElementById('j_nama4a').value,
                document.getElementById('j_nama4b').value
            ]
        },
        {
            title: formatTanggal(tomorrow) + " (Makodim)",
            names: [
                document.getElementById('j_nama4c').value,
                document.getElementById('j_nama4d').value
            ]
        }
    ];

    let sectionCount = 0;
    sections.forEach(function (section) {
        const validNames = section.names.filter(function (name) {
            return name &&
                name.trim() !== '' &&
                name !== '<Pilih Nama>' &&
                name.toLowerCase() !== 'nihil';
        });

        if (validNames.length > 0) {
            const sectionLetter = String.fromCharCode(65 + sectionCount);
            result += sectionLetter + ". " + section.title + "\n";

            validNames.forEach(function (name, i) {
                result += "   " + (i + 1) + ". " + name + "\n";
            });

            result += "\n";
            sectionCount++;
        }
    });

    if (JadwalData.currentHanpangan) {
        result += "- Jadwal Hanpangan hari ini : " + JadwalData.currentHanpangan + "\n\n";
    }

    result += "Demikian MMP.";

    document.getElementById('j_hasilPesan').value = result;
}

// ================= RESET JADWAL =================
/**
 * Reset jadwal data
 * Clear dropdowns dan localStorage
 */
function resetJadwalData() {
    showJadwalToast("Meriset data dan memuat ulang...");

    const jadwalDropdownIds = [
        'j_nama1a', 'j_nama1b', 'j_nama2a', 'j_nama2b',
        'j_nama3a', 'j_nama3b', 'j_nama3c', 'j_nama3d',
        'j_nama4a', 'j_nama4b', 'j_nama4c', 'j_nama4d'
    ];

    jadwalDropdownIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.selectedIndex = 0;
        }
    });

    try {
        localStorage.removeItem('jadwalSelections');
    } catch (e) {
        console.warn("Tidak dapat menghapus dari localStorage:", e);
    }

    initJadwalPiket();
}

// ================= SHARE TO PLATFORMS =================
/**
 * Share jadwal ke Telegram & WhatsApp
 * Send formatted message ke selected Telegram group
 * Open WhatsApp dengan pesan yang sama
 */
async function shareJadwalToBothPlatforms() {
    const pesan = document.getElementById('j_hasilPesan').value.trim();

    if (!pesan) {
        showJadwalToast("Tidak ada pesan untuk dikirim");
        return;
    }

    const selectedGroupId = document.getElementById('j_telegramGroupSelect').value;

    if (!selectedGroupId) {
        showJadwalToast("Pilih group Telegram terlebih dahulu");
        return;
    }

    // Kirim ke Telegram via backend Google Apps Script
    try {
        const result = await sendToBackend('sendTelegramText', {
            message: pesan,
            chatId: selectedGroupId
        });

        if (result.success) {
            showJadwalToast("✅ Pesan terkirim ke Telegram Group via Backend");
        } else {
            console.error("Error sending to Telegram via backend:", result);
            showJadwalToast(`❌ Gagal mengirim ke Telegram: ${result.error || 'Unknown error'}`);

            // Fallback: Kirim langsung ke WhatsApp saja
            setTimeout(() => {
                const encodedPesan = encodeURIComponent(pesan);
                const whatsappUrl = `https://wa.me/?text=${encodedPesan}`;
                window.open(whatsappUrl, '_blank');
                showJadwalToast("📱 Membuka WhatsApp...");
            }, 1000);
            return;
        }

        // Kirim ke WhatsApp
        setTimeout(() => {
            const encodedPesan = encodeURIComponent(pesan);
            const whatsappUrl = `https://wa.me/?text=${encodedPesan}`;
            window.open(whatsappUrl, '_blank');
            showJadwalToast("📱 Membuka WhatsApp...");
        }, 1000);

    } catch (error) {
        console.error("Error:", error);
        showJadwalToast("❌ Gagal mengirim ke Telegram");

        // Fallback: Kirim ke WhatsApp saja
        setTimeout(() => {
            const encodedPesan = encodeURIComponent(pesan);
            const whatsappUrl = `https://wa.me/?text=${encodedPesan}`;
            window.open(whatsappUrl, '_blank');
            showJadwalToast("📱 Membuka WhatsApp (fallback)...");
        }, 1000);
    }
}

// ================= TOAST NOTIFICATION =================
/**
 * Show toast notification
 * Auto-hide setelah duration
 */
function showJadwalToast(message, duration = 3000) {
    // Suppressed per user preference: no toast popups for Jadwal Piket.
    return;
}

console.log("✅ PIKET Module loaded - All JADWAL PIKET functions ready");
