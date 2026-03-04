#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tier 1 敌人贴图生成器 - 迭代 3/10
《深根之疫》故事设定：初级寄生状态
特征：苍白菌丝覆盖、呆滞眼神、轻微变异
"""

import json
import os

with open('assets/palette.json', 'r', encoding='utf-8') as f:
    palette = json.load(f)

c = palette['mainColors']
a = palette['accentColors']
tier1_colors = palette['enemyTiers']['tier1_basic']

class Tier1EnemyGenerator:
    def __init__(self):
        self.width = 32
        self.height = 32
        self.canvas = [['' for _ in range(32)] for _ in range(32)]
    
    def clear(self):
        self.canvas = [['' for _ in range(32)] for _ in range(32)]
    
    def set_pixel(self, x, y, color):
        if 0 <= x < 32 and 0 <= y < 32:
            self.canvas[y][x] = color
    
    def fill_rect(self, x, y, w, h, color):
        for dy in range(h):
            for dx in range(w):
                self.set_pixel(x + dx, y + dy, color)
    
    def draw_circle(self, cx, cy, r, color, filled=True):
        for y in range(-r, r + 1):
            for x in range(-r, r + 1):
                dist = (x**2 + y**2) ** 0.5
                if filled:
                    if dist <= r:
                        self.set_pixel(cx + x, cy + y, color)
                else:
                    if r - 0.5 <= dist <= r + 0.5:
                        self.set_pixel(cx + x, cy + y, color)
    
    def add_mycelium(self, count=3):
        """添加菌丝覆盖效果 - 感染特征"""
        import random
        for _ in range(count):
            x = random.randint(8, 24)
            y = random.randint(8, 24)
            # 菌丝斑点
            self.set_pixel(x, y, a['a1_mycelium'])
            self.set_pixel(x+1, y, a['a0_infectionWhite'])
            self.set_pixel(x, y+1, a['a2_spore'])
    
    def add_infected_eyes(self, x1, y1, x2, y2):
        """感染眼睛 - 乳白色无光泽"""
        # 左眼
        self.set_pixel(x1, y1, a['a0_infectionWhite'])
        self.set_pixel(x1+1, y1, a['a1_mycelium'])
        # 右眼
        self.set_pixel(x2, y2, a['a0_infectionWhite'])
        self.set_pixel(x2+1, y2, a['a1_mycelium'])
    
    def generate_chick(self):
        """感染小鸡 - 曾经的跳跳"""
        self.clear()
        
        # 身体（圆球状）
        body_color = tier1_colors[0]  # 苍白
        self.draw_circle(16, 18, 7, body_color, True)
        
        # 肚皮（更浅）
        self.draw_circle(16, 20, 4, tier1_colors[1], True)
        
        # 头
        self.draw_circle(16, 10, 5, tier1_colors[1], True)
        
        # 喙（菌丝化）
        self.fill_rect(15, 12, 2, 2, a['a2_spore'])
        
        # 感染眼睛
        self.add_infected_eyes(13, 9, 18, 9)
        
        # 小翅膀（下垂 - 无力感）
        self.fill_rect(8, 16, 3, 2, tier1_colors[2])
        self.fill_rect(21, 17, 3, 2, tier1_colors[2])
        
        # 腿（颤抖效果用帧动画实现）
        self.set_pixel(14, 25, c['c6_brown'])
        self.set_pixel(18, 25, c['c6_brown'])
        
        # 菌丝覆盖
        self.add_mycelium(4)
        
        return self.export_frame()
    
    def generate_mouse(self):
        """感染老鼠 - 敏捷但受控"""
        self.clear()
        
        # 身体（细长）
        body_color = tier1_colors[1]
        self.fill_rect(12, 14, 12, 8, body_color)
        self.draw_circle(22, 16, 4, tier1_colors[0], True)  # 头部区域
        
        # 头（尖锐）
        self.fill_rect(22, 12, 6, 6, tier1_colors[0])
        
        # 大耳朵（感染下垂）
        self.fill_rect(20, 8, 3, 4, tier1_colors[2])
        self.fill_rect(25, 8, 3, 4, tier1_colors[2])
        
        # 感染眼睛（红色血丝效果）
        self.set_pixel(24, 13, a['a10_bloodRed'])
        self.set_pixel(27, 13, a['a10_bloodRed'])
        
        # 鼻子（菌丝须）
        self.set_pixel(28, 15, a['a1_mycelium'])
        self.set_pixel(29, 14, a['a2_spore'])
        
        # 尾巴（菌丝化 - 分段）
        tail_segments = [(11, 18), (9, 19), (7, 18), (5, 17), (4, 15)]
        for i, (tx, ty) in enumerate(tail_segments):
            color = a['a1_mycelium'] if i % 2 == 0 else a['a0_infectionWhite']
            self.set_pixel(tx, ty, color)
        
        # 腿（细小）
        self.set_pixel(14, 22, c['c6_brown'])
        self.set_pixel(18, 22, c['c6_brown'])
        
        # 菌丝覆盖
        self.add_mycelium(3)
        
        return self.export_frame()
    
    def generate_snail(self):
        """感染蜗牛 - 缓慢但坚韧"""
        self.clear()
        
        # 壳（螺旋状 - 用同心圆模拟）
        shell_color = tier1_colors[0]
        self.draw_circle(16, 16, 9, shell_color, False)  # 外圈
        self.draw_circle(16, 16, 6, tier1_colors[1], False)  # 中圈
        self.draw_circle(16, 16, 3, tier1_colors[2], True)  # 中心
        
        # 菌丝覆盖壳
        for angle in [0, 90, 180, 270]:
            import math
            rad = math.radians(angle)
            x = int(16 + 7 * math.cos(rad))
            y = int(16 + 7 * math.sin(rad))
            self.set_pixel(x, y, a['a1_mycelium'])
        
        # 身体（软体部分 - 延伸出来）
        body_color = tier1_colors[1]
        self.fill_rect(6, 14, 8, 6, body_color)
        
        # 触角（感染发光）
        self.set_pixel(6, 12, a['a6_nerveGlow'])
        self.set_pixel(6, 10, a['a0_infectionWhite'])
        self.set_pixel(5, 13, a['a6_nerveGlow'])
        
        # 眼睛（在触角顶端）
        self.set_pixel(6, 9, a['a0_infectionWhite'])
        
        # 腹足（扁平）
        self.fill_rect(8, 20, 16, 2, tier1_colors[2])
        
        # 粘液痕迹（身后）
        for x in range(4, 8):
            self.set_pixel(x, 21, a['a3_slimeGreen'])
        
        # 菌丝覆盖
        self.add_mycelium(5)
        
        return self.export_frame()
    
    def generate_pigeon(self):
        """感染鸽子 - 曾经的银牙"""
        self.clear()
        
        # 身体（流线型）
        body_color = tier1_colors[0]
        self.draw_circle(16, 17, 7, body_color, True)
        
        # 头（小）
        self.draw_circle(22, 12, 4, tier1_colors[1], True)
        
        # 喙（尖锐）
        self.fill_rect(25, 11, 3, 2, c['c6_brown'])
        
        # 感染眼睛（侧视）
        self.set_pixel(24, 11, a['a0_infectionWhite'])
        
        # 翅膀（展开 - 准备扑击）
        wing_color = tier1_colors[2]
        # 左翼
        self.fill_rect(10, 14, 4, 8, wing_color)
        self.set_pixel(9, 16, wing_color)
        self.set_pixel(8, 18, wing_color)
        # 右翼（部分遮挡）
        self.fill_rect(20, 15, 3, 6, wing_color)
        
        # 尾羽（扇形）
        for i in range(3):
            self.set_pixel(10 - i, 20 + i, wing_color)
        
        # 腿（细小）
        self.set_pixel(15, 24, c['c6_brown'])
        self.set_pixel(18, 24, c['c6_brown'])
        
        # 菌丝覆盖
        self.add_mycelium(4)
        
        return self.export_frame()
    
    def generate_duck3(self):
        """感染小鸭 - 第三变异型"""
        self.clear()
        
        # 身体（圆润）
        body_color = tier1_colors[1]
        self.draw_circle(16, 18, 6, body_color, True)
        
        # 头（大）
        self.draw_circle(16, 10, 5, tier1_colors[0], True)
        
        # 扁喙（黄色但暗淡）
        self.fill_rect(14, 12, 4, 2, c['c8_gold'])
        self.set_pixel(13, 12, c['c8_gold'])
        
        # 感染眼睛（呆滞）
        self.add_infected_eyes(13, 9, 18, 9)
        
        # 翅膀（小）
        wing_color = tier1_colors[2]
        self.fill_rect(10, 16, 3, 4, wing_color)
        self.fill_rect(19, 16, 3, 4, wing_color)
        
        # 蹼足
        self.fill_rect(14, 24, 2, 2, c['c6_brown'])
        self.fill_rect(18, 24, 2, 2, c['c6_brown'])
        self.set_pixel(13, 25, c['c6_brown'])
        self.set_pixel(20, 25, c['c6_brown'])
        
        # 菌丝覆盖
        self.add_mycelium(3)
        
        return self.export_frame()
    
    def export_frame(self):
        """导出为ASCII艺术"""
        lines = []
        for y in range(32):
            row = ''
            for x in range(32):
                color = self.canvas[y][x]
                if color:
                    row += self.color_to_char(color)
                else:
                    row += '.'
            lines.append(row)
        return '\n'.join(lines)
    
    def color_to_char(self, color):
        """颜色转字符"""
        color_map = {
            tier1_colors[0]: 'O',  # 苍白主体
            tier1_colors[1]: 'o',  # 浅色
            tier1_colors[2]: ':',  # 深色细节
            a['a0_infectionWhite']: '*',  # 感染白
            a['a1_mycelium']: '+',  # 菌丝
            a['a2_spore']: '~',  # 孢子
            c['c6_brown']: '#',  # 腿/喙
            c['c8_gold']: 'g',  # 金色（暗淡）
        }
        return color_map.get(color, '?')
    
    def generate_all(self):
        """生成所有Tier 1敌人"""
        enemies = {
            'chick': self.generate_chick,
            'mouse': self.generate_mouse,
            'snail': self.generate_snail,
            'pigeon': self.generate_pigeon,
            'duck3': self.generate_duck3,
        }
        
        results = {}
        for name, generator in enemies.items():
            results[name] = generator()
            print(f"Generated: {name}")
        
        return results
    
    def save_debug_view(self, filename='generated_assets/tier1_enemies_debug.txt'):
        """保存调试图像"""
        results = self.generate_all()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("=== Tier 1 敌人精灵表 - 初级寄生 ===\n\n")
            f.write("《深根之疫》故事设定：菌丝蔓延区的第一批受害者\n")
            f.write("特征：苍白菌丝覆盖、呆滞眼神、轻微变异\n\n")
            f.write("图例: O=苍白主体 o=浅色 :=深色 *=感染白 +=菌丝 ~=孢子 #=肢体 g=暗淡金\n\n")
            
            for name, frame in results.items():
                f.write(f"--- {name} ---\n")
                f.write(frame)
                f.write("\n\n")
        
        print(f"\nSaved to: {filename}")

if __name__ == '__main__':
    gen = Tier1EnemyGenerator()
    gen.save_debug_view()
    print("\nTier 1 enemy generation complete!")
