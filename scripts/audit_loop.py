#!/usr/bin/env python3
"""Xem ReAct loop parser + final_answer handling"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JAVA = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service')
react_path = os.path.join(JAVA, 'ReActAgentService.java')

with open(react_path, 'r', encoding='utf-16', errors='replace') as f:
    react = f.read()

lines = react.split('\n')
print(f'Total lines: {len(lines)}')

# In lines 80-200 (ReAct loop)
print('\n=== Lines 80-200 (ReAct loop) ===')
for i, l in enumerate(lines[79:200], 80):
    print(f'{i}: {l}')
