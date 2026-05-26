import os
import re
import sys
from pathlib import Path
from pypdf import PdfReader

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

RAW_DIR = Path("Backend/src/main/resources/knowledge/vnua_docs")
PROCESSED_DIR = Path("Backend/src/main/resources/knowledge")
INDEX_PATH = Path("uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md")
MAX_PAGES = 80
MIN_REAL_TEXT_CHARS = 800
SKIP_FILE_PATTERNS = [
    r"^1\.SH01001",
    r"^2\.TH01011",
    r"^3\.MT01004",
    r"^4\.ML01020",
    r"^5\.MT01002",
    r"^8\.TH01007",
    r"^9\.ML01021",
    r"^10\.CN02301",
    r"^12\.ML01022",
    r"^13\.ML01005",
    r"^14\.-ML01023",
    r"^17\.SN01032",
    r"^26\.SN01033",
    r"^40\.SN03055",
    r"^73\.MT02011",
    r"^82\.TY04998",
    r"^9c\.Programm",
    r"^Ban-dac-ta",
    r"^Program",
    r"^Programm",
    r"^TYCD_",
    r"^ifp-",
    r"^huongdan",
    r"^Thong-bao",
    r"^phu-luc",
    r"^ilovepdf",
    r"^(bichphuong|chuhuong|giang|giap|haithanh|hieu|hoangminh|huuanh|Lai-Thu-Hang|lanh|le|Le-Thi-Trang|linh|MTN|nam|ngoc|Nguyen-Anh-Tuan|Nguyen-Hong-Thu|nguyenmanhtuong|nguyenthanhtrung|nguyenthihangDL|nguyenthithanhha|nguyenthitrang|ninh|ntphuong|Pahmthilanhuong|phai|son|suthanhlong|tam|thai|thau|toan|trananh|trang|truong|vuthithutra|Yenpdf_merged-1)\.pdf$",
]

RAW_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)

def clean_title(file_name: str) -> str:
    base = Path(file_name).stem
    base = re.sub(r"^\d+[.\-_]*", "", base)
    base = base.replace("_", " ").replace("-", " ").replace(".", " ")
    base = re.sub(r"\s+", " ", base).strip()
    return base or Path(file_name).stem

def normalize_keywords(title: str) -> list[str]:
    words = re.findall(r"[A-Za-zÀ-ỹ0-9]+", title)
    keywords = []
    for word in words:
        if len(word) >= 3 and word.lower() not in {"pdf", "vnua", "merged", "web"}:
            keywords.append(word)
    extras = []
    lower = " ".join(keywords).lower()
    if "benh" in lower or "bệnh" in lower:
        extras.extend(["bệnh", "triệu chứng", "chẩn đoán", "điều trị", "phác đồ", "lâm sàng"])
    if "duoc" in lower or "dược" in lower or "thuoc" in lower or "thuốc" in lower:
        extras.extend(["thuốc", "dược lý", "liều dùng", "chống chỉ định", "tác dụng phụ"])
    if "ky sinh" in lower or "ký sinh" in lower:
        extras.extend(["ký sinh trùng", "giun", "ve", "ghẻ", "demodex"])
    if "truyen nhiem" in lower or "truyền nhiễm" in lower:
        extras.extend(["truyền nhiễm", "virus", "vi khuẩn", "vaccine", "parvo", "care", "dại"])
    if "ngoai khoa" in lower or "phau thuat" in lower or "phẫu thuật" in lower:
        extras.extend(["ngoại khoa", "phẫu thuật", "vết thương", "triệt sản", "mổ"])
    return list(dict.fromkeys(keywords + extras))

def should_skip_file(file_name: str) -> bool:
    return any(re.search(pattern, file_name, flags=re.IGNORECASE) for pattern in SKIP_FILE_PATTERNS)

def write_markdown(md_path: Path, file_name: str, reader: PdfReader, full_text: list[str]) -> str:
    title = clean_title(file_name)
    pdf_path = RAW_DIR / file_name
    keywords = normalize_keywords(title)
    text_chars = sum(len(item) for item in full_text)
    status = "text"
    with md_path.open("w", encoding="utf-8") as f:
        f.write(f"# TÀI LIỆU CHUYÊN MÔN VNUA: {title.upper()}\n\n")
        f.write(f"- File PDF gốc: {file_name}\n")
        f.write(f"- Đường dẫn nội bộ: {pdf_path.as_posix()}\n")
        f.write(f"- Số trang PDF: {len(reader.pages)}\n")
        f.write(f"- Từ khóa tra cứu: {', '.join(keywords)}\n\n")
        if text_chars >= MIN_REAL_TEXT_CHARS:
            f.write("## Nội dung trích xuất\n\n")
            f.write("\n".join(full_text))
        else:
            status = "scan"
            f.write("## Thẻ tra cứu tài liệu scan\n\n")
            f.write(
                "PDF này nhiều khả năng là bản scan/ảnh nên chưa trích xuất được chữ bằng pypdf. "
                "Khi người dùng hỏi trùng chủ đề, Rexi phải nói rõ đang dựa trên metadata tài liệu, "
                "gợi ý mở PDF gốc để kiểm tra chi tiết, và không bịa phác đồ cụ thể nếu không có đoạn trích văn bản.\n\n"
            )
            f.write("### Chủ đề có thể liên quan\n")
            for keyword in keywords:
                f.write(f"- {keyword}\n")
    return status

print("=== BẮT ĐẦU NGHIỀN TOÀN BỘ TÀI LIỆU PDF VNUA SANG MARKDOWN ===", flush=True)

pdf_files = sorted([
    f.name for f in RAW_DIR.iterdir()
    if f.is_file() and f.suffix.lower() == ".pdf" and not should_skip_file(f.name)
])
print(f"[*] Tìm thấy {len(pdf_files)} file PDF trong thư mục vnua_docs.", flush=True)

success_count = 0
skipped_count = 0
failed_count = 0
scan_count = 0
index_rows = []

for idx, file_name in enumerate(pdf_files):
    base_name = os.path.splitext(file_name)[0]
    pdf_path = RAW_DIR / file_name
    md_path = PROCESSED_DIR / f"{base_name}.md"
    
    # Kiểm tra xem file .md đã tồn tại chưa và có kích thước hợp lệ ko
    should_extract = True
    if md_path.exists():
        size = md_path.stat().st_size
        # Nếu file đã có tri thức thực sự thì bỏ qua để tiết kiệm thời gian.
        # File scan-card vẫn có metadata đủ dùng nên cũng được xem là hợp lệ.
        if size > 500:
            should_extract = False
            skipped_count += 1
            
    if should_extract:
        print(f"[{idx+1}/{len(pdf_files)}] Đang nghiền: {file_name}...", flush=True)
        try:
            reader = PdfReader(str(pdf_path))
            full_text = []
            total_pages = len(reader.pages)
            
            # Trích xuất phần đầu tài liệu để giữ knowledge vừa đủ token khi RAG.
            pages_to_extract = range(min(MAX_PAGES, total_pages))
            
            for page_num in pages_to_extract:
                page = reader.pages[page_num]
                text = page.extract_text()
                if text:
                    full_text.append(f"# ## TRANG {page_num + 1}\n{text}\n")
            
            status = write_markdown(md_path, file_name, reader, full_text)
            if status == "text":
                success_count += 1
            else:
                print(f"    [!] PDF scan/ít chữ, đã tạo thẻ metadata cho Rexi: {file_name}", flush=True)
                scan_count += 1
        except Exception as e:
            print(f"    [!] Lỗi khi xử lý {file_name}: {e}", flush=True)
            failed_count += 1

    title = clean_title(file_name)
    index_rows.append((title, file_name, f"Backend/src/main/resources/knowledge/vnua_docs/{file_name}"))

with INDEX_PATH.open("w", encoding="utf-8") as f:
    f.write("# THƯ VIỆN TÀI LIỆU VNUA CỤC BỘ CỦA REXI\n\n")
    f.write("Danh sách này được sinh tự động từ thư mục PDF gốc. Rexi Agent dùng để tra cứu nhanh tên tài liệu và đường dẫn nội bộ.\n\n")
    for title, file_name, local_path in index_rows:
        f.write(f"## {title}\n")
        f.write(f"- File: {file_name}\n")
        f.write(f"- Đường dẫn nội bộ: {local_path}\n")
        f.write(f"- Từ khóa: {', '.join(normalize_keywords(title))}\n\n")
            
print("\n=== HOÀN TẤT CHIẾN DỊCH NGHIỀN TRI THỨC! ===", flush=True)
print(f"🎉 Thành công: {success_count} file.")
print(f"⏭️ Bỏ qua (Đã có sẵn): {skipped_count} file.")
print(f"🖼️ Scan/metadata card: {scan_count} file.")
print(f"❌ Thất bại/Ảnh quét: {failed_count} file.")
print(f"📚 Index Agent: {INDEX_PATH}")
