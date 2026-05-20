import os
import sys
from pypdf import PdfReader

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

RAW_DIR = "Backend/src/main/resources/knowledge/vnua_docs"
PROCESSED_DIR = "Backend/src/main/resources/knowledge"

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

print("=== BẮT ĐẦU NGHIỀN TOÀN BỘ 243 TÀI LIỆU PDF VNUA SANG MARKDOWN ===", flush=True)

pdf_files = [f for f in os.listdir(RAW_DIR) if f.lower().endswith('.pdf')]
print(f"[*] Tìm thấy {len(pdf_files)} file PDF trong thư mục vnua_docs.", flush=True)

success_count = 0
skipped_count = 0
failed_count = 0

for idx, file_name in enumerate(pdf_files):
    base_name = os.path.splitext(file_name)[0]
    pdf_path = os.path.join(RAW_DIR, file_name)
    md_path = os.path.join(PROCESSED_DIR, f"{base_name}.md")
    
    # Kiểm tra xem file .md đã tồn tại chưa và có kích thước hợp lệ không
    should_extract = True
    if os.path.exists(md_path):
        size = os.path.getsize(md_path)
        # Nếu file đã có tri thức thực sự (> 500 bytes) thì bỏ qua để tiết kiệm thời gian
        if size > 500:
            should_extract = False
            skipped_count += 1
            
    if should_extract:
        print(f"[{idx+1}/{len(pdf_files)}] Đang nghiền: {file_name}...", flush=True)
        try:
            reader = PdfReader(pdf_path)
            full_text = []
            total_pages = len(reader.pages)
            
            # Trích xuất tối đa 50 trang đầu (hoặc toàn bộ nếu ngắn hơn) để tối ưu dung lượng
            pages_to_extract = range(min(50, total_pages))
            
            for page_num in pages_to_extract:
                page = reader.pages[page_num]
                text = page.extract_text()
                if text:
                    full_text.append(f"### TRANG {page_num + 1}\n{text}\n")
            
            if full_text:
                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(f"# TÀI LIỆU CHUYÊN MÔN VNUA: {base_name.upper()}\n\n")
                    f.write(f"Nguồn: {file_name}\n\n")
                    f.write("\n".join(full_text))
                success_count += 1
            else:
                print(f"    [!] Cảnh báo: Không trích xuất được văn bản từ {file_name} (Có thể là file scan dạng ảnh).", flush=True)
                # Tạo file md tượng trưng để không quét lại
                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(f"# TÀI LIỆU VNUA: {base_name.upper()}\n(Tài liệu dạng ảnh quét)\n")
                failed_count += 1
        except Exception as e:
            print(f"    [!] Lỗi khi xử lý {file_name}: {e}", flush=True)
            failed_count += 1
            
print("\n=== HOÀN TẤT CHIẾN DỊCH NGHIỀN TRI THỨC! ===", flush=True)
print(f"🎉 Thành công: {success_count} file.")
print(f"⏭️ Bỏ qua (Đã có sẵn): {skipped_count} file.")
print(f"❌ Thất bại/Ảnh quét: {failed_count} file.")
