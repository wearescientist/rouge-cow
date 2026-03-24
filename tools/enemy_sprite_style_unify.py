#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格统一优化脚本
目标：将高清锐利贴图修成HD-2D电影感入镜态
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np

# 处理参数（可调整）
CONFIG = {
    # 1. 边缘软化
    'edge_soften_radius': 1.5,      # 边缘羽化半径（像素）
    'edge_soften_strength': 0.6,    # 边缘羽化强度 (0-1)
    
    # 2. 明暗调整
    'black_threshold': 30,          # 低于此值视为纯黑，需要提亮
    'white_threshold': 225,         # 高于此值视为纯白，需要压暗
    'shadow_lift': 15,              # 暗部提亮量
    'highlight_compress': 20,       # 亮部压缩量
    'contrast_reduction': 0.85,     # 对比度降低系数 (<1降低)
    
    # 3. 色彩调整
    'saturation_factor': 0.88,      # 饱和度系数 (<1降低)
    'red_saturation_extra': 0.82,   # 红色额外降饱和
    'warm_tint': (5, 2, -3),        # 暖灰倾向 (R, G, B偏移)
    
    # 4. 细节简化
    'detail_smooth_radius': 0.8,    # 细节柔化半径
}

def detect_edge_mask(img):
    """检测边缘区域（用于针对性软化）"""
    # 转为灰度
    gray = img.convert('L')
    # 边缘检测（找轮廓）
    edges = gray.filter(ImageFilter.FIND_EDGES)
    # 二值化得到边缘 mask
    edge_mask = edges.point(lambda x: 255 if x > 30 else 0)
    # 稍微膨胀边缘区域
    edge_mask = edge_mask.filter(ImageFilter.MaxFilter(3))
    return edge_mask

def reduce_pure_black_white(img, config):
    """减少纯黑纯白，增加中间层"""
    pixels = np.array(img)
    
    # 分离通道
    r, g, b, a = pixels[:,:,0], pixels[:,:,1], pixels[:,:,2], pixels[:,:,3]
    
    # 创建亮度mask
    brightness = (r * 0.299 + g * 0.587 + b * 0.114).astype(np.float32)
    
    # 纯黑区域提亮（但保留透明度信息）
    black_mask = brightness < config['black_threshold']
    lift_factor = config['shadow_lift'] / 255.0
    
    # 只提亮RGB，不改变Alpha
    for c in [r, g, b]:
        c[black_mask] = np.clip(c[black_mask] + config['shadow_lift'], 0, 255)
    
    # 纯白区域压暗
    white_mask = brightness > config['white_threshold']
    for c in [r, g, b]:
        c[white_mask] = np.clip(c[white_mask] - config['highlight_compress'], 0, 255)
    
    return Image.fromarray(pixels, 'RGBA')

def soften_edges(img, config):
    """软化边缘（针对性处理，不整体模糊）"""
    # 检测边缘
    edge_mask = detect_edge_mask(img)
    
    # 轻微模糊原图
    softened = img.filter(ImageFilter.GaussianBlur(config['edge_soften_radius']))
    
    # 根据边缘mask混合：边缘区域用softened，非边缘用原图
    edge_mask = edge_mask.convert('L')
    softened_edge = Image.composite(softened, img, edge_mask)
    
    # 最终混合，控制软化强度
    return Image.blend(img, softened_edge, config['edge_soften_strength'])

def adjust_color_tone(img, config):
    """色彩调整：降饱和、暖灰倾向"""
    # 分离Alpha
    r, g, b, a = img.split()
    rgb_img = Image.merge('RGB', (r, g, b))
    
    # 降低整体饱和度
    enhancer = ImageEnhance.Color(rgb_img)
    rgb_img = enhancer.enhance(config['saturation_factor'])
    
    # 红色区域额外降饱和（检测红色主导像素）
    pixels = np.array(rgb_img)
    r_vals, g_vals, b_vals = pixels[:,:,0], pixels[:,:,1], pixels[:,:,2]
    
    # 红色主导：R明显大于G和B
    red_dominant = (r_vals > g_vals + 20) & (r_vals > b_vals + 20)
    
    # 对红色区域额外降饱和并压暗
    red_mask = red_dominant
    pixels[red_mask, 0] = np.clip(pixels[red_mask, 0] * config['red_saturation_extra'], 0, 255)
    pixels[red_mask, 1] = np.clip(pixels[red_mask, 1] * 0.9, 0, 255)  # G略降
    pixels[red_mask, 2] = np.clip(pixels[red_mask, 2] * 0.9, 0, 255)  # B略降
    
    # 暖灰倾向（整体微调）- 使用int16避免溢出
    warm_r, warm_g, warm_b = config['warm_tint']
    pixels = pixels.astype(np.int16)
    pixels[:,:,0] = np.clip(pixels[:,:,0] + warm_r, 0, 255)
    pixels[:,:,1] = np.clip(pixels[:,:,1] + warm_g, 0, 255)
    pixels[:,:,2] = np.clip(pixels[:,:,2] + warm_b, 0, 255)
    pixels = pixels.astype(np.uint8)
    
    rgb_img = Image.fromarray(pixels, 'RGB')
    
    # 合并回RGBA
    return Image.merge('RGBA', (*rgb_img.split(), a))

def simplify_details(img, config):
    """简化细节：轻微平滑高频噪点"""
    # 轻微模糊去除细小噪点（保护边缘）
    smoothed = img.filter(ImageFilter.BoxBlur(1))
    # 与原图轻微混合，保留主体
    return Image.blend(img, smoothed, 0.2)

def reduce_contrast(img, config):
    """降低对比度（压缩黑白两极）"""
    # 分离Alpha
    r, g, b, a = img.split()
    rgb_img = Image.merge('RGB', (r, g, b))
    
    # 降低对比度
    enhancer = ImageEnhance.Contrast(rgb_img)
    rgb_img = enhancer.enhance(config['contrast_reduction'])
    
    return Image.merge('RGBA', (*rgb_img.split(), a))

def process_sprite(input_path, output_path, config):
    """处理单张贴图"""
    img = Image.open(input_path).convert('RGBA')
    
    # 按顺序处理
    img = reduce_pure_black_white(img, config)   # 1. 减少纯黑纯白
    img = reduce_contrast(img, config)            # 2. 降低对比度
    img = adjust_color_tone(img, config)          # 3. 色彩调整
    img = simplify_details(img, config)           # 4. 简化细节
    img = soften_edges(img, config)               # 5. 边缘软化（最后做）
    
    # 保存
    img.save(output_path, 'PNG')
    return True

def process_floor_monsters(floor_num, base_dir, output_dir):
    """处理整层怪物"""
    floor_path = Path(base_dir) / f"floor{floor_num}"
    output_floor = Path(output_dir) / f"floor{floor_num}"
    
    if not floor_path.exists():
        print(f"错误：找不到路径 {floor_path}")
        return
    
    # 遍历所有怪物
    for monster_dir in floor_path.iterdir():
        if not monster_dir.is_dir():
            continue
        
        base_id = monster_dir.name
        
        # 遍历所有版本
        for version_dir in monster_dir.iterdir():
            if not version_dir.is_dir():
                continue
            
            version = version_dir.name
            walk_dir = version_dir / "walk"
            
            if not walk_dir.exists():
                continue
            
            # 创建输出目录
            out_walk = output_floor / base_id / version / "walk"
            out_walk.mkdir(parents=True, exist_ok=True)
            
            # 处理所有帧
            frame_files = sorted(walk_dir.glob("*.png"))
            print(f"处理: floor{floor_num}/{base_id}/{version} - {len(frame_files)}帧")
            
            for frame_file in frame_files:
                output_path = out_walk / frame_file.name
                try:
                    process_sprite(frame_file, output_path, CONFIG)
                except Exception as e:
                    print(f"  错误 {frame_file.name}: {e}")
    
    print(f"\n完成！输出目录: {output_floor}")

if __name__ == "__main__":
    # 第一层处理
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_styled"
    
    print("="*60)
    print("怪物贴图风格统一优化")
    print("="*60)
    print(f"处理: 第一层")
    print(f"输出: {OUTPUT_DIR}")
    print("-"*60)
    
    process_floor_monsters(1, BASE_DIR, OUTPUT_DIR)
