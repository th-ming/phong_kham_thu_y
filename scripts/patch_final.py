#!/usr/bin/env python3
"""Patch FINAL: System prompt cực kỳ action-first, cấm nói nhiều"""
import sys, os, shutil
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

CWD = os.getcwd()
react_path = os.path.join(CWD, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')
temp_path  = os.path.join(CWD, 'scripts', 'react_temp.java')

shutil.copy2(react_path, temp_path)

with open(temp_path, 'r', encoding='utf-16') as f:
    content = f.read()

print('File chars:', len(content))
patches = 0

# === PATCH: Thay toan bo QUY TAC HANH DONG section ===
# Tim doan "=== QUY TAC HANH DONG" den het
old_rules_marker = '=== QUY TAC HANH DONG (BAT BUOC) ==='
idx_rules = content.find(old_rules_marker)
print(f'QUY TAC HANH DONG at: {idx_rules}')

if idx_rules >= 0:
    # Tim het section (den === SITEMAP ===)
    sitemap_marker = '=== SITEMAP ==='
    idx_sitemap = content.find(sitemap_marker, idx_rules)
    print(f'SITEMAP at: {idx_sitemap}')

    if idx_sitemap > idx_rules:
        old_rules = content[idx_rules:idx_sitemap]
        print('Old rules block:', repr(old_rules[:200]))

        # Viet lai rules - cuc ky ngan, cam noi nhieu
        new_rules = '''=== LUAT HANH DONG (BAT BUOC, VI PHAM = SAI) ===\\n"
            + "1. CO DU DATA -> GOI TOOL NGAY. Khong bao truoc, khong giai thich.\\n"
            + "2. THIEU 1 TRUONG -> Hoi duy nhat 1 cau <= 10 tu.\\n"
            + "3. final_answer: toi da 2-3 cau. Khong mo dau, khong tong ket lai tool data.\\n"
            + "4. CAM DUNG: 'de toi', 'toi se', 'dua tren', 'theo nhu', 'hien tai he thong'. Cu lam.\\n"
            + "5. User noi 'lam di/chot/ok/sure' -> chay tool ngay, khong xin them xac nhan.\\n"
            + "6. Ngon ngu bat ky (Gen Z/teencode/khong dau) -> hieu y, tra loi tieng Viet ngan.\\n"
            + "7. GOI TOOL: chuan hoa (loai=Meo/Cho, ngay=YYYY-MM-DD, gio=HH:mm).\\n"
            + medicalRule
            + "9. NAVIGATE: [NAVIGATE:path] khi user muon chuyen trang.\\n"
            + "10. UI ACTION: [CLICK:id] [FILL:id|val] [SELECT:id|val] khi co DOM + user nho.\\n"
            + "\\n'''

        content = content[:idx_rules] + new_rules + content[idx_sitemap:]
        print('PATCH OK - Rules section replaced with aggressive action-first')
        patches += 1

# === PATCH 2: Groq temperature xuong 0.1 cho task-oriented (it sang tao, nhieu thuc thi) ===
if '"temperature", 0.3' in content:
    content = content.replace('"temperature", 0.3', '"temperature", 0.1')
    print('PATCH 2 OK - temperature 0.3->0.1 (uu tien thuc thi, han che sang tac)')
    patches += 1

# === PATCH 3: Tool result message - ngan hon nua ===
# Thay "Tra final_answer ngan gon. Khong giai thich..."
old_tr = 'Tr\u1ea3 final_answer ng\u1eafn g\u1ecdn. Kh\u00f4ng gi\u1ea3i th\u00edch qu\u00e1 tr\u00ecnh, kh\u00f4ng nh\u1eafc l\u1ea1i to\u00e0n b\u1ed9 d\u1eef li\u1ec7u tool.'
new_tr = 'final_answer ngay, <= 3 cau, khong mo dau.'
if old_tr in content:
    content = content.replace(old_tr, new_tr)
    print('PATCH 3 OK - Tool result instruction: ultra-short')
    patches += 1
else:
    # Thu tim phan cuoi
    trc = content.find('toolResultMsg.setContent(')
    if trc >= 0:
        chunk = content[trc:trc+400]
        nn = chunk.rfind('\\n\\n')
        if nn >= 0:
            end_q = chunk.find('"', nn + 4)
            if end_q >= 0:
                content = content[:trc+nn+4] + 'final_answer ngay, <= 3 cau, khong mo dau.' + content[trc+end_q:]
                print('PATCH 3 OK (indirect)')
                patches += 1

with open(temp_path, 'w', encoding='utf-16') as f:
    f.write(content)
shutil.copy2(temp_path, react_path)
os.remove(temp_path)
print(f'\n{patches} patches. Done. File: {len(content)} chars')
