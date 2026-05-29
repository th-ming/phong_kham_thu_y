#!/usr/bin/env python3
"""Patch buildSystemPrompt + buildAgentIdentityBlock - ACTION FIRST"""
import sys, re, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

# Dung absolute path voi ten co dau
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JAVA = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service')
react_path = os.path.join(JAVA, 'ReActAgentService.java')

print('Reading:', react_path)
print('Exists:', os.path.exists(react_path))

with open(react_path, 'r', encoding='utf-16', errors='replace') as f:
    react = f.read()

print('File chars:', len(react))

# === Tim buildSystemPrompt method ===
sp_start = react.find('    private String buildSystemPrompt(')
# Tim method tiep theo de xac dinh end
id_start = react.find('    private String buildAgentIdentityBlock(', sp_start + 100)
print(f'buildSystemPrompt at {sp_start}, buildAgentIdentityBlock at {id_start}')

if sp_start < 0 or id_start < 0:
    print('ERROR: Cannot find method boundaries')
    sys.exit(1)

old_sp = react[sp_start:id_start]
print(f'Old buildSystemPrompt: {len(old_sp)} chars')

# Viet lai method - NGAN, ACTION-FIRST
new_sp = '''    private String buildSystemPrompt(String userQuery, String username, String userRole) {
        String globalCtx = memoryService.getGlobalContext(userQuery);
        String userCtx   = (username != null) ? memoryService.getUserContext(username) : "";
        boolean isStaff  = isStaffRole(userRole);
        String toolsSchema = toolService.getToolsSchemaForRole(userRole);
        String normalizedRole = RoleAccessPolicy.normalizeRole(userRole);

        // Quy tac y te phan tang theo vai tro
        String medicalRule = switch (normalizedRole) {
            case "bac_si" ->
                "- Y te: ho tro chuyen sau (phan oan, nhom thuoc, lieu tham khao). Ghi ro la tham khao, quyet dinh cuoi do bac si.\\n";
            case "y_ta" ->
                "- Y te: ho tro cham soc, huong dan sau dieu tri. KHONG ke phac do/lieu; chuyen bac si xu ly.\\n";
            default ->
                "- Y te: KHONG chan doan, KHONG ke thuoc, KHONG neu lieu. Chi so cap an toan va huong dan gap bac si.\\n";
        };

        String roleCtx = isStaff
            ? "Nhan vien noi bo - vai tro: " + userRole + ". Chi dung tool trong danh sach quyen."
            : "Khach hang - username: " + username + ". Chi dung tool khach duoc phep.";

        return buildAgentIdentityBlock(userRole, isStaff)
            + "\\n\\n" + toolsSchema
            + "\\n\\n=== NGU CANH PHONG KHAM ===\\n" + globalCtx
            + "\\n=== THONG TIN NGUOI DUNG ===\\n" + userCtx
            + "\\n=== VAI TRO ===\\n" + roleCtx
            + "\\n\\n=== QUY TAC HANH DONG (BAT BUOC) ===\\n"
            + "- ACT FIRST: co du du lieu -> goi tool NGAY. Khong giai thich, khong thong bao truoc.\\n"
            + "- Thieu thong tin: hoi DUY NHAT 1 cau ngan ve truong con thieu.\\n"
            + "- final_answer: ngan gon, thuc chat. Khong mo dau, khong lap lai toan bo du lieu tu tool.\\n"
            + "- TUYET DOI khong noi 'de toi kiem tra', 'toi se...', 'bay gio toi'. Cu goi tool/tra loi.\\n"
            + "- 'lam di'/'dat luon'/'huy luon'/'chot luon': chay tool ngay, khong xin them xac nhan.\\n"
            + "- Xac nhan (ok/sure/duoc/chot/yep): thuc hien hanh dong dang cho ngay.\\n"
            + "- Ngon ngu: hieu moi dang (Gen Z, teencode, khong dau, Anh-Viet tron). Tra loi tieng Viet chuan.\\n"
            + "- GOI TOOL: chuan hoa tham so (loai='Meo'/'Cho', ngay=YYYY-MM-DD, gio=HH:mm).\\n"
            + medicalRule
            + "- NAVIGATE: phat [NAVIGATE:duong_dan] khi user muon chuyen trang/phan he.\\n"
            + "- UI: phat [CLICK:id] [FILL:id|val] [SELECT:id|val] [TOGGLE:id] khi co DOM context va user nho lam.\\n"
            + "\\n=== SITEMAP ===\\n"
            + "[Khach] / | /bang-gia | /bac-si | /lien-he | /khach-hang/dashboard\\n"
            + "/khach-hang/dat-lich-hen | /khach-hang/lich-su-lich-hen | /khach-hang/quan-ly-thu-cung\\n"
            + "/khach-hang/ho-so-benh-an | /khach-hang/hoa-don-thanh-toan | /khach-hang/thong-tin-ca-nhan\\n"
            + "[QL/NV] /quan-ly/dashboard | /quan-ly/lich-hen | /quan-ly/khach-hang-thu-cung\\n"
            + "/quan-ly/ho-so-benh-an | /quan-ly/kham-benh | /quan-ly/don-thuoc | /quan-ly/hoa-don\\n"
            + "/quan-ly/kho-thuoc | /quan-ly/nhap-kho | /quan-ly/nhan-vien-phan-quyen\\n"
            + "/quan-ly/bao-cao-thong-ke | /quan-ly/ke-toan | /quan-ly/dich-vu | /quan-ly/cau-hinh\\n";
    }

'''

react = react[:sp_start] + new_sp + react[id_start:]
print(f'New buildSystemPrompt: {len(new_sp)} chars (was {len(old_sp)})')

# === Cap nhat buildAgentIdentityBlock - ngan gon hon ===
# Tim lai vi tri sau khi replace
id_start2 = react.find('    private String buildAgentIdentityBlock(', sp_start + len(new_sp) - 100)
if id_start2 < 0:
    id_start2 = react.find('    private String buildAgentIdentityBlock(')
print(f'buildAgentIdentityBlock at: {id_start2}')

if id_start2 > 0:
    # Tim het method
    next_method = react.find('\n    private ', id_start2 + 100)
    if next_method < 0:
        next_method = react.find('\n    public ', id_start2 + 100)
    old_id = react[id_start2:next_method]
    print(f'Old buildAgentIdentityBlock: {len(old_id)} chars')

    new_id = '''    private String buildAgentIdentityBlock(String userRole, boolean isStaff) {
        return """
            === DANH TINH AGENT ===
            - Ban la Rexi Agent - tro ly hanh dong cua phong kham thu y Rexi.
            - Vai tro: %s. Chi thao tac trong pham vi quyen nay.
            - Stack: Groq (Llama 3.3 70B) -> Gemini -> OpenRouter (fallback).
            - NGUYEN TAC: hanh dong truoc, giai thich sau neu can. Ngan gon la uu tien.
            """.formatted(userRole == null || userRole.isBlank() ? (isStaff ? "noi bo" : "khach/an danh") : userRole);
    }

'''
    react = react[:id_start2] + new_id + react[next_method:]
    print(f'New buildAgentIdentityBlock: {len(new_id)} chars (was {len(old_id)})')

# === Ghi file ===
with open(react_path, 'w', encoding='utf-16') as f:
    f.write(react)
print(f'\nFile saved! Total: {len(react)} chars')
