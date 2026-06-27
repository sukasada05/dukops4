<#
Update VS Code helper script

Usage:
  - Open PowerShell as Administrator (recommended for winget/choco installs)
  - Run: `powershell -ExecutionPolicy Bypass -File .\support\update-vscode.ps1`

What it does:
  1. Try to read local `code` CLI version (`code --version`).
  2. Query VS Code update API for latest stable release.
  3. If newer version available, offer to upgrade using `winget` or `choco` (if present),
     or download the installer and open it for manual install.

#>
Set-StrictMode -Version Latest
Write-Host "== VS Code Auto-update Helper ==" -ForegroundColor Cyan

function Get-LocalCodeVersion {
    try {
        $codeCmd = Get-Command code -ErrorAction SilentlyContinue
        if ($null -ne $codeCmd) {
            $ver = (& code --version 2>$null | Select-Object -First 1)
            if ($ver) { return $ver.Trim() }
        }
    } catch { }

    # Try registry (user installer)
    try {
        return $null
    } catch { return $null }
}

function Get-RemoteLatestVersion {
    try {
        # VS Code update API - request latest stable for win32 x64
        $apiUrl = 'https://update.code.visualstudio.com/api/update/win32-x64/stable/latest'
        $resp = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing -ErrorAction Stop
        # Response contains 'name' (version) and 'url'
        return @{ version = $resp.name; url = $resp.url }
    } catch {
        Write-Host "Gagal mengambil info versi online: $_" -ForegroundColor Yellow
        return $null
    }
}

function Compare-Versions([string]$local, [string]$remote) {
    if (-not $local) { return -1 }
    try {
        $lv = [Version]($local.Split(' ')[0])
        $rv = [Version]($remote.Split(' ')[0])
        return $lv.CompareTo($rv)
    } catch { return -1 }
}

$local = Get-LocalCodeVersion
if ($local) { Write-Host "Local VS Code version: $local" -ForegroundColor Green } else { Write-Host "Local VS Code not detected via 'code' CLI." -ForegroundColor Yellow }

$remoteInfo = Get-RemoteLatestVersion
if (-not $remoteInfo) { Write-Host "Tidak dapat mengambil info rilis terbaru. Anda bisa membuka https://code.visualstudio.com/ untuk mengunduh."; exit 1 }

Write-Host "Latest stable version: $($remoteInfo.version)" -ForegroundColor Green

$cmp = Compare-Versions $local $remoteInfo.version
if ($cmp -ge 0) {
    Write-Host "VS Code sudah up-to-date." -ForegroundColor Green
    exit 0
}

Write-Host "Versi baru tersedia: $($remoteInfo.version) (local: $local)" -ForegroundColor Cyan

Write-Host "Opsi upgrade:" -ForegroundColor Cyan
Write-Host "  1) Upgrade otomatis via winget (direkomendasikan)"
Write-Host "  2) Upgrade otomatis via Chocolatey (jika terpasang)"
Write-Host "  3) Unduh installer dan buka (manual)"
Write-Host "  4) Batal"

$choice = Read-Host "Pilih opsi [1-4]"
switch ($choice) {
    '1' {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Host "Menjalankan: winget upgrade --id Microsoft.VisualStudioCode -e" -ForegroundColor Yellow
            Start-Process -FilePath winget -ArgumentList 'upgrade','--id','Microsoft.VisualStudioCode','-e' -NoNewWindow -Wait
        } else {
            Write-Host "winget tidak ditemukan di PATH. Silakan instal winget atau pilih opsi lain." -ForegroundColor Red
        }
    }
    '2' {
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Host "Menjalankan: choco upgrade vscode -y" -ForegroundColor Yellow
            Start-Process -FilePath choco -ArgumentList 'upgrade','vscode','-y' -NoNewWindow -Wait
        } else {
            Write-Host "Chocolatey tidak ditemukan. Pilih opsi lain." -ForegroundColor Red
        }
    }
    '3' {
        $downloadUrl = $remoteInfo.url
        if (-not $downloadUrl) { Write-Host "URL installer tidak tersedia. Silakan buka https://code.visualstudio.com/ untuk mengunduh manual."; break }
        $tmp = Join-Path $env:TEMP "VSCode-Setup-latest.exe"
        Write-Host "Mengunduh installer ke: $tmp" -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tmp -UseBasicParsing -ErrorAction Stop
            Write-Host "Unduhan selesai. Menjalankan installer..." -ForegroundColor Green
            Start-Process -FilePath $tmp -Verb RunAs
        } catch {
            Write-Host "Gagal mengunduh atau menjalankan installer: $_" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Dibatalkan." -ForegroundColor Yellow
    }
}

Write-Host "Selesai." -ForegroundColor Cyan
