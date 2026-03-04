#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主角牛牛贴图生成器 - 迭代 2/10
基于《深根之疫》故事设定：地脉共鸣者
"""

import json
import os

# 加载调色板
with open('assets/palette.json', 'r', encoding='utf-8') as f:
    palette = json.load(f)

c = palette['mainColors']
a = palette['accentColors']

class PlayerSpriteGenerator:
    def __init__(self):
        self.width = 32
        self.height = 32
        # 创建 32x32 画布，每个像素存储颜色
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
    
    def draw_horn(self, x, y, is_left=True):
        """绘制金色双角，带发光效果"""
        # 角主体
        if is_left:
            self.fill_rect(x, y, 3, 5, c['c8_gold'])
            # 发光尖端
            self.set_pixel(x + 1, y - 1, a['a13_coreGold'])
            self.set_pixel(x, y, c['c9_amber'])
        else:
            self.fill_rect(x, y, 3, 5, c['c8_gold'])
            self.set_pixel(x + 1, y - 1, a['a13_coreGold'])
            self.set_pixel(x + 2, y, c['c9_amber'])
    
    def draw_body(self, frame=0):
        """绘制牛牛身体，帧0-3为行走动画"""
        # 身体摆动偏移
        body_offset = [0, 1, 0, -1][frame % 4]
        
        # 主体（棕色野牛身体）
        self.draw_circle(16, 18 + body_offset, 8, c['c7_tan'], True)
        
        # 肚皮（浅一点）
        self.draw_circle(16, 20 + body_offset, 5, c['c9_amber'], True)
        
        # 地脉纹路（淡金色）
        glow_positions = [
            (15, 16 + body_offset), (17, 16 + body_offset),
            (16, 18 + body_offset), (14, 19 + body_offset), (18, 19 + body_offset)
        ]
        for gx, gy in glow_positions:
            if frame % 2 == 0:  # 脉动效果
                self.set_pixel(gx, gy, a['a13_coreGold'])
            else:
                self.set_pixel(gx, gy, c['c9_amber'])
    
    def draw_head(self, frame=0):
        """绘制头部"""
        head_offset = [0, 1, 0, -1][frame % 4]
        
        # 头部主体
        self.draw_circle(16, 10 + head_offset, 6, c['c9_amber'], True)
        
        # 鼻子/嘴部
        self.draw_circle(16, 13 + head_offset, 3, c['c7_tan'], True)
        
        # 眼睛（黑色，坚定眼神）
        self.set_pixel(13, 9 + head_offset, c['c0_black'])
        self.set_pixel(18, 9 + head_offset, c['c0_black'])
        
        # 眼睛高光
        self.set_pixel(14, 8 + head_offset, c['c4_white'])
        self.set_pixel(19, 8 + head_offset, c['c4_white'])
        
        # 耳朵
        self.fill_rect(9, 8 + head_offset, 2, 3, c['c7_tan'])
        self.fill_rect(21, 8 + head_offset, 2, 3, c['c7_tan'])
    
    def draw_legs(self, frame=0):
        """绘制腿部，行走动画"""
        leg_positions = [
            [(12, 25), (19, 25), (13, 25), (20, 25)],  # 帧0
            [(12, 26), (19, 24), (13, 26), (20, 24)],  # 帧1
            [(12, 25), (19, 25), (13, 25), (20, 25)],  # 帧2
            [(12, 24), (19, 26), (13, 24), (20, 26)],  # 帧3
        ]
        
        positions = leg_positions[frame % 4]
        for lx, ly in positions:
            # 腿部（深棕色蹄子）
            self.fill_rect(lx, ly, 2, 4, c['c6_brown'])
            # 蹄子高光
            self.set_pixel(lx + 1, ly + 3, c['c4_white'])
    
    def draw_horns_glow(self, frame=0):
        """双角发光效果 - 地脉共鸣者标志"""
        head_offset = [0, 1, 0, -1][frame % 4]
        
        # 左角
        self.draw_horn(9, 4 + head_offset, is_left=True)
        # 右角
        self.draw_horn(20, 4 + head_offset, is_left=False)
        
        # 角间能量连接（帧2时最强）
        if frame == 2:
            for x in range(12, 20):
                self.set_pixel(x, 4 + head_offset, a['a13_coreGold'])
    
    def generate_walk_frame(self, frame_num):
        """生成行走动画帧 0-3"""
        self.clear()
        self.draw_body(frame_num)
        self.draw_legs(frame_num)
        self.draw_head(frame_num)
        self.draw_horns_glow(frame_num)
        return self.export_frame()
    
    def generate_dash_frame(self, frame_num):
        """生成冲刺动画帧 0-1"""
        self.clear()
        
        # 冲刺时身体前倾
        lean = 2 if frame_num == 0 else 3
        
        # 身体（倾斜）
        self.draw_circle(16 + lean, 18, 8, c['c7_tan'], True)
        self.draw_circle(16 + lean, 20, 5, c['c9_amber'], True)
        
        # 冲刺残影效果
        for i in range(3):
            alpha_pos = 13 - i * 2
            if alpha_pos > 0:
                self.set_pixel(alpha_pos, 18, a['a1_mycelium'])
        
        # 腿部（奔跑姿态）
        if frame_num == 0:
            self.fill_rect(14, 24, 2, 4, c['c6_brown'])
            self.fill_rect(20, 22, 2, 4, c['c6_brown'])
        else:
            self.fill_rect(15, 22, 2, 4, c['c6_brown'])
            self.fill_rect(19, 24, 2, 4, c['c6_brown'])
        
        # 头部（前倾）
        self.draw_circle(18 + lean, 10, 6, c['c9_amber'], True)
        self.set_pixel(19 + lean, 9, c['c0_black'])
        self.set_pixel(22 + lean, 9, c['c0_black'])
        
        # 角发光（冲刺时更强）
        self.draw_horn(11 + lean, 4, is_left=True)
        self.draw_horn(22 + lean, 4, is_left=False)
        # 金色拖尾
        for x in range(10, 14 + lean):
            self.set_pixel(x, 5, c['c9_amber'])
        
        return self.export_frame()
    
    def generate_hit_frame(self):
        """生成受击帧"""
        self.clear()
        
        # 身体（后仰）
        self.draw_circle(14, 18, 8, c['c7_tan'], True)
        
        # 受击闪烁（白色）
        self.draw_circle(16, 16, 6, c['c4_white'], False)
        
        # 头部（后仰）
        self.draw_circle(14, 10, 6, c['c9_amber'], True)
        
        # 眼睛（痛苦闭眼）
        self.set_pixel(12, 9, c['c0_black'])
        self.set_pixel(13, 9, c['c0_black'])
        self.set_pixel(16, 9, c['c0_black'])
        self.set_pixel(17, 9, c['c0_black'])
        
        # 角（暗淡）
        self.fill_rect(9, 4, 3, 5, c['c6_brown'])  # 左角暗淡
        self.fill_rect(18, 4, 3, 5, c['c6_brown'])  # 右角暗淡
        
        # 腿部
        self.fill_rect(11, 25, 2, 3, c['c6_brown'])
        self.fill_rect(17, 24, 2, 3, c['c6_brown'])
        
        return self.export_frame()
    
    def export_frame(self):
        """导出帧数据为文本格式"""
        lines = []
        for y in range(32):
            row = ''
            for x in range(32):
                color = self.canvas[y][x]
                if color:
                    # 简化为颜色首字母
                    row += self.color_to_char(color)
                else:
                    row += '.'
            lines.append(row)
        return '\n'.join(lines)
    
    def color_to_char(self, color):
        """颜色转字符表示（用于调试查看）"""
        color_map = {
            c['c0_black']: '#',
            c['c7_tan']: 'B',      # Body
            c['c9_amber']: 'A',    # Amber
            c['c6_brown']: 'D',    # Dark
            c['c8_gold']: 'G',     # Gold
            a['a13_coreGold']: '*', # Glow
            c['c9_amber']: '+',    # Light glow
            c['c4_white']: 'W',    # White
        }
        return color_map.get(color, '?')
    
    def generate_sprite_sheet(self):
        """生成完整精灵表：4行走 + 2冲刺 + 1受击 = 7帧"""
        frames = []
        
        print("Generating player sprite frames...")
        
        # 4帧行走
        for i in range(4):
            frames.append(self.generate_walk_frame(i))
            print(f"  Walk frame {i}: OK")
        
        # 2帧冲刺
        for i in range(2):
            frames.append(self.generate_dash_frame(i))
            print(f"  Dash frame {i}: OK")
        
        # 1帧受击
        frames.append(self.generate_hit_frame())
        print(f"  Hit frame: OK")
        
        return frames
    
    def save_debug_view(self, filename='player_sprite_debug.txt'):
        """保存调试图像（ASCII艺术）"""
        frames = self.generate_sprite_sheet()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("=== 牛牛主角精灵表 - 地脉共鸣者 ===\n\n")
            f.write("图例: B=身体 A=琥珀色 D=深棕 G=金色 *=发光 +=淡光 W=白 #=黑 .=透明\n\n")
            
            frame_names = ['行走0', '行走1', '行走2', '行走3', '冲刺0', '冲刺1', '受击']
            
            for name, frame in zip(frame_names, frames):
                f.write(f"--- {name} ---\n")
                f.write(frame)
                f.write("\n\n")
        
        print(f"\nSaved debug view to: {filename}")

# 主程序
if __name__ == '__main__':
    gen = PlayerSpriteGenerator()
    gen.save_debug_view('generated_assets/player_sprite_debug.txt')
    print("\nPlayer sprite generation complete!")
    print("Output: generated_assets/player_sprite_debug.txt")
