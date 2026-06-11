import re
import sys

def translate_mssql_to_postgres(input_path, output_path):
    # Thử đọc với UTF-16 LE trước vì file chứa byte 0xff 0xfe
    try:
        with open(input_path, 'r', encoding='utf-16') as f:
            content = f.read()
    except Exception:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()

    # 1. Loại bỏ các lệnh đặc thù của MS SQL Server
    content = re.sub(r'(?i)\bUSE\s+\[\w+\]', '', content)
    content = re.sub(r'(?i)\bGO\b', ';', content)
    content = re.sub(r'(?i)SET\s+ANSI_NULLS\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+QUOTED_IDENTIFIER\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+ANSI_PADDING\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+ANSI_WARNINGS\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+NUMERIC_ROUNDABORT\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+ARITHABORT\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+CONCAT_NULL_YIELDS_NULL\s+(ON|OFF)', '', content)
    content = re.sub(r'(?i)SET\s+NOCOUNT\s+(ON|OFF)', '', content)
    
    # Loại bỏ các cấu hình ALTER DATABASE hoặc DATABASE property ở đầu và cuối file
    content = re.sub(r'(?i)ALTER\s+DATABASE\s+.*?\n', '', content)
    content = re.sub(r'(?i)CREATE\s+DATABASE\s+.*?\n', '', content)

    # 2. Thay đổi dấu ngoặc vuông [] thành double quotes hoặc loại bỏ
    content = re.sub(r'\[dbo\]\.', '', content)
    content = re.sub(r'\[(\w+)\]', r'\1', content)

    # 3. Thay đổi kiểu dữ liệu tương thích Postgres
    content = re.sub(r'(?i)\bNVARCHAR\((MAX|\d+)\)', r'VARCHAR(\1)', content)
    content = re.sub(r'(?i)\bNVARCHAR\b', 'VARCHAR', content)
    content = re.sub(r'(?i)\bNCHAR\b', 'CHAR', content)
    content = re.sub(r'(?i)\bDATETIME2\b', 'TIMESTAMP', content)
    content = re.sub(r'(?i)\bDATETIME\b', 'TIMESTAMP', content)
    content = re.sub(r'(?i)\bBIT\b', 'BOOLEAN', content)
    content = re.sub(r'(?i)\bIDENTITY\(\d+,\s*\d+\)', 'SERIAL', content)
    content = re.sub(r'(?i)\bIMAGE\b', 'BYTEA', content)
    content = re.sub(r'(?i)\bMONEY\b', 'DECIMAL(19,4)', content)
    
    # 4. Thay đổi tiền tố N'text' (Unicode trong MS SQL) thành 'text' trong Postgres
    content = re.sub(r"N'((?:''|[^'])*)'", r"'\1'", content)

    # 5. Loại bỏ CLUSTERED, NONCLUSTERED, các cấu hình filegroup
    content = re.sub(r'(?i)ON\s+PRIMARY', '', content)
    content = re.sub(r'(?i)TEXTIMAGE_ON\s+PRIMARY', '', content)
    content = re.sub(r'(?i)WITH\s*\([^)]*\)', '', content)
    content = re.sub(r'(?i)CLUSTERED', '', content)
    content = re.sub(r'(?i)NONCLUSTERED', '', content)

    # Viết ra file mới dạng UTF-8 chuẩn
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully translated {input_path} to {output_path}")

if __name__ == "__main__":
    translate_mssql_to_postgres('d:\\QLy Phòng Khám Thú Y\\Database\\PhongKhamThuY.sql', 'd:\\QLy Phòng Khám Thú Y\\Database\\PhongKhamThuY_Postgres.sql')
