#!/usr/bin/env python3
"""
Convert CO_*.txt coordinate files to JSON format
Usage: python3 convert_coordinates.py
"""

import os
import json
import re
from pathlib import Path

def parse_coordinate_line(line):
    """Parse a single coordinate line: -8.130900, 115.108300, 290m"""
    line = line.strip()
    if not line or line.startswith('#'):
        return None
    
    parts = [p.strip() for p in line.split(',')]
    if len(parts) != 3:
        return None
    
    try:
        lat = float(parts[0])
        lon = float(parts[1])
        elevation = parts[2].strip()  # Keep as string (e.g., "290m")
        return {
            "lat": lat,
            "lon": lon,
            "elevation": elevation
        }
    except (ValueError, IndexError):
        return None

def convert_txt_to_json(txt_file_path):
    """Convert a single CO_*.txt file to JSON"""
    try:
        # Extract desa name from filename: CO_Gitgit.txt -> Gitgit
        filename = os.path.basename(txt_file_path)
        desa_name = filename.replace('CO_', '').replace('.txt', '')
        
        # Read coordinates
        coordinates = []
        with open(txt_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                coord = parse_coordinate_line(line)
                if coord:
                    coordinates.append(coord)
        
        if not coordinates:
            print(f"⚠️  {filename}: No valid coordinates found")
            return False
        
        # Create JSON structure
        data = {
            "desa": desa_name,
            "coordinates": coordinates
        }
        
        # Create output file path
        output_dir = os.path.join(os.path.dirname(txt_file_path), 'data', 'coordinates')
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, f"{desa_name}.json")
        
        # Write JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ {filename} → {desa_name}.json ({len(coordinates)} coordinates)")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")
        return False

def main():
    """Main function"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find all CO_*.txt files
    co_files = sorted(Path(script_dir).glob('CO_*.txt'))
    
    if not co_files:
        print("❌ No CO_*.txt files found")
        return
    
    print(f"Found {len(co_files)} coordinate files\n")
    
    # Convert each file
    success_count = 0
    for txt_file in co_files:
        if convert_txt_to_json(str(txt_file)):
            success_count += 1
    
    print(f"\n{'='*50}")
    print(f"✅ Conversion complete: {success_count}/{len(co_files)} files")
    print(f"Output directory: data/coordinates/")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
