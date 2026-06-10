#!/usr/bin/env python3
"""Fix remaining LOWER(CAST()) patterns in 5 controller files"""
import re

FILE_PATTERN_MAP = {
    "Backend/src/main/java/com/rexi/pkty/controller/ThuCungController.java": {
        "markers": ["boolean pg = DatabaseDialect.isPostgres"],
        "patterns": [
            ('(t.da_xoa IS NULL OR LOWER(CAST(t.da_xoa AS varchar)) IN (\'0\', \'false\'))', 'DatabaseDialect.isNotDeleted(pg, "t.da_xoa")'),
            ('da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\') ORDER BY ngay_tao DESC', '" + DatabaseDialect.isNotDeleted(pg, "da_xoa") + " ORDER BY ngay_tao DESC'),
        ]
    },
    "Backend/src/main/java/com/rexi/pkty/controller/SystemController.java": {
        "markers": [],
        "patterns": [
            ('(da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\'))', 'DatabaseDialect.isNotDeleted(pg, "da_xoa")'),
            ('LOWER(CAST(nhan_email AS varchar)) IN (\'1\', \'true\')', 'DatabaseDialect.isActive(pg, "nhan_email")'),
        ]
    },
    "Backend/src/main/java/com/rexi/pkty/controller/NhanVienController.java": {
        "markers": [],
        "patterns": [
            ('(nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN (\'0\', \'false\'))', 'DatabaseDialect.isNotDeleted(pg, "nv.da_xoa")'),
        ]
    },
    "Backend/src/main/java/com/rexi/pkty/controller/LichTrucController.java": {
        "markers": [],
        "patterns": [
            ('(nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN (\'0\', \'false\'))', 'DatabaseDialect.isNotDeleted(pg, "nv.da_xoa")'),
        ]
    },
    "Backend/src/main/java/com/rexi/pkty/controller/LichHenController.java": {
        "markers": [],
        "patterns": [
            ('(da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\'))', 'DatabaseDialect.isNotDeleted(pg, "da_xoa")'),
            ('LOWER(CAST(trang_thai AS varchar)) IN (\'1\', \'true\')', 'DatabaseDialect.isActive(pg, "trang_thai")'),
        ]
    },
}

for filepath, config in FILE_PATTERN_MAP.items():
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  SKIP: {filepath} not found")
        continue

    original = content

    # Check if pg variable exists in the file
    has_pg = 'boolean pg = DatabaseDialect.isPostgres' in content

    for pattern, replacement in config["patterns"]:
        count = content.count(pattern)
        if count > 0:
            content = content.replace(pattern, replacement)
            print(f"  {filepath.split('/')[-1]}: replaced {count}x '{pattern[:50]}...'")

    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        remaining = len(re.findall(r'LOWER\(CAST\(', content))
        print(f"  -> Saved. Remaining LOWER(CAST): {remaining}")
    else:
        print(f"  {filepath.split('/')[-1]}: no changes needed")

print("\n=== Controller files done ===")
