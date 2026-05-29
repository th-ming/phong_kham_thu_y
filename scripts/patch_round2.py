#!/usr/bin/env python3
import re, os, sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

JAVA = os.path.join('Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service')

# === A: ReActAgentService - MAX_ITERATIONS 6 -> 4 ===
react_path = os.path.join(JAVA, 'ReActAgentService.java')
with open(react_path, 'r', encoding='utf-16', errors='replace') as f:
    react = f.read()
if 'MAX_ITERATIONS = 6' in react:
    react = react.replace('MAX_ITERATIONS = 6', 'MAX_ITERATIONS = 4')
    with open(react_path, 'w', encoding='utf-16') as f:
        f.write(react)
    print('A OK - MAX_ITERATIONS 6->4 (giam vong lap, phan hoi nhanh hon)')
else:
    mi = re.search(r'MAX_ITERATIONS\s*=\s*(\d+)', react)
    print('A SKIP, current:', mi.group(1) if mi else 'N/A')

# === B: GroqService - max_tokens 600->800, temperature 0.4->0.3 ===
groq_path = os.path.join(JAVA, 'GroqService.java')
with open(groq_path, 'r', encoding='utf-8', errors='replace') as f:
    groq = f.read()
changed_b = False

pattern_tokens = '"max_tokens", hasImage ? 900 : 600'
replace_tokens = '"max_tokens", hasImage ? 1024 : 800'
if pattern_tokens in groq:
    groq = groq.replace(pattern_tokens, replace_tokens)
    print('B1 OK - Groq max_tokens: 600->800 (du cho cau tra loi day du hon)')
    changed_b = True
else:
    # Thu tim phan rieng biet
    mt_line = re.search(r'"max_tokens",\s*(hasImage\s*\?\s*\d+\s*:\s*\d+|\d+)', groq)
    print('B1 SKIP - max_tokens line:', mt_line.group(0) if mt_line else 'not found')

pattern_temp = '"temperature", 0.4'
replace_temp = '"temperature", 0.3'
if pattern_temp in groq:
    groq = groq.replace(pattern_temp, replace_temp)
    print('B2 OK - Groq temperature: 0.4->0.3 (chinh xac hon, it hallucinate hon)')
    changed_b = True
else:
    print('B2 SKIP - temperature 0.4 not found')

if changed_b:
    with open(groq_path, 'w', encoding='utf-8') as f:
        f.write(groq)
    print('B - Groq file saved')

# === C: AiMemoryService - Mo rong Smart Router keywords ===
mem_path = os.path.join(JAVA, 'AiMemoryService.java')
with open(mem_path, 'r', encoding='utf-8', errors='replace') as f:
    mem = f.read()

# Tim va hien thi block schedule check hien tai
idx = mem.find('cleanQuery.contains')
if idx >= 0:
    chunk = mem[idx:idx+600]
    print('\nC - Current getGlobalContext keywords block:')
    print(chunk[:500])
    print('...')

# Tim chinh xac doan schedule check
sched_pattern = re.compile(r'(cleanQuery\.contains\("[^"]+"\)\s*\|\|\s*)+cleanQuery\.contains\("[^"]+"\)')
sched_match = sched_pattern.search(mem)
if sched_match:
    old_sched = sched_match.group(0)
    print('Found schedule check block, len:', len(old_sched))

# Tim end of schedule if block de insert them keyword
# Tim doan: "gio lam", "thu") 
target_end_of_sched = 'cleanQuery.contains("gi\u1edd l\u00e0m") || cleanQuery.contains("th\u1ee9")'
if target_end_of_sched in mem:
    new_end = (
        'cleanQuery.contains("gi\u1edd l\u00e0m") || cleanQuery.contains("th\u1ee9") ||\n'
        '            cleanQuery.contains("slot") || cleanQuery.contains("gi\u1edd") || '
        'cleanQuery.contains("ng\u00e0y") ||\n'
        '            cleanQuery.contains("kh\u00e1m") || cleanQuery.contains("mai") || '
        'cleanQuery.contains("s\u00e1ng") || cleanQuery.contains("chi\u1ec1u")'
    )
    mem = mem.replace(target_end_of_sched, new_end)
    with open(mem_path, 'w', encoding='utf-8') as f:
        f.write(mem)
    print('C OK - AiMemoryService Smart Router: bo sung gio, ngay, kham, sang, chieu, mai, slot')
else:
    # Tim khong dau
    target_no_diacritic = 'cleanQuery.contains("gio lam") || cleanQuery.contains("thu")'
    if target_no_diacritic in mem:
        new_end_nd = (
            'cleanQuery.contains("gio lam") || cleanQuery.contains("thu") ||\n'
            '            cleanQuery.contains("slot") || cleanQuery.contains("gio") || '
            'cleanQuery.contains("ngay") ||\n'
            '            cleanQuery.contains("kham") || cleanQuery.contains("mai") || '
            'cleanQuery.contains("sang") || cleanQuery.contains("chieu")'
        )
        mem = mem.replace(target_no_diacritic, new_end_nd)
        with open(mem_path, 'w', encoding='utf-8') as f:
            f.write(mem)
        print('C OK - Smart Router extended (no-diacritic version)')
    else:
        # Hien thi vung xung quanh de debug
        idx2 = mem.find('lam") || cleanQuery')
        print('C FAIL - Debug:', mem[max(0,idx2-80):idx2+120] if idx2 >= 0 else 'Not found')

# === D: OpenRouterService - Fail-fast timeout ===
or_path = os.path.join(JAVA, 'OpenRouterService.java')
with open(or_path, 'r', encoding='utf-8', errors='replace') as f:
    or_c = f.read()
changed_d = False

# Hien thi cac timeout hien tai
timeouts = re.findall(r'Duration\.ofSeconds\((\d+)\)', or_c)
print('\nD - OpenRouter current timeouts:', timeouts)

# Doi 25s -> 12s cho read timeout (fail fast -> fallback sang Groq)
if 'Duration.ofSeconds(25)' in or_c:
    or_c = or_c.replace('Duration.ofSeconds(25)', 'Duration.ofSeconds(12)')
    print('D1 OK - OpenRouter read timeout: 25s->12s')
    changed_d = True
if 'Duration.ofSeconds(10)' in or_c:
    # Chi thay the lan dau (connect timeout)
    or_c = or_c.replace('Duration.ofSeconds(10)', 'Duration.ofSeconds(6)', 1)
    print('D2 OK - OpenRouter connect timeout: 10s->6s')
    changed_d = True
if changed_d:
    with open(or_path, 'w', encoding='utf-8') as f:
        f.write(or_c)
    print('D - OpenRouter file saved')
else:
    print('D SKIP - no matching timeouts found')
