/**
 * AdminDashboard.js
 * Admin panel for monitoring and managing submissions
 * Features: PIN login, real-time analytics, queue management, error logs, CSV export
 * 
 * @module AdminDashboard
 */

export class AdminDashboard {
    static CONFIG = {
        PIN: '1234', // Change in production
        SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes
    };

    static state = {
        isAuthenticated: false,
        sessionStartTime: null,
        updateInterval: null
    };

    /**
     * Initialize Admin Dashboard
     */
    static init() {
        this.checkSession();
        if (!this.state.isAuthenticated) {
            this.showLoginModal();
        } else {
            this.showDashboard();
        }
    }

    /**
     * Show login modal
     */
    static showLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'adminLoginModal';
        modal.className = 'admin-login-modal';
        modal.innerHTML = `
            <div class="admin-login-container">
                <div class="admin-login-header">
                    <i class="fas fa-lock"></i>
                    <h2>ADMIN PANEL</h2>
                </div>

                <div class="admin-login-form">
                    <label>PIN Akses:</label>
                    <input type="password" id="adminPIN" placeholder="Masukkan PIN" maxlength="6" 
                           onkeypress="AdminDashboard.handlePINKeypress(event)">
                    <div id="adminPINError" class="admin-error" style="display: none;"></div>

                    <button onclick="AdminDashboard.verifyPIN()" class="admin-login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>

                    <div class="admin-login-footer">
                        <small>⚠ Akses terbatas untuk administrator</small>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus PIN input
        setTimeout(() => {
            document.getElementById('adminPIN').focus();
        }, 100);
    }

    /**
     * Handle PIN keypress (Enter to submit)
     */
    static handlePINKeypress(event) {
        if (event.key === 'Enter') {
            this.verifyPIN();
        }
    }

    /**
     * Verify PIN
     */
    static verifyPIN() {
        const pin = document.getElementById('adminPIN').value;
        const errorDiv = document.getElementById('adminPINError');

        if (pin === this.CONFIG.PIN) {
            // Remove modal
            const modal = document.getElementById('adminLoginModal');
            modal.remove();

            // Authenticate
            this.state.isAuthenticated = true;
            this.state.sessionStartTime = Date.now();
            localStorage.setItem('adminSessionStartTime', this.state.sessionStartTime);

            // Show dashboard
            this.showDashboard();
        } else {
            errorDiv.textContent = '❌ PIN salah. Coba lagi.';
            errorDiv.style.display = 'block';
            document.getElementById('adminPIN').value = '';
            document.getElementById('adminPIN').focus();
        }
    }

    /**
     * Check session validity
     */
    static checkSession() {
        const sessionStart = localStorage.getItem('adminSessionStartTime');
        if (sessionStart && Date.now() - parseInt(sessionStart) < this.CONFIG.SESSION_TIMEOUT) {
            this.state.isAuthenticated = true;
            this.state.sessionStartTime = parseInt(sessionStart);
        } else {
            this.state.isAuthenticated = false;
            localStorage.removeItem('adminSessionStartTime');
        }
    }

    /**
     * Show admin dashboard
     */
    static showDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'adminDashboard';
        dashboard.className = 'admin-dashboard';
        dashboard.innerHTML = `
            <div class="admin-dashboard-wrapper">
                <!-- Header -->
                <div class="admin-header">
                    <div class="admin-header-left">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>ADMIN DASHBOARD</span>
                    </div>
                    <div class="admin-header-right">
                        <span class="admin-session-info" id="sessionInfo">Session: Valid</span>
                        <button onclick="AdminDashboard.logout()" class="admin-logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="admin-tabs">
                    <button class="admin-tab-btn active" onclick="AdminDashboard.switchTab('dashboard')">
                        <i class="fas fa-chart-line"></i> Dashboard
                    </button>
                    <button class="admin-tab-btn" onclick="AdminDashboard.switchTab('settings')">
                        <i class="fas fa-cog"></i> Pengaturan
                    </button>
                </div>

                <!-- Content -->
                <div class="admin-content">
                    <!-- Dashboard Tab -->
                    <div id="dashboard-tab" class="admin-tab-content active">
                        <!-- Analytics Section -->
                        <section class="admin-section">
                            <h3 class="admin-section-title">📊 Analitik</h3>
                            <div class="analytics-grid">
                                
                                <div class="analytics-card success">
                                    <span class="analytics-label">Berhasil</span>
                                    <span class="analytics-value" id="successSubmissions">0</span>
                                </div>
                                <div class="analytics-card error">
                                    <span class="analytics-label">Gagal</span>
                                    <span class="analytics-value" id="failedSubmissions">0</span>
                                </div>
                                <div class="analytics-card warning">
                                    <span class="analytics-label">Tertunda</span>
                                    <span class="analytics-value" id="pendingSubmissions">0</span>
                                </div>
                            </div>
                        </section>

                        <!-- Desa Coverage -->
                        <section class="admin-section">
                            <h3 class="admin-section-title">🗺️ Cakupan Desa (24 Jam Terakhir)</h3>
                            <div class="desa-coverage" id="desaCoverageList">
                                <p class="loading">Memuat data...</p>
                            </div>
                        </section>

                        <!-- Recent Submissions -->
                        <section class="admin-section">
                            <h3 class="admin-section-title">📋 Pengiriman Terbaru (Last 24h)</h3>
                            <div class="submissions-list" id="submissionsList">
                                <p class="loading">Memuat data...</p>
                            </div>
                        </section>

                        <!-- Error Logs -->
                        <section class="admin-section">
                            <h3 class="admin-section-title">⚠️ Log Kesalahan</h3>
                            <div class="error-logs" id="errorLogsList">
                                <p class="loading">Memuat data...</p>
                            </div>
                        </section>

                        <!-- Actions -->
                        <section class="admin-section">
                            <h3 class="admin-section-title">⚙️ Aksi Admin</h3>
                            <div class="admin-actions">
                                <button onclick="AdminDashboard.exportCSV()" class="admin-action-btn">
                                    <i class="fas fa-download"></i> Export CSV
                                </button>
                                <button onclick="AdminDashboard.printReport()" class="admin-action-btn">
                                    <i class="fas fa-print"></i> Print Report
                                </button>
                                <button onclick="AdminDashboard.clearErrorLogs()" class="admin-action-btn danger">
                                    <i class="fas fa-trash"></i> Hapus Error Logs
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- Settings Tab -->
                    <div id="settings-tab" class="admin-tab-content">
                        <section class="admin-section">
                            <h3 class="admin-section-title">⚙️ Pengaturan Umum</h3>
                            <div class="admin-settings-form">
                                
                                <div class="settings-group">
                                    <label for="validationEnabled">
                                        <input type="checkbox" id="validationEnabled" checked>
                                        Aktifkan Validasi Form
                                    </label>
                                    <small class="settings-hint">Jika diaktifkan, form akan divalidasi sebelum pengiriman</small>
                                </div>

                                <div class="settings-group">
                                    <label for="formSubmissionEnabled">
                                        <input type="checkbox" id="formSubmissionEnabled" checked>
                                        Izinkan Pengiriman Form
                                    </label>
                                    <small class="settings-hint">Jika dinonaktifkan, users tidak dapat mengirimkan form apapun</small>
                                </div>

                                <div class="settings-status">
                                    <div id="settingsMessage" class="settings-message" style="display: none;"></div>
                                </div>

                                <div class="settings-actions">
                                    <button onclick="AdminDashboard.saveSettings()" class="settings-save-btn">
                                        <i class="fas fa-save"></i> Simpan Pengaturan
                                    </button>
                                    <button onclick="AdminDashboard.resetSettings()" class="settings-reset-btn">
                                        <i class="fas fa-redo"></i> Reset ke Default
                                    </button>
                                </div>

                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

                                <h4 style="margin-top: 20px;">📊 Data & Export</h4>
                                
                                <div class="settings-actions">
                                    <button onclick="AdminDashboard.exportSettings()" class="settings-action-btn">
                                        <i class="fas fa-download"></i> Export Pengaturan
                                    </button>
                                    <button onclick="AdminDashboard.importSettings()" class="settings-action-btn">
                                        <i class="fas fa-upload"></i> Import Pengaturan
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);

        // Start monitoring
        this.startMonitoring();

        // Initialize settings display
        this.loadSettingsDisplay();
    }

    /**
     * Switch between tabs
     */
    static switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
        }

        // Add active class to clicked button
        event.target.closest('.admin-tab-btn')?.classList.add('active');

        // If settings tab, load current settings
        if (tabName === 'settings') {
            this.loadSettingsDisplay();
        }
    }

    /**
     * Load settings form with current values
     */
    static async loadSettingsDisplay() {
        try {
            const settings = await AdminSettings.getSettings() || AdminSettings.DEFAULT_SETTINGS;

            // Set form values
            const validationEnabled = document.getElementById('validationEnabled');
            const formSubmissionEnabled = document.getElementById('formSubmissionEnabled');

            if (validationEnabled) validationEnabled.checked = settings.VALIDATION_ENABLED !== false;
            if (formSubmissionEnabled) formSubmissionEnabled.checked = settings.FORM_SUBMISSION_ENABLED !== false;

            console.log('Settings loaded:', settings);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Save settings
     */
    static async saveSettings() {
        try {
            const validationEnabled = document.getElementById('validationEnabled')?.checked;
            const formSubmissionEnabled = document.getElementById('formSubmissionEnabled')?.checked;

            // Validate
            const settings = {
                VALIDATION_ENABLED: validationEnabled,
                FORM_SUBMISSION_ENABLED: formSubmissionEnabled,
                MIN_DAYS_AHEAD: 7,  // Kept for backward compatibility but not used
                MAX_DAYS_PAST: 7    // Kept for backward compatibility but not used
            };

            await AdminSettings.saveSettings(settings);
            this.showSettingsMessage('✓ Pengaturan berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showSettingsMessage('❌ Gagal menyimpan pengaturan', 'error');
        }
    }

    /**
     * Reset settings to default
     */
    static async resetSettings() {
        if (!confirm('Reset semua pengaturan ke nilai default?')) return;

        try {
            await AdminSettings.resetSettings();
            this.loadSettingsDisplay();
            this.showSettingsMessage('✓ Pengaturan direset ke default', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showSettingsMessage('❌ Gagal mereset pengaturan', 'error');
        }
    }

    /**
     * Show settings message
     */
    static showSettingsMessage(message, type = 'info') {
        const messageEl = document.getElementById('settingsMessage');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.style.display = 'block';
        messageEl.style.padding = '10px 15px';
        messageEl.style.borderRadius = '4px';
        messageEl.style.marginBottom = '10px';

        if (type === 'success') {
            messageEl.style.backgroundColor = '#e8f5e9';
            messageEl.style.color = '#2e7d32';
            messageEl.style.border = '1px solid #4caf50';
        } else if (type === 'error') {
            messageEl.style.backgroundColor = '#ffebee';
            messageEl.style.color = '#c62828';
            messageEl.style.border = '1px solid #f44336';
        }

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }

    /**
     * Export settings as JSON
     */
    static async exportSettings() {
        try {
            await AdminSettings.exportSettings();
            this.showSettingsMessage('✓ Pengaturan berhasil diexport', 'success');
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.showSettingsMessage('❌ Gagal mengexport pengaturan', 'error');
        }
    }

    /**
     * Import settings from JSON file
     */
    static importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;

                await AdminSettings.importSettings(file);
                this.loadSettingsDisplay();
                this.showSettingsMessage('✓ Pengaturan berhasil diimport', 'success');
            } catch (error) {
                console.error('Error importing settings:', error);
                this.showSettingsMessage(`❌ ${error.message}`, 'error');
            }
        };
        input.click();
    }

    /**
     * Start dashboard monitoring
     */
    static startMonitoring() {
        this.updateDashboard();

        // Update every 5 seconds
        this.state.updateInterval = setInterval(() => {
            this.updateDashboard();
            this.checkSessionTimeout();
        }, 5000);
    }

    /**
     * Check session timeout
     */
    static checkSessionTimeout() {
        if (Date.now() - this.state.sessionStartTime > this.CONFIG.SESSION_TIMEOUT) {
            this.logout();
        }

        // Update session info
        const remaining = Math.ceil((this.CONFIG.SESSION_TIMEOUT - (Date.now() - this.state.sessionStartTime)) / 60000);
        const sessionInfo = document.getElementById('sessionInfo');
        if (sessionInfo) {
            sessionInfo.textContent = `Session: ${remaining}m remaining`;
        }
    }

    /**
     * Update dashboard data
     */
    static updateDashboard() {
        const syncLog = JSON.parse(localStorage.getItem('dukopsSyncLog') || '[]');
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter last 24h
        const recent = syncLog.filter(log => new Date(log.timestamp) > last24h);

        // Calculate stats
        const successCount = syncLog.filter(log => log.status === 'success').length;
        const failedCount = syncLog.filter(log => log.status === 'failed').length;
        const pendingCount = window.OfflineManager ? window.OfflineManager.getQueue().length : 0;

        // Update analytics
        document.getElementById('successSubmissions').textContent = successCount;
        document.getElementById('failedSubmissions').textContent = failedCount;
        document.getElementById('pendingSubmissions').textContent = pendingCount;

        // Update desa coverage
        this.updateDesaCoverage(recent);

        // Update submissions list
        this.updateSubmissionsList(recent);

        // Update error logs
        this.updateErrorLogs(syncLog.filter(log => log.status === 'failed'));
    }

    /**
     * Update desa coverage
     */
    static updateDesaCoverage(submissions) {
        const desaMap = {};

        submissions.forEach(sub => {
            desaMap[sub.desa] = (desaMap[sub.desa] || 0) + 1;
        });

        const html = Object.entries(desaMap)
            .sort((a, b) => b[1] - a[1])
            .map(([desa, count]) => `
                <div class="desa-item">
                    <span class="desa-name">${desa}</span>
                    <span class="desa-count">${count} laporan</span>
                </div>
            `).join('');

        const container = document.getElementById('desaCoverageList');
        if (container) {
            container.innerHTML = html || '<p class="empty">Tidak ada laporan dalam 24 jam terakhir</p>';
        }
    }

    /**
     * Update submissions list
     */
    static updateSubmissionsList(submissions) {
        const sorted = submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limited = sorted.slice(0, 10);

        const html = limited.map(sub => {
            const time = new Date(sub.timestamp);
            const timeStr = time.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const statusClass = sub.status === 'success' ? 'success-status' : 'error-status';
            const statusIcon = sub.status === 'success' ? 'fa-check-circle' : 'fa-times-circle';

            return `
                <div class="submission-item">
                    <div class="submission-header">
                        <span class="submission-desa">${sub.desa}</span>
                        <span class="submission-time">${timeStr}</span>
                        <span class="submission-status ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${sub.status.toUpperCase()}
                        </span>
                    </div>
                    <div class="submission-details">
                        <small>${sub.filename}</small>
                    </div>
                </div>
            `;
        }).join('');

        const container = document.getElementById('submissionsList');
        if (container) {
            container.innerHTML = html || '<p class="empty">Tidak ada pengiriman</p>';
        }
    }

    /**
     * Update error logs
     */
    static updateErrorLogs(errors) {
        const html = errors.slice(0, 5).map(error => `
            <div class="error-log-item">
                <div class="error-header">
                    <span class="error-desa">${error.desa}</span>
                    <span class="error-time">${new Date(error.timestamp).toLocaleTimeString('id-ID')}</span>
                </div>
                <div class="error-message">${error.errorMessage || 'Unknown error'}</div>
            </div>
        `).join('');

        const container = document.getElementById('errorLogsList');
        if (container) {
            container.innerHTML = html || '<p class="empty">Tidak ada error</p>';
        }
    }

    /**
     * Export data to CSV
     */
    static exportCSV() {
        const syncLog = JSON.parse(localStorage.getItem('dukopsSyncLog') || '[]');

        let csv = 'Desa,Tanggal,Waktu,Status,File\n';
        syncLog.forEach(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('id-ID');
            const timeStr = date.toLocaleTimeString('id-ID');
            csv += `"${log.desa}","${dateStr}","${timeStr}","${log.status}","${log.filename}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dukops_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        alert(`✓ Exported ${syncLog.length} records to CSV`);
    }

    /**
     * Print report
     */
    static printReport() {
        const syncLog = JSON.parse(localStorage.getItem('dukopsSyncLog') || '[]');
        const successCount = syncLog.filter(log => log.status === 'success').length;
        const failedCount = syncLog.filter(log => log.status === 'failed').length;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <html><head><title>DUKOPS Report</title></head>
            <body style="font-family: Arial; margin: 20px;">
                <h2>DUKOPS - Laporan Pengiriman</h2>
                <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                <p>Berhasil: ${successCount} | Gagal: ${failedCount}</p>
                <hr>
                ${syncLog.map(log => `
                    <p>
                        <strong>${log.desa}</strong> - ${new Date(log.timestamp).toLocaleString('id-ID')}
                        <span style="color: ${log.status === 'success' ? 'green' : 'red'};">[${log.status}]</span>
                    </p>
                `).join('')}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * Clear error logs
     */
    static clearErrorLogs() {
        if (!confirm('Hapus semua error logs?')) return;

        const syncLog = JSON.parse(localStorage.getItem('dukopsSyncLog') || '[]');
        const filtered = syncLog.filter(log => log.status !== 'failed');

        localStorage.setItem('dukopsSyncLog', JSON.stringify(filtered));
        this.updateDashboard();
        alert(`✓ Deleted ${syncLog.length - filtered.length} error logs`);
    }

    /**
     * Logout
     */
    static logout() {
        clearInterval(this.state.updateInterval);
        this.state.isAuthenticated = false;
        localStorage.removeItem('adminSessionStartTime');

        const dashboard = document.getElementById('adminDashboard');
        if (dashboard) dashboard.remove();

        const loginModal = document.getElementById('adminLoginModal');
        if (loginModal) loginModal.remove();

        alert('✓ Logged out successfully');
        this.showLoginModal();
    }
}

// Expose globally
window.AdminDashboard = AdminDashboard;
