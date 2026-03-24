#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物风格转换 V3 - 保留特征 + 柔化风格
关键：不要过度降采样，保持可读性
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from pathlib import Path

def smart_resize_preserve(img, target_height=64):
    """
    智能缩放：保持足够尺寸让玩家能识别
    60-80px高度足够显示特征
    """
    aspect = img.width / img.height
    target_width = int(target_height * aspect)
    
    # LANCZOS保持清晰度
    return img.resize((target_width, target_height), Image.LANCZOS)

def soften_edges(img, radius=1.0):
    """
    边缘柔化：轻微高斯模糊创造柔和感
    但不要太糊，保持特征可辨
    """
    return img.filter(ImageFilter.GaussianBlur(radius=radius))

def reduce_contrast_saturation(img, contrast=0.8, saturation=0.85):
    """
    降低对比度和饱和度：创造电影感
    """
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(contrast)
    
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(saturation)
    
    return img

def enhance_midtones(img):
    """
    增强中间调：让细节更清晰
    避免暗部死黑、亮部死白
    """
    enhancer = ImageEnhance.Brightness(img)
    return enhancer.enhance(1.05)

def subtle_pixel_texture(img, strength=0.3):
    """
    添加微妙像素纹理：创造"低像素感"但不破坏特征
    用轻微噪声模拟
    """
    # 轻微降低分辨率再恢复（创造轻微块状感）
    w, h = img.size
    small = img.resize((w//2, h//2), Image.LANCZOS)
    return small.resize((w, h), Image.LANCZOS)

def process_monster_v3(input_path, output_path, target_height=64):
    """V3处理：保留特征 + 柔化风格"""
    try:
        img = Image.open(input_path).convert('RGBA')
        
        # Step 1: 缩放到合适尺寸（60-80px足够识别）
        img_resized = smart_resize_preserve(img, target_height)
        
        # Step 2: 边缘柔化（创造柔和感，但不糊）
        img_soft = soften_edges(img_resized, radius=0.8)
        
        # Step 3: 色彩调整（降低对比饱和）
        img_colored = reduce_contrast_saturation(img_soft)
        
        # Step 4: 增强中间调（让细节可见）
        img_bright = enhance_midtones(img_colored)
        
        # Step 5: 微妙像素纹理（风格化但不破坏特征）
        img_textured = subtle_pixel_texture(img_bright)
        
        # Step 6: 智能处理尺寸 - 保持原比例，透明填充成正方形（避免截断）
        w, h = img_textured.size
        
        # 取较大边作为画布大小（保持内容完整）
        canvas_size = max(w, h)
        # 确保至少64px
        canvas_size = max(canvas_size, 64)
        
        # 创建透明画布
        img_final = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        
        # 居中粘贴原图
        paste_x = (canvas_size - w) // 2
        paste_y = (canvas_size - h) // 2
        img_final.paste(img_textured, (paste_x, paste_y))
        
        img_final.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def process_floor(floor_num, base_input, base_output, target_height=64):
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
                    if process_monster_v3(frame_file, out_file, target_height):
                        processed += 1
            
            print(f"  {monster_name}/{version}: OK")
    
    print(f"Floor {floor_num}: {processed} frames -> {target_height}px")

if __name__ == "__main__":
    import sys
    
    base_input = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    base_output = "generated_assets/monster_walk_preserve_features"
    
    # 参数：64px高度（比玩家40px略大，保持特征）
    target_height = 64
    
    print("=" * 50)
    print(f"Monster Style V3 - Preserve Features")
    print(f"Target: {target_height}px, Soft + Readable")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "all":
        for f in range(1, 7):
            print(f"\nProcessing Floor {f}...")
            process_floor(f, base_input, base_output, target_height)
    else:
        print(f"\nProcessing Floor 1 only...")
        process_floor(1, base_input, base_output, target_height)
    
    print("\n" + "=" * 50)
    print(f"Output: {base_output}/")
    print("=" * 50)
