#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复敌人精灵图：将黑色/深色背景转换为透明
使用更激进的阈值和更好的边缘处理
"""
from PIL import Image
import os

def process_sprite(input_path, output_path):
    """
    处理单个精灵图
    - 使用更低的亮度阈值（30）来捕获更多暗色背景
    - 使用 alpha 通道混合保留边缘抗锯齿
    """
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    pixels = list(img.getdata())
    
    new_pixels = []
    for r, g, b, a in pixels:
        # 计算亮度
        brightness = (r + g + b) / 3
        
        # 如果是接近黑色的像素（且原图不是完全透明）
        if brightness < 35 and a > 0:
            # 完全透明
            new_pixels.append((r, g, b, 0))
        elif brightness < 60 and a > 0:
            # 半透明过渡区（抗锯齿边缘）
            alpha = int((brightness - 35) / 25 * 255)
            new_pixels.append((r, g, b, alpha))
        else:
            new_pixels.append((r, g, b, a))
    
    img.putdata(new_pixels)
    img.save(output_path, 'PNG')
    print(f"Processed: {os.path.basename(output_path)}")

def batch_process():
    """批量处理所有精灵图"""
    sprites_dir = r"E:\AI\game\rougelike-cow\assets\sprites"
    
    # 要处理的文件列表（排除player_cow.png主角）
    enemy_files = [
        'bear.png', 'bird.png', 'cat.png', 'chick.png', 'crab.png',
        'dog.png', 'dog2.png', 'duck.png', 'duck2.png', 'duck3.png',
        'goose.png', 'mouse.png', 'pig.png', 'pig2.png', 'pigeon.png',
        'rabbit.png', 'rabbit2.png', 'sheep.png', 'snail.png', 'snake.png',
        'squirrel.png', 'turtle.png'
    ]
    
    print("Starting aggressive background removal...")
    print("=" * 50)
    
    for filename in enemy_files:
        filepath = os.path.join(sprites_dir, filename)
        if os.path.exists(filepath):
            try:
                process_sprite(filepath, filepath)
            except Exception as e:
                print(f"Error processing {filename}: {e}")
        else:
            print(f"Missing: {filename}")
    
    print("=" * 50)
    print("Done!")

if __name__ == '__main__':
    batch_process()
