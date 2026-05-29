#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch ReActAgentService.java - UTF-16 LE mode
"""

import re, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.normpath(os.path.join(SCRIPT_DIR, '..', 
    'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java'))

print("Target file:", FILE)

# Doc file UTF-16 LE (co BOM FF FE)
with open(FILE, 'r', encoding='utf-16') as f:
    content = f.read()

print("Decoded chars:", len(content))
print("Has handleDeterministicClinicAgentQuery:", 'handleDeterministicClinicAgentQuery' in content)

patches_ok = 0

# =====================================================================
# PATCH 1: Xoa call handleDeterministicClinicAgentQuery trong run()
# Va cap nhat greeting
# =====================================================================
# Tim chinh xac doan text can thay
target1_start = '        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test)$")) {'
idx1 = content.find(target1_start)
if idx1 >= 0:
    # Tim den het block + block goi deterministic
    end_marker = '        if (deterministicVetResult != null) {\n            return deterministicVetResult;\n        }'
    idx1_end = content.find(end_marker, idx1)
    if idx1_end >= 0:
        idx1_end += len(end_marker)
        old_block = content[idx1:idx1_end]
        new_block = (
            '        // Greeting thuan tuy - chi xu ly instant, moi cau hoi thuc te de LLM tu phan tich.\n'
            '        // LLM (Groq Llama 3.3 70B) duoc train tren internet nen hieu Gen Z, teencode tu nhien.\n'
            '        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test|ping|yo|sup)$")) {\n'
            '            String greeting = "D\u1ea1, Rexi \u0111\u00e2y \u1ea1! S\u1ebfp/b\u1ea1n c\u1ea7n h\u1ed7 tr\u1ee3 g\u00ec \u2014 \u0111\u1eb7t l\u1ecbch, xem h\u1ed3 s\u01a1, tra c\u1ee9u th\u00fa c\u01b0ng hay h\u1ecfi th\u00fa y \u0111\u1ec1u \u0111\u01b0\u1ee3c nha!";\n'
            '            steps.add(new ReActStep("FINAL", greeting, null, null, null));\n'
            '            return new ReActResult(greeting, steps);\n'
            '        }'
        )
        content = content[:idx1] + new_block + content[idx1_end:]
        print("[PATCH 1] OK - Da xoa call handleDeterministicClinicAgentQuery + cap nhat greeting")
        patches_ok += 1
    else:
        print("[PATCH 1] FAIL - Khong tim thay end_marker")
else:
    print("[PATCH 1] FAIL - Khong tim thay target1_start")
    print("  Trying to find greeting block...")
    idx_alt = content.find('normalizedQuery.matches("^(hi|')
    print("  Found at:", idx_alt)

# =====================================================================
# PATCH 2: Xoa toan bo method handleDeterministicClinicAgentQuery
# =====================================================================
pattern = re.compile(
    r'    private ReActResult handleDeterministicClinicAgentQuery\([^)]+\)\s*\{.*?return null;\n    \}\n',
    re.DOTALL
)
m = pattern.search(content)
if m:
    replacement = (
        '    // handleDeterministicClinicAgentQuery da duoc go bo.\n'
        '    // Ly do: keyword matching cung nhac khong bao gio du - ngon ngu Gen Z cap nhat hang ngay.\n'
        '    // Giai phap dung: LLM (Groq Llama 3.3 70B) tu hieu ngu canh va goi dung tool.\n'
    )
    content = content[:m.start()] + replacement + content[m.end():]
    print("[PATCH 2] OK - Da xoa method handleDeterministicClinicAgentQuery")
    patches_ok += 1
else:
    print("[PATCH 2] FAIL - Regex khong match method")
    # Thu tim signature
    sig_idx = content.find('private ReActResult handleDeterministicClinicAgentQuery(')
    print("  Signature found at:", sig_idx)

# =====================================================================
# PATCH 3: Dao thu tu provider - Groq len dau
# =====================================================================
# Tim method callBestAvailableModel
method_marker = 'private ModelResponse callBestAvailableModel(List<ChatMessage> history) throws Exception {'
m3_idx = content.find(method_marker)
if m3_idx >= 0:
    # Tim het method (dong ket thuc voi "    }" ngay truoc method tiep theo)
    # Tim 3 provider blocks va reorder
    sub_start = m3_idx
    sub_end = content.find('\n    private ', m3_idx + 100)
    if sub_end < 0:
        sub_end = content.find('\n    public ', m3_idx + 100)
    
    old_method = content[sub_start:sub_end]
    
    new_method = (
        'private ModelResponse callBestAvailableModel(List<ChatMessage> history) throws Exception {\n'
        '        Exception lastError = null;\n'
        '\n'
        '        // Groq len dau: Llama 3.3 70B, phan hoi ~0.3-0.8s, hieu tu nhien moi ngon ngu ke ca Gen Z\n'
        '        try {\n'
        '            String response = groqService.chat(history);\n'
        '            logger.info("[ReAct] Model phan hoi thanh cong: Groq");\n'
        '            return new ModelResponse(response, "Groq");\n'
        '        } catch (Exception e) {\n'
        '            lastError = e;\n'
        '            logger.warning("[ReAct] Groq loi, fallback sang Gemini: " + e.getMessage());\n'
        '        }\n'
        '\n'
        '        // Fallback 1: Gemini\n'
        '        try {\n'
        '            String response = geminiService.chat(history);\n'
        '            logger.info("[ReAct] Model phan hoi thanh cong (Fallback 1): Gemini");\n'
        '            return new ModelResponse(response, "Gemini");\n'
        '        } catch (Exception e) {\n'
        '            lastError = e;\n'
        '            logger.warning("[ReAct] Gemini loi, fallback sang OpenRouter: " + e.getMessage());\n'
        '        }\n'
        '\n'
        '        // Fallback 2: OpenRouter (cham hon nhung nhieu model phu)\n'
        '        try {\n'
        '            String response = openRouterService.chat(history);\n'
        '            logger.info("[ReAct] Model phan hoi thanh cong (Fallback 2): OpenRouter");\n'
        '            return new ModelResponse(response, "OpenRouter");\n'
        '        } catch (Exception e) {\n'
        '            lastError = e;\n'
        '            logger.warning("[ReAct] OpenRouter loi: " + e.getMessage());\n'
        '        }\n'
        '\n'
        '        throw lastError != null ? lastError : new RuntimeException("Khong co provider AI kha dung.");\n'
        '    }\n'
    )
    content = content[:sub_start] + new_method + content[sub_end:]
    print("[PATCH 3] OK - Da dao thu tu: Groq -> Gemini -> OpenRouter")
    patches_ok += 1
else:
    print("[PATCH 3] FAIL - Khong tim thay callBestAvailableModel")

# =====================================================================
# PATCH 4: Mo rong isAffirmation
# =====================================================================
old_aff = (
    'private boolean isAffirmation(String normalizedQuery) {\n'
    '        return normalizedQuery.matches("^(ok|oke|okay|dong y|xac nhan|chot|lam di|mo di|duoc|yes|y)$");\n'
    '    }'
)
new_aff = (
    'private boolean isAffirmation(String normalizedQuery) {\n'
    '        // Nhan dien xac nhan: giu rong cho Gen Z nhung van an toan (chi dung trong pending confirmation).\n'
    '        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;\n'
    '        String q = normalizedQuery.trim();\n'
    '        // Khop chinh xac cac tu xac nhan pho bien\n'
    '        if (q.matches("^(ok|oke|okay|k|dong y|xac nhan|chot|chot di|lam di|mo di|duoc|yes|y|yep|yeap|sure|confirm|ung|di|lam luon|mo luon|chot luon|approved|go)$")) {\n'
    '            return true;\n'
    '        }\n'
    '        // Cum ngan co chua tu khoa xac nhan (Gen Z hay viet tat)\n'
    '        return (q.contains("chot") || q.contains("xac nhan") || q.contains("dong y")\n'
    '                || q.contains("lam di") || q.contains("mo di") || q.contains("di thoi"))\n'
    '                && q.length() <= 35;\n'
    '    }'
)

if old_aff in content:
    content = content.replace(old_aff, new_aff)
    print("[PATCH 4] OK - Da mo rong isAffirmation")
    patches_ok += 1
else:
    # Tim vi tri isAffirmation
    aff_idx = content.find('private boolean isAffirmation(')
    print("[PATCH 4] FAIL - Khong tim thay cu - isAffirmation at:", aff_idx)
    if aff_idx >= 0:
        print("  Content around it:", repr(content[aff_idx:aff_idx+200]))

# =====================================================================
# Ghi file
# =====================================================================
print(f"\n[SUMMARY] {patches_ok}/4 patches applied")
if patches_ok >= 2:
    with open(FILE, 'w', encoding='utf-16') as f:
        f.write(content)
    print("[DONE] File saved as UTF-16 LE")
    # Verify
    with open(FILE, 'rb') as f:
        final_size = len(f.read())
    print(f"[VERIFY] Final file size: {final_size} bytes")
else:
    print("[ABORT] Too many failures, not writing file")
