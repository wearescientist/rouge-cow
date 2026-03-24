#!/usr/bin/env python3
"""
按动物分级系统批量重设贴图尺寸
"""
from PIL import Image
import os
import shutil
from pathlib import Path

# 动物分级映射: 文件名 -> (动物名, 基础高度)
SPRITE_TIERS = {
    # 微型 (基础高 20)
    'snail.png': ('蜗牛', 20),
    'bird.png': ('蜜蜂', 20),  # 实际用作蜜蜂/小鸟
    'mouse.png': ('老鼠', 20),
    'crab.png': ('蜘蛛', 20),  # 用户说明：螃蟹贴图实际是蜘蛛，微型
    
    # 小型 (基础高 32)
    'chick.png': ('小鸡', 32),
    'pigeon.png': ('鸽子', 32),
    'duck.png': ('鸭子', 32),
    'duck2.png': ('鸭子2', 32),
    'duck3.png': ('鸭子3', 32),
    'turtle.png': ('乌龟', 32),  # 调整为小型
    
    # 中型 (基础高 42)
    'rabbit.png': ('兔子', 42),
    'rabbit2.png': ('兔子2', 42),
    'cat.png': ('猫', 42),
    'dog.png': ('狗', 42),
    'dog2.png': ('狗2', 42),
    'snake.png': ('蛇', 42),
    'goose.png': ('鹅', 42),
    'squirrel.png': ('松鼠', 42),
    
    # 大型 (基础高 55)
    'pig.png': ('猪', 55),
    'pig2.png': ('猪2', 55),
    'sheep.png': ('羊', 55),
    # 'bear.png': ('熊', 55),  # 用户确认：bear贴图实际是老鼠，移到小型
    
    # 小型 (基础高 32) - bear实际是老鼠贴图
    'bear.png': ('老鼠(熊贴图)', 32),
    
    # 特殊：玩家奶牛保持原大小（不处理）
    # 'cow1.png': ('奶牛', 60),
}

# Tier 倍率（从 ENEMY_TYPES 获取）
TIER_MULTIPLIERS = {
    1: 1.0,   # T1
    2: 1.3,   # T2
    3: 1.6,   # T3
    4: 2.0,   # T4/Boss
}

def resize_sprite(src_path, dst_path, target_height):
    """缩放贴图到目标高度（保持比例）"""
    with Image.open(src_path) as img:
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        orig_w, orig_h = img.size
        aspect = orig_w / orig_h
        target_width = int(target_height * aspect)
        
        # 使用LANCZOS重采样保持清晰
        resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        resized.save(dst_path)
        
        return orig_w, orig_h, target_width, target_height

def process_all_sprites():
    """处理所有贴图"""
    sprite_dir = Path('assets/sprites')
    backup_dir = Path('backup/sprites_resize_20260307')
    
    # 创建备份
    if not backup_dir.exists():
        backup_dir.mkdir(parents=True)
        print(f"[备份] 创建备份目录: {backup_dir}")
    
    # 复制原始文件到备份
    for png_file in sprite_dir.glob('*.png'):
        shutil.copy(png_file, backup_dir / png_file.name)
    print(f"[备份] 已备份 {len(list(backup_dir.glob('*.png')))} 个文件")
    
    # 处理基础贴图
    print("\n[处理] 基础贴图:")
    for filename, (animal, base_height) in SPRITE_TIERS.items():
        src_path = sprite_dir / filename
        if not src_path.exists():
            print(f"  [跳过] {filename} 不存在")
            continue
        
        # 处理不同 tier 版本
        for tier, multiplier in TIER_MULTIPLIERS.items():
            target_h = int(base_height * multiplier)
            
            # 基础贴图用 T1 尺寸
            if tier == 1:
                orig_w, orig_h, new_w, new_h = resize_sprite(src_path, src_path, target_h)
                print(f"  {filename}: {orig_w}x{orig_h} -> {new_w}x{new_h} ({animal} T1)")
            
            # 处理描边版本 (outlined_by_color/*)
            for color in ['white', 'red', 'blue', 'green', 'gold', 'purple']:
                color_dir = sprite_dir / 'outlined_by_color' / color
                if color_dir.exists():
                    outlined_path = color_dir / filename
                    if outlined_path.exists():
                        resize_sprite(outlined_path, outlined_path, target_h)
    
    print("\n[完成] 所有贴图处理完成!")
    print(f"[提示] 原始文件备份在: {backup_dir}")

if __name__ == '__main__':
    process_all_sprites()
