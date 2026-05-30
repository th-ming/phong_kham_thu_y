import re

def generate_perfect_tables_only_sql():
    # Đọc file gốc dạng UTF-16
    with open('d:\\QLy Phòng Khám Thú Y\\PhongKhamThuY.sql', 'r', encoding='utf-16') as f:
        content = f.read()

    # Xóa dấu ngoặc vuông MS SQL
    content = content.replace('[dbo].', '').replace('[', '').replace(']', '')

    # Phân tách file theo từ khóa GO
    parts = content.split('GO')
    safe_parts = []
    
    for part in parts:
        part_strip = part.strip()
        upper_part = part_strip.upper()
        # Loại bỏ triệt để views, procedures, triggers, master, database config, fulltext, and USE statements
        if any(kw in upper_part for kw in ['CREATE VIEW', 'CREATE PROCEDURE', 'CREATE TRIGGER', 'CREATE DATABASE', 'ALTER DATABASE', 'USE ', 'CREATE   PROCEDURE', 'CREATE  PROCEDURE', 'SP_FULLTEXT_DATABASE', 'FULLTEXTSERVICEPROPERTY']):
            continue
        # Bỏ qua các lệnh tạo USER hoặc ROLE của SQL Server vì Postgres không hỗ trợ
        if any(kw in upper_part for kw in ['CREATE USER', 'ALTER ROLE', 'CREATE ROLE']):
            continue
        # Bỏ các khai báo UserDefinedFunction của SQL Server
        if 'USERDEFINEDFUNCTION' in upper_part or 'CREATE FUNCTION' in upper_part:
            continue
        # LOẠI BỎ LỆNH CHECK CONSTRAINT ĐẶC THÙ CỦA MS SQL SERVER
        if 'CHECK CONSTRAINT' in upper_part:
            continue
        safe_parts.append(part)

    # Ghép lại thành một file SQL sạch
    clean_sql = '\n'.join(safe_parts)

    # Thực hiện dịch các kiểu dữ liệu và hàm sang PostgreSQL
    t_sql = clean_sql
    
    # SỬA LỖI CÚ PHÁP SERIAL TRONG POSTGRESQL:
    t_sql = re.sub(r'(?i)\bbigint\s+IDENTITY\(\d+,\s*\d+\)', 'BIGSERIAL', t_sql)
    t_sql = re.sub(r'(?i)\bint\s+IDENTITY\(\d+,\s*\d+\)', 'SERIAL', t_sql)
    t_sql = re.sub(r'(?i)\bbigint\s+SERIAL\b', 'BIGSERIAL', t_sql)
    t_sql = re.sub(r'(?i)\bint\s+SERIAL\b', 'SERIAL', t_sql)

    # Dịch các kiểu dữ liệu khác
    t_sql = re.sub(r'(?i)\bNVARCHAR\((MAX|\d+)\)', r'VARCHAR(\1)', t_sql)
    t_sql = re.sub(r'(?i)\bNVARCHAR\b', 'VARCHAR', t_sql)
    t_sql = re.sub(r'(?i)\bNCHAR\b', 'CHAR', t_sql)
    t_sql = re.sub(r'(?i)\bDATETIME2\b', 'TIMESTAMP', t_sql)
    t_sql = re.sub(r'(?i)\bDATETIME\b', 'TIMESTAMP', t_sql)
    t_sql = re.sub(r'(?i)\bBIT\b', 'BOOLEAN', t_sql)
    t_sql = re.sub(r'(?i)\bIMAGE\b', 'BYTEA', t_sql)
    t_sql = re.sub(r'(?i)\bMONEY\b', 'DECIMAL(19,4)', t_sql)
    
    # Unicode N'...' -> '...'
    t_sql = re.sub(r"N'((?:''|[^'])*)'", r"'\1'", t_sql)
    
    # Loại bỏ cấu trúc phân mảnh ổ đĩa vật lý của MS SQL Server
    t_sql = re.sub(r'(?i)ON\s+PRIMARY', '', t_sql)
    t_sql = re.sub(r'(?i)TEXTIMAGE_ON\s+PRIMARY', '', t_sql)
    t_sql = re.sub(r'(?i)WITH\s*\([^)]*\)', '', t_sql)
    t_sql = re.sub(r'(?i)CLUSTERED', '', t_sql)
    t_sql = re.sub(r'(?i)NONCLUSTERED', '', t_sql)
    t_sql = re.sub(r'(?i)\bGETDATE\(\)', 'CURRENT_TIMESTAMP', t_sql)
    
    # Sửa kiểu dữ liệu varchar(max) thành text trong Postgres
    t_sql = re.sub(r'(?i)\bVARCHAR\(MAX\)', 'TEXT', t_sql)
    
    # Loại bỏ triệt để mọi từ khóa USE thừa thãi
    t_sql = re.sub(r'(?i)\bUSE\s+PhongKhamThuY\b', '', t_sql)
    t_sql = re.sub(r'(?i)\bUSE\s+master\b', '', t_sql)
    
    # LOẠI BỎ TRIỆT ĐỂ LỆNH SET QUOTED_IDENTIFIER VÀ SET ANSI_NULLS CỦA MS SQL SERVER
    t_sql = re.sub(r'(?i)\bSET\s+QUOTED_IDENTIFIER\s+(ON|OFF);?', '', t_sql)
    t_sql = re.sub(r'(?i)\bSET\s+ANSI_NULLS\s+(ON|OFF);?', '', t_sql)
    t_sql = re.sub(r'(?i)\bSET\s+ANSI_PADDING\s+(ON|OFF);?', '', t_sql)

    # LOẠI BỎ CÚ PHÁP PRIMARY KEY (column ASC) và INDEX (column ASC) CỦA MS SQL SERVER
    t_sql = re.sub(r'(?i)\bASC\b', '', t_sql)
    
    # Loại bỏ cấu trúc rác: TEXTIMAGE_ dư thừa sau khi xóa ngoặc đơn
    t_sql = re.sub(r'(?i)\bTEXTIMAGE_\b', '', t_sql)
    
    # LOẠI BỎ HẾT CÁC LỆNH "NON" CỦA CHỮ "NONCLUSTERED" BỊ THỪA
    t_sql = re.sub(r'(?i)\bUNIQUE\s+NON\b', 'UNIQUE', t_sql)
    t_sql = re.sub(r'(?i)\bCREATE\s+NON\s+INDEX\b', 'CREATE INDEX', t_sql)

    # Dịch dấu GO thành dấu chấm phẩy ';' chính xác phân tách các khối lệnh
    # Ta chỉ dịch GO khi nó là một từ độc lập để tránh dịch nhầm GO trong các từ ghép
    t_sql = re.sub(r'(?i)\bGO\b', ';', t_sql)
    
    # SỬA LỖI CÚ PHÁP PHÂN TÁCH LỆNH: 
    t_sql = re.sub(r'\)\s*\n\s*(/\*\*\*\*\*\*)', r');\n\1', t_sql)
    
    # SỬA LỖI: SQL Server có cú pháp 'ALTER TABLE table WITH CHECK ADD CONSTRAINT ...'
    t_sql = re.sub(r'(?i)\bWITH\s+CHECK\s+ADD\b', 'ADD', t_sql)
    
    # SỬA TRIỆT ĐỂ LỖI PK_HoaD KEY CÒN SÓT CÚ PHÁP PRIMARY KEY SAI:
    t_sql = re.sub(r'(?i)\bPK_HoaD\s+KEY\b', 'PK_HoaD PRIMARY KEY', t_sql)
    
    # SỬA LỖI CÚ PHÁP PHÂN TÁCH LỆNH CHO CÁC DÒNG ALTER TABLE:
    # Chỉ thêm dấu chấm phẩy ';' vào cuối các dòng ALTER TABLE thật sự, không chèn lung tung vào giữa cột.
    # Sử dụng regex chính xác để khớp các dòng FOREIGN KEY REFERENCES có thể xuống dòng
    t_sql = re.sub(
        r'(?i)(ALTER\s+TABLE\s+\w+\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\([^)]*\)\s+REFERENCES\s+\w+\s*\([^)]*\)(?:\s+ON\s+DELETE\s+(?:SET\s+NULL|CASCADE|RESTRICT|NO\s+ACTION))?)(?!\s*;)',
        r'\1;',
        t_sql
    )
    
    # SỬA LỖI: SQL Server có cú pháp 'ALTER TABLE table ADD DEFAULT (val) FOR col'
    # PostgreSQL KHÔNG hỗ trợ cú pháp này! Trong Postgres phải viết:
    # 'ALTER TABLE table ALTER COLUMN col SET DEFAULT val;'
    # Hãy tự động dịch cú pháp ADD DEFAULT này sang chuẩn Postgres:
    # Ví dụ: ALTER TABLE LichHen ADD DEFAULT (CURRENT_TIMESTAMP) FOR ngay_tao
    # -> ALTER TABLE LichHen ALTER COLUMN ngay_tao SET DEFAULT CURRENT_TIMESTAMP;
    
    # Hàm tìm và dịch ADD DEFAULT thông minh:
    def convert_add_default(match):
        table = match.group(1).strip()
        val = match.group(2).strip()
        col = match.group(3).strip()
        # Loại bỏ các dấu ngoặc đơn thừa xung quanh giá trị default của MS SQL
        while val.startswith('(') and val.endswith(')'):
            val = val[1:-1].strip()
        return f"ALTER TABLE {table} ALTER COLUMN {col} SET DEFAULT {val};"

    # Regex bắt chuẩn cú pháp: ALTER TABLE table ADD [CONSTRAINT name] DEFAULT (val) FOR col
    # (Có thể có hoặc không có CONSTRAINT name)
    t_sql = re.sub(r'(?i)ALTER\s+TABLE\s+(\w+)\s+(?:ADD\s+CONSTRAINT\s+\w+\s+)?ADD\s+DEFAULT\s+\((.*?)\)\s+FOR\s+(\w+)', convert_add_default, t_sql)
    t_sql = re.sub(r'(?i)ALTER\s+TABLE\s+(\w+)\s+(?:ADD\s+CONSTRAINT\s+\w+\s+)?DEFAULT\s+\((.*?)\)\s+FOR\s+(\w+)', convert_add_default, t_sql)
    t_sql = re.sub(r'(?i)ALTER\s+TABLE\s+(\w+)\s+ADD\s+DEFAULT\s+(\S+)\s+FOR\s+(\w+)', convert_add_default, t_sql)

    # SỬA LỖI KIỂU DỮ LIỆU MẶC ĐỊNH CỦA BOOLEAN TRONG POSTGRESQL:
    # da_xoa, welcome_email_sent, da_doc mặc định là false (0)
    t_sql = re.sub(r'(?i)(ALTER\s+COLUMN\s+(?:da_xoa|welcome_email_sent|da_doc)\s+SET\s+DEFAULT\s+)0\b', r'\1false', t_sql)
    t_sql = re.sub(r'(?i)(ALTER\s+COLUMN\s+(?:da_xoa|welcome_email_sent|da_doc)\s+SET\s+DEFAULT\s+)1\b', r'\1true', t_sql)
    # nhan_email, nhan_sms, trang_thai mặc định là true (1) hoặc false (0)
    t_sql = re.sub(r'(?i)(ALTER\s+COLUMN\s+(?:nhan_email|nhan_sms|trang_thai)\s+SET\s+DEFAULT\s+)1\b', r'\1true', t_sql)
    t_sql = re.sub(r'(?i)(ALTER\s+COLUMN\s+(?:nhan_email|nhan_sms|trang_thai)\s+SET\s+DEFAULT\s+)0\b', r'\1false', t_sql)

    # CŨNG PHẢI THÊM DẤU ';' CHO CÁC DÒNG CREATE INDEX:
    t_sql = re.sub(
        r'(?i)(CREATE\s+(?:UNIQUE\s+)?INDEX\s+\w+\s+ON\s+\w+\s*\([^)]*\))(?!\s*;)',
        r'\1;',
        t_sql
    )

    # Đảm bảo cuối file có kết thúc đẹp
    t_sql = t_sql.strip() + ";"

    output_path = 'd:\\QLy Phòng Khám Thú Y\\PhongKhamThuY_Tables_Only.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(t_sql)

    # Đếm số bảng thực tế đã dịch
    tables_new = re.findall(r'(?i)CREATE\s+TABLE\s+(\w+)', t_sql)
    
    print(f"Absolutely Perfect Postgres Clean Audit:")
    print(f"- Tables count: {len(tables_new)} (Target: 37)")
    print(f"- Total Lines: {len(t_sql.splitlines())}")

if __name__ == "__main__":
    generate_perfect_tables_only_sql()
