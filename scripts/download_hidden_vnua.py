import os
import sys
import requests
from pypdf import PdfReader

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

RAW_DIR = "Backend/src/main/resources/knowledge/vnua_docs"
PROCESSED_DIR = "Backend/src/main/resources/knowledge"
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

FILE_ID = "17w_mJbvjXLdG0zM1RWx_8yPs2WU_OS0g"
pdf_path = os.path.join(RAW_DIR, "giao_trinh_ngoai_khoa_2019.pdf")
md_path = os.path.join(PROCESSED_DIR, "giao_trinh_ngoai_khoa_2019.md")

print("=== BẮT ĐẦU TẢI GIÁO TRÌNH BỆNH NGOẠI KHOA THÚ Y VNUA 2019 (ẨN) ===", flush=True)

def get_confirm_token(response):
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            return value
    for line in response.text.splitlines():
        if 'confirm=' in line:
            # Trích xuất confirm TOKEN từ html nếu có
            parts = line.split('confirm=')
            if len(parts) > 1:
                token = parts[1].split('&')[0].split('"')[0].split("'")[0]
                return token
    return None

def download_file_from_google_drive(file_id, destination):
    url = "https://docs.google.com/uc?export=download"
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    
    response = session.get(url, params={'id': file_id}, stream=True)
    token = get_confirm_token(response)
    
    if token:
        params = {'id': file_id, 'confirm': token}
        response = session.get(url, params=params, stream=True)
        
    with open(destination, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)

# Xóa file cũ bị lỗi nếu có
if os.path.exists(pdf_path):
    try:
        # Nếu dung lượng file quá nhỏ (dưới 10KB), khả năng cao là file HTML lỗi
        if os.path.getsize(pdf_path) < 10000:
            os.remove(pdf_path)
            print("[*] Đã dọn dẹp file tải lỗi cũ.", flush=True)
    except Exception:
        pass

# 1. Tải từ Google Drive
if not os.path.exists(pdf_path):
    print(f"[*] Đang kết nối và tải file từ Google Drive (ID: {FILE_ID}) với thuật toán chống chặn...", flush=True)
    try:
        download_file_from_google_drive(FILE_ID, pdf_path)
        print(f"    -> Tải thành công! Kích thước file: {os.path.getsize(pdf_path)} bytes.", flush=True)
    except Exception as e:
        print(f"    [!] Thất bại khi tải file từ Google Drive: {e}", flush=True)
        sys.exit(1)
else:
    print(f"[~] File PDF đã tồn tại tại {pdf_path}. Bỏ qua bước tải.", flush=True)

# 2. Nghiền tri thức (Trích xuất văn bản)
if os.path.exists(pdf_path) and not os.path.exists(md_path):
    print(f"[*] Đang nghiền tri thức từ giao_trinh_ngoai_khoa_2019.pdf...", flush=True)
    try:
        reader = PdfReader(pdf_path)
        full_text = []
        total_pages = len(reader.pages)
        print(f"    -> File PDF có tổng cộng {total_pages} trang.", flush=True)
        
        # Trích xuất tối đa 100 trang đầu tiên
        pages_to_extract = list(range(min(100, total_pages)))
        
        for page_num in pages_to_extract:
            page = reader.pages[page_num]
            text = page.extract_text()
            if text:
                full_text.append(f"# ## TRANG {page_num + 1}\n{text}\n")
                
        with open(md_path, "w", encoding="utf-8") as f:
            f.write("# GIÁO TRÌNH NGOẠI KHOA THÚ Y VNUA 2019 - ĐỘC QUYỀN\n\n")
            f.write(f"Nguồn gốc: Học viện Nông nghiệp Việt Nam (NXB Học viện Nông nghiệp 2019)\n\n")
            f.write("\n".join(full_text))
            
        print(f"    -> Nghiền thành công! Đã tạo file tri thức {md_path} ({len(pages_to_extract)} trang).", flush=True)
    except Exception as e:
        print(f"    [!] Thất bại khi trích xuất văn bản: {e}", flush=True)
else:
    print(f"[~] File tri thức đã được tạo tại {md_path}. Bỏ qua bước nghiền.", flush=True)

print("=== HOÀN TẤT NẠP GIÁO TRÌNH NGOẠI KHOA VNUA 2019 SIÊU HIẾM! ===", flush=True)
