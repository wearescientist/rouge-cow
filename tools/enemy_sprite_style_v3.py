#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格统一优化 V3
综合 V1(色彩) + V2(阴影) + 加强版边缘处理
"""

import os
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import numpy as np

CONFIG = {
    # ===== V1 色彩优化（保留加强）=====
    # 1. 边缘软化 - 更强
    'edge_soften_radius': 2.0,      # 边缘羽化半径
    'edge_soften_strength': 0.7,    # 边缘羽化强度
    
    # 2. 明暗调整 - 整体压暗
    'black_threshold': 40,          # 压低纯黑阈值
    'shadow_lift': 20,              # 暗部提亮（但要控制）
    'highlight_compress': 30,       # 亮部压缩加强
    'contrast_reduction': 0.82,     # 对比度降低更多
    'overall_darken': 0.9,          # 整体压暗系数
    
    # 3. 色彩调整 - 红色大幅降饱和
    'saturation_factor': 0.85,      # 整体降饱和
    'red_saturation_extra': 0.7,    # 红色大幅降饱和！
    'red_darken': 0.85,             # 红色额外压暗
    'warm_tint': (3, 1, -2),        # 暖灰倾向
    
    # ===== V2 阴影优化（修正）=====
    # 4. 内阴影 - 更强
    'inner_shadow_size': 4,         # 内阴影像素
    'inner_shadow_darkness': 35,    # 暗度加深值（更强）
    
    # 5. 接地投影 - 椭圆形
    'ground_shadow': True,
    'shadow_width_ratio': 1.2,      # 投影宽度倍数
    'shadow_height': 12,            # 投影高度
    'shadow_opacity': 100,          # 不透明度
    'shadow_blur': 6,               # 投影模糊
}

def soften_edges_v3(img, config):
    """V3: 更强的边缘软化"""
    # 检测边缘
    gray = img.convert('L')
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_mask = edges.point(lambda x: 255 if x > 20 else 0)
    edge_mask = edge_mask.filter(ImageFilter.MaxFilter(5))
    
    # 模糊原图
    softened = img.filter(ImageFilter.GaussianBlur(config['edge_soften_radius']))
    
    # 混合
    edge_mask = edge_mask.convert('L')
    result = Image.composite(img, softened, edge_mask)
    return Image.blend(img, result, config['edge_soften_strength'])

def reduce_pure_black_white_v3(img, config):
    """V3: 更强的明暗压缩 + 整体压暗"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    brightness = (r * 0.299 + g * 0.587 + b * 0.114)
    
    # 提亮极暗部（但控制在一定范围）
    black_mask = brightness < config['black_threshold']
    for c in [r, g, b]:
        c[black_mask] = np.clip(c[black_mask] + config['shadow_lift'], 0, 255)
    
    # 压暗亮部
    white_mask = brightness > 200
    for c in [r, g, b]:
        c[white_mask] = np.clip(c[white_mask] - config['highlight_compress'], 0, 255)
    
    # 整体压暗（关键！）
    for c in [r, g, b]:
        c *= config['overall_darken']
    
    arr[:,:,0] = r
    arr[:,:,1] = g
    arr[:,:,2] = b
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def adjust_color_tone_v3(img, config):
    """V3: 更强的色彩调整，特别是红色"""
    r, g, b, a = img.split()
    rgb = Image.merge('RGB', (r, g, b))
    
    # 整体降饱和
    enhancer = ImageEnhance.Color(rgb)
    rgb = enhancer.enhance(config['saturation_factor'])
    
    arr = np.array(rgb).astype(np.float32)
    
    # 检测红色区域 - 更严格的条件
    red_mask = (arr[:,:,0] > arr[:,:,1] + 15) & (arr[:,:,0] > arr[:,:,2] + 15)
    
    # 红色大幅降饱和 + 压暗
    arr[red_mask, 0] = np.clip(arr[red_mask, 0] * config['red_saturation_extra'], 0, 255)
    arr[red_mask, 0] = np.clip(arr[red_mask, 0] * config['red_darken'], 0, 255)  # 额外压暗
    arr[red_mask, 1] = np.clip(arr[red_mask, 1] * 0.88, 0, 255)
    arr[red_mask, 2] = np.clip(arr[red_mask, 2] * 0.88, 0, 255)
    
    # 暖灰倾向
    warm_r, warm_g, warm_b = config['warm_tint']
    arr = arr.astype(np.int16)
    arr[:,:,0] = np.clip(arr[:,:,0] + warm_r, 0, 255)
    arr[:,:,1] = np.clip(arr[:,:,1] + warm_g, 0, 255)
    arr[:,:,2] = np.clip(arr[:,:,2] + warm_b, 0, 255)
    
    rgb = Image.fromarray(arr.astype(np.uint8), 'RGB')
    return Image.merge('RGBA', (*rgb.split(), a))

def add_inner_shadow_v3(img, config):
    """V3: 更强的内阴影"""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    mask = a > 0
    alpha_img = Image.fromarray((mask * 255).astype(np.uint8))
    
    # 更强的膨胀
    dilated = alpha_img.filter(ImageFilter.MaxFilter(config['inner_shadow_size'] * 2 + 1))
    dilated_arr = np.array(dilated) > 0
    
    edge_mask = dilated_arr & ~mask
    
    edge_img = Image.fromarray((edge_mask * 255).astype(np.uint8))
    blurred_edge = edge_img.filter(ImageFilter.GaussianBlur(config['inner_shadow_size']))
    edge_intensity = np.array(blurred_edge) / 255.0
    
    # 在有像素的地方应用更强的内阴影
    shadow_mask = edge_intensity * (a > 0).astype(float)
    darkening = config['inner_shadow_darkness'] * shadow_mask
    
    r = np.clip(r - darkening, 0, 255)
    g = np.clip(g - darkening, 0, 255)
    b = np.clip(b - darkening, 0, 255)
    
    arr[:,:,0] = r
    arr[:,:,1] = g
    arr[:,:,2] = b
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def add_ground_shadow_ellipse(img, config):
    """V3: 正确的椭圆接地投影"""
    if not config['ground_shadow']:
        return img
    
    arr = np.array(img)
    h, w = arr.shape[:2]
    alpha = arr[:,:,3]
    
    # 找到怪物底部边界框
    y_coords, x_coords = np.where(alpha > 0)
    if len(y_coords) == 0:
        return img
    
    min_y, max_y = y_coords.min(), y_coords.max()
    min_x, max_x = x_coords.min(), x_coords.max()
    
    # 计算椭圆投影位置和大小
    center_x = (min_x + max_x) // 2
    width = (max_x - min_x) * config['shadow_width_ratio']
    height = config['shadow_height']
    bottom_y = min(max_y + height//2, h - 1)
    
    # 创建投影层
    shadow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    
    # 绘制椭圆
    ellipse_box = [
        center_x - width//2,
        min(max_y, h - height - 1),
        center_x + width//2,
        min(max_y + height, h - 1)
    ]
    
    # 多层椭圆实现渐变
    for i in range(3):
        alpha_val = int(config['shadow_opacity'] * (1 - i * 0.3))
        offset = i * 2
        box = [
            ellipse_box[0] + offset,
            ellipse_box[1] + offset//2,
            ellipse_box[2] - offset,
            ellipse_box[3] - offset//2
        ]
        draw.ellipse(box, fill=(0, 0, 0, alpha_val))
    
    # 模糊投影
    shadow = shadow.filter(ImageFilter.GaussianBlur(config['shadow_blur']))
    
    # 混合
    return Image.alpha_composite(shadow, img)

def simplify_details_v3(img, config):
    """V3: 简化细节"""
    smoothed = img.filter(ImageFilter.BoxBlur(1))
    return Image.blend(img, smoothed, 0.25)

def process_sprite_v3(input_path, output_path, config):
    """V3: 完整处理流程"""
    img = Image.open(input_path).convert('RGBA')
    
    # 1. 边缘软化（V1加强）
    img = soften_edges_v3(img, config)
    
    # 2. 明暗压缩 + 整体压暗（V1加强）
    img = reduce_pure_black_white_v3(img, config)
    
    # 3. 色彩调整（V1加强，红色大幅处理）
    img = adjust_color_tone_v3(img, config)
    
    # 4. 细节简化
    img = simplify_details_v3(img, config)
    
    # 5. 内阴影（V2加强）
    img = add_inner_shadow_v3(img, config)
    
    # 6. 椭圆接地投影（V3修正）
    img = add_ground_shadow_ellipse(img, config)
    
    img.save(output_path, 'PNG')
    return True

def process_floor_v3(floor_num, base_dir, output_dir):
    """V3: 处理整层"""
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
                    process_sprite_v3(frame_file, output_path, CONFIG)
                except Exception as e:
                    print(f"  错误 {frame_file.name}: {e}")
    
    print(f"\n完成！输出: {output_floor}")

if __name__ == "__main__":
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_hd2d_v3"
    
    print("="*60)
    print("怪物贴图 HD-2D 风格优化 V3")
    print("="*60)
    print("V1色彩 + V2阴影 + 加强版边缘 + 椭圆投影")
    print("-"*60)
    
    process_floor_v3(1, BASE_DIR, OUTPUT_DIR)
