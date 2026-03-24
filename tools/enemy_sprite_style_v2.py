#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格统一优化 V2
重点：添加正确的 HD-2D 边缘（羽化暗边 + 接地阴影）
"""

import os
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

CONFIG = {
    # 1. 边缘处理 - 添加羽化的内阴影
    'inner_shadow_size': 3,         # 内阴影像素数
    'inner_shadow_darkness': 25,    # 暗度加深值
    'edge_soften': 1.5,             # 边缘羽化半径
    
    # 2. 接地阴影
    'ground_shadow': True,
    'shadow_height': 8,             # 阴影高度
    'shadow_opacity': 80,           # 阴影不透明度
    
    # 3. 明暗调整（保持）
    'contrast_reduction': 0.90,
    'saturation_factor': 0.92,
    
    # 4. 红色调整
    'red_saturation_extra': 0.88,
}

def add_inner_shadow(img, config):
    """添加内阴影（边缘向内的柔和暗化）"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    # 创建mask（有像素的区域）
    mask = a > 0
    
    # 找边缘：向外膨胀后再减去原mask，得到边缘区域
    from PIL import Image
    alpha_img = Image.fromarray((mask * 255).astype(np.uint8))
    dilated = alpha_img.filter(ImageFilter.MaxFilter(config['inner_shadow_size'] * 2 + 1))
    dilated_arr = np.array(dilated) > 0
    
    # 边缘 = 膨胀后的 - 原mask
    edge_mask = dilated_arr & ~mask
    
    # 将边缘向内扩散（模拟内阴影）
    edge_img = Image.fromarray((edge_mask * 255).astype(np.uint8))
    blurred_edge = edge_img.filter(ImageFilter.GaussianBlur(config['inner_shadow_size']))
    edge_intensity = np.array(blurred_edge) / 255.0
    
    # 在有像素的地方应用内阴影
    shadow_mask = edge_intensity * (a > 0).astype(float)
    darkening = config['inner_shadow_darkness'] * shadow_mask
    
    r = np.clip(r - darkening, 0, 255)
    g = np.clip(g - darkening, 0, 255)
    b = np.clip(b - darkening, 0, 255)
    
    arr[:,:,0] = r
    arr[:,:,1] = g
    arr[:,:,2] = b
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def add_ground_shadow(img, config):
    """在底部添加接地阴影"""
    if not config['ground_shadow']:
        return img
    
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    # 找到最底部有像素的行
    alpha = arr[:,:,3]
    bottom_rows = []
    for y in range(h-1, -1, -1):
        if np.any(alpha[y] > 0):
            bottom_rows.append(y)
            if len(bottom_rows) >= 5:  # 取底部5行
                break
    
    if not bottom_rows:
        return img
    
    # 创建阴影层
    shadow = np.zeros((h, w, 4), dtype=np.uint8)
    shadow_opacity = config['shadow_opacity']
    
    # 在底部绘制阴影
    shadow_height = min(config['shadow_height'], h // 4)
    for i, y in enumerate(range(max(bottom_rows) + 1, min(max(bottom_rows) + 1 + shadow_height, h))):
        fade = 1 - (i / shadow_height)  # 向上淡出
        for x in range(w):
            # 检查这一列在上方是否有怪物像素
            if np.any(alpha[max(0, y-20):y, x] > 0):
                shadow[y, x] = [0, 0, 0, int(shadow_opacity * fade)]
    
    # 混合阴影和原图
    shadow_img = Image.fromarray(shadow, 'RGBA')
    return Image.alpha_composite(shadow_img, img)

def adjust_color_tone(img, config):
    """色彩调整"""
    from PIL import ImageEnhance
    
    # 分离Alpha
    r, g, b, a = img.split()
    rgb = Image.merge('RGB', (r, g, b))
    
    # 降饱和
    enhancer = ImageEnhance.Color(rgb)
    rgb = enhancer.enhance(config['saturation_factor'])
    
    # 红色额外处理
    arr = np.array(rgb)
    red_mask = (arr[:,:,0] > arr[:,:,1] + 20) & (arr[:,:,0] > arr[:,:,2] + 20)
    arr[red_mask, 0] = np.clip(arr[red_mask, 0] * config['red_saturation_extra'], 0, 255)
    arr[red_mask, 1] = np.clip(arr[red_mask, 1] * 0.92, 0, 255)
    arr[red_mask, 2] = np.clip(arr[red_mask, 2] * 0.92, 0, 255)
    
    rgb = Image.fromarray(arr, 'RGB')
    return Image.merge('RGBA', (*rgb.split(), a))

def process_sprite_v2(input_path, output_path, config):
    """处理单张贴图 V2"""
    img = Image.open(input_path).convert('RGBA')
    
    # 1. 添加内阴影（关键！）
    img = add_inner_shadow(img, config)
    
    # 2. 添加接地阴影
    img = add_ground_shadow(img, config)
    
    # 3. 色彩调整
    img = adjust_color_tone(img, config)
    
    # 保存
    img.save(output_path, 'PNG')
    return True

def process_floor_v2(floor_num, base_dir, output_dir):
    """处理整层 V2"""
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
            print(f"处理: floor{floor_num}/{base_id}/{version} - {len(frame_files)}帧")
            
            for frame_file in frame_files:
                output_path = out_walk / frame_file.name
                try:
                    process_sprite_v2(frame_file, output_path, CONFIG)
                except Exception as e:
                    print(f"  错误 {frame_file.name}: {e}")
    
    print(f"\n完成！输出: {output_floor}")

if __name__ == "__main__":
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_hd2d"
    
    print("="*60)
    print("怪物贴图 HD-2D 风格优化 V2")
    print("="*60)
    print("重点：内阴影 + 接地阴影 + 柔和边缘")
    print("-"*60)
    
    process_floor_v2(1, BASE_DIR, OUTPUT_DIR)
