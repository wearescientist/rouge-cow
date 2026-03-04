#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图居中修复工具
自动检测贴图模型并将其调整到图像正中央
"""

from PIL import Image
import os
import sys

# 配置
SPRITES_DIR = r"E:\AI\game\rougelike-cow\assets\sprites"
BACKUP_DIR = os.path.join(SPRITES_DIR, "backup_original")

# 需要处理的怪物贴图列表（根目录下的基础贴图）
ENEMY_SPRITES = [
    'bear.png', 'bird.png', 'boss6.png', 'cat.png', 'chick.png', 'crab.png',
    'dog.png', 'dog2.png', 'duck.png', 'duck2.png', 'duck3.png', 'goose.png',
    'mouse.png', 'pig.png', 'pig2.png', 'pigeon.png', 'rabbit.png', 'rabbit2.png',
    'sheep.png', 'snail.png', 'snake.png', 'squirrel.png', 'turtle.png'
]

# 描边颜色目录
OUTLINE_COLORS = ['white', 'red', 'pink', 'orange', 'purple', 'gold', 
                  'blue', 'cyan', 'green', 'lime', 'magenta', 'yellow']


def get_bounding_box(img):
    """
    获取图像中非透明像素的边界框
    返回: (left, top, right, bottom) 或 None 如果没有非透明像素
    """
    # 转换为RGBA模式
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    pixels = img.load()
    width, height = img.size
    
    # 初始化边界
    left = width
    top = height
    right = 0
    bottom = 0
    
    # 遍历所有像素找边界
    has_content = False
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 10:  # 透明度大于10视为有效像素
                has_content = True
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    
    if not has_content:
        return None
    
    return (left, top, right + 1, bottom + 1)  # +1 因为 right/bottom 是包含的


def center_sprite(img):
    """
    将贴图模型居中
    返回: 新的居中图像
    """
    bbox = get_bounding_box(img)
    if bbox is None:
        print("  警告: 贴图为空，无有效像素")
        return img
    
    left, top, right, bottom = bbox
    
    # 计算模型的宽度和高度
    content_width = right - left
    content_height = bottom - top
    
    # 计算模型的中心
    content_cx = (left + right) / 2
    content_cy = (top + bottom) / 2
    
    # 图像中心
    img_width, img_height = img.size
    img_cx = img_width / 2
    img_cy = img_height / 2
    
    # 计算需要的偏移量
    offset_x = img_cx - content_cx
    offset_y = img_cy - content_cy
    
    print(f"  模型边界: ({left}, {top}) - ({right}, {bottom})")
    print(f"  模型中心: ({content_cx:.1f}, {content_cy:.1f})")
    print(f"  图像中心: ({img_cx:.1f}, {img_cy:.1f})")
    print(f"  偏移量: ({offset_x:+.1f}, {offset_y:+.1f})")
    
    # 创建新图像，将模型居中
    new_img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
    
    # 裁剪出模型内容
    content = img.crop(bbox)
    
    # 计算粘贴位置（使模型居中）
    paste_x = int(img_cx - content_width / 2)
    paste_y = int(img_cy - content_height / 2)
    
    # 粘贴模型到新图像
    new_img.paste(content, (paste_x, paste_y))
    
    return new_img


def process_sprite(filepath, backup=True):
    """处理单个贴图文件"""
    print(f"\n处理: {os.path.basename(filepath)}")
    
    try:
        # 加载图像
        img = Image.open(filepath)
        
        # 备份原图
        if backup:
            backup_path = os.path.join(BACKUP_DIR, os.path.basename(filepath))
            if not os.path.exists(backup_path):
                img.save(backup_path)
                print(f"  已备份")
        
        # 居中处理
        new_img = center_sprite(img)
        
        # 保存
        new_img.save(filepath)
        print(f"  已保存")
        
        return True
        
    except Exception as e:
        print(f"  错误: {e}")
        return False


def process_directory(dirpath, file_list=None, backup=True):
    """处理目录中的贴图"""
    if file_list is None:
        # 处理所有png文件
        file_list = [f for f in os.listdir(dirpath) if f.endswith('.png')]
    
    success_count = 0
    for filename in file_list:
        filepath = os.path.join(dirpath, filename)
        if os.path.exists(filepath):
            if process_sprite(filepath, backup):
                success_count += 1
        else:
            print(f"\n跳过: {filename} (不存在)")
    
    return success_count


def main():
    print("=" * 60)
    print("怪物贴图居中修复工具")
    print("=" * 60)
    
    # 创建备份目录
    os.makedirs(BACKUP_DIR, exist_ok=True)
    print(f"备份目录: {BACKUP_DIR}")
    
    total_success = 0
    
    # 1. 处理基础贴图
    print("\n" + "=" * 60)
    print("阶段 1: 处理基础怪物贴图")
    print("=" * 60)
    total_success += process_directory(SPRITES_DIR, ENEMY_SPRITES)
    
    # 2. 处理描边贴图
    print("\n" + "=" * 60)
    print("阶段 2: 处理描边颜色贴图")
    print("=" * 60)
    
    for color in OUTLINE_COLORS:
        color_dir = os.path.join(SPRITES_DIR, 'outlined_by_color', color)
        if os.path.exists(color_dir):
            print(f"\n处理颜色: {color}")
            total_success += process_directory(color_dir, ENEMY_SPRITES, backup=False)
        else:
            print(f"\n跳过颜色: {color} (目录不存在)")
    
    print("\n" + "=" * 60)
    print(f"处理完成! 成功修复 {total_success} 个贴图")
    print("=" * 60)


if __name__ == '__main__':
    main()
