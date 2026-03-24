#!/usr/bin/env python3
"""
裁剪怪物贴图到实际内容边界
去除透明边距，解决浮空问题
"""

from PIL import Image
from pathlib import Path

def crop_to_content(input_path, output_path):
    """裁剪图片到非透明内容的边界"""
    img = Image.open(input_path).convert('RGBA')
    
    # 获取内容边界
    bbox = img.getbbox()
    if bbox:
        # 裁剪到内容
        cropped = img.crop(bbox)
        cropped.save(output_path, 'PNG')
        return True
    return False

def process_all():
    base_input = Path("generated_assets/monster_walk_preserve_features")
    
    total = 0
    for img_path in base_input.rglob("*.png"):
        if crop_to_content(img_path, img_path):
            total += 1
            if total % 20 == 0:
                print(f"Processed {total} images...")
    
    print(f"Done! Total {total} images cropped to content.")

if __name__ == "__main__":
    process_all()
