#!/usr/bin/env python3
"""
为裁剪后的贴图生成 metadata
所有 bounds 都是 {0,0,width,height}，无需偏移
"""

from PIL import Image
import json
from pathlib import Path

def generate_metadata():
    sprite_dir = Path('assets/sprites')
    
    # 贴图映射
    sprite_mapping = {
        'player': ('player/player_0.png', {'tier': 0, 'type': 'player'}),
        'npc_shopkeeper': ('misc/npc_shopkeeper.png', {'tier': 0, 'type': 'npc'}),
        'chick': ('chick.png', {'tier': 1, 'type': 'normal'}),
        'mouse': ('mouse.png', {'tier': 1, 'type': 'normal'}),
        'snail': ('snail.png', {'tier': 1, 'type': 'ground'}),
        'pigeon': ('pigeon.png', {'tier': 1, 'type': 'flying'}),
        'duck3': ('duck3.png', {'tier': 1, 'type': 'ground'}),
        'bat': ('bird.png', {'tier': 1, 'type': 'flying'}),
        'rabbit2': ('rabbit2.png', {'tier': 2, 'type': 'speed'}),
        'bee': ('bird.png', {'tier': 2, 'type': 'flying'}),
        'panther': ('cat.png', {'tier': 2, 'type': 'speed'}),
        'tiaotiao': ('rabbit.png', {'tier': 2, 'type': 'speed'}),
        'tiezhua': ('bird.png', {'tier': 2, 'type': 'flying'}),
        'crab': ('crab.png', {'tier': 2, 'type': 'tank'}),
        'nibei': ('turtle.png', {'tier': 2, 'type': 'tank'}),
        'bear': ('bear.png', {'tier': 2, 'type': 'tank'}),
        'snake': ('snake.png', {'tier': 2, 'type': 'ranged'}),
        'goose': ('goose.png', {'tier': 2, 'type': 'ranged'}),
        'fox': ('dog.png', {'tier': 2, 'type': 'ranged'}),
        'yinya': ('dog2.png', {'tier': 2, 'type': 'assassin'}),
        'wolf_king': ('dog2.png', {'tier': 3, 'type': 'boss'}),
        'turtle': ('turtle.png', {'tier': 3, 'type': 'boss'}),
        'mimic': ('bear.png', {'tier': 3, 'type': 'boss'}),
        'ghost': ('pigeon.png', {'tier': 3, 'type': 'boss'}),
        'mother': ('bear.png', {'tier': 4, 'type': 'boss'}),
    }
    
    results = {
        '_version': '3.0-cropped',
        '_description': '贴图已裁剪，无透明边距，bounds从(0,0)开始'
    }
    
    for key, (rel_path, meta) in sprite_mapping.items():
        full_path = sprite_dir / rel_path
        if not full_path.exists():
            print(f'[SKIP] {rel_path}')
            continue
        
        # 读取裁剪后的尺寸
        with Image.open(full_path) as img:
            width, height = img.size
        
        # 构建 metadata (简化版)
        data = {
            'canvasWidth': width,
            'canvasHeight': height,
            # 已裁剪，bounds 从 (0,0) 开始
            'bounds': {'x': 0, 'y': 0, 'width': width, 'height': height},
            # 锚点居中
            'anchor': {
                'center': {'x': width // 2, 'y': height // 2},
                'feet': {'x': width // 2, 'y': height}
            },
            'hitboxRatio': {'w': 0.95, 'h': 0.95},
            'src': f'assets/sprites/{rel_path}',
            'meta': meta
        }
        
        # 玩家添加动画配置
        if key == 'player':
            data['animation'] = {
                'type': 'horizontal',
                'frames': 8,
                'frameOffsets': [
                    {'x': 0, 'y': 0}, {'x': 0, 'y': 1},
                    {'x': 0, 'y': 0}, {'x': 0, 'y': -1},
                    {'x': 0, 'y': 0}, {'x': 0, 'y': 1},
                    {'x': 0, 'y': 0}, {'x': 0, 'y': -1}
                ]
            }
        
        results[key] = data
        print(f"[OK] {key}: {width}x{height}")
    
    # 保存
    output = 'assets/sprites/metadata.json'
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f'\n[OK] Generated: {output}')
    print(f'Total: {len(results)-2} sprites')

if __name__ == '__main__':
    generate_metadata()
