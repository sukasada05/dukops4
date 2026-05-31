// ========================================
// DUKOPS.JS - DUKOPS BABINSA Module
// ========================================
// Semua fungsi untuk fitur DUKOPS BABINSA (pelaporan aktivitas)
// Requires: common.js (loaded first)

console.log("📦 DUKOPS Module loading...");

// ================= LOAD DESA LIST =================
/**
 * Load daftar desa dari GitHub
 * Menampilkan 15 desa di dropdown selectDesa
 */
async function loadDesaList() {
    console.log("🔄 Loading desa list...");

    const select = document.getElementById('selectDesa');
    const loading = document.getElementById('loadingDesa');

    if (!select) {
        console.error("❌ Desa select element not found!");
        return;
    }

    loading.style.display = 'block';

    try {
        const fallbackDesas = [
            "Gitgit", "Panji", "Panji Anom", "Sukasada", "Pancasari", "Wanagiri",
            "Ambengan", "Kayu Putih", "Padang Bulia", "Pegadungan",
            "Pegayaman", "Sambangan", "Selat", "Silangjana", "Tegallinggah"
        ];

        select.innerHTML = '<option value="">-- Pilih Desa --</option>';

        for (const desaName of fallbackDesas) {
            const option = document.createElement('option');
            const jsonPath = `data/coordinates/${desaName}.json`;
            option.value = jsonPath;
            option.textContent = normalizeDesaName(desaName).cleanName;
            option.setAttribute('data-raw-name', desaName);
            select.appendChild(option);
        }

        console.log(`✅ Loaded ${fallbackDesas.length} desas from GitHub`);
        showNotification('✅ Daftar desa berhasil dimuat', 'success');

    } catch (error) {
        console.error("❌ Error loading desa list:", error);
        showNotification('⚠️ Gagal memuat daftar desa (mode offline)', 'warning');
    } finally {
        loading.style.display = 'none';
    }
}

// ================= LOAD SELECTED DESA =================
/**
 * Load koordinat untuk desa yang dipilih
 * Fetch dari GitHub CO_[DesaName].json
 */
async function loadSelectedDesa() {
    const select = document.getElementById('selectDesa');
    const jsonPath = select.value;
    const loading = document.getElementById('loadingKoordinat');

    if (!jsonPath) {
        resetForm();
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    selectedDesa = selectedOption.getAttribute('data-raw-name') || selectedOption.text;

    updateDesaHeaderImage(selectedDesa);

    const desaInfo = normalizeDesaName(selectedDesa);
    document.getElementById('previewDesa').textContent = "Desa: " + desaInfo.cleanName;

    loading.style.display = 'block';
    document.getElementById('previewKordinat').textContent = "Memuat koordinat...";

    try {
            console.log(`📂 Loading local coordinates from: ${jsonPath}`);

        if (!response.ok) {
            console.error(`❌ Fetch failed with status ${response.status}: ${response.statusText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log(`✅ JSON parsed successfully, coordinates:`, jsonData);

        if (!jsonData.coordinates || !Array.isArray(jsonData.coordinates)) {
            console.error("❌ Invalid JSON structure:", jsonData);
            throw new Error("Format JSON koordinat tidak valid");
        }

        kordinatList = jsonData.coordinates.map(coord =>
            `${coord.lat},${coord.lon},${coord.elevation}`
        );

        console.log(`📌 Loaded ${kordinatList.length} coordinates`);

        if (kordinatList.length === 0) throw new Error("File koordinat kosong");

        pickRandomKoordinat();
        showNotification(`Koordinat ${desaInfo.cleanName} dimuat (${kordinatList.length} titik)`, "success");

    } catch (error) {
        console.error("❌ Error loading coordinates:", error);
        document.getElementById('previewKordinat').textContent = "Gagal memuat koordinat";
        showNotification("Gagal memuat koordinat: " + error.message, "error");
    } finally {
        loading.style.display = 'none';
        updatePreview();
        checkInputCompletion();
    }
}

// ================= PICK RANDOM KOORDINAT =================
/**
 * Pilih koordinat random dari list
 * Tampilkan dengan animasi fade
 */
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

        setTimeout(() => {
            coordElement.style.opacity = "1";
        }, 50);

        updatePreview();
        checkInputCompletion();

    }, 300);
}

// ================= PREVIEW IMAGE =================
/**
 * Preview gambar yang dipilih
 * Load ke Image object dan update canvas
 */
function previewImage() {
    const file = document.getElementById("gambar").files[0];
    const preview = document.getElementById("previewGambar");

    if (file) {
        preview.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function (e) {
            img = new Image();
            img.src = e.target.result;
            img.onload = function () {
                if (kordinatList.length > 0) {
                    pickRandomKoordinat();
                }
                updatePreview();
            };
            img.onerror = function () {
                showNotification("Gagal memuat gambar", "error");
                document.getElementById("gambar").value = "";
                preview.textContent = "";
            };
        };
        reader.onerror = function () {
            showNotification("Gagal membaca file", "error");
        };
        reader.readAsDataURL(file);
    } else {
        img = new Image();
        updatePreview();
    }
    checkInputCompletion();
}

// ================= UPDATE DATE PREVIEW =================
/**
 * Update preview tanggal & waktu
 * Parse dari datetime-local input
 */
function updateDatePreview() {
    const tglInput = document.getElementById("tanggalWaktu").value;
    const preview = document.getElementById("previewTanggal");
    const previewHeader = document.getElementById("previewTanggalHeader");

    if (tglInput) {
        let date;

        if (tglInput.includes('T')) {
            date = new Date(tglInput);
        } else {
            const [datePart, timePart] = tglInput.split(' ');
            const [year, month, day] = datePart.split('-');
            const [hours, minutes] = timePart.split(':');
            date = new Date(year, month - 1, day, hours, minutes);
        }

        date.setSeconds(Math.floor(Math.random() * 60));
        tanggalWaktu = date.toISOString();

        const options = {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        let formattedDate;
        if (date.toLocaleDateString) {
            formattedDate = date.toLocaleString('id-ID', options);
        } else {
            formattedDate = formatDateForOldBrowsers(date);
        }

        preview.textContent = formattedDate;
        if (previewHeader) previewHeader.textContent = formattedDate;
    } else {
        tanggalWaktu = "";
        preview.textContent = "";
        if (previewHeader) previewHeader.textContent = "";
    }
    updatePreview();
    checkInputCompletion();
}

// ================= UPDATE PREVIEW (CANVAS WATERMARK) =================
/**
 * Update canvas dengan watermark (desa, koordinat, tanggal)
 */
function updatePreview() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    if (img.src && img.complete) {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (img.height / img.width));
    } else {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (9 / 16));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img.src && img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (selectedDesa || currentKoordinat || tanggalWaktu) {
        ctx.textAlign = "right";
        ctx.font = "36px Arial";

        const bottomMargin = 20;
        const lineHeight = 40;
        const rightMargin = 10;

        if (selectedDesa) {
            const desaInfo = normalizeDesaName(selectedDesa);
            const displayDesaName = desaInfo.cleanName;

            const watermarkText = (displayDesaName === "Sukasada" || displayDesaName === "SUKASADA")
                ? "Babinsa Kelurahan Sukasada"
                : "Babinsa " + displayDesaName;

            ctx.strokeStyle = "white";
            ctx.lineWidth = 0;
            ctx.strokeText(watermarkText,
                canvas.width - rightMargin,
                canvas.height - bottomMargin - (lineHeight * 2));

            ctx.fillStyle = "white";
            ctx.fillText(watermarkText,
                canvas.width - rightMargin,
                canvas.height - bottomMargin - (lineHeight * 2));
        }

        if (currentKoordinat) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 0;
            ctx.strokeText(currentKoordinat,
                canvas.width - rightMargin,
                canvas.height - bottomMargin - lineHeight);

            ctx.fillStyle = "white";
            ctx.fillText(currentKoordinat,
                canvas.width - rightMargin,
                canvas.height - bottomMargin - lineHeight);
        }

        if (tanggalWaktu) {
            const date = new Date(tanggalWaktu);
            let dateText;

            if (date.toLocaleDateString) {
                dateText = date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }) + ", " +
                    date.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
            } else {
                dateText = formatDateForOldBrowsers(date);
            }

            ctx.strokeStyle = "white";
            ctx.lineWidth = 0;
            ctx.strokeText(dateText,
                canvas.width - rightMargin,
                canvas.height - bottomMargin);

            ctx.fillStyle = "white";
            ctx.fillText(dateText,
                canvas.width - rightMargin,
                canvas.height - bottomMargin);
        }
    }
}

// ================= PROCESS SUBMISSION =================
/**
 * Process pengiriman laporan DUKOPS
 * 1. Validate input
 * 2. Create ZIP (foto + narasi)
 * 3. Download ZIP
 * 4. Send ke Telegram (via backend)
 * 5. Upload ke Google Drive (via backend)
 * 6. Update counter & logs
 */
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

    try {
        const canvas = document.getElementById("canvas");
        const imgData = canvas.toDataURL("image/png");
        const narasi = document.getElementById("narasi").value;
        const date = new Date(tanggalWaktu);

        const day = String(date.getDate()).padStart(2, '0');
        const monthNum = String(date.getMonth() + 1);
        const monthName = date.toLocaleDateString('id-ID', { month: 'long' });
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

        // 1. Download ke lokal
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = zipFileNameForDownload;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 2. Kirim ke Telegram (via backend)
        const telegramSent = await sendZipToTelegram(content, zipFileNameForBackend, selectedDesa);

        // 3. Upload ke Google Drive (via backend)
        const driveUploaded = await uploadToGoogleDrive(content, zipFileNameForBackend, selectedDesa, date);

        // 4. Update counter per desa
        const desaData = updateDesaCounter(selectedDesa, zipFileNameForBackend);

        // 5. Refresh data absensi jika sudah dibuka
        if (document.getElementById('attendancePanel').style.display === 'block') {
            setTimeout(() => loadAttendanceData(), 2000);
        }

        // 6. Notifikasi hasil
        let notificationMsg = '';
        if (telegramSent && driveUploaded) {
            notificationMsg = `✔ Berhasil: Telegram & Drive (${desaData.count}/9 laporan)`;
            showNotification(notificationMsg, "success");

            if (desaData.count >= 9) {
                showThankYouPopup(desaInfo.cleanName, desaData.count);
                await sendThankYouTelegram(desaInfo.cleanName, desaData.count);
            }
        } else if (telegramSent) {
            notificationMsg = `✔ Telegram OK (Drive gagal) (${desaData.count}/9 laporan)`;
            showNotification(notificationMsg, "warning");
        } else if (driveUploaded) {
            notificationMsg = `✔ Drive OK (Telegram gagal) (${desaData.count}/9 laporan)`;
            showNotification(notificationMsg, "warning");
        } else {
            notificationMsg = "⚠ File didownload, tapi gagal ke Telegram & Drive";
            showNotification(notificationMsg, "error");
        }

        updateCounter();
        addSendLog(zipFileNameForBackend, "success", notificationMsg);
        saveSubmittedDate(tanggalWaktu);

    } catch (error) {
        console.error("Error:", error);
        showNotification("❌ Gagal mengirim laporan", "error");
        const desaInfo = normalizeDesaName(selectedDesa);
        addSendLog(`${desaInfo.cleanName} - Error`, "failed", error.message);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// ================= VALIDATE SUBMISSION =================
/**
 * Validasi sebelum submit
 * Check: desa, koordinat, tanggal, foto, narasi
 * Show confirmation dialog
 */
function validateSubmission() {
    if (!selectedDesa) {
        showNotification("Masukkan nama desa terlebih dahulu", "warning");
        return false;
    }

    if (!currentKoordinat) {
        showNotification("Koordinat tidak valid", "warning");
        return false;
    }

    if (!tanggalWaktu) {
        showNotification("Isi tanggal dan waktu", "warning");
        return false;
    }

    if (!img.src || !img.complete) {
        showNotification("Upload foto kegiatan", "warning");
        return false;
    }

    const narasi = document.getElementById("narasi").value.trim();
    if (!narasi) {
        showNotification("Isi narasi kegiatan", "warning");
        return false;
    }

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
    confirmMsg += `3. Dikirim ke Telegram & Drive: ${desaInfo.cleanName} ${day} ${monthNum} ${year}.zip`;

    return confirm(confirmMsg);
}

// ================= CHECK SAME DATE MONTH SUBMISSION =================
/**
 * Cek apakah sudah ada laporan untuk tanggal/bulan yang sama
 */
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

// ================= RESET FUNCTIONS =================
/**
 * Reset canvas ke black screen default
 */
function resetCanvas() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = Math.round(canvas.width / (16 / 9));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Reset SEMUA data (counter, logs, tanggal, form)
 * Requires confirmation
 */
function resetAll() {
    if (confirm("Apakah Anda yakin ingin mereset SEMUA data?\n\n• Counter laporan terkirim\n• Log pengiriman\n• Tanggal terakhir\n• Counter per desa\n• Form input\n\nAksi ini tidak dapat dibatalkan!")) {
        submissionCount = 0;
        document.getElementById('submissionCounter').textContent = '0';
        localStorage.setItem('dukopsSubmissionCount', '0');

        localStorage.removeItem('dukopsSendLogs');
        document.getElementById('logTerkirim').innerHTML = '';

        submittedDates = [];
        localStorage.removeItem('dukopsSubmittedDates');

        desaCounter = {};
        localStorage.removeItem('dukopsDesaCounter');

        resetForm();

        showNotification("Semua data telah direset", "success");
    }
}

/**
 * Reset form input (tidak reset counter & logs)
 */
function resetForm() {
    selectedDesa = "";
    kordinatList = [];
    currentKoordinat = "";
    document.getElementById('selectDesa').value = "";
    document.getElementById('previewDesa').textContent = "";
    document.getElementById('previewKordinat').textContent = "";
    document.getElementById('narasi').value = "";
    document.getElementById('gambar').value = "";
    document.getElementById('tanggalWaktu').value = "";
    document.getElementById('previewGambar').textContent = "";
    document.getElementById('previewTanggal').textContent = "";
    const previewHeader = document.getElementById("previewTanggalHeader");
    if (previewHeader) previewHeader.textContent = "";
    updateDesaHeaderImage("");
    checkInputCompletion();
    updatePreview();
    resetCanvas();
}

// ================= COUNTER MANAGEMENT =================
/**
 * Update submission counter
 */
function updateCounter() {
    submissionCount++;
    document.getElementById('submissionCounter').textContent = submissionCount;
    localStorage.setItem('dukopsSubmissionCount', submissionCount.toString());
}

/**
 * Update desa counter
 * Track jumlah laporan per desa per bulan
 */
function updateDesaCounter(desaName, fileName) {
    const date = new Date(tanggalWaktu);
    const monthYear = date.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });

    if (!desaCounter[desaName]) {
        desaCounter[desaName] = {
            count: 0,
            files: [],
            month: monthYear
        };
    }

    if (desaCounter[desaName].month !== monthYear) {
        desaCounter[desaName] = {
            count: 1,
            files: [fileName],
            month: monthYear
        };
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

// ================= LOGGING FUNCTIONS =================
/**
 * Add log entry untuk pengiriman
 */
function addSendLog(filename, status, message = "") {
    const logsContainer = document.getElementById("logTerkirim");
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";

    const time = new Date().toLocaleTimeString('id-ID');
    const statusClass = status === "success" ? "success" : "failed";

    logEntry.innerHTML = `
        <div class="log-time">${time}</div>
        <div class="log-filename">${filename}</div>
        <div class="log-status ${statusClass}">Status: ${status.toUpperCase()} ${message}</div>
    `;

    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
    saveSendLog(filename, status, time);
}

/**
 * Save send log ke localStorage
 */
function saveSendLog(filename, status, time) {
    let logs = JSON.parse(localStorage.getItem('dukopsSendLogs') || '[]');
    logs.unshift({ filename, status, time });
    if (logs.length > 50) logs = logs.slice(0, 50);
    localStorage.setItem('dukopsSendLogs', JSON.stringify(logs));
}

/**
 * Load send logs dari localStorage saat init
 */
function loadSendLogs() {
    const logs = JSON.parse(localStorage.getItem('dukopsSendLogs') || '[]');
    const container = document.getElementById("logTerkirim");

    logs.forEach(log => {
        const logEntry = document.createElement("div");
        logEntry.className = "log-entry";
        const statusClass = log.status === "success" ? "success" : "failed";

        logEntry.innerHTML = `
            <div class="log-time">${log.time}</div>
            <div class="log-filename">${log.filename}</div>
            <div class="log-status ${statusClass}">Status: ${log.status.toUpperCase()}</div>
        `;

        container.appendChild(logEntry);
    });
}

/**
 * Save submitted date ke localStorage
 */
function saveSubmittedDate(dateStr) {
    submittedDates.push(dateStr);
    localStorage.setItem('dukopsSubmittedDates', JSON.stringify(submittedDates));
}

// ================= INPUT VALIDATION =================
/**
 * Check apakah semua input sudah lengkap
 * Enable/disable submit button
 */
function checkInputCompletion() {
    const isComplete = selectedDesa &&
        currentKoordinat &&
        tanggalWaktu &&
        img.src &&
        img.complete &&
        document.getElementById("narasi").value.trim();

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.disabled = !isComplete;
    }
}

// ================= ATTENDANCE (ABSENSI) FUNCTIONS =================
/**
 * Tampilkan attendance panel dengan report
 */
function showAttendance() {
    const panel = document.getElementById('attendancePanel');
    const button = document.getElementById('showAttendanceBtn');

    if (panel && button) {
        panel.style.display = 'block';
        button.style.display = 'none';

        populateAttendanceDesaFilter();

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        document.getElementById('attendanceMonthFilter').value = `${year}-${month}`;

        loadAttendanceData();
    }
}

/**
 * Sembunyikan attendance panel
 */
function hideAttendance() {
    const panel = document.getElementById('attendancePanel');
    const button = document.getElementById('showAttendanceBtn');

    if (panel && button) {
        panel.style.display = 'none';
        button.style.display = 'block';
    }
}

/**
 * Populate desa filter dropdown di attendance panel
 */
function populateAttendanceDesaFilter() {
    const filter = document.getElementById('attendanceDesaFilter');
    const selectDesa = document.getElementById('selectDesa');

    if (!filter || !selectDesa) return;

    filter.innerHTML = '<option value="">Semua Desa</option>';

    for (let i = 1; i < selectDesa.options.length; i++) {
        const option = selectDesa.options[i];
        const desaInfo = normalizeDesaName(option.getAttribute('data-raw-name') || option.text);

        const newOption = document.createElement('option');
        newOption.value = desaInfo.cleanName;
        newOption.textContent = desaInfo.cleanName;
        filter.appendChild(newOption);
    }
}

/**
 * Load attendance data dari backend
 * Fallback ke localStorage jika backend gagal
 */
async function loadAttendanceData() {
    const loading = document.getElementById('attendanceLoading');
    const list = document.getElementById('attendanceList');
    const summary = document.getElementById('attendanceSummary');

    if (!loading || !list) return;

    loading.style.display = 'block';
    list.innerHTML = '';
    if (summary) summary.style.display = 'none';

    try {
        const result = await sendToBackend('listFiles', {
            desaFilter: document.getElementById('attendanceDesaFilter').value,
            monthFilter: document.getElementById('attendanceMonthFilter').value,
            readZips: 'true'
        });

        if (result.success) {
            attendanceData = result.files || [];

            const selectedMonth = document.getElementById('attendanceMonthFilter').value;
            if (selectedMonth) {
                const [year, month] = selectedMonth.split('-');
                attendanceData = attendanceData.filter(file => {
                    const fileMonth = file.month || extractMonthYearFromFileName(file.name);
                    return fileMonth === `${year}-${month}`;
                });
            }

            displayAttendanceList(attendanceData);
            displayAttendanceSummary(attendanceData);
            showNotification(`✅ Data absensi dimuat (${attendanceData.length} file)`, "success");
        } else {
            showNotification("❌ Gagal memuat data absensi", "error");
            loadAttendanceFromFallback();
        }

    } catch (error) {
        console.error('Error loading attendance:', error);
        loadAttendanceFromFallback();
    } finally {
        loading.style.display = 'none';
    }
}

/**
 * Extract month-year dari filename
 * Format: Desa 01 2024.zip
 */
function extractMonthYearFromFileName(filename) {
    const match = filename.match(/(\d{1,2})\s+(\d{4})\.zip$/);
    if (match) {
        const month = match[1].padStart(2, '0');
        const year = match[2];
        return `${year}-${month}`;
    }
    return '';
}

/**
 * Load attendance dari localStorage (fallback saat offline)
 */
function loadAttendanceFromFallback() {
    const list = document.getElementById('attendanceList');
    const summary = document.getElementById('attendanceSummary');

    if (!list) return;

    const desaData = [];
    for (const [desaName, data] of Object.entries(desaCounter)) {
        if (data.files && data.files.length > 0) {
            data.files.forEach(fileName => {
                desaData.push({
                    name: fileName,
                    desa: desaName,
                    count: data.count,
                    month: data.month
                });
            });
        }
    }

    if (desaData.length > 0) {
        attendanceData = desaData.map(item => ({
            name: item.name,
            desa: item.desa,
            size: 0,
            createdTime: new Date().toISOString(),
            webViewLink: '#',
            zipContents: `Narasi.txt, Dukops.png`,
            month: extractMonthYearFromFileName(item.name)
        }));

        displayAttendanceList(attendanceData);
        displayAttendanceSummary(attendanceData);
        showNotification("Menggunakan data lokal (offline mode)", "warning");
    } else {
        list.innerHTML = `<div style="text-align: center; color: #a5a5a5; padding: 20px;">
            <i class="fas fa-folder-open"></i><br>
            Tidak ada data laporan<br>
            <small>Silakan kirim laporan terlebih dahulu</small>
        </div>`;
        if (summary) summary.style.display = 'none';
    }
}

/**
 * Display attendance list dengan grouping by month/desa
 */
function displayAttendanceList(files) {
    const list = document.getElementById('attendanceList');
    if (!list) return;

    if (!files || files.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: #a5a5a5; padding: 20px;">
            <i class="fas fa-folder-open"></i><br>
            Tidak ada data laporan<br>
            <small>Silakan kirim laporan terlebih dahulu</small>
        </div>`;
        return;
    }

    const groupedByMonthYear = {};
    files.forEach(file => {
        const monthYear = file.month || extractMonthYearFromFileName(file.name);
        if (!groupedByMonthYear[monthYear]) {
            groupedByMonthYear[monthYear] = {
                month: monthYear,
                files: [],
                desas: new Set()
            };
        }
        groupedByMonthYear[monthYear].files.push(file);

        const desaName = file.desa || extractDesaFromFileName(file.name);
        groupedByMonthYear[monthYear].desas.add(desaName);
    });

    const sortedMonths = Object.keys(groupedByMonthYear)
        .sort((a, b) => new Date(b) - new Date(a));

    let html = '';

    sortedMonths.forEach(monthYear => {
        const group = groupedByMonthYear[monthYear];
        const [year, month] = monthYear.split('-');
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const monthName = monthNames[parseInt(month) - 1];

        html += `
            <div class="desa-card" style="margin-bottom: 20px;">
                <div class="desa-header" style="background: #2b4d2b;">
                    <div class="desa-name">
                        <i class="fas fa-folder"></i> ${monthName} ${year}
                    </div>
                    <div class="desa-count">
                        ${group.files.length} laporan | ${group.desas.size} desa
                    </div>
                </div>
                <div class="desa-files">
        `;

        const filesByDesa = {};
        group.files.forEach(file => {
            const desaName = file.desa || extractDesaFromFileName(file.name);
            if (!filesByDesa[desaName]) {
                filesByDesa[desaName] = [];
            }
            filesByDesa[desaName].push(file);
        });

        Object.entries(filesByDesa).forEach(([desaName, desaFiles]) => {
            const fileCount = desaFiles.length;
            const isComplete = fileCount >= TARGET_LAPORAN;

            html += `
                <div class="desa-card" style="margin: 10px 0; border-left: 4px solid ${isComplete ? '#4CAF50' : '#FF9800'};">
                    <div class="desa-header" style="padding: 8px 12px;">
                        <div class="desa-name" style="font-size: 14px;">${desaName}</div>
                        <div class="desa-count" style="font-size: 12px; color: ${isComplete ? '#4CAF50' : '#FF9800'}">
                            ${fileCount}/9 laporan
                        </div>
                    </div>
                    <div class="desa-files" style="padding: 5px 12px;">
            `;

            desaFiles.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

            desaFiles.forEach((file, index) => {
                const date = new Date(file.createdTime);
                const dateStr = date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const fileSize = file.size ? formatFileSize(file.size) : 'Ukuran tidak tersedia';
                const zipContents = file.zipContents ?
                    `<div class="file-meta" style="color: #4dff4d; margin-top: 3px;">
                        <i class="fas fa-file-archive"></i> Isi ZIP: ${file.zipContents}
                    </div>` : '';

                html += `
                    <div class="file-item" style="padding: 6px 0;">
                        <div class="file-info">
                            <div style="flex: 1;">
                                <div class="file-name" style="font-size: 13px;">${file.name}</div>
                                <div class="file-meta" style="font-size: 11px;">
                                    <i class="far fa-clock"></i> ${dateStr}
                                    <span style="margin-left: 10px;">
                                        <i class="fas fa-hdd"></i> ${fileSize}
                                    </span>
                                </div>
                                ${zipContents}
                            </div>
                            ${file.webViewLink !== '#' ? `
                                <a href="${file.webViewLink}" target="_blank" class="file-link" title="Buka di Drive">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}

/**
 * Display attendance summary (statistik)
 */
function displayAttendanceSummary(files) {
    const summary = document.getElementById('attendanceSummary');
    const totalReports = document.getElementById('totalReports');
    const totalDesa = document.getElementById('totalDesa');
    const targetStatus = document.getElementById('targetStatus');
    const progressBar = document.getElementById('progressBar');

    if (!summary || !files || files.length === 0) {
        if (summary) summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';

    if (totalReports) totalReports.textContent = files.length;

    const uniqueDesas = new Set();
    files.forEach(file => {
        const desaName = file.desa || extractDesaFromFileName(file.name);
        uniqueDesas.add(desaName);
    });

    if (totalDesa) totalDesa.textContent = uniqueDesas.size;

    let totalAchieved = 0;
    let totalPossible = uniqueDesas.size * TARGET_LAPORAN;

    const desaCounts = {};
    files.forEach(file => {
        const desaName = file.desa || extractDesaFromFileName(file.name);
        desaCounts[desaName] = (desaCounts[desaName] || 0) + 1;
    });

    Object.values(desaCounts).forEach(count => {
        totalAchieved += Math.min(count, TARGET_LAPORAN);
    });

    const achievementPercent = totalPossible > 0 ? (totalAchieved / totalPossible * 100) : 0;

    if (targetStatus) {
        targetStatus.textContent = `${achievementPercent.toFixed(1)}%`;
        targetStatus.style.color = achievementPercent >= 100 ? '#4CAF50' :
            achievementPercent >= 70 ? '#FF9800' : '#f44336';
    }

    if (progressBar) {
        progressBar.style.width = `${achievementPercent}%`;
        progressBar.style.background = achievementPercent >= 100 ? '#4CAF50' :
            achievementPercent >= 70 ? '#FF9800' : '#f44336';
    }
}

/**
 * Extract desa name dari filename
 */
function extractDesaFromFileName(filename) {
    const cleanName = filename.replace(/_/g, ' ')
        .replace(/\.zip$/, '')
        .replace(/\s+\d{1,2}\s+\d{4}$/, '')
        .trim();

    const selectDesa = document.getElementById('selectDesa');
    if (!selectDesa) return cleanName;

    for (let i = 1; i < selectDesa.options.length; i++) {
        const option = selectDesa.options[i];
        const desaInfo = normalizeDesaName(option.getAttribute('data-raw-name') || option.text);

        if (cleanName.toLowerCase().includes(desaInfo.cleanName.toLowerCase()) ||
            desaInfo.cleanName.toLowerCase().includes(cleanName.toLowerCase())) {
            return desaInfo.cleanName;
        }
    }

    return cleanName;
}

/**
 * Refresh attendance data
 */
function refreshAttendanceData() {
    loadAttendanceData();
}

/**
 * Download attendance report sebagai TXT file
 */
function downloadAttendanceReport() {
    if (attendanceData.length === 0) {
        showNotification("Tidak ada data untuk didownload", "warning");
        return;
    }

    try {
        let txtContent = "=".repeat(50) + "\n";
        txtContent += "       LAPORAN ABSENSI DUKOPS BABINSA\n";
        txtContent += "       KORAMIL 1609-05/SUKASADA\n";
        txtContent += "=".repeat(50) + "\n\n";

        txtContent += `Tanggal Laporan: ${new Date().toLocaleString('id-ID')}\n`;
        txtContent += `Total Data: ${attendanceData.length} laporan\n\n`;

        txtContent += "-".repeat(50) + "\n";
        txtContent += "RINGKASAN PER DESA:\n";
        txtContent += "-".repeat(50) + "\n";

        const desaGroups = {};
        attendanceData.forEach(file => {
            const desaName = file.desa || extractDesaFromFileName(file.name);
            if (!desaGroups[desaName]) {
                desaGroups[desaName] = {
                    files: [],
                    count: 0,
                    latestDate: new Date(0)
                };
            }
            desaGroups[desaName].files.push(file);
            desaGroups[desaName].count++;

            const fileDate = new Date(file.createdTime);
            if (fileDate > desaGroups[desaName].latestDate) {
                desaGroups[desaName].latestDate = fileDate;
            }
        });

        const sortedDesas = Object.keys(desaGroups).sort((a, b) => {
            return desaGroups[b].count - desaGroups[a].count;
        });

        sortedDesas.forEach((desaName, index) => {
            const group = desaGroups[desaName];
            const status = group.count >= TARGET_LAPORAN ? "✅ TUNTAS" : "⏳ BELUM";
            const lastDate = group.latestDate.toLocaleDateString('id-ID');

            txtContent += `\n${index + 1}. ${desaName}\n`;
            txtContent += `   Jumlah Laporan : ${group.count}/${TARGET_LAPORAN}\n`;
            txtContent += `   Status Target  : ${status}\n`;
            txtContent += `   Terakhir Kirim : ${lastDate}\n`;
        });

        const uniqueDesas = Object.keys(desaGroups).length;
        const totalReports = attendanceData.length;
        const completedDesas = Object.values(desaGroups).filter(g => g.count >= TARGET_LAPORAN).length;
        const completionRate = ((completedDesas / uniqueDesas) * 100).toFixed(1);

        txtContent += "\n" + "=".repeat(50) + "\n";
        txtContent += "STATISTIK:\n";
        txtContent += "=".repeat(50) + "\n";
        txtContent += `Total Desa        : ${uniqueDesas}\n`;
        txtContent += `Total Laporan     : ${totalReports}\n`;
        txtContent += `Desa Tuntas       : ${completedDesas}\n`;
        txtContent += `Desa Belum Tuntas : ${uniqueDesas - completedDesas}\n`;
        txtContent += `Persentase Tuntas : ${completionRate}%\n\n`;

        txtContent += "-".repeat(50) + "\n";
        txtContent += "DETAIL LAPORAN:\n";
        txtContent += "-".repeat(50) + "\n";

        attendanceData.forEach((file, index) => {
            const date = new Date(file.createdTime);
            const dateStr = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            txtContent += `\n${index + 1}. ${file.name}\n`;
            txtContent += `   Desa    : ${file.desa || extractDesaFromFileName(file.name)}\n`;
            txtContent += `   Tanggal : ${dateStr}\n`;
            if (file.zipContents) {
                txtContent += `   Isi ZIP : ${file.zipContents}\n`;
            }
            if (file.webViewLink && file.webViewLink !== '#') {
                txtContent += `   Link    : ${file.webViewLink}\n`;
            }
        });

        txtContent += "\n" + "=".repeat(50) + "\n";
        txtContent += "CATATAN:\n";
        txtContent += "- Target per desa: 9 laporan per bulan\n";
        txtContent += "- Sistem by: Serka I Nyoman Arta\n";
        txtContent += "=".repeat(50);

        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const fileName = `LAPORAN_DUKOPS_${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}.txt`;

        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification(`✅ Laporan TXT berhasil didownload: ${fileName}`, "success");

    } catch (error) {
        console.error('Error downloading report:', error);
        showNotification("❌ Gagal membuat laporan", "error");
    }
}

// ================= DESA HEADER IMAGE =================
/**
 * Update desa header image dari banner folder atau GitHub
 */
function updateDesaHeaderImage(desaName) {
    const headerImage = document.getElementById('desaHeaderImage');
    if (!headerImage) return;

    const localDefaultUrl = 'LOGO KOREM163 Wirasatya.png';

    if (!desaName) {
        headerImage.src = localDefaultUrl;
        headerImage.onerror = () => {
            headerImage.onerror = null;
            headerImage.src = localDefaultUrl;
        };
        return;
    }

    const desaInfo = normalizeDesaName(desaName);
    const imageName = desaInfo.normalized;
    const localUrl = `Profile/${imageName}.png`;

    headerImage.src = localUrl;
    headerImage.onerror = () => {
        headerImage.onerror = null;
        headerImage.src = localDefaultUrl;
    };
}

// ================= THANK YOU POPUP & TELEGRAM =================
/**
 * Show thank you popup ketika mencapai target 9 laporan
 */
function showThankYouPopup(desaName, count) {
    const modal = document.createElement('div');
    modal.className = 'thankyou-popup';

    modal.innerHTML = `
        <div class="thankyou-content">
            <div style="font-size: 80px; color: #4CAF50; margin-bottom: 20px;">
                <i class="fas fa-trophy"></i>
            </div>
            <h2 style="color: #9fd49f; margin-bottom: 15px; font-size: 28px;">
                🎉 SELAMAT! 🎉
            </h2>
            <p style="color: #f5f5f5; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">
                <strong>Babinsa ${desaName}</strong><br>
                Telah menyelesaikan <strong>${count} laporan</strong> untuk bulan ini!
            </p>
            <div style="
                background: rgba(76, 175, 80, 0.2);
                border: 2px solid #4CAF50;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                font-size: 16px;
                color: #b2d8b2;
            ">
                <i class="fas fa-check-circle"></i> Target 9 laporan per bulan TERCAPAI!
            </div>
            <p style="color: #a5a5a5; margin-bottom: 25px; font-size: 14px;">
                Terima kasih atas dedikasi dan kerja keras Anda dalam melaksanakan tugas DUKOPS.
            </p>
            <button onclick="this.closest('.thankyou-popup').remove()" 
                    style="
                        background: linear-gradient(135deg, #4CAF50, #2b4d2b);
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                        transition: transform 0.3s;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.transform='translateY(0)'">
                <i class="fas fa-thumbs-up"></i> TERIMA KASIH
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 10000);
}

/**
 * Send thank you message ke Telegram group
 */
async function sendThankYouTelegram(desaName, count) {
    try {
        const message = `🎉 *SELAMAT!* 🎉

*Babinsa ${desaName}* telah menyelesaikan *${count} laporan DUKOPS* untuk bulan ini!

✅ *Target 9 laporan per bulan TERCAPAI!*

Terima kasih atas dedikasi dan kerja keras dalam melaksanakan tugas DUKOPS.

*KORAMIL 1609-05/SUKASADA*
*Kodim 1609/Buleleng*`;

        const result = await sendToBackend('sendTelegramText', {
            message: message,
            chatId: '-1003020813628'
        });

        if (result.success) {
            console.log('Ucapan terima kasih terkirim ke Telegram');
        }
    } catch (error) {
        console.error('Gagal mengirim ucapan terima kasih ke Telegram:', error);
    }
}

// ================= PWA INSTALL =================
/**
 * Setup install prompt untuk PWA
 */
function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        setTimeout(() => {
            const installButton = document.getElementById('installButton');
            if (installButton) {
                installButton.style.display = 'flex';

                installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            installButton.style.display = 'none';
                            showNotification('✅ Aplikasi berhasil diinstall!', 'success');
                        }
                        deferredPrompt = null;
                    }
                });
            }
        }, 3000);
    });

    window.addEventListener('appinstalled', () => {
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

console.log("✅ DUKOPS Module loaded - All DUKOPS BABINSA functions ready");
