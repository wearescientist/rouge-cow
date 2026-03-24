#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格转换 V2 - 先缩放再风格化
目标：40-60px画布，匹配玩家贴图密度
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from pathlib import Path

T1_COMMON_MOBS = [
    'bat',
    'chick',
    'crab',
    'fox',
    'ghost',
    'rabbit2',
    'snail',
    'snake',
]

def smart_resize(img, target_height=48):
    """
    智能缩放：先降到目标尺寸（匹配玩家大小）
    使用LANCZOS保持清晰度
    """
    aspect = img.width / img.height
    target_width = int(target_height * aspect)
    
    # LANCZOS：高质量下采样
    return img.resize((target_width, target_height), Image.LANCZOS)

def pixelate_soft(img, pixel_size=4):
    """
    柔和像素化：
    1. 降到超小尺寸（创造块状感）
    2. 最近邻放大（保持硬边像素）
    3. 轻微模糊（柔化硬边）
    """
    w, h = img.size
    
    # 降到小尺寸（每个像素块代表原图的pixel_size个像素）
    small_w = w // pixel_size
    small_h = h // pixel_size
    img_small = img.resize((small_w, small_h), Image.NEAREST)
    
    # 最近邻放大（保持块状）
    img_pixelated = img_small.resize((w, h), Image.NEAREST)
    
    # 轻微模糊柔化边缘（0.3-0.5px）
    img_soft = img_pixelated.filter(ImageFilter.GaussianBlur(radius=0.4))
    
    return img_soft

def color_adjust(img, saturation=0.9, contrast=0.85):
    """
    色彩调整：降低饱和度和对比度
    """
    # 降低对比度
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(contrast)
    
    # 降低饱和度
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(saturation)
    
    return img

def add_soft_outline(img, outline_color=(0, 0, 0, 30)):
    """
    添加柔和描边（增强剪影可读性）
    """
    r, g, b, a = img.split()
    
    # 膨胀alpha创建描边
    outline = a.filter(ImageFilter.MaxFilter(3))
    
    # 模糊描边
    outline = outline.filter(ImageFilter.GaussianBlur(1))
    
    # 降低描边不透明度
    outline = outline.point(lambda x: x * 0.3)
    
    # 合并（先描边，再原图）
    outline_img = Image.new('RGBA', img.size, outline_color)
    outline_img.putalpha(outline)
    
    # 原图覆盖在描边上
    result = Image.alpha_composite(outline_img, img)
    
    return result

def process_monster_v2(input_path, output_path, target_height=48, pixel_size=4):
    """V2处理流程"""
    try:
        img = Image.open(input_path).convert('RGBA')
        
        # Step 1: 智能缩放到目标尺寸（关键！先统一尺寸）
        img_resized = smart_resize(img, target_height)
        
        # Step 2: 柔和像素化（块状感但不糊）
        img_pixelated = pixelate_soft(img_resized, pixel_size)
        
        # Step 3: 色彩调整（降低对比和饱和）
        img_colored = color_adjust(img_pixelated)
        
        # Step 4: 添加柔和描边
        img_outlined = add_soft_outline(img_colored)
        
        # Step 5: 中心裁剪成正方形（48x48或60x60）
        w, h = img_outlined.size
        if w > h:
            left = (w - h) // 2
            right = left + h
            img_cropped = img_outlined.crop((left, 0, right, h))
        else:
            top = (h - w) // 2
            bottom = top + w
            img_cropped = img_outlined.crop((0, top, w, bottom))
        
        # 最终调整为标准尺寸
        final_size = 48
        img_final = img_cropped.resize((final_size, final_size), Image.LANCZOS)
        
        img_final.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def process_floor(floor_num, base_input, base_output, target_height=48, pixel_size=4, monster_filter=None):
    """处理整层"""
    input_dir = Path(base_input) / f"floor{floor_num}"
    output_dir = Path(base_output) / f"floor{floor_num}"
    
    if not input_dir.exists():
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    processed = 0
    
    for monster_dir in input_dir.iterdir():
        if not monster_dir.is_dir():
            continue
        
        monster_name = monster_dir.name
        if monster_filter and monster_name not in monster_filter:
            continue
        
        for version_dir in monster_dir.iterdir():
            if not version_dir.is_dir():
                continue
            
            version = version_dir.name
            walk_dir = version_dir / "walk"
            
            if not walk_dir.exists():
                continue
            
            out_monster_dir = output_dir / monster_name / version / "walk"
            out_monster_dir.mkdir(parents=True, exist_ok=True)
            
            for i in range(1, 5):
                frame_file = walk_dir / f"f0{i}.png"
                if frame_file.exists():
                    out_file = out_monster_dir / f"f0{i}.png"
                    if process_monster_v2(frame_file, out_file, target_height, pixel_size):
                        processed += 1
            
            print(f"  {monster_name}/{version}: OK")
    
    print(f"Floor {floor_num}: {processed} frames -> {target_height}px")

def process_t1_common(base_input, base_output, target_height=48, pixel_size=4):
    print("\nProcessing T1 common mobs (floor1 source whitelist)...")
    process_floor(
        1,
        base_input,
        base_output,
        target_height,
        pixel_size,
        monster_filter=set(T1_COMMON_MOBS),
    )

if __name__ == "__main__":
    import sys
    
    base_input = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    base_output = "generated_assets/monster_walk_player_style_v2"
    
    # 参数：目标高度，像素块大小
    # 推荐：48px高度，4px像素块
    target_height = 48
    pixel_size = 4
    
    print("=" * 50)
    print(f"Monster Style Converter V2")
    print(f"Target: {target_height}px height, {pixel_size}px pixels")
    print("=" * 50)
    
    mode = sys.argv[1] if len(sys.argv) > 1 else "floor1"

    if mode == "all":
        for f in range(1, 7):
            print(f"\nProcessing Floor {f}...")
            process_floor(f, base_input, base_output, target_height, pixel_size)
    elif mode == "t1":
        base_output = "generated_assets/monster_walk_player_style_t1"
        process_t1_common(base_input, base_output, target_height, pixel_size)
    else:
        print(f"\nProcessing Floor 1 only (test mode)...")
        process_floor(1, base_input, base_output, target_height, pixel_size)
    
    print("\n" + "=" * 50)
    print(f"Output: {base_output}/")
    print("=" * 50)
