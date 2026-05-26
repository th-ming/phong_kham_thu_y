import os
import re

# Bộ quy tắc chuyển đổi comment sang Minimalist & Pragmatic Tech Commenting Style
TEENCODE_MAP = {
    r"\b[Kk]hông\b": "ko",
    r"\b[Tt]ôi\b": "t",
    r"\b[Mm]ày\b": "m",
    r"\b[Cc]húng tôi\b": "t",
    r"\b[Cc]ơ sở dữ liệu\b": "db",
    r"\b[Cc]ấu hình\b": "config",
    r"\b[Ss]ố điện thoại\b": "sđt",
    r"\b[Cc]hứng thực\b": "auth",
    r"\b[Xx]ác nhận\b": "xn",
    r"\b[Bb]ác sĩ\b": "bs",
    r"\b[Đđ]iện thoại\b": "dt",
    r"\b[Aa]dmin\b": "ADMIN",
    r"\b[Bb]ac_si\b": "BAC_SI",
    r"\b[Tt]iep_tan\b": "TIEP_TAN",
    r"\b[Tt]oken\b": "TOKEN",
    r"\b[Dd]atabase\b": "DB",
    r"\b[Ff]orbidden\b": "403_FORBIDDEN",
    r"\b[Ii]dor\b": "IDOR",
    r"\b[Xx]ss\b": "XSS",
    r"\b[Ss]qli\b": "SQLi",
    r"\b[Ss]ếp ơi\b": "t",
    r"\b[Mm]áy sếp\b": "máy",
}

def clean_comment_text(comment):
    # Loại bỏ các từ chào hỏi, trò chuyện thừa thãi
    comment = re.sub(r"(sếp ơi|sếp|máy sếp|ôi sếp ơi|dạ|ạ)\b", "", comment, flags=re.IGNORECASE)
    
    # Áp dụng teencode và uppercase các từ khóa quan trọng
    for pattern, replacement in TEENCODE_MAP.items():
        comment = re.sub(pattern, replacement, comment)
        
    # Loại bỏ khoảng trắng thừa
    comment = re.sub(r"\s+", " ", comment).strip()
    return comment

def process_java_comment(match):
    full_match = match.group(0)
    if full_match.startswith("//"):
        comment_text = full_match[2:].strip()
        cleaned = clean_comment_text(comment_text)
        if not cleaned:
            return ""
        return f"// {cleaned}"
    elif full_match.startswith("/*"):
        comment_text = full_match[2:-2].strip()
        # Nếu là javadoc hoặc comment nhiều dòng, ta rút gọn thành 1 dòng duy nhất dạng //
        cleaned = clean_comment_text(comment_text)
        if not cleaned:
            return ""
        return f"// {cleaned}"
    return full_match

def process_python_ps_comment(match):
    full_match = match.group(0)
    comment_text = full_match[1:].strip()
    cleaned = clean_comment_text(comment_text)
    if not cleaned:
        return ""
    return f"# {cleaned}"

def clean_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        ext = os.path.splitext(file_path)[1].lower()
        
        # Regex tìm kiếm comment
        if ext in [".java", ".ts", ".tsx", ".js", ".jsx"]:
            # Tránh sửa các URL như http:// hoặc https://
            # Pattern này khớp với // comment nhưng ko khớp với http://
            pattern = r"(?<!:)\/\/.*|\/\*[\s\S]*?\*\/"
            new_content = re.sub(pattern, process_java_comment, content)
        elif ext in [".py", ".ps1"]:
            # Pattern khớp với # comment nhưng không khớp với # trong string hay header/shebang
            pattern = r"#.*"
            new_content = re.sub(pattern, process_python_ps_comment, content)
        else:
            return False
            
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Cleaned: {file_path}")
            return True
        else:
            print(f"No changes / Already clean: {file_path}")
            return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

# Đọc task.md và tìm các file chưa hoàn thành
task_md_path = r"C:\Users\84916\.gemini\antigravity\brain\b560d2f5-a29f-4715-bcf9-0132081be43f\task.md"
base_dir = r"d:\QLy Phòng Khám Thú Y"

if os.path.exists(task_md_path):
    with open(task_md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    new_lines = []
    for line in lines:
        match = re.match(r"- `\[ \]` (.*)", line)
        if match:
            rel_path = match.group(1).strip()
            # Bỏ qua file .agent và chính file script dọn dẹp nếu có
            if ".agent" in rel_path or "CleanAllComments.py" in rel_path:
                new_lines.append(line)
                continue
                
            abs_path = os.path.join(base_dir, rel_path)
            success = clean_file(abs_path)
            if success:
                new_lines.append(line.replace("`[ ]`", "`[x]`"))
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    with open(task_md_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("task.md updated successfully!")
else:
    print("task.md not found!")
