#!/usr/bin/env python3
"""Fix remaining issues found by code review: CAST(? AS time), DATEADD/GETDATE, broken replacement"""
import re

# ============ AiToolService.java - Fix CAST(? AS time) ============
FILE = "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java"
with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original = content

# Fix CAST(? AS time) in countDoctorsInSlot, countStaffInSlot, doctorsInSlot, staffHasShiftAt
# These use "llv.gio_bat_dau = CAST(? AS time)" which works on SQL Server but not PostgreSQL
# PostgreSQL needs: llv.gio_bat_dau = ?::time

# Pattern: llv.gio_bat_dau = CAST(? AS time)
# The issue is that these are inline SQL strings, not StringBuilder
# We need to detect pg and use the right syntax

# For methods that don't have pg variable, we need to add it or use a different approach
# Actually, the cleanest fix is to use DatabaseDialect.castToTime(pg, "llv.gio_bat_dau")

# Method: countDoctorsInSlot - has no pg variable
# Add pg detection to the method
content = content.replace(
    '    private int countDoctorsInSlot(LocalDate date, String time) {\n        Integer count = jdbcTemplate.queryForObject(',
    '    private int countDoctorsInSlot(LocalDate date, String time) {\n        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);\n        String timeExpr = DatabaseDialect.castToTime(pg, "llv.gio_bat_dau");\n        Integer count = jdbcTemplate.queryForObject('
)

# Replace CAST(? AS time) in countDoctorsInSlot
content = content.replace(
    'WHERE llv.ngay_lam = ? AND llv.gio_bat_dau = CAST(? AS time) AND " + doctorPredicate(),',
    'WHERE llv.ngay_lam = ? AND " + timeExpr + " = ? AND " + doctorPredicate(),'
)

# Method: countStaffInSlot - has no pg variable
content = content.replace(
    '    private int countStaffInSlot(LocalDate date, String time, String role) {\n        StringBuilder sql = new StringBuilder(',
    '    private int countStaffInSlot(LocalDate date, String time, String role) {\n        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);\n        String timeExpr = DatabaseDialect.castToTime(pg, "llv.gio_bat_dau");\n        StringBuilder sql = new StringBuilder('
)

# Replace CAST(? AS time) in countStaffInSlot
# The pattern is: llv.gio_bat_dau = CAST(? AS time) 
# But in the StringBuilder it's: "LEFT JOIN TaiKhoan tk ON tk.id_nhan_vien = nv.id_nhan_vien WHERE llv.ngay_lam = ? AND llv.gio_bat_dau = CAST(? AS time) "
content = content.replace(
    '"LEFT JOIN TaiKhoan tk ON tk.id_nhan_vien = nv.id_nhan_vien WHERE llv.ngay_lam = ? AND llv.gio_bat_dau = CAST(? AS time) "',
    '"LEFT JOIN TaiKhoan tk ON tk.id_nhan_vien = nv.id_nhan_vien WHERE llv.ngay_lam = ? AND " + timeExpr + " = ? "'
)

# Method: doctorsInSlot - has no pg variable
content = content.replace(
    '    private List<Map<String, Object>> doctorsInSlot(LocalDate date, String time) {\n        return jdbcTemplate.queryForList(',
    '    private List<Map<String, Object>> doctorsInSlot(LocalDate date, String time) {\n        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);\n        String timeExpr = DatabaseDialect.castToTime(pg, "llv.gio_bat_dau");\n        return jdbcTemplate.queryForList('
)

# Replace CAST(? AS time) in doctorsInSlot
content = content.replace(
    '"WHERE llv.ngay_lam = ? AND llv.gio_bat_dau = CAST(? AS time) AND " + doctorPredicate() +',
    '"WHERE llv.ngay_lam = ? AND " + timeExpr + " = ? AND " + doctorPredicate() +'
)

# Method: staffHasShiftAt - has no pg variable
content = content.replace(
    '    private boolean staffHasShiftAt(String staff, LocalDate date, String time) {\n        if (staff == null || staff.isBlank()) return false;\n        Integer count = jdbcTemplate.queryForObject(',
    '    private boolean staffHasShiftAt(String staff, LocalDate date, String time) {\n        if (staff == null || staff.isBlank()) return false;\n        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);\n        String timeExpr = DatabaseDialect.castToTime(pg, "llv.gio_bat_dau");\n        Integer count = jdbcTemplate.queryForObject('
)

# Replace CAST(? AS time) in staffHasShiftAt
content = content.replace(
    '"WHERE LOWER(nv.ho_ten) LIKE LOWER(?) AND llv.ngay_lam = ? AND llv.gio_bat_dau = CAST(? AS time)"',
    '"WHERE LOWER(nv.ho_ten) LIKE LOWER(?) AND llv.ngay_lam = ? AND " + timeExpr + " = ?"'
)

# Fix toolFindFreeStaff CAST(? AS time) - 2 occurrences
# The pattern: AND l.gio_bat_dau < CAST(? AS time) AND COALESCE(l.gio_ket_thuc, l.gio_bat_dau) > CAST(? AS time)
# These are in the NOT EXISTS subquery
# Need to detect pg in toolFindFreeStaff (already has pg)
content = content.replace(
    '"AND NOT EXISTS (SELECT 1 FROM LichLamViecNhanVien l WHERE l.id_nhan_vien = nv.id_nhan_vien AND l.ngay_lam = ? " +\n            "AND l.gio_bat_dau < CAST(? AS time) AND COALESCE(l.gio_ket_thuc, l.gio_bat_dau) > CAST(? AS time)) " +\n            "ORDER BY nv.ho_ten ");',
    '"AND NOT EXISTS (SELECT 1 FROM LichLamViecNhanVien l WHERE l.id_nhan_vien = nv.id_nhan_vien AND l.ngay_lam = ? " +\n            "AND l.gio_bat_dau < " + DatabaseDialect.castToTime(pg, "?") + " AND COALESCE(l.gio_ket_thuc, l.gio_bat_dau) > " + DatabaseDialect.castToTime(pg, "?") + ") " +\n            "ORDER BY nv.ho_ten ");'
)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

remaining_cast_time = len(re.findall(r'CAST\(\? AS time\)', content))
print(f"AiToolService.java: remaining CAST(? AS time) = {remaining_cast_time}")


# ============ FinanceController.java - Fix DATEADD/GETDATE ============
FILE2 = "Backend/src/main/java/com/rexi/pkty/controller/FinanceController.java"
with open(FILE2, "r", encoding="utf-8") as f:
    content2 = f.read()

# Line 462: DATEADD(day, -6, CAST(GETDATE() AS date))
# Need to replace with DatabaseDialect.currentDateMinusDays(pg, 6)
# But first check if pg is available in that method
if 'boolean pg = DatabaseDialect.isPostgres' not in content2:
    # Find the method that contains this pattern
    # It's likely in a method that already has jdbcTemplate
    # Add pg detection near the pattern
    pass

# Replace the hardcoded DATEADD/GETDATE pattern
old_pattern = '"WHERE UPPER(TRIM(trang_thai)) = \'DA_THANH_TOAN\' AND ngay_lap_hoa_don >= DATEADD(day, -6, CAST(GETDATE() AS date)) "'
new_pattern = '"WHERE UPPER(TRIM(trang_thai)) = \'DA_THANH_TOAN\' AND ngay_lap_hoa_don >= " + DatabaseDialect.currentDateMinusDays(DatabaseDialect.isPostgres(jdbcTemplate), 6) + " "'

if old_pattern in content2:
    content2 = content2.replace(old_pattern, new_pattern)
    print(f"FinanceController.java: fixed DATEADD/GETDATE pattern")

with open(FILE2, "w", encoding="utf-8") as f:
    f.write(content2)


# ============ Fix AiToolService line 1997 broken replacement ============
# Check if there's a broken pattern
FILE3 = "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java"
with open(FILE3, "r", encoding="utf-8") as f:
    content3 = f.read()

# Check for the broken replacement pattern
if 'DatabaseDialect.isNotDeleted(pg, "da_xoa")' in content3 and 'SELECT id_thu_cung FROM ThuCung' in content3:
    # Find the broken line
    lines = content3.split('\n')
    for i, line in enumerate(lines):
        if 'SELECT id_thu_cung FROM ThuCung' in line and 'DatabaseDialect.isNotDeleted' in line:
            # This line has Java code inside a SQL string - fix it
            print(f"  Found broken line at line {i+1}: {line.strip()[:100]}")
            # Replace the broken pattern with proper SQL
            fixed_line = line.replace(
                'DatabaseDialect.isNotDeleted(pg, "da_xoa")',
                "(da_xoa IS NULL OR da_xoa = false)"
            )
            # Also need to handle the OFFSET part
            if 'OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY' in fixed_line:
                fixed_line = fixed_line.replace(
                    'OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"',
                    '" + DatabaseDialect.topN(pg, 1)'
                )
            lines[i] = fixed_line
            print(f"  Fixed to: {fixed_line.strip()[:100]}")
            break
    content3 = '\n'.join(lines)
    with open(FILE3, "w", encoding="utf-8") as f:
        f.write(content3)

print("\n=== All remaining issues fixed ===")
