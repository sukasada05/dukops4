# SCRIPTS SUMMARY

Ringkasan skrip yang ada di repository ini:

- `manage-banners.ps1` & `support/manage-banners.ps1`: PowerShell untuk copy/list/check banner lokal.
- `convert-coordinates.ps1` & `support/convert-coordinates.ps1` & `convert_coordinates.py`: konversi file `CO_*.txt` ke JSON di `data/coordinates/`.
- `fix-coordinates.ps1`: alternatif PowerShell untuk parse file koordinat.
- `banner-function-local.js`: fungsi client-side untuk load banner lokal dengan fallback GitHub.
- `audio-base64.js` (root & assets): generator base64 audio untuk efek suara.
- `audio-pro-system.js` (root & assets): sistem audio berbasis Web Audio API.
- `js/utils/common.js`: helper umum, network backend helper, localStorage helpers.
- `js/modules/piket.js`: modul jadwal piket.
- `js/modules/dukops.js`: modul utama DUKOPS untuk pemilihan desa, koordinat, dan pembuatan ZIP submission.
- `js/components/FormValidator.js`: validasi form client-side.
- `js/components/AdminDashboard.js`: dashboard admin (login PIN, export, analytics).

Catatan:
- Terdapat beberapa duplikat file (assets/ vs root, support/ vs root). Build tidak akan menghapus atau mengubah file asli; build hanya menyalin yang diperlukan ke `dist/`.
- Gunakan `npm run build` untuk membuat `dist/` dan `npm start` untuk menjalankan server lokal.
