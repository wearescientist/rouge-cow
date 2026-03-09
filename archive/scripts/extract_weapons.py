#!/usr/bin/env python3
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到WEAPONS定义
match = re.search(r'const\s+WEAPONS\s*=\s*\{', content)
if match:
    start = match.end() - 1
    
    # 找到结束位置
    brace_count = 1
    i = start + 1
    while brace_count > 0 and i < len(content):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
        i += 1
    
    weapons_content = content[start:i]
    
    # 提取武器key和类型
    weapons = re.findall(r"'(\w+)':\s*\{[^}]*type:\s*'(\w+)'", weapons_content)
    
    print("=== 玩家武器清单 ===\n")
    print(f"共找到 {len(weapons)} 个武器:\n")
    
    for key, type in weapons:
        print(f"  {key}: type={type}")
else:
    print("WEAPONS not found!")
