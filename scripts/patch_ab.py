#!/usr/bin/env python3
"""Patch A+B final: dung byte-level replacement"""
import sys, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
react_path = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')

# Doc file duoi dang binary UTF-16
with open(react_path, 'rb') as f:
    raw = f.read()

# Convert to string (UTF-16 LE with BOM)
content = raw.decode('utf-16', errors='replace')
print('Chars:', len(content))

patches = 0

# === PATCH A: Tool result message ===
# Tim exact substring tu inspect_loop.py
old_a = '[K\u1ebcT QU\u1ea2 TOOL " + toolName.toUpperCase() + "]\\n" + observation + "\\n\\nD\u1ef1a tr\u00ean k\u1ebft qu\u1ea3 tr\u00ean, h\u00e3y ti\u1ebfp t\u1ee5c ho\u1eb7c tr\u1ea3 l\u1eddi final_answer.'
new_a = '[K\u1ebcT QU\u1ea2 TOOL " + toolName.toUpperCase() + "]\\n" + observation + "\\n\\nTr\u1ea3 final_answer ng\u1eafn g\u1ecdn, th\u1ef1c ch\u1ea5t. Kh\u00f4ng gi\u1ea3i th\u00edch qu\u00e1 tr\u00ecnh, kh\u00f4ng nh\u1eafc l\u1ea1i to\u00e0n b\u1ed9 d\u1eef li\u1ec7u.'

if old_a in content:
    content = content.replace(old_a, new_a)
    print('PATCH A OK - Tool result prompt action-first')
    patches += 1
else:
    # Thu tim phan con
    idx = content.find('toolResultMsg.setContent(')
    print('PATCH A FAIL - idx:', idx)
    if idx >= 0:
        chunk = content[idx:idx+250]
        print('Actual:', repr(chunk))

# === PATCH B: Fallback message ===
# Tim tu "Dan th\u00e0nh ph\u00e2n t\u00edch sau"
old_b = '\u0110\u00e3 ho\u00e0n th\u00e0nh ph\u00e2n t\u00edch sau " + MAX_ITERATIONS + " b\u01b0\u1edbc. D\u1ef1a tr\u00ean d\u1eef li\u1eadu thu th\u1eadp \u0111\u01b0\u1ee3c, t\u00f4i \u0111\u00e3 c\u1ed1 g\u1eafng h\u1ebft s\u1ee9c \u0111\u1ec3 h\u1ed7 tr\u1ee3 b\u1ea1n. C\u00f3 th\u1ec3 y\u00eau c\u1ea7u c\u1ee7a b\u1ea1n c\u1ea7n th\u00eam th\u00f4ng tin b\u1ed5 sung.'
new_b = 'Rexi c\u1ea7n th\u00eam th\u00f4ng tin \u0111\u1ec3 ho\u00e0n th\u00e0nh. B\u1ea1n c\u00f3 th\u1ec3 b\u1ed5 sung kh\u00f4ng?'

if old_b in content:
    content = content.replace(old_b, new_b)
    print('PATCH B OK - Fallback message ngan gon')
    patches += 1
else:
    idx2 = content.find('MAX_ITERATIONS + "')
    print('PATCH B FAIL - fallback at:', idx2)
    if idx2 >= 0:
        print('Actual:', repr(content[idx2-40:idx2+150]))

# === Ghi file ===
with open(react_path, 'w', encoding='utf-16') as f:
    f.write(content)
print(f'\n{patches} patches. File saved: {len(content)} chars')
