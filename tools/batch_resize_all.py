#!/usr/bin/env python3
"""批量处理所有贴图到合适尺寸"""
from PIL import Image
import os

BASE_DIR = r'E:\AI\game\rougelike-cow\assets\sprites'

# 定义各类型贴图的目标尺寸
TARGET_SIZES = {
    'effects': (32, 32),  # 特效类
    'misc': (32, 32),     # 杂项（宝箱、NPC等）
    'ui': (32, 32),       # UI图标类
    'tiles/walls': (64, 64),  # 墙壁和门
}

def resize_image(input_path, output_path, size):
    """调整图片大小并保持透明度"""
    try:
        img = Image.open(input_path)
        
        # 确保有透明通道
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 使用LANCZOS重采样缩放
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        
        img_resized.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"错误: {input_path} - {e}")
        return False

def process_folder(folder_name, target_size):
    """处理指定文件夹"""
    folder_path = os.path.join(BASE_DIR, folder_name)
    if not os.path.exists(folder_path):
        print(f"Folder not found: {folder_path}")
        return
    
    print(f"\nProcessing {folder_name} -> {target_size}...")
    
    for filename in os.listdir(folder_path):
        if not filename.endswith('.png'):
            continue
            
        input_path = os.path.join(folder_path, filename)
        
        # 检查当前尺寸
        img = Image.open(input_path)
        if img.size == target_size:
            print(f"  跳过 {filename} (已是目标尺寸)")
            continue
        
        # 处理图片
        if resize_image(input_path, input_path, target_size):
            print(f"  OK {filename} {img.size} -> {target_size}")
        else:
            print(f"  FAIL {filename}")

def main():
    print("Starting batch resize...")
    
    for folder, size in TARGET_SIZES.items():
        process_folder(folder, size)
    
    print("\nDone!")

if __name__ == '__main__':
    main()
