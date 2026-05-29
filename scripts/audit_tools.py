#!/usr/bin/env python3
"""Tim va doc AiToolService"""
import sys, os, re
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC  = os.path.join(ROOT, 'Backend', 'src')

# Tim AiToolService.java
found = []
for root, dirs, files in os.walk(SRC):
    for fname in files:
        if fname == 'AiToolService.java':
            found.append(os.path.join(root, fname))

print('Found:', found)
if not found:
    sys.exit(1)

tool_path = found[0]
with open(tool_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print(f'Size: {len(content)} chars, lines: {content.count(chr(10))}')

# Tim getToolsSchemaForRole
schema_idx = content.find('getToolsSchemaForRole')
if schema_idx >= 0:
    print('=== getToolsSchemaForRole (first 1200 chars) ===')
    print(content[schema_idx:schema_idx+1200])

# Tim phan mo ta tool (description)
desc_count = len(re.findall(r'"description"', content))
print(f'\nTotal "description" entries: {desc_count}')

# Tim cac description dai (> 100 chars)
descs = re.findall(r'"description"\s*[,:]\s*"([^"]{60,})"', content)
print(f'Long descriptions (>60 chars): {len(descs)}')
for d in descs[:8]:
    print(f'  [{len(d)}] {d[:100]}')
