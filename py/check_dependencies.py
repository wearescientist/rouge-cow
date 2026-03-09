#!/usr/bin/env python3
import os
import re

print("=== Round 1: Global Dependencies Check ===\n")

files = [f for f in os.listdir('src/systems') if f.endswith('.js')]

for file in files:
    print(f"\n[ {file} ]")
    with open(f'src/systems/{file}', 'r', encoding='utf-8') as f:
        content = f.read()
    
    class_match = re.search(r'class (\w+)', content)
    if class_match:
        class_name = class_match.group(1)
        print(f"  Class: {class_name}")
    
    if re.search(r'window\.' + (class_name if class_match else r'\w+') + r'\s*=', content):
        print(f"  OK: Exported to window")
    else:
        print(f"  WARN: Not exported to window!")

print("\n=== Round 1 Complete ===")
