// ============================================
// SUPABASE INTEGRATION FOR JADWAL PIKET
// ============================================

const SUPABASE_URL = 'https://qthoexsadattfnnzcawh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aG9leHNhZGF0dGZubnpjYXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTMzNTAsImV4cCI6MjA5NjEyOTM1MH0.qZBFjrN8F8vwxoaPKIPLDQIOWbt58BNlPWLOn4J_5_4';

const supabaseJadwal = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUserDesaJadwal = '';
let lastUpdateTimeJadwal = null;
let isSendingJadwal = false;

const JADWAL_DROPDOWN_IDS = {
    piketKoramilHariIni: ['j_nama1a_baru', 'j_nama1b_baru'],
    piketKoramilBesok: ['j_nama2a_baru', 'j_nama2b_baru'],
    jagaKediamanHariIni: ['j_nama3a_baru', 'j_nama3b_baru'],
    jagaKediamanBesok: ['j_nama3c_baru', 'j_nama3d_baru'],
    piketMakodimHariIni: ['j_nama4a_baru', 'j_nama4b_baru'],
    piketMakodimBesok: ['j_nama4c_baru', 'j_nama4d_baru']
};

async function upsertScheduleOverwrite(scheduleDate, scheduleType, shiftName, personelNames, hanpangan, fullMessage, updateReason) {
    try {
        const { data, error } = await supabaseJadwal.rpc('upsert_schedule_overwrite', {
            p_schedule_date: scheduleDate,
            p_schedule_type: scheduleType,
            p_shift_name: shiftName,
            p_personel_names: personelNames,
            p_hanpangan: hanpangan || '',
            p_full_message: fullMessage || '',
            p_updated_by: currentUserDesaJadwal,
            p_updated_by_desa: currentUserDesaJadwal,
            p_update_reason: updateReason || 'Pengiriman jadwal'
        });
        
        if (error) {
            console.log('RPC error:', error.message);
            return null;
        }
        
        if (data && data.was_updated) {
            console.log(`🔄 ${scheduleType} ${shiftName} diupdate! (Update ke-${data.update_count})`);
        } else if (data) {
            console.log(`✅ ${scheduleType} ${shiftName} tersimpan`);
        }
        return data;
    } catch (error) {
        console.error(`Error:`, error);
        return null;
    }
}

async function sendAllSchedulesToSupabase(fullMessage, hanpangan) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const now = new Date();
    let updateReason = 'Pengiriman jadwal';
    
    if (lastUpdateTimeJadwal && (now - lastUpdateTimeJadwal) < 60 * 60 * 1000) {
        const minutesAgo = Math.round((now - lastUpdateTimeJadwal) / 60000);
        updateReason = `Perubahan jadwal (${minutesAgo} menit setelah kirim sebelumnya)`;
        showToastMessage(`⚠️ Mengirim ulang dalam ${minutesAgo} menit. Data LAMA akan ditimpa!`, 'warning');
    }
    
    const schedules = [
        { date: today, type: 'Piket Koramil', shift: 'Hari Ini', ids: JADWAL_DROPDOWN_IDS.piketKoramilHariIni },
        { date: tomorrowStr, type: 'Piket Koramil', shift: 'Besok', ids: JADWAL_DROPDOWN_IDS.piketKoramilBesok },
        { date: today, type: 'Jaga Kediaman', shift: 'Hari Ini', ids: JADWAL_DROPDOWN_IDS.jagaKediamanHariIni },
        { date: tomorrowStr, type: 'Jaga Kediaman', shift: 'Besok', ids: JADWAL_DROPDOWN_IDS.jagaKediamanBesok },
        { date: today, type: 'Piket Makodim', shift: 'Hari Ini', ids: JADWAL_DROPDOWN_IDS.piketMakodimHariIni },
        { date: tomorrowStr, type: 'Piket Makodim', shift: 'Besok', ids: JADWAL_DROPDOWN_IDS.piketMakodimBesok }
    ];
    
    const results = [];
    for (const schedule of schedules) {
        const names = schedule.ids.map(id => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        }).filter(n => n && n.trim());
        
        if (names.length > 0) {
            const result = await upsertScheduleOverwrite(
                schedule.date, schedule.type, schedule.shift,
                names, hanpangan, fullMessage, updateReason
            );
            if (result) results.push(result);
        }
    }
    
    lastUpdateTimeJadwal = now;
    return results;
}

async function loadLatestSchedulesFromSupabase() {
    try {
        const { data, error } = await supabaseJadwal
            .from('daily_schedules_overwrite')
            .select('*')
            .order('schedule_date', { ascending: true });
        
        if (error) {
            console.log('Error loading:', error.message);
            return false;
        }
        
        if (!data || data.length === 0) return false;
        
        const scheduleMap = {};
        data.forEach(s => {
            const key = `${s.schedule_type}|${s.shift_name}`;
            scheduleMap[key] = s;
        });
        
        updateJadwalDropdownsFromData(scheduleMap);
        
        const hanpanganSchedule = data.find(s => s.hanpangan);
        if (hanpanganSchedule && hanpanganSchedule.hanpangan) {
            const runningTextEl = document.getElementById('runningTextJadwalBaru');
            if (runningTextEl && !runningTextEl.textContent.includes(hanpanganSchedule.hanpangan)) {
                runningTextEl.textContent = `🍽️ JADWAL HANPANGAN HARI INI: ${hanpanganSchedule.hanpangan} 🍽️`;
            }
        }
        
        console.log(`✅ Loaded ${data.length} schedules from Supabase`);
        return true;
    } catch (error) {
        console.error('Error loading schedules:', error);
        return false;
    }
}

function updateJadwalDropdownsFromData(scheduleMap) {
    const dropdownPairs = [
        { key: 'Piket Koramil|Hari Ini', ids: ['j_nama1a_baru', 'j_nama1b_baru'] },
        { key: 'Piket Koramil|Besok', ids: ['j_nama2a_baru', 'j_nama2b_baru'] },
        { key: 'Jaga Kediaman|Hari Ini', ids: ['j_nama3a_baru', 'j_nama3b_baru'] },
        { key: 'Jaga Kediaman|Besok', ids: ['j_nama3c_baru', 'j_nama3d_baru'] },
        { key: 'Piket Makodim|Hari Ini', ids: ['j_nama4a_baru', 'j_nama4b_baru'] },
        { key: 'Piket Makodim|Besok', ids: ['j_nama4c_baru', 'j_nama4d_baru'] }
    ];
    
    for (const pair of dropdownPairs) {
        const schedule = scheduleMap[pair.key];
        if (schedule && schedule.personel_names) {
            pair.ids.forEach((id, idx) => {
                if (schedule.personel_names[idx]) {
                    const dropdown = document.getElementById(id);
                    if (dropdown && dropdown.querySelector(`option[value="${schedule.personel_names[idx]}"]`)) {
                        dropdown.value = schedule.personel_names[idx];
                    }
                }
            });
        }
    }
    
    if (typeof updatePreview === 'function') {
        updatePreview();
    }
}

let scheduleChannel = null;

function subscribeToScheduleUpdates() {
    if (scheduleChannel) supabaseJadwal.removeChannel(scheduleChannel);
    scheduleChannel = supabaseJadwal.channel('schedule-overwrite')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'daily_schedules_overwrite' 
        }, (payload) => {
            if (payload.new && payload.new.last_updated_by_desa !== currentUserDesaJadwal) {
                showToastMessage(`🔄 ${payload.new.schedule_type} ${payload.new.shift_name} diupdate oleh ${payload.new.last_updated_by_desa}`, 'info');
                loadLatestSchedulesFromSupabase();
            }
        }).subscribe();
}

async function sendJadwalToWhatsAppWithSupabase() {
    if (isSendingJadwal) {
        showToastMessage('⏳ Masih memproses, tunggu sebentar...', 'warning');
        return false;
    }
    
    const preview = document.getElementById('j_hasilPesanBaru');
    const pesan = preview ? preview.value.trim() : "";
    if (!pesan) {
        showToastMessage('Tidak ada pesan untuk dikirim', 'warning');
        return false;
    }
    
    const runningText = document.getElementById('runningTextJadwalBaru');
    let hanpangan = '';
    if (runningText) {
        const match = runningText.textContent.match(/JADWAL HANPANGAN HARI INI: (.+?) 🍽️/);
        if (match) hanpangan = match[1];
    }
    
    isSendingJadwal = true;
    showToastMessage('📡 Menyimpan jadwal ke database...', 'info');
    
    try {
        await sendAllSchedulesToSupabase(pesan, hanpangan);
        showToastMessage('✅ Jadwal tersimpan! Membuka WhatsApp...', 'success');
        setTimeout(() => window.open("https://wa.me/?text=" + encodeURIComponent(pesan), "_blank"), 1000);
    } catch (error) {
        console.error('Error:', error);
        showToastMessage('❌ Gagal menyimpan, tetap buka WhatsApp', 'error');
        setTimeout(() => window.open("https://wa.me/?text=" + encodeURIComponent(pesan), "_blank"), 500);
    } finally {
        isSendingJadwal = false;
    }
    return false;
}

function showToastMessage(message, type = 'info') {
    let toast = document.getElementById('j_toastNotificationBaru');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'j_toastNotificationBaru';
        toast.className = 'jadwal-toast';
        document.body.appendChild(toast);
    }
    const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.style.color = type === 'warning' ? '#1a1a2e' : 'white';
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

async function initJadwalSupabase() {
    console.log('🚀 Initializing Jadwal Supabase Integration...');
    const selectDesa = document.getElementById('selectDesa');
    if (selectDesa) {
        currentUserDesaJadwal = selectDesa.options[selectDesa.selectedIndex]?.text || '';
        const handleDesaChange = async () => {
            const newDesa = selectDesa.options[selectDesa.selectedIndex]?.text || '';
            if (newDesa && newDesa !== '-- Pilih Desa/Kelurahan --') {
                currentUserDesaJadwal = newDesa;
                await loadLatestSchedulesFromSupabase();
            }
        };
        selectDesa.removeEventListener('change', handleDesaChange);
        selectDesa.addEventListener('change', handleDesaChange);
        if (currentUserDesaJadwal && currentUserDesaJadwal !== '-- Pilih Desa/Kelurahan --') {
            await loadLatestSchedulesFromSupabase();
        }
    }
    subscribeToScheduleUpdates();
    
    const whatsappBtn = document.getElementById('whatsappBtnBaru');
    if (whatsappBtn) {
        const newBtn = whatsappBtn.cloneNode(true);
        whatsappBtn.parentNode?.replaceChild(newBtn, whatsappBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendJadwalToWhatsAppWithSupabase();
        });
    }
    console.log('✅ Jadwal Supabase integration initialized');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJadwalSupabase);
} else {
    initJadwalSupabase();
}
