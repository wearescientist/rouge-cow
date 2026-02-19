#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UI and Tile Assets Generator
UI素材和地图瓦片生成器
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = "assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_image(w, h, scale=4):
    return Image.new('RGBA', (w * scale, h * scale), (0, 0, 0, 0))

def draw_pixel(draw, x, y, color, scale=4):
    draw.rectangle(
        [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
        fill=color
    )

# ========== UI 素材 ==========

def generate_heart_full():
    """满血心形"""
    img = create_image(16, 14)
    draw = ImageDraw.Draw(img)
    
    RED = '#E74C3C'
    RED_DARK = '#C0392B'
    
    heart = [
        (4, 3), (5, 3), (6, 3), (9, 3), (10, 3), (11, 3),
        (3, 4), (4, 4), (5, 4), (6, 4), (7, 4), (8, 4), (9, 4), (10, 4), (11, 4), (12, 4),
        (3, 5), (4, 5), (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5), (11, 5), (12, 5),
        (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6), (11, 6),
        (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7),
        (6, 8), (7, 8), (8, 8), (9, 8),
        (7, 9), (8, 9),
    ]
    for x, y in heart:
        draw_pixel(draw, x, y, RED)
    
    # 阴影
    draw_pixel(draw, 3, 4, RED_DARK)
    draw_pixel(draw, 3, 5, RED_DARK)
    
    return img

def generate_heart_empty():
    """空血心形（轮廓）"""
    img = create_image(16, 14)
    draw = ImageDraw.Draw(img)
    
    GRAY = '#555555'
    
    outline = [
        (4, 3), (5, 3), (6, 3), (9, 3), (10, 3), (11, 3),
        (3, 4), (12, 4),
        (3, 5), (12, 5),
        (4, 6), (11, 6),
        (5, 7), (10, 7),
        (6, 8), (9, 8),
        (7, 9), (8, 9),
    ]
    for x, y in outline:
        draw_pixel(draw, x, y, GRAY)
    
    return img

def generate_exp_bar():
    """经验条（分段式）"""
    img = create_image(64, 8)
    draw = ImageDraw.Draw(img)
    
    BLUE = '#3498DB'
    BLUE_DARK = '#2980B9'
    BG = '#2C3E50'
    
    # 背景
    for x in range(64):
        for y in range(8):
            draw_pixel(draw, x, y, BG)
    
    # 10段经验格子
    for i in range(10):
        x_start = i * 6 + 1
        for x in range(x_start, x_start + 5):
            for y in range(2, 6):
                draw_pixel(draw, x, y, BLUE)
    
    return img

def generate_coin():
    """金币图标"""
    img = create_image(12, 12)
    draw = ImageDraw.Draw(img)
    
    GOLD = '#F1C40F'
    GOLD_DARK = '#D4AC0D'
    
    # 圆形金币
    circle = [
        (4, 2), (5, 2), (6, 2), (7, 2),
        (3, 3), (4, 3), (5, 3), (6, 3), (7, 3), (8, 3),
        (3, 4), (4, 4), (5, 4), (6, 4), (7, 4), (8, 4),
        (3, 5), (4, 5), (5, 5), (6, 5), (7, 5), (8, 5),
        (4, 6), (5, 6), (6, 6), (7, 6),
        (4, 7), (5, 7), (6, 7), (7, 7),
        (5, 8), (6, 8),
    ]
    for x, y in circle:
        draw_pixel(draw, x, y, GOLD)
    
    # 边框
    draw_pixel(draw, 3, 3, GOLD_DARK)
    draw_pixel(draw, 8, 3, GOLD_DARK)
    draw_pixel(draw, 3, 5, GOLD_DARK)
    draw_pixel(draw, 8, 5, GOLD_DARK)
    
    return img

# ========== 地图瓦片 ==========

def generate_floor_cave():
    """洞穴地板"""
    img = create_image(32, 32)
    draw = ImageDraw.Draw(img)
    
    BROWN = '#5D4037'
    BROWN_LIGHT = '#6D4C41'
    BROWN_DARK = '#4E342E'
    PURPLE = '#4A148C'  # 寄生痕迹
    
    # 基础纹理
    for x in range(32):
        for y in range(32):
            noise = (x * 7 + y * 13) % 23
            if noise < 8:
                draw_pixel(draw, x, y, BROWN)
            elif noise < 15:
                draw_pixel(draw, x, y, BROWN_LIGHT)
            elif noise < 19:
                draw_pixel(draw, x, y, BROWN_DARK)
            else:
                draw_pixel(draw, x, y, PURPLE)  # 偶尔紫斑
    
    return img

def generate_wall_cave():
    """洞穴墙壁"""
    img = create_image(32, 32)
    draw = ImageDraw.Draw(img)
    
    GRAY = '#424242'
    GRAY_LIGHT = '#616161'
    GRAY_DARK = '#212121'
    PURPLE = '#6A1B9A'
    
    # 岩石纹理
    for x in range(32):
        for y in range(32):
            noise = (x * 11 + y * 7) % 20
            if noise < 7:
                draw_pixel(draw, x, y, GRAY)
            elif noise < 13:
                draw_pixel(draw, x, y, GRAY_LIGHT)
            elif noise < 17:
                draw_pixel(draw, x, y, GRAY_DARK)
            else:
                draw_pixel(draw, x, y, PURPLE)
    
    # 顶部高亮（立体感）
    for x in range(32):
        draw_pixel(draw, x, 0, GRAY_LIGHT)
        draw_pixel(draw, x, 1, GRAY)
    
    return img

def generate_floor_grass():
    """草地地板（草原回忆关）"""
    img = create_image(32, 32)
    draw = ImageDraw.Draw(img)
    
    GREEN = '#4CAF50'
    GREEN_LIGHT = '#66BB6A'
    GREEN_DARK = '#388E3C'
    YELLOW = '#8BC34A'  # 枯草
    
    for x in range(32):
        for y in range(32):
            noise = (x * 5 + y * 9) % 25
            if noise < 10:
                draw_pixel(draw, x, y, GREEN)
            elif noise < 17:
                draw_pixel(draw, x, y, GREEN_LIGHT)
            elif noise < 21:
                draw_pixel(draw, x, y, GREEN_DARK)
            else:
                draw_pixel(draw, x, y, YELLOW)
    
    return img

def generate_door():
    """门/出口"""
    img = create_image(32, 32)
    draw = ImageDraw.Draw(img)
    
    WOOD = '#5D4037'
    WOOD_DARK = '#3E2723'
    GOLD = '#FFD700'
    
    # 门框
    for x in range(32):
        for y in range(32):
            # 门洞
            if 8 < x < 24 and 4 < y < 28:
                # 内部黑色（通道）
                if x == 9 or x == 23 or y == 5 or y == 27:
                    draw_pixel(draw, x, y, WOOD_DARK)
                else:
                    draw_pixel(draw, x, y, '#1a1a2e')
            else:
                draw_pixel(draw, x, y, WOOD)
    
    # 门把手
    draw_pixel(draw, 21, 16, GOLD)
    draw_pixel(draw, 22, 16, GOLD)
    
    return img

# ========== 道具图标模板 ==========

def generate_item_template():
    """道具图标模板（24x24）"""
    img = create_image(24, 24)
    draw = ImageDraw.Draw(img)
    
    # 边框
    BORDER = '#BDC3C7'
    BG = '#ECF0F1'
    
    for x in range(24):
        for y in range(24):
            if x < 2 or x > 21 or y < 2 or y > 21:
                draw_pixel(draw, x, y, BORDER)
            else:
                draw_pixel(draw, x, y, BG)
    
    return img

# ========== 生成所有素材 ==========
def generate_all():
    print("Generating UI and Tile Assets...")
    
    assets = {
        # UI
        'ui_heart_full': generate_heart_full(),
        'ui_heart_empty': generate_heart_empty(),
        'ui_exp_bar': generate_exp_bar(),
        'ui_coin': generate_coin(),
        # 地图瓦片
        'tile_floor_cave': generate_floor_cave(),
        'tile_wall_cave': generate_wall_cave(),
        'tile_floor_grass': generate_floor_grass(),
        'tile_door': generate_door(),
        # 模板
        'item_template': generate_item_template(),
    }
    
    for name, img in assets.items():
        filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
        img.save(filepath)
        print(f"[OK] {filepath}")
    
    print(f"\nDone! Generated {len(assets)} UI/Tile assets.")

if __name__ == '__main__':
    generate_all()
