# Banner Management Script - Local Banner Handler
# Copy banner files ke folder local untuk management lokal

param(
    [ValidateSet('copy', 'list', 'check', 'help')]
    [string]$Action = 'help'
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$bannersDir = "$projectRoot\banners"
$rootBannerFiles = Get-ChildItem "$projectRoot\bnr_*.png" -ErrorAction SilentlyContinue

function Copy-BannersToLocal {
    Write-Host "Copying banner files to local folder..." -ForegroundColor Cyan
    
    if (-not (Test-Path $bannersDir)) {
        New-Item -ItemType Directory -Path $bannersDir | Out-Null
        Write-Host "Created banners directory" -ForegroundColor Green
    }
    
    if ($rootBannerFiles.Count -eq 0) {
        Write-Host "No banner files found in root directory" -ForegroundColor Yellow
        return
    }
    
    $copied = 0
    foreach ($file in $rootBannerFiles) {
        $destPath = Join-Path $bannersDir $file.Name
        Copy-Item $file.FullName -Destination $destPath -Force
        Write-Host "Copied: $($file.Name)" -ForegroundColor Green
        $copied++
    }
    
    Write-Host "Done! Copied $copied banner files" -ForegroundColor Green
}

function List-BannerFiles {
    Write-Host "BANNER FILES STATUS:" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Local Banners (banners folder):" -ForegroundColor White
    if (Test-Path $bannersDir) {
        $localFiles = Get-ChildItem "$bannersDir\*.png" -ErrorAction SilentlyContinue
        if ($localFiles.Count -gt 0) {
            foreach ($file in $localFiles) {
                $size = [math]::Round($file.Length / 1KB, 2)
                Write-Host "  $($file.Name) - $size KB" -ForegroundColor Green
            }
        }
        else {
            Write-Host "  (empty)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  (folder tidak ada)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Root Banners:" -ForegroundColor White
    if ($rootBannerFiles.Count -gt 0) {
        foreach ($file in $rootBannerFiles) {
            $size = [math]::Round($file.Length / 1KB, 2)
            Write-Host "  $($file.Name) - $size KB" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  (tidak ada)" -ForegroundColor Yellow
    }
}

function Check-BannerSetup {
    Write-Host "Checking banner setup..." -ForegroundColor Cyan
    Write-Host ""
    
    $appJsPath = "$projectRoot\app.js"
    if (Test-Path $appJsPath) {
        $appJsContent = Get-Content $appJsPath -Raw
        if ($appJsContent -match "banners/bnr_") {
            Write-Host "OK: app.js configured for local banner loading" -ForegroundColor Green
        }
        else {
            Write-Host "WARNING: app.js not configured for local banners" -ForegroundColor Yellow
        }
    }
    
    if (Test-Path $bannersDir) {
        $bannerCount = (Get-ChildItem "$bannersDir\*.png" -ErrorAction SilentlyContinue).Count
        Write-Host "OK: banners folder exists ($bannerCount PNG files)" -ForegroundColor Green
    }
    else {
        Write-Host "WARNING: banners folder does not exist" -ForegroundColor Yellow
    }
}

function Show-Help {
    Write-Host "BANNER MANAGEMENT SCRIPT - Local Banner Handler"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  .\manage-banners.ps1 -Action copy   (Copy banner files ke local folder)"
    Write-Host "  .\manage-banners.ps1 -Action list   (List semua banner files)"
    Write-Host "  .\manage-banners.ps1 -Action check  (Check setup status)"
    Write-Host "  .\manage-banners.ps1 -Action help   (Show bantuan)"
    Write-Host ""
    Write-Host "KEUNTUNGAN:"
    Write-Host "  - Update banner tanpa git commit"
    Write-Host "  - Fallback otomatis ke GitHub jika lokal tidak ada"
    Write-Host "  - Tidak perlu edit script"
}

switch ($Action) {
    'copy' { Copy-BannersToLocal }
    'list' { List-BannerFiles }
    'check' { Check-BannerSetup }
    'help' { Show-Help }
    default { Show-Help }
}
