#!/usr/bin/env python3
"""Patch GroqService temperature + compile verify"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

CWD = os.getcwd()
groq_path = os.path.join(CWD, 'Backend','src','main','java','com','rexi','pkty','service','GroqService.java')

with open(groq_path,'r',encoding='utf-8') as f:
    c = f.read()

changed = False

# temperature thap = it sang tac, nhieu thuc thi -> phu hop cho task-agent
for old_t, new_t in [('0.3', '0.1'), ('0.4', '0.1')]:
    marker = '"temperature", ' + old_t
    if marker in c:
        c = c.replace(marker, '"temperature", 0.1')
        print(f'OK - temperature {old_t}->0.1')
        changed = True

if not changed:
    temps = re.findall(r'"temperature",\s*([\d.]+)', c)
    print('Current temperatures:', temps, '(no change needed or format diff)')

if changed:
    with open(groq_path,'w',encoding='utf-8') as f:
        f.write(c)
    print('GroqService saved')
