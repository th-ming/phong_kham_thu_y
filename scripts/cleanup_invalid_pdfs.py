import os
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

RAW_DIR = "Backend/src/main/resources/knowledge/vnua_docs"

if os.path.exists(RAW_DIR):
    files = os.listdir(RAW_DIR)
    deleted_count = 0
    for f in files:
        if f.lower().endswith(".pdf"):
            path = os.path.join(RAW_DIR, f)
            try:
                with open(path, "rb") as file:
                    header = file.read(4)
                    if header != b"%PDF":
                        print(f"[*] Phát hiện file hỏng/lỗi (không có header %PDF): {f}. Đang xóa...", flush=True)
                        file.close()
                        os.remove(path)
                        deleted_count += 1
            except Exception as e:
                print(f"[!] Lỗi khi kiểm tra {f}: {e}", flush=True)
    print(f"=== ĐÃ DỌN DẸP XONG! Đã xóa {deleted_count} file lỗi. ===", flush=True)
else:
    print("[!] Thư mục vnua_docs không tồn tại.", flush=True)
