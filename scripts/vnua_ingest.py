import os
import subprocess
import sys

# Đảm bảo console trên Windows in được tiếng Việt
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Tự động cài đặt thư viện cần thiết
def install_libraries():
    try:
        import requests
        import pypdf
    except ImportError:
        print("Đang cài đặt thư viện hỗ trợ tải và đọc PDF...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "pypdf"])

install_libraries()

import requests
from pypdf import PdfReader

# 11 Link giáo trình VNUA gốc
DOCS = {
    "benh_cho_meo": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/66.TY03018.-BENH-CUA-CHO-MEO.pdf",
    "benh_noi_khoa_1": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/35.TY03002.-BENH-NOI-KHOA-THU-Y-I.pdf",
    "benh_noi_khoa_2": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/36.TY03003.-BENH-NOI-KHOA-THU-Y-II.pdf",
    "phau_thuat_ngoai_khoa": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/57.TY03023.-PHAU-THUAT-NGOAI-KHOA-THU-Y-THUC-HANH.pdf",
    "giao_trinh_ngoai_khoa": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/08/TY03008_Benh-ngoai-khoa-Thu-y.pdf",
    "thuc_tap_ngoai_san": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/77.TY03045.-THUC-TAP-GIAO-TRINH-NGOAI-SAN.pdf",
    "thuc_tap_truyen_nhiem": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/79.TY03044.-THUC-TAP-GIAO-TRINH-TRUYEN-NHIEM.pdf",
    "benh_truyen_lay_nguoi_thu": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/52.TY03040.-BENH-TRUYEN-LAY-GIUA-DONG-VAT-VA-NGUOI.pdf",
    "duoc_ly_hoc": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/29.TY02006.-DUOC-LY-HOC-THU-Y.pdf",
    "benh_ly_hoc": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/28.TY02020.-BENH-LY-HOC-THU-Y.pdf",
    "mien_dich_hoc": "https://khoathuy.vnua.edu.vn/wp-content/uploads/2022/09/19.TY02014.-MIEN-DICH-HOC-THU-Y.pdf"
}

# Các thư mục lưu trữ
RAW_DIR = "Backend/src/main/resources/knowledge/vnua_docs"
PROCESSED_DIR = "Backend/src/main/resources/knowledge" # Đưa thẳng vào thư mục knowledge để Java quét

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

print("=== BẮT ĐẦU QUY TRÌNH NẠP TRI THỨC VNUA CHUYÊN SÂU ===")

for name, url in DOCS.items():
    pdf_path = os.path.join(RAW_DIR, f"{name}.pdf")
    md_path = os.path.join(PROCESSED_DIR, f"{name}.md")
    
    # 1. Tải File PDF nếu chưa có
    if not os.path.exists(pdf_path):
        print(f"\n[+] Đang tải giáo trình: {name}...")
        try:
            r = requests.get(url, headers=headers, timeout=30)
            if r.status_code == 200:
                with open(pdf_path, "wb") as f:
                    f.write(r.content)
                print(f"    -> Tải thành công! ({len(r.content)} bytes)")
            else:
                print(f"    [!] Thất bại, mã lỗi HTTP: {r.status_code}")
                continue
        except Exception as e:
            print(f"    [!] Lỗi khi tải: {e}")
            continue
    else:
        print(f"\n[~] File PDF '{name}.pdf' đã tồn tại. Bỏ qua bước tải.")

    # 2. Nghiền tri thức (Trích xuất toàn bộ text gốc)
    if os.path.exists(pdf_path) and not os.path.exists(md_path):
        print(f"[+] Đang nghiền tri thức từ {name}.pdf...")
        try:
            reader = PdfReader(pdf_path)
            full_text = []
            
            # Trích xuất từng trang
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    full_text.append(f"### TRANG {page_num + 1}\n{text}\n")
            
            # Lưu lại nguyên văn
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(f"# GIÁO TRÌNH GỐC VNUA: {name.upper()}\n\n")
                f.write("\n".join(full_text))
                
            print(f"    -> Nghiền thành công! Đã tạo {md_path} ({len(reader.pages)} trang).")
        except Exception as e:
            print(f"    [!] Lỗi khi nghiền PDF: {e}")
    else:
        print(f"[~] File tri thức '{name}.md' đã được nghiền trước đó. Bỏ qua.")

print("\n=== HOÀN TẤT NẠP TRI THỨC! REXI ĐÃ TRỞ NÊN SIÊU THÔNG THÁI ===")
