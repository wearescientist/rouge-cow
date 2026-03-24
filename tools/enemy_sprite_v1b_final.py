#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图 V1b 最终版 - 第一层全处理
核心：50%降采样压细节 → 近邻放大保轮廓 → 混原图30% → 底部轻压暗
"""

import os
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

CONFIG = {
    # 核心：风格性降采样
    'downscale_ratio': 0.5,      # 50% 降采样
    'resample_down': Image.LANCZOS,  # 降采样用LANCZOS保质量
    'resample_up': Image.NEAREST,    # 放大用NEAREST保块面感（关键！）
    
    # 混回原图比例
    'blend_original': 0.3,       # 30%原图混回，避免纯糊
    
    # 底部轻压暗（模拟接地）
    'bottom_darken_height': 6,   # 底部6像素
    'bottom_darken_amount': 15,  # 轻微压暗
}

def style_resample(img, config):
    """核心：风格性降采样 - 50%降采样后NEAREST放大"""
    orig_w, orig_h = img.size
    
    # 1. 降采样到50%（压掉高清细节）
    small_w = int(orig_w * config['downscale_ratio'])
    small_h = int(orig_h * config['downscale_ratio'])
    small = img.resize((small_w, small_h), config['resample_down'])
    
    # 2. NEAREST放大回原尺寸（保块面感，关键！）
    blocky = small.resize((orig_w, orig_h), config['resample_up'])
    
    # 3. 混回原图30%（避免纯糊，保留一点细节）
    result = Image.blend(blocky, img, config['blend_original'])
    
    return result

def add_bottom_contact(img, config):
    """底部轻压暗 - 模拟接地接触感"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    h, w = arr.shape[:2]
    
    # 找底部有像素的区域
    mask = a > 0
    bottom_y = 0
    for y in range(h-1, -1, -1):
        if np.any(mask[y]):
            bottom_y = y
            break
    
    if bottom_y == 0:
        return img
    
    # 底部轻压暗
    darken_height = min(config['bottom_darken_height'], h // 4)
    start_y = max(0, bottom_y - darken_height)
    
    for y in range(start_y, min(bottom_y + 1, h)):
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

def process_sprite_v1b(input_path, output_path, config):
    """V1b 单张处理"""
    img = Image.open(input_path).convert('RGBA')
    
    # 1. 风格性降采样（核心）
    img = style_resample(img, config)
    
    # 2. 底部轻压暗
    img = add_bottom_contact(img, config)
    
    img.save(output_path, 'PNG')
    return True

def process_floor_v1b(floor_num, base_dir, output_dir):
    """处理整层"""
    floor_path = Path(base_dir) / f"floor{floor_num}"
    output_floor = Path(output_dir) / f"floor{floor_num}"
    
    total_frames = 0
    
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
            frame_count = len(frame_files)
            total_frames += frame_count
            
            print(f"Processing: {base_id}/{version} - {frame_count} frames")
            
            for frame_file in frame_files:
                output_path = out_walk / frame_file.name
                try:
                    process_sprite_v1b(frame_file, output_path, CONFIG)
                except Exception as e:
                    print(f"  Error {frame_file.name}: {e}")
    
    print(f"\nDone! Total: {total_frames} frames")
    print(f"Output: {output_floor}")
    return total_frames

if __name__ == "__main__":
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_v1b_final"
    
    print("="*70)
    print("Monster Sprite V1b Final - Floor 1")
    print("="*70)
    print("Style: 50% downscale → NEAREST upscale → 30% blend original")
    print("       + light bottom contact darken")
    print("-"*70)
    
    process_floor_v1b(1, BASE_DIR, OUTPUT_DIR)
