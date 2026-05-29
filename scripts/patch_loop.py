#!/usr/bin/env python3
"""Patch ReAct loop: tool result prompt + fallback message - ACTION-FIRST"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JAVA = os.path.join(ROOT, 'Backend', 'src', 'main', 'java', 'com', 'rexi', 'pkty', 'service')
react_path = os.path.join(JAVA, 'ReActAgentService.java')

with open(react_path, 'r', encoding='utf-16', errors='replace') as f:
    react = f.read()

print('File chars:', len(react))
patches = 0

# === PATCH A: Tool result message - khuyen LLM tra loi ngan ===
old_tool_result = '[K\u1ebcT QU\u1ea2 TOOL " + toolName.toUpperCase() + "]\\n" + observation + "\\n\\nD\u1ef1a tr\u00ean k\u1ebft qu\u1ea3 tr\u00ean, h\u00e3y ti\u1ebfp t\u1ee5c ho\u1eb7c tr\u1ea3 l\u1eddi final_answer.'
new_tool_result = '[K\u1ebcT QU\u1ea2 TOOL " + toolName.toUpperCase() + "]\\n" + observation + "\\n\\nH\u00e3y tr\u1ea3 final_answer ng\u1eafn g\u1ecdn, th\u1ef1c ch\u1ea5t. Kh\u00f4ng gi\u1ea3i th\u00edch qu\u00e1 tr\u00ecnh.'

if old_tool_result in react:
    react = react.replace(old_tool_result, new_tool_result)
    print('PATCH A OK - Tool result prompt: bo "dua tren ket qua tren, hay tiep tuc"')
    patches += 1
else:
    # Tim phan tool result message
    tr_idx = react.find('[K\u1ebcT QU\u1ea2 TOOL ')
    if tr_idx < 0:
        tr_idx = react.find('[K\\u1ebcT QU')
    print(f'PATCH A FAIL - tool result at {tr_idx}')
    if tr_idx >= 0:
        print(repr(react[tr_idx:tr_idx+200]))

# === PATCH B: Fallback message - ngan gon ===
old_fallback = '\u0110\u00e3 ho\u00e0n th\u00e0nh ph\u00e2n t\u00edch sau " + MAX_ITERATIONS + " b\u01b0\u1edbc. D\u1ef1a tr\u00ean d\u1eef li\u1eadu thu th\u1eadp \u0111\u01b0\u1ee3c, t\u00f4i \u0111\u00e3 c\u1ed1 g\u1eafng h\u1ebft s\u1ee9c \u0111\u1ec3 h\u1ed7 tr\u1ee3 b\u1ea1n. C\u00f3 th\u1ec3 y\u00eau c\u1ea7u c\u1ee7a b\u1ea1n c\u1ea7n th\u00eam th\u00f4ng tin b\u1ed5 sung.'
new_fallback = 'Rexi c\u1ea7n th\u00eam th\u00f4ng tin \u0111\u1ec3 ho\u00e0n th\u00e0nh. B\u1ea1n c\u00f3 th\u1ec3 cung c\u1ea5p th\u00eam kh\u00f4ng?'

if old_fallback in react:
    react = react.replace(old_fallback, new_fallback)
    print('PATCH B OK - Fallback message: ngan gon hon')
    patches += 1
else:
    fb_idx = react.find('\u0110\u00e3 ho\u00e0n th\u00e0nh ph\u00e2n t\u00edch sau ')
    print(f'PATCH B FAIL - fallback at {fb_idx}')
    if fb_idx >= 0:
        print(repr(react[fb_idx:fb_idx+200]))

# === PATCH C: Tool call description - ngan hon ===
# "Goi tool: " + toolName -> giu nguyen vi la log
# Nhung khi add vao history, them chi dan ngan gon
old_tool_instruction = '"Dựa tr\u00ean k\u1ebft qu\u1ea3 tr\u00ean, h\u00e3y ti\u1ebfp t\u1ee5c ho\u1eb7c tr\u1ea3 l\u1eddi final_answer."'
if old_tool_instruction in react:
    react = react.replace(old_tool_instruction, '"H\u00e3y tr\u1ea3 final_answer ng\u1eafn g\u1ecdn, th\u1ef1c ch\u1ea5t."')
    print('PATCH C OK')
    patches += 1
else:
    print('PATCH C SKIP (already patched or different format)')

# === PATCH D: Xoa buildAppointmentSlotReply + nextWeekendDate + containsAny ===
# Cac method nay khong con duoc goi (da xoa caller o run())
# Nhung van ton tai lam file lon hon can thiet
old_appt = '    private ReActResult buildAppointmentSlotReply('
appt_idx = react.find(old_appt)
if appt_idx >= 0:
    # Tim het cac method cho den isAffirmation
    affirm_idx = react.find('    private boolean isAffirmation(', appt_idx)
    if affirm_idx > appt_idx:
        removed_block = react[appt_idx:affirm_idx]
        print(f'PATCH D - Removing unused buildAppointmentSlotReply + helpers: {len(removed_block)} chars')
        react = react[:appt_idx] + react[affirm_idx:]
        print('PATCH D OK')
        patches += 1
    else:
        print('PATCH D FAIL - cannot find end boundary')
else:
    print('PATCH D SKIP - buildAppointmentSlotReply already removed')

# === Ghi file ===
with open(react_path, 'w', encoding='utf-16') as f:
    f.write(react)
print(f'\n{patches} patches applied. File saved: {len(react)} chars')
