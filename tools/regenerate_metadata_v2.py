#!/usr/bin/env python3
"""
Sprite Metadata Generator v2 - 精确像素边界提取
使用 PIL 分析 PNG 的非透明像素，生成精确的 bounds 数据
"""

from PIL import Image
import json
import os
from pathlib import Path

def analyze_image(path):
    """分析图片，返回精确的非透明像素边界"""
    try:
        with Image.open(path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            width, height = img.size
            pixels = img.load()
            
            min_x, min_y = width, height
            max_x, max_y = 0, 0
            has_visible = False
            
            for y in range(height):
                for x in range(width):
                    r, g, b, a = pixels[x, y]
                    if a > 10:  # 透明度阈值
                        has_visible = True
                        min_x = min(min_x, x)
                        min_y = min(min_y, y)
                        max_x = max(max_x, x)
                        max_y = max(max_y, y)
            
            if not has_visible:
                return None
            
            return {
                'canvasWidth': width,
                'canvasHeight': height,
                'bounds': {
                    'x': min_x,
                    'y': min_y,
                    'width': max_x - min_x + 1,
                    'height': max_y - min_y + 1
                }
            }
    except Exception as e:
        print(f"Error analyzing {path}: {e}")
        return None

def process_sprites():
    """处理所有贴图"""
    sprite_dir = Path('assets/sprites')
    
    # 定义要处理的贴图
    sprites_to_process = {
        'player': 'player/player_0.png',
        'npc_shopkeeper': 'misc/npc_shopkeeper.png',
        # T1 敌人
        'chick': 'chick.png',
        'mouse': 'mouse.png',
        'snail': 'snail.png',
        'pigeon': 'pigeon.png',
        'duck3': 'duck3.png',
        'bat': 'bird.png',  # bat 使用 bird 贴图
        # T2 敌人
        'rabbit2': 'rabbit2.png',
        'bee': 'bird.png',
        'panther': 'cat.png',
        'tiaotiao': 'rabbit.png',
        'tiezhua': 'bird.png',
        'crab': 'crab.png',
        'nibei': 'turtle.png',
        'bear': 'bear.png',
        'snake': 'snake.png',
        'goose': 'goose.png',
        'fox': 'dog.png',
        'yinya': 'dog2.png',
        # T3 敌人
        'wolf_king': 'dog2.png',
        'turtle': 'turtle.png',
        'mimic': 'bear.png',
        'ghost': 'pigeon.png',
        # T4 敌人
        'mother': 'bear.png',
    }
    
    results = {
        '_version': '2.0-pixel-perfect',
        '_description': '基于非透明像素边界的精确贴图数据'
    }
    
    # 从旧配置加载元信息
    try:
        with open('assets/sprites/metadata.json', 'r', encoding='utf-8') as f:
            old_meta = json.load(f)
    except:
        old_meta = {}
    
    for key, rel_path in sprites_to_process.items():
        full_path = sprite_dir / rel_path
        if not full_path.exists():
            print(f'[SKIP] Not found: {rel_path}')
            continue
        
        print(f'[PROCESS] {key}: {rel_path}')
        
        data = analyze_image(str(full_path))
        if not data:
            print(f'  [WARN] No visible pixels')
            continue
        
        # 添加元信息
        if key in old_meta and isinstance(old_meta[key], dict):
            old = old_meta[key]
            data['meta'] = old.get('meta', {})
            data['hitboxRatio'] = old.get('hitboxRatio', {'w': 0.95, 'h': 0.95})
            data['src'] = f'assets/sprites/{rel_path}'
        else:
            data['meta'] = {'tier': 0, 'type': 'unknown'}
            data['hitboxRatio'] = {'w': 0.95, 'h': 0.95}
        
        # 计算锚点 (基于bounds)
        bounds = data['bounds']
        center_x = bounds['x'] + bounds['width'] / 2
        center_y = bounds['y'] + bounds['height'] / 2
        feet_y = bounds['y'] + bounds['height']
        
        data['anchor'] = {
            'center': {'x': round(center_x), 'y': round(center_y)},
            'feet': {'x': round(center_x), 'y': round(feet_y)}
        }
        
        results[key] = data
        
        # 打印统计
        print(f'  Canvas: {data["canvasWidth"]}x{data["canvasHeight"]}')
        print(f'  Bounds: {bounds["width"]}x{bounds["height"]} @ ({bounds["x"]},{bounds["y"]})')
        print(f'  Fill: {(bounds["width"] * bounds["height"]) / (data["canvasWidth"] * data["canvasHeight"]) * 100:.1f}%')
    
    # 保存结果
    output_path = 'assets/sprites/metadata_v2.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f'\n[OK] Generated: {output_path}')
    print(f'Total sprites: {len(results) - 2}')  # 减去版本字段

if __name__ == '__main__':
    process_sprites()
