#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch ReActAgentService.java - binary-safe mode
"""

import re, sys, os

FILE = r"d:\QLy Phong Kham Thu Y\Backend\src\main\java\com\rexi\pkty\service\ReActAgentService.java"
# Thu vien path
FILE2 = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
    '..', 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service', 'ReActAgentService.java')
FILE2 = os.path.normpath(FILE2)

# Doc file dang binary, decode voi errors=replace de khong crash
with open(FILE2, 'rb') as f:
    raw = f.read()

# Detect encoding
if raw[:3] == b'\xef\xbb\xbf':
    enc = 'utf-8-sig'
    raw = raw[3:]
else:
    enc = 'utf-8'

content = raw.decode('utf-8', errors='surrogatepass')
print("File size bytes:", len(raw))
print("Decoded chars:", len(content))
print("Has handleDeterministicClinicAgentQuery:", 'handleDeterministicClinicAgentQuery' in content)
print("Current provider order in callBestAvailableModel:")
m = content.find('private ModelResponse callBestAvailableModel')
if m >= 0:
    sub = content[m:m+500]
    g = sub.find('groqService.chat')
    gem = sub.find('geminiService.chat')
    op = sub.find('openRouterService.chat')
    print(f"  Groq at {g}, Gemini at {gem}, OpenRouter at {op}")
