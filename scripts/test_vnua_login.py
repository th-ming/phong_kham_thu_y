import requests
from bs4 import BeautifulSoup
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

username = "671688"
password = "Tranminh09818@"

print(f"=== ĐANG KIỂM TRA ĐĂNG NHẬP THƯ VIỆN VNUA VỚI TK: {username} ===", flush=True)

# Thử các địa chỉ thư viện VNUA phổ biến
urls = [
    "http://infolib.vnua.edu.vn",
    "http://mainlib.vnua.edu.vn"
]

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

for url in urls:
    print(f"\n[*] Đang kết nối tới: {url}...", flush=True)
    try:
        # Truy cập trang chủ để lấy cookie ban đầu
        res = session.get(url, timeout=10)
        print("Status code:", res.status_code)
        
        # Phân tích cú pháp HTML để tìm form đăng nhập hoặc các endpoint đăng nhập
        soup = BeautifulSoup(res.text, "html.parser")
        forms = soup.find_all("form")
        print(f" Tìm thấy {len(forms)} form trên trang.")
        for idx, form in enumerate(forms):
            action = form.get("action")
            method = form.get("method", "get")
            print(f"  Form {idx+1}: action='{action}', method='{method}'")
            inputs = form.find_all("input")
            for inp in inputs:
                print(f"    Input: name='{inp.get('name')}', type='{inp.get('type')}'")
                
    except Exception as e:
        print(f" [!] Lỗi khi kết nối tới {url}: {e}", flush=True)
