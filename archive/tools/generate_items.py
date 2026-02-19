#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Item Icons Generator
道具图标生成器
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = "assets/items"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_image(w, h, scale=4):
    return Image.new('RGBA', (w * scale, h * scale), (0, 0, 0, 0))

def draw_pixel(draw, x, y, color, scale=4):
    draw.rectangle(
        [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
        fill=color
    )

# ========== 被动道具图标 ==========

def generate_item_milk():
    """牛奶瓶 - 加伤害"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    WHITE = '#FFFFFF'
    BLUE = '#3498DB'
    
    # 瓶身
    for x in range(6, 14):
        for y in range(8, 16):
            draw_pixel(draw, x, y, WHITE)
    # 瓶颈
    for x in range(8, 12):
        for y in range(5, 8):
            draw_pixel(draw, x, y, BLUE)
    # 瓶盖
    for x in range(7, 13):
        draw_pixel(draw, x, 4, '#7F8C8D')
    # 标签
    for x in range(7, 13):
        draw_pixel(draw, x, 10, BLUE)
    
    return img

def generate_item_grass():
    """幸运草 - 加暴击"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    GREEN = '#2ECC71'
    DARK_GREEN = '#27AE60'
    
    # 三叶草
    leaves = [
        (10, 4), (10, 5),
        (8, 6), (9, 6), (10, 6), (11, 6), (12, 6),
        (6, 8), (7, 8), (8, 8), (9, 8), (10, 8), (11, 8), (12, 8), (13, 8), (14, 8),
        (10, 9),
        (8, 10), (9, 10), (10, 10), (11, 10), (12, 10),
        (10, 11),
        (10, 12), (10, 13), (10, 14),
    ]
    for x, y in leaves:
        draw_pixel(draw, x, y, GREEN)
    
    # 茎
    draw_pixel(draw, 10, 13, DARK_GREEN)
    draw_pixel(draw, 10, 14, DARK_GREEN)
    
    return img

def generate_item_bell():
    """铃铛 - 加速度"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    GOLD = '#F1C40F'
    GOLD_DARK = '#D4AC0D'
    
    # 铃铛主体
    for x in range(6, 14):
        for y in range(6, 12):
            draw_pixel(draw, x, y, GOLD)
    # 顶部
    for x in range(7, 13):
        draw_pixel(draw, x, 5, GOLD)
    # 底部
    for x in range(7, 13):
        draw_pixel(draw, x, 12, GOLD_DARK)
    # 铃铛舌
    draw_pixel(draw, 10, 13, GOLD_DARK)
    
    return img

def generate_item_horns():
    """牛角 - 加攻击范围"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    GRAY = '#7F8C8D'
    DARK_GRAY = '#566573'
    
    # 左角
    draw_pixel(draw, 5, 6, GRAY)
    draw_pixel(draw, 6, 7, GRAY)
    draw_pixel(draw, 7, 8, GRAY)
    draw_pixel(draw, 8, 9, GRAY)
    # 右角
    draw_pixel(draw, 14, 6, GRAY)
    draw_pixel(draw, 13, 7, GRAY)
    draw_pixel(draw, 12, 8, GRAY)
    draw_pixel(draw, 11, 9, GRAY)
    # 角根部
    draw_pixel(draw, 9, 10, DARK_GRAY)
    draw_pixel(draw, 10, 10, DARK_GRAY)
    
    return img

def generate_item_wings():
    """翅膀 - 加移速"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    WHITE = '#FFFFFF'
    BLUE_WHITE = '#E8F4F8'
    
    # 左翼
    left = [
        (2, 8), (3, 8),
        (1, 9), (2, 9), (3, 9), (4, 9),
        (2, 10), (3, 10), (4, 10), (5, 10),
        (3, 11), (4, 11), (5, 11), (6, 11),
    ]
    for x, y in left:
        draw_pixel(draw, x, y, WHITE)
    
    # 右翼
    right = [
        (17, 8), (16, 8),
        (18, 9), (17, 9), (16, 9), (15, 9),
        (17, 10), (16, 10), (15, 10), (14, 10),
        (16, 11), (15, 11), (14, 11), (13, 11),
    ]
    for x, y in right:
        draw_pixel(draw, x, y, WHITE)
    
    return img

def generate_item_heart():
    """大心脏 - 加生命上限"""
    img = create_image(20, 20)
    draw = ImageDraw.Draw(img)
    
    RED = '#E74C3C'
    PINK = '#FF9999'
    
    # 大心形
    heart = [
        (5, 5), (6, 5), (7, 5), (12, 5), (13, 5), (14, 5),
        (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (11, 6), (12, 6), (13, 6), (14, 6), (15, 6),
        (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7), (11, 7), (12, 7), (13, 7), (14, 7), (15, 7),
        (5, 8), (6, 8), (7, 8), (8, 8), (9, 8), (10, 8), (11, 8), (12, 8), (13, 8), (14, 8),
        (6, 9), (7, 9), (8, 9), (9, 9), (10, 9), (11, 9), (12, 9), (13, 9),
        (7, 10), (8, 10), (9, 10), (10, 10), (11, 10), (12, 10),
        (8, 11), (9, 11), (10, 11), (11, 11),
        (9, 12), (10, 12),
    ]
    for x, y in heart:
        draw_pixel(draw, x, y, RED)
    
    # 高光
    draw_pixel(draw, 6, 7, PINK)
    draw_pixel(draw, 12, 7, PINK)
    
    return img

# ========== 生成所有道具 ==========
def generate_all():
    print("Generating Item Icons...")
    
    items = {
        'item_milk': generate_item_milk(),        # 牛奶-伤害
        'item_clover': generate_item_grass(),     # 三叶草-暴击
        'item_bell': generate_item_bell(),        # 铃铛-速度
        'item_horns': generate_item_horns(),      # 牛角-范围
        'item_wings': generate_item_wings(),      # 翅膀-移速
        'item_heart': generate_item_heart(),      # 大心-生命
    }
    
    for name, img in items.items():
        filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
        img.save(filepath)
        print(f"[OK] {filepath}")
    
    print(f"\nDone! Generated {len(items)} item icons.")

if __name__ == '__main__':
    generate_all()
