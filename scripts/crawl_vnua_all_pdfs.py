import os
import sys
import time
import requests
from bs4 import BeautifulSoup
import urllib.parse
from pypdf import PdfReader

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure directories exist
RAW_DIR = "Backend/src/main/resources/knowledge/vnua_docs"
PROCESSED_DIR = "Backend/src/main/resources/knowledge"
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Crawler settings
BASE_URL = "https://khoathuy.vnua.edu.vn"
visited_pages = set()
pages_to_visit = [
    "https://khoathuy.vnua.edu.vn/",
    "https://khoathuy.vnua.edu.vn/dao-tao/dai-hoc/",
    "https://khoathuy.vnua.edu.vn/nghien-cuu-khoa-hoc/",
    "https://khoathuy.vnua.edu.vn/sinh-vien/"
]
pdf_links = set()

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

print("=== BẮT ĐẦU CÀO TOÀN BỘ GIÁO TRÌNH KHOA THÚ Y VNUA ===", flush=True)

# Phase 1: Crawl to find PDF links
MAX_PAGES = 100
page_count = 0

print(f"[*] Giai đoạn 1: Quét website để tìm link PDF (Tối đa {MAX_PAGES} trang)...", flush=True)
while pages_to_visit and page_count < MAX_PAGES:
    url = pages_to_visit.pop(0)
    if url in visited_pages:
        continue
    visited_pages.add(url)
    page_count += 1
    
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200 or "text/html" not in r.headers.get("Content-Type", ""):
            continue
            
        soup = BeautifulSoup(r.text, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urllib.parse.urljoin(BASE_URL, href)
            
            # Remove fragments
            if '#' in full_url:
                full_url = full_url.split('#')[0]
                
            if full_url.lower().endswith('.pdf'):
                pdf_links.add(full_url)
            elif full_url.startswith(BASE_URL) and full_url not in visited_pages:
                if "/wp-content/uploads/" not in full_url and "/category/" not in full_url:
                    # Avoid adding too many media links or duplicate category pages
                    if full_url not in pages_to_visit:
                        pages_to_visit.append(full_url)
    except Exception as e:
        pass

print(f"[+] Hoàn tất quét. Đã tìm thấy {len(pdf_links)} file PDF.", flush=True)

# Phase 2: Download and extract
print("\n[*] Giai đoạn 2: Tải và nghiền tài liệu thành Markdown...", flush=True)

for pdf_url in pdf_links:
    file_name = urllib.parse.unquote(pdf_url.split('/')[-1])
    base_name = file_name.replace('.pdf', '')
    
    pdf_path = os.path.join(RAW_DIR, file_name)
    md_path = os.path.join(PROCESSED_DIR, f"{base_name}.md")
    
    # Download
    if not os.path.exists(pdf_path):
        print(f"    -> Đang tải: {file_name}", flush=True)
        try:
            r = requests.get(pdf_url, headers=headers, timeout=30)
            if r.status_code == 200:
                with open(pdf_path, "wb") as f:
                    f.write(r.content)
            else:
                continue
        except Exception:
            continue
            
    # Extract
    if os.path.exists(pdf_path) and not os.path.exists(md_path):
        print(f"    -> Đang trích xuất (nghiền): {file_name}", flush=True)
        try:
            reader = PdfReader(pdf_path)
            full_text = []
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    full_text.append(f"### TRANG {page_num + 1}\n{text}\n")
            
            if full_text:
                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(f"# TÀI LIỆU VNUA: {base_name}\n\n")
                    f.write(f"Nguồn: {pdf_url}\n\n")
                    f.write("\n".join(full_text))
        except Exception as e:
            print(f"       [!] Lỗi trích xuất: {e}", flush=True)

print("\n=== HOÀN TẤT NẠP TRI THỨC! CHATBOT ĐÃ SẴN SÀNG ===", flush=True)
