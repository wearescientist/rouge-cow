#!/usr/bin/env python3
"""处理剩余的大尺寸贴图"""
from PIL import Image
import os

BASE_DIR = r'E:\AI\game\rougelike-cow\assets\sprites'

def resize_image(input_path, output_path, size):
    """调整图片大小并保持透明通道"""
    try:
        img = Image.open(input_path)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        # 使用LANCZOS重采样
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        img_resized.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# 1. 处理武器贴图 -> 32x32
print("=== Processing Weapons -> 32x32 ===")
weapons_dir = os.path.join(BASE_DIR, 'weapons')
for filename in os.listdir(weapons_dir):
    if filename.endswith('.png'):
        input_path = os.path.join(weapons_dir, filename)
        img = Image.open(input_path)
        if img.size != (32, 32):
            resize_image(input_path, input_path, (32, 32))
            print(f"  {filename}: {img.size} -> 32x32")
        else:
            print(f"  {filename}: already 32x32")

# 2. 处理特效贴图 -> 32x32 (已经处理过了，检查一下)
print("\n=== Checking Effects -> 32x32 ===")
effects_dir = os.path.join(BASE_DIR, 'effects')
for filename in os.listdir(effects_dir):
    if filename.endswith('.png'):
        input_path = os.path.join(effects_dir, filename)
        img = Image.open(input_path)
        if img.size != (32, 32):
            resize_image(input_path, input_path, (32, 32))
            print(f"  {filename}: {img.size} -> 32x32")
        else:
            print(f"  {filename}: already 32x32")

# 3. 处理地板贴图 -> 128x128 (用于平铺)
print("\n=== Processing Floor Tiles -> 128x128 ===")
floors_dir = os.path.join(BASE_DIR, 'tiles', 'floors')
for filename in os.listdir(floors_dir):
    if filename.endswith('.png') and 'overview' not in filename:
        input_path = os.path.join(floors_dir, filename)
        img = Image.open(input_path)
        if img.size != (128, 128):
            resize_image(input_path, input_path, (128, 128))
            print(f"  {filename}: {img.size} -> 128x128")
        else:
            print(f"  {filename}: already 128x128")

# 4. 处理墙壁/门贴图 -> 64x64
print("\n=== Processing Wall/Door Tiles -> 64x64 ===")
walls_dir = os.path.join(BASE_DIR, 'tiles', 'walls')
for filename in os.listdir(walls_dir):
    if filename.endswith('.png'):
        input_path = os.path.join(walls_dir, filename)
        img = Image.open(input_path)
        if img.size != (64, 64):
            resize_image(input_path, input_path, (64, 64))
            print(f"  {filename}: {img.size} -> 64x64")
        else:
            print(f"  {filename}: already 64x64")

# 5. 处理UI贴图 -> 32x32
print("\n=== Processing UI -> 32x32 ===")
ui_dir = os.path.join(BASE_DIR, 'ui')
for filename in os.listdir(ui_dir):
    if filename.endswith('.png'):
        input_path = os.path.join(ui_dir, filename)
        img = Image.open(input_path)
        if img.size != (32, 32):
            resize_image(input_path, input_path, (32, 32))
            print(f"  {filename}: {img.size} -> 32x32")
        else:
            print(f"  {filename}: already 32x32")

# 6. 处理杂项贴图 -> 32x32
print("\n=== Processing Misc -> 32x32 ===")
misc_dir = os.path.join(BASE_DIR, 'misc')
for filename in os.listdir(misc_dir):
    if filename.endswith('.png'):
        input_path = os.path.join(misc_dir, filename)
        img = Image.open(input_path)
        if img.size != (32, 32):
            resize_image(input_path, input_path, (32, 32))
            print(f"  {filename}: {img.size} -> 32x32")
        else:
            print(f"  {filename}: already 32x32")

print("\nDone!")
