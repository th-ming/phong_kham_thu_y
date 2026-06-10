#!/usr/bin/env python3
"""Fix remaining PostgreSQL compatibility issues in AiToolService, ChatController, DichVuRepository"""
import re

# ============ AiToolService.java ============
FILE = "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java"
with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original = content

# Fix remaining StringBuilder OFFSET patterns - need to split ORDER BY from OFFSET
# Pattern: sql.append("ORDER BY xxx OFFSET 0 ROWS FETCH NEXT N ROWS ONLY");
# -> sql.append("ORDER BY xxx "); DatabaseDialect.appendPagination(sql, pg, N, 0);

# 1. Line ~368: sql.append(")) OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
content = content.replace(
    'sql.append(")) OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");',
    'sql.append(")) ");\n        DatabaseDialect.appendPagination(sql, pg, 20, 0);'
)

# 2. Line ~436: inline string with OFFSET
content = content.replace(
    '"ORDER BY lh.id_lich_hen OFFSET 0 ROWS FETCH NEXT 200 ROWS ONLY",',
    '"ORDER BY lh.id_lich_hen " + DatabaseDialect.topN(pg, 200),'
)

# 3. Line ~519: sql.append(" ORDER BY tc.id_thu_cung OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
content = content.replace(
    'sql.append(" ORDER BY tc.id_thu_cung OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");',
    'sql.append(" ORDER BY tc.id_thu_cung ");\n        DatabaseDialect.appendPagination(sql, pg, 20, 0);'
)

# 4. Line ~640
content = content.replace(
    'sql.append("ORDER BY llv.ngay_lam, llv.gio_bat_dau OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY");',
    'sql.append("ORDER BY llv.ngay_lam, llv.gio_bat_dau ");\n        DatabaseDialect.appendPagination(sql, pg, 50, 0);'
)

# 5. Line ~1022
content = content.replace(
    'sql.append("ORDER BY nv.ho_ten OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");',
    'sql.append("ORDER BY nv.ho_ten ");\n        DatabaseDialect.appendPagination(sql, pg, 1, 0);'
)

# 6. Line ~1216
content = content.replace(
    'sql.append("ORDER BY lh.ngay_kham, lh.gio_kham OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY");',
    'sql.append("ORDER BY lh.ngay_kham, lh.gio_kham ");\n                DatabaseDialect.appendPagination(sql, pg, 5, 0);'
)

# 7. Line ~1328
content = content.replace(
    'sql.append(" OFFSET 0 ROWS FETCH NEXT 15 ROWS ONLY");',
    'DatabaseDialect.appendPagination(sql, pg, 15, 0);'
)

# 8. Line ~1506
content = content.replace(
    'sql.append("ORDER BY llv.ngay_lam DESC, llv.gio_bat_dau ASC OFFSET 0 ROWS FETCH NEXT 30 ROWS ONLY");',
    'sql.append("ORDER BY llv.ngay_lam DESC, llv.gio_bat_dau ASC ");\n        DatabaseDialect.appendPagination(sql, pg, 30, 0);'
)

# 9. Line ~1997: Fix broken replacement - this is inside a SQL string, not Java code
# The previous script incorrectly replaced LOWER(CAST) inside a string literal
# Fix: restore proper string concatenation
content = content.replace(
    'AND DatabaseDialect.isNotDeleted(pg, "da_xoa") ORDER BY id_thu_cung OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"',
    'AND (da_xoa IS NULL OR da_xoa = false) ORDER BY id_thu_cung " + DatabaseDialect.topN(pg, 1)'
)
# Also handle the SQL Server variant if the previous fix didn't apply
content = content.replace(
    'AND (da_xoa IS NULL OR da_xoa = false) ORDER BY id_thu_cung " + DatabaseDialect.topN(pg, 1)',
    'AND (da_xoa IS NULL OR da_xoa = false) ORDER BY id_thu_cung " + DatabaseDialect.topN(pg, 1)'
)

# Also fix remaining toolThongKeKhachHangHomNay OFFSET pattern (inline query with jdbcTemplate.queryForList)
content = content.replace(
    '"ORDER BY lh.id_lich_hen " + DatabaseDialect.topN(pg, 200),',
    '"ORDER BY lh.id_lich_hen " + DatabaseDialect.topN(pg, 200)'
)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

remaining_offset = len(re.findall(r'OFFSET.*ROWS.*FETCH NEXT', content))
remaining_lower_cast = len(re.findall(r'LOWER\(CAST\(', content))
print(f"AiToolService.java: remaining OFFSET={remaining_offset}, remaining LOWER(CAST)={remaining_lower_cast}")


# ============ ChatController.java ============
FILE2 = "Backend/src/main/java/com/rexi/pkty/controller/ChatController.java"
with open(FILE2, "r", encoding="utf-8") as f:
    content2 = f.read()

# ChatController needs: detect pg at start of buildRealtimeContext or the method that builds context
# The 2 OFFSET + 5 LOWER(CAST) are in the buildRealtimeContext area and other methods

# Find the method that contains these patterns - it's in the large chat() method
# We need to add pg detection. Let's find a good spot.

# The patterns are in the chat() method. Let's add pg near the top of the method.
# Actually, looking at the code, the patterns are in the system prompt construction
# and in tryFastDbReply. Let me find the exact locations.

# Fix LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false') patterns
# These are in inline SQL strings, so we need to use DatabaseDialect.isNotDeleted
# But we need pg variable. The patterns are in the chat() method.

# First, let's add pg detection in the chat method
# Find a good insertion point - after the rate limiting section
chat_marker = '        try {\n            if (history == null || history.isEmpty()) {'
if chat_marker in content2:
    pg_line_chat = '\n            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);'
    content2 = content2.replace(chat_marker, chat_marker.replace('        try {', '        try {' + pg_line_chat))
    print("Added pg to ChatController.chat()")

# Replace OFFSET patterns in ChatController
content2 = re.sub(
    r'\+ "ORDER BY llv\.ngay_lam, llv\.gio_bat_dau OFFSET 0 ROWS FETCH NEXT (\d+) ROWS ONLY",',
    r'+ "ORDER BY llv.ngay_lam, llv.gio_bat_dau " + DatabaseDialect.topN(pg, \1),',
    content2
)
content2 = re.sub(
    r'\+ "ORDER BY ho_ten OFFSET 0 ROWS FETCH NEXT (\d+) ROWS ONLY"\);',
    r'+ "ORDER BY ho_ten " + DatabaseDialect.topN(pg, \1));',
    content2
)

# Replace LOWER(CAST) patterns
content2 = content2.replace(
    '"WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\')) "',
    '"WHERE " + DatabaseDialect.isNotDeleted(pg, "da_xoa") + " "'
)
content2 = content2.replace(
    '"AND (trang_thai IS NULL OR LOWER(CAST(trang_thai AS varchar)) IN (\'1\', \'true\')) "',
    '"AND " + DatabaseDialect.isActive(pg, "trang_thai") + " "'
)
content2 = content2.replace(
    'AND (nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN (\'0\', \'false\')) ',
    '" + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " '
)
content2 = content2.replace(
    '"WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\')) "',
    '"WHERE " + DatabaseDialect.isNotDeleted(pg, "da_xoa") + " "'
)

# Line 2561: separate context - may need its own pg
# Let's handle the customer lookup too
content2 = content2.replace(
    'AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN (\'0\', \'false\'))"',
    'AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa')
content2 = content2.replace(
    'AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa',
    'AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa") + "'
)

with open(FILE2, "w", encoding="utf-8") as f:
    f.write(content2)

remaining_offset2 = len(re.findall(r'OFFSET.*ROWS.*FETCH NEXT', content2))
remaining_lower_cast2 = len(re.findall(r'LOWER\(CAST\(', content2))
print(f"ChatController.java: remaining OFFSET={remaining_offset2}, remaining LOWER(CAST)={remaining_lower_cast2}")


# ============ DichVuRepository.java ============
FILE3 = "Backend/src/main/java/com/rexi/pkty/repository/DichVuRepository.java"
with open(FILE3, "r", encoding="utf-8") as f:
    content3 = f.read()

# Convert native queries to JPQL (cross-database safe)
# These methods are unused (dead code) but let's fix them anyway
new_repository = '''package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, String> {

    @Query("SELECT d FROM DichVu d WHERE d.trang_thai = true ORDER BY d.id_dich_vu")
    List<DichVu> findTop8ActiveServices();

    @Query("SELECT d FROM DichVu d WHERE d.trang_thai = true")
    List<DichVu> findAllActiveServices();
}
'''

with open(FILE3, "w", encoding="utf-8") as f:
    f.write(new_repository)

print(f"DichVuRepository.java: Converted to JPQL (2 queries fixed)")

print("\n=== ALL DONE ===")
