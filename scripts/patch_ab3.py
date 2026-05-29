#!/usr/bin/env python3
"""Patch AB - edit qua temp file ASCII path"""
import sys, os, shutil
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

CWD = os.getcwd()
react_path = os.path.join(CWD, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')
temp_path  = os.path.join(CWD, 'scripts', 'react_temp.java')

print('Source:', react_path, '| Exists:', os.path.exists(react_path))

# 1. Copy sang temp (cung nam trong CWD nhung ten file don gian)
shutil.copy2(react_path, temp_path)
print('Copied to temp:', temp_path)

# 2. Doc temp file
with open(temp_path, 'r', encoding='utf-16') as f:
    content = f.read()
print('Chars:', len(content))
patches = 0

# === PATCH A: Tool result prompt - action-first ===
trc_idx = content.find('toolResultMsg.setContent(')
if trc_idx >= 0:
    chunk = content[trc_idx:trc_idx+500]
    nn_idx = chunk.rfind('\\n\\n')
    if nn_idx >= 0:
        chunk_end = chunk.find('"', nn_idx + 4)
        if chunk_end >= 0:
            old_suffix = chunk[nn_idx + 4:chunk_end]
            print('Old A suffix:', repr(old_suffix))
            new_suffix = 'Tr\u1ea3 final_answer ng\u1eafn g\u1ecdn. Kh\u00f4ng gi\u1ea3i th\u00edch qu\u00e1 tr\u00ecnh, kh\u00f4ng nh\u1eafc l\u1ea1i to\u00e0n b\u1ed9 d\u1eef li\u1ec7u tool.'
            content = content[:trc_idx + nn_idx + 4] + new_suffix + content[trc_idx + chunk_end:]
            print('PATCH A OK')
            patches += 1

# === PATCH B: Fallback message ngan ===
marker_b = 'MAX_ITERATIONS + "'
idx_b = content.find(marker_b)
if idx_b >= 0:
    line_start = content.rfind('\n', 0, idx_b) + 1
    line_end   = content.find('\n', idx_b)
    old_line = content[line_start:line_end]
    print('Old B:', repr(old_line[:80]))
    indent = len(old_line) - len(old_line.lstrip())
    new_line = ' ' * indent + 'String fallback = "Rexi c\u1ea7n th\u00eam th\u00f4ng tin. B\u1ea1n c\u00f3 th\u1ec3 b\u1ed5 sung kh\u00f4ng?";'
    content = content[:line_start] + new_line + content[line_end:]
    print('PATCH B OK')
    patches += 1

# 3. Ghi ra temp
with open(temp_path, 'w', encoding='utf-16') as f:
    f.write(content)
print(f'\n{patches}/2 patches written to temp')

# 4. Copy temp -> original (dung shutil de tranh van de encoding path)
shutil.copy2(temp_path, react_path)
print('Copied back to original')
os.remove(temp_path)
print('Temp removed. Done.')
