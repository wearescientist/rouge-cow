#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成墙角贴图 (120x120)
四个墙角: tl(左上), tr(右上), bl(左下), br(右下)
"""

from PIL import Image
import os

# 配置
OUTPUT_DIR = 'assets/sprites/tiles/walls'
WALL_SIZE = 120  # 墙角贴图尺寸
WALL_THICKNESS = 120

# 6层配色方案 (与墙/门一致)
LAYER_COLORS = {
    1: {'wall': '#4a5568', 'wall_dark': '#2d3748', 'wall_light': '#718096'},  # 灰色石墙
    2: {'wall': '#2d5016', 'wall_dark': '#1a3009', 'wall_light': '#4a7c23'},  # 绿色森林
    3: {'wall': '#4a306d', 'wall_dark': '#2d1b4e', 'wall_light': '#6b4c9a'},  # 紫色沼泽
    4: {'wall': '#8b4513', 'wall_dark': '#5c2e0c', 'wall_light': '#cd853f'},  # 橙色沙漠
    5: {'wall': '#722f37', 'wall_dark': '#4a1e23', 'wall_light': '#a94442'},  # 暗红火山
    6: {'wall': '#1a1a2e', 'wall_dark': '#0f0f1a', 'wall_light': '#4a4a6a'},  # 深紫核心
}

def create_wall_pattern(color_base, color_dark, color_light, size=64):
    """创建基础墙纹理图案 (64x64用于取样)"""
    img = Image.new('RGBA', (size, size), color_base)
    pixels = img.load()
    
    import random
    random.seed(42)  # 可复现
    
    for y in range(size):
        for x in range(size):
            # 石墙纹理 - 渐变 + 噪声
            noise = random.randint(-20, 20)
            # 顶部更亮（光照效果）
            grad = int((1 - y / size) * 30)
            
            r, g, b = ImageColor.getrgb(color_base)
            r = max(0, min(255, r + noise + grad))
            g = max(0, min(255, g + noise + grad))
            b = max(0, min(255, b + noise + grad))
            pixels[x, y] = (r, g, b, 255)
    
    # 添加一些石块纹理
    for _ in range(8):
        bx = random.randint(0, size-16)
        by = random.randint(0, size-12)
        bw = random.randint(8, 16)
        bh = random.randint(6, 12)
        
        for y in range(by, min(by+bh, size)):
            for x in range(bx, min(bx+bw, size)):
                noise = random.randint(-10, 10)
                r, g, b = ImageColor.getrgb(color_light if random.random() > 0.5 else color_dark)
                r = max(0, min(255, r + noise))
                g = max(0, min(255, g + noise))
                b = max(0, min(255, b + noise))
                pixels[x, y] = (r, g, b, 255)
    
    return img

def create_corner(layer, corner_type, colors):
    """
    创建墙角贴图
    corner_type: 'tl', 'tr', 'bl', 'br'
    tl: 左上 - 墙身向右(上) + 向下(左)  
    tr: 右上 - 墙身向左(上) + 向下(右)
    bl: 左下 - 墙身向右(下) + 向上(左)
    br: 右下 - 墙身向左(下) + 向上(右)
    """
    from PIL import ImageDraw
    import random
    
    size = WALL_SIZE
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    random.seed(42 + layer + hash(corner_type))
    
    c_base = colors['wall']
    c_dark = colors['wall_dark']
    c_light = colors['wall_light']
    
    r_base, g_base, b_base = ImageColor.getrgb(c_base)
    r_dark, g_dark, b_dark = ImageColor.getrgb(c_dark)
    r_light, g_light, b_light = ImageColor.getrgb(c_light)
    
    def noise_color(r, g, b, amount=20):
        n = random.randint(-amount, amount)
        return (
            max(0, min(255, r + n)),
            max(0, min(255, g + n)),
            max(0, min(255, b + n)),
            255
        )
    
    # 绘制像素级石墙纹理
    pixels = img.load()
    
    # 定义墙角区域
    # 每个墙角有两个墙条交汇
    # thickness = 120 (整个贴图都是墙)
    t = WALL_THICKNESS  # 120
    
    for y in range(size):
        for x in range(size):
            in_h_wall = False  # 水平墙条
            in_v_wall = False  # 垂直墙条
            
            if corner_type == 'tl':  # 左上: 上边缘水平 + 左边缘垂直
                in_h_wall = y < t  # 上半部分
                in_v_wall = x < t  # 左半部分
            elif corner_type == 'tr':  # 右上: 上边缘水平 + 右边缘垂直
                in_h_wall = y < t
                in_v_wall = x >= size - t
            elif corner_type == 'bl':  # 左下: 下边缘水平 + 左边缘垂直
                in_h_wall = y >= size - t
                in_v_wall = x < t
            elif corner_type == 'br':  # 右下: 下边缘水平 + 右边缘垂直
                in_h_wall = y >= size - t
                in_v_wall = x >= size - t
            
            if in_h_wall or in_v_wall:
                # 基础颜色 + 渐变 + 噪声
                # 水平墙: 顶部亮，底部暗
                # 垂直墙: 外侧亮，内侧暗
                
                base_r, base_g, base_b = r_base, g_base, b_base
                
                if in_h_wall and in_v_wall:
                    # 角落交汇区 - 混合
                    grad = 20
                elif in_h_wall:
                    # 水平墙渐变 (上亮下暗)
                    if corner_type in ['tl', 'tr']:
                        grad = int((1 - y / t) * 40)
                    else:
                        grad = int(((y - (size - t)) / t) * 40)
                else:
                    # 垂直墙渐变 (外亮内暗)
                    if corner_type in ['tl', 'bl']:
                        grad = int((1 - x / t) * 30)
                    else:
                        grad = int(((x - (size - t)) / t) * 30)
                
                # 添加石块纹理
                block_size = 20
                bx = x // block_size
                by = y // block_size
                block_noise = (bx * 3 + by * 7) % 30 - 15
                
                final_r = max(0, min(255, base_r + grad + block_noise + random.randint(-10, 10)))
                final_g = max(0, min(255, base_g + grad + block_noise + random.randint(-10, 10)))
                final_b = max(0, min(255, base_b + grad + block_noise + random.randint(-10, 10)))
                
                pixels[x, y] = (final_r, final_g, final_b, 255)
                
                # 添加石块缝隙
                if x % block_size == 0 or y % block_size == 0:
                    if random.random() > 0.7:
                        pixels[x, y] = noise_color(r_dark, g_dark, b_dark, 10)
    
    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for layer in range(1, 7):
        colors = LAYER_COLORS[layer]
        
        for corner in ['tl', 'tr', 'bl', 'br']:
            img = create_corner(layer, corner, colors)
            filename = f'{OUTPUT_DIR}/layer{layer}_corner_{corner}.png'
            img.save(filename)
            print(f'Generated: {filename}')
    
    print('\nAll corner textures generated!')

if __name__ == '__main__':
    from PIL import ImageColor
    main()
