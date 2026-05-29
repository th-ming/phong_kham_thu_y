#!/usr/bin/env python3
"""Patch A+B: dung surrogatepass de giu nguyen byte content"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
react_path = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')

# Doc raw bytes UTF-16
with open(react_path, 'rb') as f:
    raw = f.read()

# BOM = FF FE (UTF-16 LE). Strip BOM va decode
bom = raw[:2]
print('BOM:', bom.hex())
if bom == b'\xff\xfe':
    content_bytes = raw[2:]  # bo BOM
else:
    content_bytes = raw

# Encode cac string can thay the thanh UTF-16 LE bytes de tim chinh xac
def to_utf16le(s):
    return s.encode('utf-16-le')

patches = 0

# === PATCH A: thay the "hay tiep tuc hoac tra loi final_answer" ===
old_a_str = 'D\u1ef1a tr\u00ean k\u1ebft qu\u1ea3 tr\u00ean, h\u00e3y ti\u1ebfp t\u1ee5c ho\u1eb7c tr\u1ea3 l\u1eddi final_answer.'
new_a_str = 'Tr\u1ea3 final_answer ng\u1eafn g\u1ecdn, th\u1ef1c ch\u1ea5t. Kh\u00f4ng gi\u1ea3i th\u00edch qu\u00e1 tr\u00ecnh.'

old_a_bytes = to_utf16le(old_a_str)
new_a_bytes = to_utf16le(new_a_str)

if old_a_bytes in content_bytes:
    content_bytes = content_bytes.replace(old_a_bytes, new_a_bytes)
    print('PATCH A OK - Tool result prompt: action-first')
    patches += 1
else:
    print('PATCH A FAIL - searching for partial...')
    # Thu tim phan dau
    partial = to_utf16le('hay tiep tuc')
    idx = content_bytes.find(partial)
    print('  partial "hay tiep tuc" at:', idx)
    partial2 = to_utf16le('h\u00e3y ti\u1ebfp t\u1ee5c')
    idx2 = content_bytes.find(partial2)
    print('  partial viet at:', idx2)
    if idx2 >= 0:
        # Doc 200 bytes xung quanh
        chunk = content_bytes[max(0,idx2-20):idx2+150]
        try:
            print('  context:', chunk.decode('utf-16-le', errors='replace'))
        except:
            pass

# === PATCH B: thay the fallback message dai ===
old_b_str = '\u0110\u00e3 ho\u00e0n th\u00e0nh ph\u00e2n t\u00edch sau '
idx_b = content_bytes.find(to_utf16le(old_b_str))
print(f'\nPATCH B - "\u0110\u00e3 ho\u00e0n" at byte idx: {idx_b}')
if idx_b >= 0:
    # Doc doan xung quanh
    chunk = content_bytes[idx_b:idx_b+250]
    s = chunk.decode('utf-16-le', errors='replace')
    print('Context:', repr(s[:200]))

    # Tim het chuoi den dau "
    end_quote_bytes = to_utf16le('"')
    # Tim vi tri " ket thuc string trong context
    # Fallback string: "Da hoan thanh phan tich sau " + MAX_ITERATIONS + " buoc..."
    # Can xac dinh doan string cuoi trong java source
    # Tim den "; " 
    end_marker = to_utf16le('sung."')
    end_idx = content_bytes.find(end_marker, idx_b)
    if end_idx >= 0:
        end_idx += len(end_marker)
        old_full = content_bytes[idx_b:end_idx]
        print('Old full:', repr(old_full.decode('utf-16-le', errors='replace')))
        
        new_b_str = 'Rexi c\u1ea7n th\u00eam th\u00f4ng tin. B\u1ea1n c\u00f3 th\u1ec3 b\u1ed5 sung kh\u00f4ng?"'
        new_b_bytes = to_utf16le(new_b_str)
        content_bytes = content_bytes[:idx_b] + new_b_bytes + content_bytes[end_idx:]
        print('PATCH B OK - Fallback message ngan gon')
        patches += 1
    else:
        print('PATCH B FAIL - cannot find end marker "sung."')

# === Ghi file ===
with open(react_path, 'wb') as f:
    f.write(b'\xff\xfe')  # BOM
    f.write(content_bytes)
print(f'\n{patches} patches. File saved: {len(content_bytes)} bytes')
