@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
    start "DUKOPS Local Server" /min py -m http.server 8000 --bind 127.0.0.1
) else (
    where python >nul 2>nul
    if errorlevel 1 (
        echo Python tidak ditemukan. Instal Python, lalu jalankan file ini kembali.
        pause
        exit /b 1
    )
    start "DUKOPS Local Server" /min python -m http.server 8000 --bind 127.0.0.1
)

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"
echo DUKOPS berjalan di http://127.0.0.1:8000/
echo Tutup jendela server "DUKOPS Local Server" untuk menghentikannya.
