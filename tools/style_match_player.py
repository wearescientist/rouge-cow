#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图风格转换 - 匹配玩家风格
技术路线：降采样+量化+边缘软化+对比度压缩
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from pathlib import Path
import shutil

def pixelate_and_soften(img, target_size=32):
    """
    核心转换：创造低像素电影感
    1. 大幅降采样（创造块状像素）
    2. 轻微放大（保持块状感）
    3. 边缘软化（不那么锐利）
    4. 颜色量化（减少色数）
    """
    orig_w, orig_h = img.size
    
    # Step 1: 降到超低分辨率（创造块状像素基础）
    # 降到目标尺寸的50%，这样放大后会有明显的"大像素"感
    tiny_size = (target_size // 2, target_size // 2)
    img_tiny = img.resize(tiny_size, Image.NEAREST)  # NEAREST保持硬边
    
    # Step 2: 放大回原尺寸（保持块状感）
    img_pixelated = img_tiny.resize((orig_w, orig_h), Image.NEAREST)
    
    # Step 3: 轻微模糊软化边缘（模拟玩家的柔和感）
    # 半径0.5-1px的轻微高斯模糊
    img_soft = img_pixelated.filter(ImageFilter.GaussianBlur(radius=0.6))
    
    # Step 4: 颜色量化（减少颜色数量到大色块）
    # 转换为P模式（调色板），限制颜色数
    img_quantized = img_soft.quantize(colors=16, method=2).convert('RGBA')
    
    # Step 5: 对比度和饱和度压缩（匹配玩家的柔和色调）
    enhancer = ImageEnhance.Contrast(img_quantized)
    img_low_contrast = enhancer.enhance(0.75)  # 降低对比度
    
    enhancer = ImageEnhance.Color(img_low_contrast)
    img_final = enhancer.enhance(0.85)  # 降低饱和度
    
    # Step 6: 保持原始透明通道
    r, g, b, a = img_final.split()
    # 如果原始alpha有内容，保留它
    orig_a = img.split()[3]
    
    # 合并：新RGB + 原始Alpha（稍微软化边缘）
    final = Image.merge('RGBA', (r, g, b, orig_a))
    
    return final

def darken_bottom(img, factor=0.85):
    """底部压暗（增加地面感）"""
    w, h = img.size
    pixels = np.array(img)
    
    # 创建渐变遮罩（底部20%区域压暗）
    for y in range(int(h * 0.8), h):
        darken = factor + (1 - factor) * (y - h * 0.8) / (h * 0.2)
        pixels[y, :, :3] = (pixels[y, :, :3] * darken).astype(np.uint8)
    
    return Image.fromarray(pixels)

def process_monster(input_path, output_path, target_size=40):
    """处理单个怪物帧"""
    try:
        img = Image.open(input_path).convert('RGBA')
        
        # 核心风格转换
        styled = pixelate_and_soften(img, target_size)
        
        # 底部压暗（轻微）
        final = darken_bottom(styled, 0.92)
        
        # 确保尺寸一致
        final = final.resize((img.width, img.height), Image.LANCZOS)
        
        final.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def process_floor(floor_num, base_input, base_output):
    """处理整层怪物"""
    input_dir = Path(base_input) / f"floor{floor_num}"
    output_dir = Path(base_output) / f"floor{floor_num}"
    
    if not input_dir.exists():
        print(f"Floor {floor_num} not found")
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    
    # 遍历所有怪物
    for monster_dir in input_dir.iterdir():
        if not monster_dir.is_dir():
            continue
        
        monster_name = monster_dir.name
        
        # 遍历版本
        for version_dir in monster_dir.iterdir():
            if not version_dir.is_dir():
                continue
            
            version = version_dir.name
            walk_dir = version_dir / "walk"
            
            if not walk_dir.exists():
                continue
            
            # 创建输出目录
            out_monster_dir = output_dir / monster_name / version / "walk"
            out_monster_dir.mkdir(parents=True, exist_ok=True)
            
            # 处理每一帧
            for i in range(1, 5):
                frame_file = walk_dir / f"f0{i}.png"
                if frame_file.exists():
                    out_file = out_monster_dir / f"f0{i}.png"
                    if process_monster(frame_file, out_file):
                        processed += 1
            
            print(f"  {monster_name}/{version}: OK")
    
    print(f"Floor {floor_num}: {processed} frames processed")

if __name__ == "__main__":
    import sys
    
    # 输入：原版怪物
    base_input = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    # 输出：风格化后的怪物
    base_output = "generated_assets/monster_walk_player_style"
    
    print("=" * 50)
    print("Monster Style Converter - Match Player Style")
    print("=" * 50)
    
    # 可以先只处理第一层测试效果
    if len(sys.argv) > 1 and sys.argv[1] == "all":
        for f in range(1, 7):
            print(f"\nProcessing Floor {f}...")
            process_floor(f, base_input, base_output)
    else:
        print("\nProcessing Floor 1 only (test mode)...")
        print("Use 'python style_match_player.py all' for all floors")
        process_floor(1, base_input, base_output)
    
    print("\n" + "=" * 50)
    print(f"Output: {base_output}/")
    print("=" * 50)
