
import os

file_path = r"d:\QLy Phòng Khám Thú Y\Backend\src\main\java\com\rexi\pkty\controller\LichHenController.java"

# Read with latin-1 to avoid decode errors
with open(file_path, 'r', encoding='latin-1') as f:
    lines = f.readlines()

new_lines = []
skip = 0
for i in range(len(lines)):
    if skip > 0:
        skip -= 1
        continue
    
    # Check for the corrupted pattern in latin-1
    if '\xba\xc2\xb7t' in lines[i]:
        print(f"Found corruption at line {i+1}")
        skip = 5 # Skip the block
        continue
    
    new_lines.append(lines[i])

# Write back with the original intended encoding (UTF-8)
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File fixed successfully")
