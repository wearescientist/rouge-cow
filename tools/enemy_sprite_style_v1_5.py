#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格统一优化 V1.5
基于 V1 的轻微加强版：
- 保持 V1 边缘柔化、色彩调整
- 轻微整体压暗 5%（不是 10%）
- 底部边缘暗化（模拟接地接触感）
- 红色降饱和 0.82（V1 是 0.88）
"""

import os
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

CONFIG = {
    # ===== V1 核心（保持）=====
    # 1. 边缘软化
    'edge_soften_radius': 1.5,
    'edge_soften_strength': 0.6,
    
    # 2. 明暗调整
    'black_threshold': 30,
    'shadow_lift': 15,
    'highlight_compress': 20,
    'contrast_reduction': 0.85,
    
    # ===== V1.5 微调 =====
    # 3. 轻微整体压暗（5% 不是 10%）
    'overall_darken': 0.95,
    
    # 4. 红色再降一点（0.82 不是 0.88）
    'saturation_factor': 0.88,
    'red_saturation_extra': 0.82,
    'warm_tint': (3, 1, -2),
    
    # 5. 底部边缘暗化（模拟接触感）
    'bottom_darken_height': 8,      # 底部多少像素
    'bottom_darken_amount': 20,     # 暗化程度
}

def soften_edges(img, config):
    """V1: 边缘软化"""
    gray = img.convert('L')
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_mask = edges.point(lambda x: 255 if x > 30 else 0)
    edge_mask = edge_mask.filter(ImageFilter.MaxFilter(3))
    
    softened = img.filter(ImageFilter.GaussianBlur(config['edge_soften_radius']))
    edge_mask = edge_mask.convert('L')
    result = Image.composite(img, softened, edge_mask)
    return Image.blend(img, result, config['edge_soften_strength'])

def reduce_pure_black_white(img, config):
    """V1: 明暗压缩"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    brightness = (r * 0.299 + g * 0.587 + b * 0.114)
    
    black_mask = brightness < config['black_threshold']
    for c in [r, g, b]:
        c[black_mask] = np.clip(c[black_mask] + config['shadow_lift'], 0, 255)
    
    white_mask = brightness > 200
    for c in [r, g, b]:
        c[white_mask] = np.clip(c[white_mask] - config['highlight_compress'], 0, 255)
    
    arr[:,:,0] = r
    arr[:,:,1] = g
    arr[:,:,2] = b
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def adjust_color_tone(img, config):
    """V1.5: 色彩调整，红色 0.82"""
    r, g, b, a = img.split()
    rgb = Image.merge('RGB', (r, g, b))
    
    enhancer = ImageEnhance.Color(rgb)
    rgb = enhancer.enhance(config['saturation_factor'])
    
    arr = np.array(rgb).astype(np.float32)
    
    # 红色 0.82
    red_mask = (arr[:,:,0] > arr[:,:,1] + 20) & (arr[:,:,0] > arr[:,:,2] + 20)
    arr[red_mask, 0] = np.clip(arr[red_mask, 0] * config['red_saturation_extra'], 0, 255)
    
    # 暖灰倾向
    arr = arr.astype(np.int16)
    warm_r, warm_g, warm_b = config['warm_tint']
    arr[:,:,0] = np.clip(arr[:,:,0] + warm_r, 0, 255)
    arr[:,:,1] = np.clip(arr[:,:,1] + warm_g, 0, 255)
    arr[:,:,2] = np.clip(arr[:,:,2] + warm_b, 0, 255)
    
    rgb = Image.fromarray(arr.astype(np.uint8), 'RGB')
    return Image.merge('RGBA', (*rgb.split(), a))

def add_bottom_contact_darken(img, config):
    """V1.5: 底部边缘暗化（模拟接地接触感）"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    h, w = arr.shape[:2]
    
    # 找到底部有像素的区域
    mask = a > 0
    bottom_y = 0
    for y in range(h-1, -1, -1):
        if np.any(mask[y]):
            bottom_y = y
            break
    
    if bottom_y == 0:
        return img
    
    # 从底部往上 darken_height 像素逐渐暗化
    darken_height = min(config['bottom_darken_height'], h // 4)
    start_y = max(0, bottom_y - darken_height)
    
    for y in range(start_y, min(bottom_y + 1, h)):
        # 计算暗化强度（越底部越强）
        progress = (y - start_y) / darken_height if darken_height > 0 else 1
        darken = config['bottom_darken_amount'] * progress
        
        for x in range(w):
            if a[y, x] > 0:
                r[y, x] = max(0, r[y, x] - darken)
                g[y, x] = max(0, g[y, x] - darken)
                b[y, x] = max(0, b[y, x] - darken)
    
    arr[:,:,0] = r
    arr[:,:,1] = g
    arr[:,:,2] = b
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def overall_darken_light(img, config):
    """V1.5: 轻微整体压暗 5%"""
    arr = np.array(img).astype(np.float32)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    # 只压暗 5%
    r *= config['overall_darken']
    g *= config['overall_darken']
    b *= config['overall_darken']
    
    arr[:,:,0] = np.clip(r, 0, 255)
    arr[:,:,1] = np.clip(g, 0, 255)
    arr[:,:,2] = np.clip(b, 0, 255)
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def simplify_details(img, config):
    """V1: 细节简化"""
    smoothed = img.filter(ImageFilter.BoxBlur(1))
    return Image.blend(img, smoothed, 0.2)

def process_sprite_v1_5(input_path, output_path, config):
    """V1.5 处理流程"""
    img = Image.open(input_path).convert('RGBA')
    
    # 1. 边缘软化（V1）
    img = soften_edges(img, config)
    
    # 2. 明暗压缩（V1）
    img = reduce_pure_black_white(img, config)
    
    # 3. 色彩调整（V1.5 红色 0.82）
    img = adjust_color_tone(img, config)
    
    # 4. 细节简化（V1）
    img = simplify_details(img, config)
    
    # 5. 轻微整体压暗 5%（V1.5 新增）
    img = overall_darken_light(img, config)
    
    # 6. 底部边缘暗化（V1.5 新增）
    img = add_bottom_contact_darken(img, config)
    
    img.save(output_path, 'PNG')
    return True

def process_floor_v1_5(floor_num, base_dir, output_dir):
    """处理整层 V1.5"""
    floor_path = Path(base_dir) / f"floor{floor_num}"
    output_floor = Path(output_dir) / f"floor{floor_num}"
    
    for monster_dir in sorted(floor_path.iterdir()):
        if not monster_dir.is_dir():
            continue
        
        base_id = monster_dir.name
        
        for version_dir in sorted(monster_dir.iterdir()):
            if not version_dir.is_dir():
                continue
            
            version = version_dir.name
            walk_dir = version_dir / "walk"
            
            if not walk_dir.exists():
                continue
            
            out_walk = output_floor / base_id / version / "walk"
            out_walk.mkdir(parents=True, exist_ok=True)
            
            frame_files = sorted(walk_dir.glob("*.png"))
            print(f"Processing: floor{floor_num}/{base_id}/{version} - {len(frame_files)} frames")
            
            for frame_file in frame_files:
                output_path = out_walk / frame_file.name
                try:
                    process_sprite_v1_5(frame_file, output_path, CONFIG)
                except Exception as e:
                    print(f"  Error {frame_file.name}: {e}")
    
    print(f"\nDone! Output: {output_floor}")

if __name__ == "__main__":
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_hd2d_v1_5"
    
    print("="*60)
    print("Monster Sprite HD-2D Style V1.5")
    print("="*60)
    print("Based on V1 + slight improvements")
    print("- 5% overall darken")
    print("- Bottom contact darken")
    print("- Red saturation 0.82")
    print("-"*60)
    
    process_floor_v1_5(1, BASE_DIR, OUTPUT_DIR)
