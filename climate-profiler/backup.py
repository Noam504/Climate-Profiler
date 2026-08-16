"""
backup.py
---------
Simple 1-click project snapshot & versioning script.
Creates a clean, timestamped ZIP archive in the 'backups/' directory.
"""

import os
import sys
import zipfile
import datetime

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')


def create_backup(tag=None):
    project_dir = os.path.dirname(os.path.abspath(__file__))
    backups_dir = os.path.join(project_dir, "backups")
    os.makedirs(backups_dir, exist_ok=True)
    
    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    tag_clean = f"_{tag.strip().replace(' ', '_')}" if tag else ""
    zip_filename = f"climate_profiler_backup_{now_str}{tag_clean}.zip"
    zip_filepath = os.path.join(backups_dir, zip_filename)
    
    # Files/folders to exclude
    exclude_dirs = {"__pycache__", "backups", ".git", ".venv", "venv"}
    exclude_exts = {".pyc", ".pyo"}
    
    count = 0
    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_exts:
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_dir)
                zipf.write(full_path, rel_path)
                count += 1
                
    size_mb = os.path.getsize(zip_filepath) / (1024 * 1024)
    print(f"✓ Backup created successfully!")
    print(f"  Archive: {zip_filepath}")
    print(f"  Files packed: {count}")
    print(f"  Size: {size_mb:.2f} MB")

if __name__ == "__main__":
    custom_tag = sys.argv[1] if len(sys.argv) > 1 else None
    create_backup(custom_tag)
