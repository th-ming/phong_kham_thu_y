#!/usr/bin/env python3
"""Patch 2 riêng: History trimming"""
import sys, os, shutil, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

CWD = os.getcwd()
react_path = os.path.join(CWD, 'Backend','src','main','java','com','rexi','pkty','service','ReActAgentService.java')
temp_path  = os.path.join(CWD, 'scripts', 'react_temp.java')

shutil.copy2(react_path, temp_path)
with open(temp_path, 'r', encoding='utf-16') as f:
    react = f.read()

# Tim chinh xac "continue;" trong ReAct loop
# Tim theo ASCII tuyet doi (khong co dau)
continues = [(m.start(), react[max(0,m.start()-100):m.start()+20]) for m in re.finditer(r'\bcontinue;', react)]
print(f'Found {len(continues)} continue statements:')
for idx, ctx in continues:
    print(f'  at {idx}: {repr(ctx[-60:])}')

# Tim cai "continue" trong vong lap ReAct (sau history.add(toolResultMsg))
add_tool = react.find('history.add(toolResultMsg)')
print(f'history.add(toolResultMsg) at: {add_tool}')

if add_tool >= 0:
    # Tim continue tiep theo sau do
    cont_idx = react.find('continue;', add_tool)
    print(f'Next continue after history.add at: {cont_idx}')
    if cont_idx >= 0:
        # Doc dong chua continue nay
        line_start = react.rfind('\n', 0, cont_idx) + 1
        line_end = react.find('\n', cont_idx)
        old_line = react[line_start:line_end]
        indent = len(old_line) - len(old_line.lstrip())
        indent_str = ' ' * indent

        # Chen trim code TRUOC continue
        trim_code = (
            '\n' + indent_str + '// Giu toi da 7 messages de tiet kiem token (system + 3 turns)\n'
            + indent_str + 'if (history.size() > 7) {\n'
            + indent_str + '    List<ChatMessage> trimmed = new ArrayList<>();\n'
            + indent_str + '    trimmed.add(history.get(0)); // Giu system prompt\n'
            + indent_str + '    trimmed.addAll(history.subList(history.size() - 6, history.size()));\n'
            + indent_str + '    history.clear();\n'
            + indent_str + '    history.addAll(trimmed);\n'
            + indent_str + '}\n'
            + indent_str
        )
        react = react[:line_start] + trim_code + react[line_start:]
        print('PATCH 2 OK - History trimmed at max 7 messages')

        with open(temp_path, 'w', encoding='utf-16') as f:
            f.write(react)
        shutil.copy2(temp_path, react_path)
        os.remove(temp_path)
        print(f'Saved: {len(react)} chars')
    else:
        print('PATCH 2 FAIL - no continue after history.add(toolResultMsg)')
else:
    print('PATCH 2 FAIL - history.add(toolResultMsg) not found')
