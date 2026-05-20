import requests
from bs4 import BeautifulSoup
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

urls = [
    "http://infolib.vnua.edu.vn",
    "http://mainlib.vnua.edu.vn"
]

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

for url in urls:
    print(f"\n=== QUÉT LINKS TẠI: {url} ===", flush=True)
    try:
        res = session.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        links = soup.find_all("a")
        print(f"Tìm thấy {len(links)} thẻ <a>.")
        for idx, link in enumerate(links):
            href = link.get("href")
            text = link.get_text(strip=True)
            if href and any(k in href.lower() or k in text.lower() for k in ["login", "đăng nhập", "tai khoan", "tài khoản", "member", "user"]):
                print(f"  [{idx+1}] Href: '{href}', Text: '{text}'")
    except Exception as e:
        print(f"[!] Lỗi: {e}", flush=True)
