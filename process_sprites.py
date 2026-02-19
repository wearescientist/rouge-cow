#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
处理敌人精灵图：将黑色/深色背景转换为透明
"""
from PIL import Image
import os

def process_sprite(input_path, output_path, black_threshold=40):
    """
    处理单个精灵图
    - 将接近黑色的像素转换为透明
    - 保留抗锯齿边缘
    """
    img = Image.open(input_path).convert('RGBA')
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        # 计算亮度
        brightness = (r + g + b) / 3
        
        # 如果是接近黑色的像素（且原图不是完全透明）
        if brightness < black_threshold and a > 0:
            # 根据亮度设置透明度：越黑越透明
            new_alpha = int((brightness / black_threshold) * 255)
            new_data.append((r, g, b, new_alpha))
        else:
            new_data.append((r, g, b, a))
    
    img.putdata(new_data)
    img.save(output_path, 'PNG')
    print(f"[OK] 处理完成: {os.path.basename(output_path)}")

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
    
    print("Starting processing enemy sprites...")
    print("=" * 50)
    
    for filename in enemy_files:
        filepath = os.path.join(sprites_dir, filename)
        if os.path.exists(filepath):
            try:
                process_sprite(filepath, filepath)
            except Exception as e:
                print(f"[ERR] 处理失败 {filename}: {e}")
        else:
            print(f"[MISSING] 文件不存在: {filename}")
    
    print("=" * 50)
    print("Processing complete!")

if __name__ == '__main__':
    batch_process()
