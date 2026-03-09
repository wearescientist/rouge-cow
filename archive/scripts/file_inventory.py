#!/usr/bin/env python3
"""遍历项目所有文件夹，整理数据文件位置"""

import os
import json

print("=== 项目文件结构整理 ===\n")

# 关键数据文件映射
data_files = {
    "weapons": [],
    "enemies": [],
    "items": [],
    "pets": [],
    "passives": [],
    "other": []
}

# 遍历所有文件夹
for root, dirs, files in os.walk('.'):
    # 跳过 .git 和 node_modules
    if '.git' in root or 'node_modules' in root or 'videos' in root:
        continue
    
    for file in files:
        filepath = os.path.join(root, file)
        rel_path = os.path.relpath(filepath)
        
        # 分类
        file_lower = file.lower()
        if 'weapon' in file_lower or 'knife' in file_lower or 'wand' in file_lower or 'whip' in file_lower:
            if file.endswith(('.js', '.json')):
                data_files["weapons"].append(rel_path)
        elif 'enemy' in file_lower or 'boss' in file_lower:
            if file.endswith(('.js', '.json')):
                data_files["enemies"].append(rel_path)
        elif 'item' in file_lower:
            if file.endswith(('.js', '.json')):
                data_files["items"].append(rel_path)
        elif 'pet' in file_lower:
            if file.endswith(('.js', '.json')):
                data_files["pets"].append(rel_path)
        elif 'passive' in file_lower:
            if file.endswith(('.js', '.json')):
                data_files["passives"].append(rel_path)

# 打印结果
for category, files in data_files.items():
    if files:
        print(f"\n【{category.upper()}】数据文件:")
        for f in sorted(files):
            size = os.path.getsize(f)
            print(f"  {f} ({size} bytes)")

print("\n" + "="*50)
print("建议的统一结构:")
print("  data/")
print("    weapons/")
print("      index.js      - 所有武器配置")
print("      evolution.js  - 武器进化关系")
print("    enemies/")
print("      index.js      - 所有敌人配置 (已有)")
print("      bosses.js     - Boss配置 (已有)")
print("    items/")
print("      index.js      - 道具配置 (已有)")
print("    passives/")
print("      index.js      - 被动道具配置")
print("    pets/")
print("      index.js      - 宠物配置")
