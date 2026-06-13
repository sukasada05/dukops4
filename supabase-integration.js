const SUPABASE_URL = 'https://qthoexsadattfnnzcawh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aG9leHNhZGF0dGZubnpjYXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTMzNTAsImV4cCI6MjA5NjEyOTM1MH0.qZBFjrN8F8vwxoaPKIPLDQIOWbt58BNlPWLOn4J_5_4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Supabase Jadwal Integration Loaded!');
    
    // Tombol test
    const btn = document.createElement('button');
    btn.textContent = '📤 TEST INSERT JADWAL';
    btn.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:99999;background:#4CAF50;color:white;padding:12px;border-radius:8px;font-weight:bold;cursor:pointer;';
    btn.onclick = async () => {
        try {
            const { data, error } = await supabase
                .from('daily_schedules_overwrite')
                .insert({
                    schedule_date: new Date().toISOString().split('T')[0],
                    schedule_type: 'TEST',
                    shift_name: 'TEST',
                    personel_names: ['Test User 1', 'Test User 2'],
                    hanpangan: 'Test Hanpangan',
                    full_message: 'Test message from browser',
                    last_updated_by: 'Babinsa Test',
                    last_updated_by_desa: 'Desa Test',
                    last_updated_at: new Date().toISOString(),
                    update_count: 1,
                    last_update_reason: 'Test insert'
                });
            
            if (error) throw error;
            alert('✅ BERHASIL! Data tersimpan di Supabase');
            console.log('✅ Data tersimpan:', data);
        } catch (error) {
            alert('❌ ERROR: ' + error.message);
            console.error('❌ Error:', error);
        }
    };
    document.body.appendChild(btn);
    console.log('✅ Tombol test ditambahkan!');
});
