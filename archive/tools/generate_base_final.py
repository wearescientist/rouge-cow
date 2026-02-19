#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final Base Body - 唯一基础模型
用户设计的简约人型素体
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = "assets/bodies"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_image(w, h, scale=4):
    return Image.new('RGBA', (w * scale, h * scale), (0, 0, 0, 0))

def draw_pixel(draw, x, y, color, scale=4):
    draw.rectangle(
        [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
        fill=color
    )

def generate_base_body_final():
    """
    用户设计的最终基础素体
    - 32x32像素
    - 极简风格
    - 头上两个小角/头发
    - 豆豆眼
    - 明确的手部位置
    """
    img = create_image(32, 32)
    draw = ImageDraw.Draw(img)
    
    # 颜色定义
    SKIN = '#FFE4C4'      # 肤色
    SKIN_SHADOW = '#E8C4A0'  # 肤色阴影
    HAIR = '#2C3E50'      # 头发/角（深色）
    EYE = '#000000'       # 眼睛
    
    # ===== 头部区域 (y: 4-12) =====
    # 头部主体 - 8x8
    for y in range(6, 14):
        for x in range(12, 20):
            draw_pixel(draw, x, y, SKIN)
    
    # 头顶的两个小角/头发（用户设计的特征）
    draw_pixel(draw, 13, 4, HAIR)
    draw_pixel(draw, 14, 5, HAIR)
    draw_pixel(draw, 18, 4, HAIR)
    draw_pixel(draw, 17, 5, HAIR)
    
    # 豆豆眼（稍微不对称，有方向感）
    draw_pixel(draw, 14, 9, EYE)
    draw_pixel(draw, 17, 9, EYE)
    # 左眼高光（暗示方向朝右）
    draw_pixel(draw, 15, 8, '#FFFFFF')
    
    # 小鼻子（方向标识）
    draw_pixel(draw, 16, 11, SKIN_SHADOW)
    
    # ===== 身体区域 (y: 14-26) =====
    # 身体主体 - 10x12
    for y in range(14, 26):
        for x in range(11, 21):
            draw_pixel(draw, x, y, SKIN)
    
    # 身体阴影（右侧）
    for y in range(14, 26):
        draw_pixel(draw, 20, y, SKIN_SHADOW)
    
    # 明确的手部位置（稍微突出的深色像素）
    # 左手
    draw_pixel(draw, 9, 17, SKIN)
    draw_pixel(draw, 8, 18, SKIN)
    draw_pixel(draw, 8, 19, SKIN)
    draw_pixel(draw, 9, 20, SKIN)
    
    # 右手
    draw_pixel(draw, 22, 17, SKIN)
    draw_pixel(draw, 23, 18, SKIN)
    draw_pixel(draw, 23, 19, SKIN)
    draw_pixel(draw, 22, 20, SKIN)
    
    # ===== 脚部 (y: 26-30) =====
    # 左脚
    draw_pixel(draw, 13, 26, SKIN)
    draw_pixel(draw, 13, 27, SKIN)
    draw_pixel(draw, 13, 28, SKIN_SHADOW)  # 鞋子/阴影
    draw_pixel(draw, 14, 28, SKIN_SHADOW)
    
    # 右脚
    draw_pixel(draw, 17, 26, SKIN)
    draw_pixel(draw, 17, 27, SKIN)
    draw_pixel(draw, 17, 28, SKIN_SHADOW)
    draw_pixel(draw, 18, 28, SKIN_SHADOW)
    
    return img

if __name__ == '__main__':
    img = generate_base_body_final()
    filepath = os.path.join(OUTPUT_DIR, "base_body.png")
    img.save(filepath)
    print(f"[OK] Generated: {filepath}")
    print("This is the ONE AND ONLY base body model.")
