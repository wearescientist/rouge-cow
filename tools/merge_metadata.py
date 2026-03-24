#!/usr/bin/env python3
"""
Metadata Merger - 合并生成的贴图数据和游戏配置
保留原有的 tier/type 等游戏逻辑信息，使用新的精确边界数据
"""

import json
from pathlib import Path

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def merge_metadata():
    # 加载数据
    old_meta = load_json("assets/sprites/metadata.json")
    generated = load_json("assets/sprites/metadata_generated.json")
    
    # 创建新的 metadata
    output = {
        "_comment": "Pixel-perfect sprite metadata - v3.0",
        "_version": "3.0",
        "_schema": {
            "canvas_size": "画布尺寸 = 实际贴图尺寸（不再固定64x64）",
            "model_bounds": "基于非透明像素扫描的精确模型边界",
            "hitboxRatio": "碰撞箱占模型比例（默认0.95x0.95，飞行单位0.85x0.85）",
            "anchor": "center=几何中心, feet=脚底位置"
        }
    }
    
    # 敌人类型到贴图 key 的映射（基于 ENEMY_TYPES 配置）
    enemy_sprite_map = {
        # T1 普通怪
        'chick': 'chick',
        'mouse': 'mouse',
        'snail': 'snail',
        'pigeon': 'pigeon',
        'duck3': 'duck3',
        'bat': 'bird',  # bat 使用 bird 贴图
        
        # T2 精英怪 - 速度型
        'rabbit2': 'rabbit2',
        'bee': 'bird',  # bee 使用 bird 贴图
        'panther': 'cat',
        'tiaotiao': 'rabbit',
        'tiezhua': 'bird',
        
        # T2 精英怪 - 肉盾型
        'crab': 'crab',
        'nibei': 'turtle',
        'bear': 'bear',
        
        # T2 精英怪 - 射手型
        'snake': 'snake',
        'goose': 'goose',
        'fox': 'dog',
        
        # T2 精英怪 - 刺客型
        'yinya': 'dog2',
        
        # T3 Boss
        'wolf_king': 'dog2',
        'turtle': 'turtle',
        'mimic': 'bear',
        'ghost': 'pigeon',
        
        # T4 Boss
        'mother': 'bear',
    }
    
    # 处理玩家
    if 'player' in generated:
        player_data = generated['player'].copy()
        player_data['src'] = 'assets/sprites/player/player_0.png'
        output['player'] = player_data
        print(f"[OK] Player: {player_data['modelWidth']}x{player_data['modelHeight']}")
    
    # 处理NPC
    if 'npc_shopkeeper' in generated:
        npc_data = generated['npc_shopkeeper'].copy()
        npc_data['src'] = 'assets/sprites/misc/npc_shopkeeper.png'
        # 缩放NPC到合适尺寸（原始1024x1024太大）
        npc_data['scale'] = 0.1  # 提示渲染系统需要缩放
        output['npc_shopkeeper'] = npc_data
        print(f"[OK] NPC Shopkeeper: {npc_data['modelWidth']}x{npc_data['modelHeight']}")
    
    # 处理敌人（按 tier 分类）
    tiers = {
        1: [],
        2: [],
        3: [],
        4: []
    }
    
    # 从旧 metadata 中提取 tier 信息
    for enemy_key, sprite_key in enemy_sprite_map.items():
        if sprite_key not in generated:
            print(f"[WARN] Missing generated data for {enemy_key} -> {sprite_key}")
            continue
            
        # 获取生成的精确数据
        sprite_data = generated[sprite_key].copy()
        
        # 从旧配置中获取游戏元信息
        if enemy_key in old_meta:
            old_data = old_meta[enemy_key]
            tier = old_data.get('meta', {}).get('tier', 1)
            size = old_data.get('meta', {}).get('size', 40)
            enemy_type = old_data.get('meta', {}).get('type', 'normal')
            anim = old_data.get('meta', {}).get('anim', 'walk')
            
            sprite_data['meta'] = {
                'tier': tier,
                'size': size,
                'type': enemy_type,
                'anim': anim
            }
            
            # 保持原有的 src 路径格式
            sprite_data['src'] = old_data.get('src', f'assets/sprites/{sprite_key}.png')
            
            tiers[tier].append(enemy_key)
        else:
            # 默认元信息
            sprite_data['meta'] = {'tier': 1, 'size': 40, 'type': 'normal'}
            sprite_data['src'] = f'assets/sprites/{sprite_key}.png'
            tiers[1].append(enemy_key)
        
        output[enemy_key] = sprite_data
        print(f"[OK] {enemy_key}: {sprite_data['modelWidth']}x{sprite_data['modelHeight']} (tier {sprite_data['meta']['tier']})")
    
    # 添加分隔注释
    # 按 tier 排序输出
    final_output = {
        "_comment": "Pixel-perfect sprite metadata - v3.0",
        "_version": "3.0",
        "_schema": output['_schema']
    }
    
    # 添加玩家
    final_output["========================="] = "玩家"
    final_output['player'] = output['player']
    
    # 添加NPC
    final_output["=========================="] = "NPC"
    final_output['npc_shopkeeper'] = output['npc_shopkeeper']
    
    # 按 tier 添加敌人
    tier_names = {
        1: "T1: 普通怪 (白色)",
        2: "T2: 精英怪 (蓝色/绿色/红色/紫色)",
        3: "T3: 小Boss (金色)",
        4: "T4: Boss (深红)"
    }
    
    for tier in [1, 2, 3, 4]:
        if tiers[tier]:
            final_output[f"==========================={tier}"] = tier_names[tier]
            for enemy_key in sorted(tiers[tier]):
                final_output[enemy_key] = output[enemy_key]
    
    # 保存
    save_json("assets/sprites/metadata.json", final_output)
    print(f"\n{'='*60}")
    print(f"[OK] Updated: assets/sprites/metadata.json")
    print(f"  Total entries: {len(output) - 3}")  # 减去注释字段
    print(f"  T1: {len(tiers[1])}, T2: {len(tiers[2])}, T3: {len(tiers[3])}, T4: {len(tiers[4])}")
    print(f"{'='*60}")
    
    # 打印对比信息
    print("\n=== 关键改进 ===")
    print("Player collision box:")
    old_player = old_meta.get('player', {})
    new_player = output.get('player', {})
    print(f"  Old: {old_player.get('modelWidth', 'N/A')}x{old_player.get('modelHeight', 'N/A')}")
    print(f"  New: {new_player.get('modelWidth', 'N/A')}x{new_player.get('modelHeight', 'N/A')}")
    
    print("\nSample enemy collision boxes:")
    for key in ['chick', 'bear', 'turtle']:
        if key in output:
            old = old_meta.get(key, {})
            new = output.get(key, {})
            old_size = f"{old.get('modelWidth', '?')}x{old.get('modelHeight', '?')}"
            new_size = f"{new.get('modelWidth', '?')}x{new.get('modelHeight', '?')}"
            print(f"  {key}: {old_size} -> {new_size}")

if __name__ == '__main__':
    merge_metadata()
