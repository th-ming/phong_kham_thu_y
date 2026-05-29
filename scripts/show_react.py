#!/usr/bin/env python3
# Script doc file va in ra de kiem tra trang thai hien tai
import sys, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

FILE = r'Backend\src\main\java\com\rexi\pkty\service\ReActAgentService.java'
with open(FILE, 'r', encoding='utf-16') as f:
    content = f.read()
    lines = content.split('\n')

print(f"Total lines: {len(lines)}")
print("=== Lines 1-80 ===")
for i, l in enumerate(lines[:80], 1):
    print(f"{i}: {l}")
