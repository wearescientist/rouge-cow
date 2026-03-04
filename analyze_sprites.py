#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析怪物贴图实际尺寸，建议合适的 size 值
"""

from PIL import Image
import os

SPRITES_DIR = r"E:\AI\game\rougelike-cow\assets\sprites"

ENEMY_SPRITES = [
    'bear', 'bird', 'boss6', 'cat', 'chick', 'crab',
    'dog', 'dog2', 'duck', 'duck2', 'duck3', 'goose',
    'mouse', 'pig', 'pig2', 'pigeon', 'rabbit', 'rabbit2',
    'sheep', 'snail', 'snake', 'squirrel', 'turtle'
]

def get_content_size(img_path):
    """获取贴图模型实际大小"""
    img = Image.open(img_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    pixels = img.load()
    width, height = img.size
    
    left = width
    top = height
    right = 0
    bottom = 0
    
    has_content = False
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 10:
                has_content = True
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    
    if not has_content:
        return None
    
    content_width = right - left + 1
    content_height = bottom - top + 1
    
    return {
        'image_size': (width, height),
        'content_bounds': (left, top, right, bottom),
        'content_size': (content_width, content_height),
        'max_dimension': max(content_width, content_height)
    }

print("=" * 70)
print("怪物贴图实际尺寸分析")
print("=" * 70)
print(f"{'贴图名':<15} {'图像大小':<12} {'内容大小':<12} {'最大边':<8} {'建议size'}")
print("-" * 70)

for name in ENEMY_SPRITES:
    filepath = os.path.join(SPRITES_DIR, name + '.png')
    if os.path.exists(filepath):
        info = get_content_size(filepath)
        if info:
            # 建议 size 值：内容最大边长的约 80%
            suggested = int(info['max_dimension'] * 0.8)
            # 四舍五入到偶数
            suggested = (suggested // 2) * 2
            suggested = max(16, min(72, suggested))  # 限制在 16-72 之间
            
            print(f"{name:<15} {str(info['image_size']):<12} {str(info['content_size']):<12} "
                  f"{info['max_dimension']:<8} {suggested}")
        else:
            print(f"{name:<15} 空贴图")
    else:
        print(f"{name:<15} 文件不存在")

print("=" * 70)
