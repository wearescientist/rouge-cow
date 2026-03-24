#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
整理怪物贴图文件夹结构
从: floor{X}/{baseId}/{version}/walk/f01.png
到:   floor{X}/T{tier}/{baseId}_{version}/walk/f01.png
支持跨楼层复制（如果当前楼层没有，从其他楼层找）
"""

import os
import shutil
import json
import re

def parse_floor_data():
    """解析 floor-data.js 获取怪物信息"""
    floor_data_path = "floor-data.js"
    if not os.path.exists(floor_data_path):
        print(f"错误: 找不到 {floor_data_path}")
        return {}
    
    with open(floor_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取 JSON 部分
    match = re.search(r'window\.FLOOR_DATA\s*=\s*({.*?});', content, re.DOTALL)
    if not match:
        print("错误: 无法解析 floor-data.js")
        return {}
    
    try:
        data = json.loads(match.group(1))
        return data
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        return {}

def find_source_in_other_floors(base_path, base_id, version, current_floor):
    """在其他楼层寻找源文件"""
    for floor_num in range(1, 7):
        if floor_num == current_floor:
            continue
        floor_path = os.path.join(base_path, f"floor{floor_num}")
        src_folder = os.path.join(floor_path, base_id, version, "walk")
        if os.path.exists(src_folder):
            return src_folder
    return None

def reorganize_folders():
    """整理文件夹"""
    data = parse_floor_data()
    if not data or 'floors' not in data:
        return
    
    base_path = "generated_assets/monster_walk_preserve_features"
    if not os.path.exists(base_path):
        print(f"错误: 找不到 {base_path}")
        return
    
    print("开始整理怪物贴图文件夹...")
    
    # 收集所有怪物配置（用于检查重复ID）
    all_monsters = {}
    
    # 遍历每个楼层
    for floor_num in range(1, 7):
        floor_key = f"floor{floor_num}"
        floor_path = os.path.join(base_path, floor_key)
        
        if not os.path.exists(floor_path):
            print(f"跳过: {floor_path} 不存在")
            continue
        
        # 获取该楼层所有怪物
        floor_data = data.get('floors', {}).get(floor_key, {})
        monsters = floor_data.get('monsters', [])
        
        print(f"\n处理 {floor_key}...")
        
        # 为每个怪物创建新文件夹
        for monster in monsters:
            base_id = monster.get('baseId')
            version = monster.get('version')
            tier = monster.get('tier', 1)
            monster_id = monster.get('id')
            
            if not base_id or not version:
                continue
            
            # 生成唯一标识
            unique_key = f"{floor_num}_{base_id}_{version}_{tier}"
            
            # 检查是否是同一怪物同一tier重复出现（F6的mother情况）
            if unique_key in all_monsters:
                # 这是重复配置，需要在ID后面加序号区分
                dup_count = sum(1 for k in all_monsters if k.startswith(f"{floor_num}_{base_id}_{version}_{tier}"))
                monster_id = f"{monster_id}_dup{dup_count}"
            all_monsters[unique_key] = monster_id
            
            # 源文件夹路径
            src_folder = os.path.join(floor_path, base_id, version, "walk")
            
            # 如果当前楼层没有，尝试从其他楼层找
            if not os.path.exists(src_folder):
                other_src = find_source_in_other_floors(base_path, base_id, version, floor_num)
                if other_src:
                    src_folder = other_src
                    print(f"  跨楼层: {base_id}/{version} 从 {os.path.basename(os.path.dirname(os.path.dirname(other_src)))} 复制")
                else:
                    # 尝试当前楼层的其他版本
                    src_base = os.path.join(floor_path, base_id)
                    if os.path.exists(src_base):
                        versions = [v for v in os.listdir(src_base) if os.path.isdir(os.path.join(src_base, v))]
                        if versions:
                            src_folder = os.path.join(src_base, versions[0], "walk")
                            print(f"  警告: {base_id}/{version} 不存在，使用 {versions[0]}")
                    else:
                        print(f"  跳过: 找不到 {base_id}/{version} 的源文件")
                        continue
            
            # 目标文件夹路径: T{tier}/{base_id}_{version}/walk
            tier_folder = f"T{tier}"
            monster_folder = f"{base_id}_{version}"
            dst_folder = os.path.join(floor_path, tier_folder, monster_folder, "walk")
            
            # 创建目标文件夹
            os.makedirs(dst_folder, exist_ok=True)
            
            # 复制文件
            if os.path.exists(src_folder):
                files = os.listdir(src_folder)
                for filename in files:
                    src_file = os.path.join(src_folder, filename)
                    dst_file = os.path.join(dst_folder, filename)
                    
                    if os.path.isfile(src_file) and not os.path.exists(dst_file):
                        shutil.copy2(src_file, dst_file)
                        print(f"  复制: {filename}")
            else:
                print(f"  警告: 源文件夹不存在 {src_folder}")
    
    print("\n整理完成!")

def verify_structure():
    """验证新结构"""
    base_path = "generated_assets/monster_walk_preserve_features"
    print("\n验证新结构...")
    
    for floor_num in range(1, 7):
        floor_key = f"floor{floor_num}"
        floor_path = os.path.join(base_path, floor_key)
        
        if not os.path.exists(floor_path):
            continue
        
        print(f"\n{floor_key}:")
        
        # 统计每个 tier
        for tier in range(1, 6):
            tier_path = os.path.join(floor_path, f"T{tier}")
            if os.path.exists(tier_path):
                monster_count = len([d for d in os.listdir(tier_path) if os.path.isdir(os.path.join(tier_path, d))])
                print(f"  T{tier}: {monster_count} 个怪物")

if __name__ == "__main__":
    print("怪物贴图文件夹整理工具")
    print("=" * 50)
    
    reorganize_folders()
    verify_structure()
    
    print("\n" + "=" * 50)
    print("完成！刷新游戏查看效果。")
