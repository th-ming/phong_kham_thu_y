#!/usr/bin/env python3
"""
Audit + Patch token optimization:
1. Cap observation truoc khi them vao history (hien tai: khong gioi han)
2. Trim history khi qua dai (giu system + 3 exchange gan nhat)
3. Giam KNOWLEDGE_MAX_CONTEXT_CHARS 3800->1800
4. Kiem tra tool schema size
"""
import sys, os, re, shutil
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

CWD = os.getcwd()
JAVA = os.path.join(CWD, 'Backend','src','main','java','com','rexi','pkty','service')
react_path = os.path.join(JAVA, 'ReActAgentService.java')
mem_path   = os.path.join(JAVA, 'AiMemoryService.java')
temp_path  = os.path.join(CWD, 'scripts', 'react_temp.java')

# === AUDIT truoc ===
shutil.copy2(react_path, temp_path)
with open(temp_path, 'r', encoding='utf-16') as f:
    react = f.read()

print('=== AUDIT TOKEN BOTTLENECKS ===')
print(f'ReActAgentService: {len(react)} chars')

# 1. Tim observation.substring (neu co cap)
obs_sub = re.findall(r'observation\.substring\(0,\s*(\d+)\)', react)
print(f'Observation truncation exists: {bool(obs_sub)} | caps: {obs_sub}')

# 2. Tim history trimming
has_trim = 'history.size()' in react and ('subList' in react or 'remove' in react)
print(f'History trimming: {has_trim}')

# 3. Tool result vao history
trc = react.find('toolResultMsg.setContent(')
if trc >= 0:
    chunk = react[trc:trc+300]
    print(f'Tool result added to history: {"history.add(toolResultMsg)" in react}')
    print(f'Observation in tool result: {"observation" in chunk}')

# 4. KNOWLEDGE_MAX_CONTEXT
with open(mem_path, 'r', encoding='utf-8', errors='replace') as f:
    mem = f.read()
kmc = re.search(r'KNOWLEDGE_MAX_CONTEXT_CHARS\s*=\s*(\d+)', mem)
ksr = re.search(r'KNOWLEDGE_SNIPPET_RADIUS\s*=\s*(\d+)', mem)
print(f'KNOWLEDGE_MAX_CONTEXT_CHARS: {kmc.group(1) if kmc else "N/A"}')
print(f'KNOWLEDGE_SNIPPET_RADIUS: {ksr.group(1) if ksr else "N/A"}')

# 5. Kiem tra getToolsSchemaForRole size
tool_path = os.path.join(JAVA, 'AiToolService.java')
with open(tool_path, 'r', encoding='utf-8', errors='replace') as f:
    tool_c = f.read()
schema_start = tool_c.find('getCustomerToolsSchema()')
schema_end = tool_c.find('getStaffToolsSchemaForRole', schema_start + 100)
if schema_start >= 0 and schema_end > schema_start:
    schema_block = tool_c[schema_start:schema_end]
    print(f'Customer tool schema method size: {len(schema_block)} chars')

schema2_start = tool_c.find('getStaffToolsSchemaForRole')
schema2_end = tool_c.find('\n    public ', schema2_start + 100)
if schema2_start >= 0 and schema2_end > schema2_start:
    schema2_block = tool_c[schema2_start:schema2_end]
    print(f'Staff tool schema method size: {len(schema2_block)} chars')

print()
print('=== PATCHES TO APPLY ===')

patches = 0

# === PATCH 1: Cap observation trong tool result message ===
# Hien tai: observation duoc dua nguyen vao message
# Can: cat gon xuong 600 chars truoc khi them vao history
old_tool_result_add = (
    'toolResultMsg.setContent("'
)
# Tim doan observation + history.add
obs_cap_marker = 'observation + "\\n\\n'
idx_obs = react.find(obs_cap_marker)
if idx_obs >= 0:
    # Tim doan code them observation vao history
    # Thay: "observation" bang "observation.substring(0, Math.min(600, observation.length()))"
    # Trong toolResultMsg
    old_obs_in_msg = '" + observation + "\\n\\n'
    new_obs_in_msg = '" + observation.substring(0, Math.min(600, observation.length())) + "\\n\\n'
    if old_obs_in_msg in react:
        react = react.replace(old_obs_in_msg, new_obs_in_msg, 1)
        print('PATCH 1 OK - Observation capped at 600 chars in history message')
        patches += 1
    else:
        print('PATCH 1 FAIL - pattern not found')
        print('  Context:', repr(react[idx_obs-20:idx_obs+100]))

# === PATCH 2: Trim history neu qua lon ===
# Tim vi tri sau "history.add(toolResultMsg)" de insert trim logic
old_continue = '                        continue; // ti\u1ebfp t\u1ee5c v\u00f2ng l\u1eb7p'
if old_continue not in react:
    # Thu ASCII
    old_continue = '                        continue; // tiep tuc vong lap'
idx_continue = react.find(old_continue)
print(f'Continue marker at: {idx_continue}')

if idx_continue >= 0:
    # Chen history trim truoc continue
    trim_code = '''
                        // Giu toi da 7 messages (system + 3 exchanges) de tiet kiem token
                        if (history.size() > 7) {
                            List<ChatMessage> trimmed = new ArrayList<>();
                            trimmed.add(history.get(0)); // system prompt
                            // Giu 6 messages cuoi cung (3 exchanges gan nhat)
                            trimmed.addAll(history.subList(history.size() - 6, history.size()));
                            history.clear();
                            history.addAll(trimmed);
                        }
'''
    react = react[:idx_continue] + trim_code + react[idx_continue:]
    print('PATCH 2 OK - History trimmed to max 7 messages (save tokens)')
    patches += 1
else:
    print('PATCH 2 FAIL - continue marker not found')

# === PATCH 3: Cap observation truoc khi log (dong hien tai la 200) ===
old_log_cap = 'observation.substring(0, Math.min(200, observation.length()))'
if old_log_cap in react:
    print('PATCH 3 SKIP - log already capped at 200 chars OK')
else:
    print('PATCH 3 N/A')

# Ghi ReActAgentService
with open(temp_path, 'w', encoding='utf-16') as f:
    f.write(react)
shutil.copy2(temp_path, react_path)
os.remove(temp_path)
print(f'ReActAgentService saved: {len(react)} chars')

# === PATCH 4: AiMemoryService - giam KNOWLEDGE_MAX_CONTEXT_CHARS 3800->1800 ===
old_kmc = 'KNOWLEDGE_MAX_CONTEXT_CHARS = 3800'
new_kmc = 'KNOWLEDGE_MAX_CONTEXT_CHARS = 1800  // Giam de tiet kiem token (was 3800)'
old_ksr = 'KNOWLEDGE_SNIPPET_RADIUS = 520'
new_ksr = 'KNOWLEDGE_SNIPPET_RADIUS = 280  // Giam snippet radius de tiet kiem token (was 520)'

changed_mem = False
if old_kmc in mem:
    mem = mem.replace(old_kmc, new_kmc)
    print('PATCH 4a OK - KNOWLEDGE_MAX_CONTEXT_CHARS: 3800->1800')
    changed_mem = True
    patches += 1
else:
    print('PATCH 4a FAIL - pattern not found')

if old_ksr in mem:
    mem = mem.replace(old_ksr, new_ksr)
    print('PATCH 4b OK - KNOWLEDGE_SNIPPET_RADIUS: 520->280')
    changed_mem = True
    patches += 1
else:
    print('PATCH 4b FAIL')

if changed_mem:
    with open(mem_path, 'w', encoding='utf-8') as f:
        f.write(mem)
    print('AiMemoryService saved')

print(f'\nTotal: {patches} patches applied')
