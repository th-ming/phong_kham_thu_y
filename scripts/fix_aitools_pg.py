#!/usr/bin/env python3
"""Fix PostgreSQL compatibility in AiToolService.java"""
import re, sys

FILE = r"Backend/src/main/java/com/rexi/pkty/service/AiToolService.java"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original = content

# 1. Fix activeEmployeePredicate() definition -> add boolean pg param
content = content.replace(
    '    private String activeEmployeePredicate() {\n        return "(nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN (\'0\', \'false\'))";\n    }',
    '    private String activeEmployeePredicate(boolean pg) {\n        return DatabaseDialect.isNotDeleted(pg, "nv.da_xoa");\n    }'
)

# Also try with \r\n
content = content.replace(
    '    private String activeEmployeePredicate() {\r\n        return "(nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN (\'0\', \'false\'))";\r\n    }',
    '    private String activeEmployeePredicate(boolean pg) {\r\n        return DatabaseDialect.isNotDeleted(pg, "nv.da_xoa");\r\n    }'
)

# 2. Add "boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);" to methods
methods_to_add_pg = [
    ('toolTimLichHenHomNay', '        String phamVi ='),
    ('toolTimKhachHang', '    private String toolTimKhachHang(String tuKhoa) {'),
    ('toolThongKeKhachHangHomNay', '        LocalDate today = LocalDate.now(VN_ZONE);\n        Integer newCustomerCount'),
    ('toolTimThuCung', '        if (tuKhoa == null || tuKhoa.trim().isEmpty()) return'),
    ('toolDanhSachThuCungCuaToi', '        String customerId = resolveCustomerId'),
    ('toolXemBenhAn', '    private String toolXemBenhAn(String idThuCung) {'),
    ('toolGetStaffSchedule', '        String staff = Objects.toString(params.getOrDefault("staff"'),
    ('toolFindOverlapStaff', '        List<String> staffNames = extractStringList'),
    ('toolFindFreeStaff', '        List<String> roles = extractStringList'),
    ('toolAutoSchedule', '        int staffCount = parseInt'),
    ('resolveStaffId', '    private String resolveStaffId(String staff, String role) {'),
    ('toolHuyLichHen', '        boolean isCustomer = RoleAccessPolicy.isCustomerRole(userRole);'),
    ('toolXemKhoThuoc', '        boolean isSearch = tuKhoa != null'),
    ('toolThongKeCaKhamBacSi', '        boolean ascending = sapXep.equals'),
    ('toolTimLichLamBacSi', '        String khoang = Objects.toString(params.getOrDefault("khoang_thoi_gian"'),
]

pg_line = '\n        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);'

for method_name, marker in methods_to_add_pg:
    # Check if pg already added near this marker
    idx = content.find(marker)
    if idx == -1:
        print(f"  WARN: Could not find marker for {method_name}")
        continue
    # Check if "boolean pg" already exists within 200 chars after marker
    nearby = content[idx:idx+300]
    if 'boolean pg' in nearby:
        print(f"  SKIP: {method_name} already has pg")
        continue
    content = content[:idx] + pg_line + '\n' + content[idx:]
    print(f"  OK: Added pg to {method_name}")

# 3. Replace remaining activeEmployeePredicate() calls (no args) -> activeEmployeePredicate(pg)
# Only replace standalone calls, not the definition
old_count = content.count('activeEmployeePredicate()')
content = content.replace('activeEmployeePredicate()', 'activeEmployeePredicate(pg)')
print(f"  Replaced {old_count} activeEmployeePredicate() calls")

# 4. Replace LOWER(CAST(da_xoa AS varchar)) patterns
# Pattern: (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))
patterns = [
    (r'\(da_xoa IS NULL OR LOWER\(CAST\(da_xoa AS varchar\)\) IN \(\'0\', \'false\'\)\)', 'da_xoa'),
    (r'\(tc\.da_xoa IS NULL OR LOWER\(CAST\(tc\.da_xoa AS varchar\)\) IN \(\'0\', \'false\'\)\)', 'tc.da_xoa'),
    (r'\(t\.da_xoa IS NULL OR LOWER\(CAST\(t\.da_xoa AS varchar\)\) IN \(\'0\', \'false\'\)\)', 't.da_xoa'),
    (r'\(nv\.da_xoa IS NULL OR LOWER\(CAST\(nv\.da_xoa AS varchar\)\) IN \(\'0\', \'false\'\)\)', 'nv.da_xoa'),
]

for pattern, column in patterns:
    replacement = f'DatabaseDialect.isNotDeleted(pg, "{column}")'
    new_content = re.sub(pattern, replacement, content)
    if new_content != content:
        count = len(re.findall(pattern, content))
        print(f"  Replaced {count} patterns for {column}")
        content = new_content

# Also handle the pattern without parentheses prefix (for inline SQL strings)
# Like: "WHERE " + DatabaseDialect.isNotDeleted(pg, "da_xoa") + " "
# These are already correct from above replacements.

# 5. Replace OFFSET FETCH NEXT patterns
# Pattern A: sql.append("OFFSET 0 ROWS FETCH NEXT X ROWS ONLY");
content = re.sub(
    r'sql\.append\("OFFSET 0 ROWS FETCH NEXT (\d+) ROWS ONLY"\);',
    r'DatabaseDialect.appendPagination(sql, pg, \1, 0);',
    content
)
print("  Fixed sql.append OFFSET patterns")

# Pattern B: ... OFFSET 0 ROWS FETCH NEXT X ROWS ONLY");
# For string concatenation like: "ORDER BY ... OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
content = re.sub(
    r'OFFSET 0 ROWS FETCH NEXT (\d+) ROWS ONLY";',
    r'" + DatabaseDialect.topN(pg, \\1);',
    content
)
print("  Fixed inline string OFFSET patterns")

# Pattern C: OFFSET 0 ROWS FETCH NEXT " + Math.max(1, staffCount) + " ROWS ONLY
# For dynamic limit in toolAutoSchedule
content = re.sub(
    r'OFFSET 0 ROWS FETCH NEXT " \+ Math\.max\(1, staffCount\) \+ " ROWS ONLY',
    r'" + DatabaseDialect.paginationSql(pg, Math.max(1, staffCount), 0)',
    content
)
print("  Fixed dynamic OFFSET pattern")

# Pattern D: OFFSET ? ROWS FETCH NEXT ? ROWS ONLY (parameterized)
# These need more complex handling - wrap with DatabaseDialect
# Skip these for now as they need manual review

# Save
if content != original:
    with open(FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print("\nFile saved successfully!")
    
    # Count remaining issues
    remaining_offset = len(re.findall(r'OFFSET.*ROWS.*FETCH NEXT', content))
    remaining_lower_cast = len(re.findall(r'LOWER\(CAST\(', content))
    print(f"Remaining OFFSET FETCH NEXT: {remaining_offset}")
    print(f"Remaining LOWER(CAST): {remaining_lower_cast}")
else:
    print("\nNo changes made!")
