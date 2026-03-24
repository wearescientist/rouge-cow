#!/usr/bin/env python3
"""
贴图源文件裁剪工具
直接裁剪透明区域，覆盖原文件
"""

from PIL import Image
import json
import shutil
from pathlib import Path
import os

def backup_sprites():
    """备份 sprites 文件夹"""
    sprite_dir = Path('assets/sprites')
    backup_dir = Path('assets/sprites_backup')
    
    if backup_dir.exists():
        print('[INFO] 删除旧备份...')
        shutil.rmtree(backup_dir)
    
    print('[INFO] 创建备份...')
    shutil.copytree(sprite_dir, backup_dir)
    print(f'[OK] 备份完成: {backup_dir}')
    return True

def crop_image(input_path):
    """裁剪图片的非透明区域，返回新尺寸信息"""
    try:
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # 获取原始尺寸
            orig_width, orig_height = img.size
            
            # 找到非透明边界
            bbox = img.getbbox()
            if not bbox:
                print(f'  [WARN] 完全透明: {input_path}')
                return None
            
            left, top, right, bottom = bbox
            new_width = right - left
            new_height = bottom - top
            
            # 裁剪并保存
            cropped = img.crop(bbox)
            cropped.save(input_path)
            
            return {
                'orig_width': orig_width,
                'orig_height': orig_height,
                'new_width': new_width,
                'new_height': new_height,
                'offset_x': left,
                'offset_y': top
            }
    except Exception as e:
        print(f'  [ERROR] {input_path}: {e}')
        return None

def process_all_sprites():
    """处理所有贴图"""
    sprite_dir = Path('assets/sprites')
    
    # 首先备份
    if not backup_sprites():
        return False
    
    print('\n[INFO] 开始裁剪贴图...\n')
    
    results = {}
    
    # 定义要处理的贴图映射 (key: 逻辑名, value: 相对路径)
    sprite_mapping = {
        'player': 'player/player_0.png',
        'npc_shopkeeper': 'misc/npc_shopkeeper.png',
        'chick': 'chick.png',
        'mouse': 'mouse.png',
        'snail': 'snail.png',
        'pigeon': 'pigeon.png',
        'duck3': 'duck3.png',
        'bat': 'bird.png',
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
        'wolf_king': 'dog2.png',
        'turtle': 'turtle.png',
        'mimic': 'bear.png',
        'ghost': 'pigeon.png',
        'mother': 'bear.png',
    }
    
    for key, rel_path in sprite_mapping.items():
        full_path = sprite_dir / rel_path
        if not full_path.exists():
            print(f'[SKIP] 不存在: {rel_path}')
            continue
        
        print(f'[CROP] {key}: {rel_path}')
        info = crop_image(str(full_path))
        
        if info:
            ratio = info['new_width'] / info['new_height']
            print(f"  {info['orig_width']}x{info['orig_height']} → {info['new_width']}x{info['new_height']} (ratio: {ratio:.2f})")
            results[key] = {
                'path': str(rel_path),
                'width': info['new_width'],
                'height': info['new_height'],
                'ratio': ratio
            }
    
    print(f'\n[OK] 裁剪完成，共处理 {len(results)} 个贴图')
    return results

if __name__ == '__main__':
    process_all_sprites()
