#!/usr/bin/env python3
"""Patch A+B: tool result prompt + fallback message"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
react_path = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')

with open(react_path, 'r', encoding='utf-16', errors='replace') as f:
    react = f.read()

print('File chars:', len(react))

# Tim toolResultMsg.setContent
idx = react.find('toolResultMsg.setContent(')
print('toolResultMsg.setContent at:', idx)
if idx >= 0:
    print('Content:')
    print(repr(react[idx:idx+300]))

print()
# Tim fallback MAX_ITERATIONS
fb_idx = react.find('MAX_ITERATIONS +')
print('MAX_ITERATIONS fallback at:', fb_idx)
if fb_idx >= 0:
    print(repr(react[fb_idx-30:fb_idx+200]))
