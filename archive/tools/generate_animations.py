#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Animations and Enemies Generator
严格遵循用户风格：32x32，大头，豆豆眼，简化四肢
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = "assets"
ENEMY_DIR = "assets/enemies"
os.makedirs(ENEMY_DIR, exist_ok=True)

def create_image(w=32, h=32, scale=4):
    return Image.new('RGBA', (w * scale, h * scale), (0, 0, 0, 0))

def draw_pixel(draw, x, y, color, scale=4):
    draw.rectangle(
        [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
        fill=color
    )

# ========== 主角走路动画（基于cow风格）==========

def generate_cow_idle():
    """站立帧（参考用户的cow.png）"""
    img = create_image()
    draw = ImageDraw.Draw(img)
    
    WHITE = '#FFFFFF'
    BLACK = '#1A1A2E'
    PINK = '#FF69B4'
    
    # 头部（大圆）
    for y in range(6, 14):
        for x in range(12, 20):
            draw_pixel(draw, x, y, WHITE)
    
    # 牛角
    draw_pixel(draw, 12, 5, BLACK)
    draw_pixel(draw, 13, 6, BLACK)
    draw_pixel(draw, 19, 5, BLACK)
    draw_pixel(draw, 18, 6, BLACK)
    
    # 耳朵
    draw_pixel(draw, 11, 7, PINK)
    draw_pixel(draw, 20, 7, PINK)
    
    # 豆豆眼
    draw_pixel(draw, 14, 9, BLACK)
    draw_pixel(draw, 17, 9, BLACK)
    
    # 身体
    for y in range(14, 24):
        for x in range(13, 19):
            draw_pixel(draw, x, y, WHITE)
    
    # 黑斑
    draw_pixel(draw, 14, 16, BLACK)
    draw_pixel(draw, 17, 18, BLACK)
    
    # 手脚（站立）
    draw_pixel(draw, 12, 20, WHITE)
    draw_pixel(draw, 11, 22, WHITE)
    draw_pixel(draw, 19, 20, WHITE)
    draw_pixel(draw, 20, 22, WHITE)
    
    return img

def generate_cow_walk1():
    """走路帧1：左脚前，右脚后"""
    img = create_image()
    draw = ImageDraw.Draw(img)
    
    WHITE = '#FFFFFF'
    BLACK = '#1A1A2E'
    PINK = '#FF69B4'
    
    # 头部（稍微偏左上，有动感）
    for y in range(5, 13):
        for x in range(11, 19):
            draw_pixel(draw, x, y, WHITE)
    
    # 牛角
    draw_pixel(draw, 11, 4, BLACK)
    draw_pixel(draw, 12, 5, BLACK)
    draw_pixel(draw, 18, 4, BLACK)
    draw_pixel(draw, 17, 5, BLACK)
    
    # 耳朵
    draw_pixel(draw, 10, 6, PINK)
    draw_pixel(draw, 19, 6, PINK)
    
    # 豆豆眼
    draw_pixel(draw, 13, 8, BLACK)
    draw_pixel(draw, 16, 8, BLACK)
    
    # 身体
    for y in range(13, 23):
        for x in range(12, 18):
            draw_pixel(draw, x, y, WHITE)
    
    # 黑斑
    draw_pixel(draw, 13, 15, BLACK)
    draw_pixel(draw, 16, 17, BLACK)
    
    # 左脚在前
    draw_pixel(draw, 11, 21, WHITE)
    draw_pixel(draw, 10, 19, WHITE)
    # 右脚在后
    draw_pixel(draw, 18, 22, WHITE)
    draw_pixel(draw, 19, 24, WHITE)
    
    return img

def generate_cow_walk2():
    """走路帧2：右脚前，左脚后"""
    img = create_image()
    draw = ImageDraw.Draw(img)
    
    WHITE = '#FFFFFF'
    BLACK = '#1A1A2E'
    PINK = '#FF69B4'
    
    # 头部（稍微偏右上）
    for y in range(5, 13):
        for x in range(13, 21):
            draw_pixel(draw, x, y, WHITE)
    
    # 牛角
    draw_pixel(draw, 13, 4, BLACK)
    draw_pixel(draw, 14, 5, BLACK)
    draw_pixel(draw, 20, 4, BLACK)
    draw_pixel(draw, 19, 5, BLACK)
    
    # 耳朵
    draw_pixel(draw, 12, 6, PINK)
    draw_pixel(draw, 21, 6, PINK)
    
    # 豆豆眼
    draw_pixel(draw, 15, 8, BLACK)
    draw_pixel(draw, 18, 8, BLACK)
    
    # 身体
    for y in range(13, 23):
        for x in range(14, 20):
            draw_pixel(draw, x, y, WHITE)
    
    # 黑斑
    draw_pixel(draw, 15, 15, BLACK)
    draw_pixel(draw, 18, 17, BLACK)
    
    # 右脚在前
    draw_pixel(draw, 20, 21, WHITE)
    draw_pixel(draw, 21, 19, WHITE)
    # 左脚在后
    draw_pixel(draw, 13, 22, WHITE)
    draw_pixel(draw, 12, 24, WHITE)
    
    return img

# ========== 敌人：感染小鸡 ==========

def generate_enemy_chick():
    """感染小鸡 - 黄+紫寄生"""
    img = create_image()
    draw = ImageDraw.Draw(img)
    
    YELLOW = '#F4D03F'
    ORANGE = '#E67E22'
    PURPLE = '#8E44AD'
    BLACK = '#000000'
    RED = '#E74C3C'
    
    # 头部（比猪小一点）
    for y in range(7, 13):
        for x in range(13, 19):
            draw_pixel(draw, x, y, YELLOW)
    
    # 鸡冠（变紫色-寄生）
    draw_pixel(draw, 14, 6, PURPLE)
    draw_pixel(draw, 15, 6, PURPLE)
    draw_pixel(draw, 16, 6, PURPLE)
    draw_pixel(draw, 15, 5, PURPLE)
    
    # 尖嘴（左）
    draw_pixel(draw, 12, 9, ORANGE)
    draw_pixel(draw, 11, 10, ORANGE)
    
    # 眼睛（一正常一变异）
    draw_pixel(draw, 14, 9, BLACK)
    draw_pixel(draw, 17, 9, RED)
    
    # 身体（倒三角）
    for y in range(13, 18):
        for x in range(14, 18):
            draw_pixel(draw, x, y, YELLOW)
    
    # 翅膀
    draw_pixel(draw, 13, 14, YELLOW)
    draw_pixel(draw, 18, 14, YELLOW)
    
    # 脚
    draw_pixel(draw, 15, 18, ORANGE)
    draw_pixel(draw, 16, 18, ORANGE)
    
    # 寄生尾巴（紫）
    draw_pixel(draw, 18, 16, PURPLE)
    draw_pixel(draw, 19, 17, PURPLE)
    
    return img

# ========== 敌人：感染绵羊 ==========

def generate_enemy_sheep():
    """感染绵羊 - 白+紫触须"""
    img = create_image()
    draw = ImageDraw.Draw(img)
    
    WHITE = '#ECF0F1'
    PURPLE = '#9B59B6'
    DARK_PURPLE = '#6C3483'
    BLACK = '#000000'
    
    # 头部（棉花球状）
    for y in range(5, 12):
        for x in range(11, 21):
            draw_pixel(draw, x, y, WHITE)
    
    # 豆豆眼
    draw_pixel(draw, 13, 8, BLACK)
    draw_pixel(draw, 18, 8, BLACK)
    
    # 身体（更圆的棉花球）
    for y in range(12, 20):
        for x in range(12, 20):
            draw_pixel(draw, x, y, WHITE)
    
    # 背上的寄生花（紫色）
    # 花心
    draw_pixel(draw, 15, 10, DARK_PURPLE)
    draw_pixel(draw, 16, 10, DARK_PURPLE)
    # 花瓣
    draw_pixel(draw, 14, 9, PURPLE)
    draw_pixel(draw, 17, 9, PURPLE)
    draw_pixel(draw, 14, 11, PURPLE)
    draw_pixel(draw, 17, 11, PURPLE)
    draw_pixel(draw, 15, 8, PURPLE)
    draw_pixel(draw, 16, 8, PURPLE)
    
    # 触须
    draw_pixel(draw, 13, 7, PURPLE)
    draw_pixel(draw, 18, 7, PURPLE)
    draw_pixel(draw, 12, 9, PURPLE)
    
    # 小短腿
    draw_pixel(draw, 14, 20, WHITE)
    draw_pixel(draw, 17, 20, WHITE)
    
    return img

# ========== 敌人：感染牧羊犬（Boss）==========

def generate_boss_dog():
    """Boss牧羊犬 - 更大，棕色+大量寄生"""
    img = create_image(40, 40)  # Boss大一点
    draw = ImageDraw.Draw(img)
    
    BROWN = '#8D6E63'
    DARK_BROWN = '#5D4037'
    PURPLE = '#7B2CBF'
    BLACK = '#000000'
    RED = '#C0392B'
    WHITE = '#FFFFFF'
    
    # 头部（大）
    for y in range(8, 18):
        for x in range(15, 25):
            draw_pixel(draw, x, y, BROWN)
    
    # 半边脸被寄生（左半边紫色）
    for y in range(8, 18):
        for x in range(15, 19):
            draw_pixel(draw, x, y, PURPLE)
    
    # 正常眼睛（右）
    draw_pixel(draw, 21, 12, BLACK)
    draw_pixel(draw, 22, 12, WHITE)  # 高光
    
    # 变异眼睛（左，红）
    draw_pixel(draw, 17, 12, RED)
    
    # 尖牙
    draw_pixel(draw, 20, 16, WHITE)
    draw_pixel(draw, 21, 15, WHITE)
    
    # 耳朵（一正常一变异）
    draw_pixel(draw, 13, 10, BROWN)
    draw_pixel(draw, 12, 12, BROWN)
    draw_pixel(draw, 26, 10, PURPLE)
    draw_pixel(draw, 27, 12, PURPLE)
    
    # 身体（大）
    for y in range(18, 30):
        for x in range(14, 26):
            draw_pixel(draw, x, y, BROWN)
    
    # 身上寄生斑点
    draw_pixel(draw, 16, 20, PURPLE)
    draw_pixel(draw, 18, 22, PURPLE)
    draw_pixel(draw, 23, 24, PURPLE)
    
    # 尾巴变触手
    draw_pixel(draw, 26, 28, PURPLE)
    draw_pixel(draw, 28, 29, PURPLE)
    draw_pixel(draw, 30, 28, PURPLE)
    
    # 腿
    draw_pixel(draw, 16, 32, DARK_BROWN)
    draw_pixel(draw, 23, 32, DARK_BROWN)
    
    return img

# ========== 生成所有 ==========
def generate_all():
    print("Generating animations and enemies...")
    
    # 主角走路动画
    generate_cow_idle().save(os.path.join(OUTPUT_DIR, "cow_idle.png"))
    print("[OK] cow_idle.png")
    generate_cow_walk1().save(os.path.join(OUTPUT_DIR, "cow_walk1.png"))
    print("[OK] cow_walk1.png")
    generate_cow_walk2().save(os.path.join(OUTPUT_DIR, "cow_walk2.png"))
    print("[OK] cow_walk2.png")
    
    # 敌人
    generate_enemy_chick().save(os.path.join(ENEMY_DIR, "enemy_chick.png"))
    print("[OK] enemies/enemy_chick.png")
    generate_enemy_sheep().save(os.path.join(ENEMY_DIR, "enemy_sheep.png"))
    print("[OK] enemies/enemy_sheep.png")
    generate_boss_dog().save(os.path.join(ENEMY_DIR, "boss_dog.png"))
    print("[OK] enemies/boss_dog.png")
    
    print("\nDone! Generated:")
    print("  - 3x 主角走路动画")
    print("  - 3x 新敌人（小鸡、绵羊、Boss狗）")

if __name__ == '__main__':
    generate_all()
