# Convert all CO_*.txt files to JSON
cd "d:\JIMPITAN 2026\GITHUB\DUKOPS"

# Create data directory if doesn't exist
New-Item -ItemType Directory -Force -Path "data\coordinates" | Out-Null

Get-ChildItem CO_*.txt | ForEach-Object {
    $name = $_.BaseName.Replace("CO_", "")
    Write-Host "Converting $name..."
    
    # Read all lines
    $lines = @(Get-Content $_.FullName)
    $coords = @()
    
    foreach ($line in $lines) {
        $line = $line.Trim()
        # Skip empty lines and comments
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
            continue
        }
        
        # Parse CSV: lat, lon, elevation
        $parts = @($line -split ',\s*')
        if ($parts.Count -eq 3) {
            try {
                $coords += @{
                    lat       = [double]($parts[0].Trim())
                    lon       = [double]($parts[1].Trim())
                    elevation = $parts[2].Trim()
                }
            }
            catch {
                # Skip invalid lines
            }
        }
    }
    
    # Create JSON object
    $obj = @{
        desa        = $name
        coordinates = $coords
    }
    
    # Convert to JSON and save
    $json = $obj | ConvertTo-Json -Depth 100
    $json | Set-Content -Path "data\coordinates\$name.json" -Encoding UTF8
    
    Write-Host "✅ $name.json ($($coords.Count) coordinates)"
}

Write-Host "`n✅ All coordinate files converted to JSON format in data/coordinates/"
