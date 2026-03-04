#!/usr/bin/env python3
"""
批量处理贴图尺寸和背景
- 主角: 256x512 -> 32x32
- 武器: 1024x1024 -> 32x32
- 道具: 标准化为 32x32
- 去除白底背景，转为透明
"""

from PIL import Image
import os
import glob

def resize_and_remove_white_bg(input_path, output_path, target_size=(32, 32)):
    """缩放图片并去除白色背景"""
    img = Image.open(input_path)
    
    # 转为RGBA模式
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 缩放
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
    
    # 去除白色背景（将接近白色的像素设为透明）
    datas = img_resized.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        # 如果像素接近白色（RGB都>240），设为透明
        if r > 240 and g > 240 and b > 240:
            newData.append((255, 255, 255, 0))  # 透明
        else:
            newData.append(item)
    
    img_resized.putdata(newData)
    img_resized.save(output_path, 'PNG')
    print(f'Processed: {os.path.basename(output_path)} -> {target_size}')

def process_player_sprites():
    """处理主角8帧"""
    print('\n=== Processing Player Sprites ===')
    player_dir = 'assets/sprites/player'
    output_dir = 'assets/sprites/player_resized'
    os.makedirs(output_dir, exist_ok=True)
    
    frames = [
        'player_bison_frame01_stand.png',
        'player_bison_frame02_walk_left.png',
        'player_bison_frame03_stand_sway.png',
        'player_bison_frame04_walk_right.png',
        'player_bison_frame05_dash.png',
        'player_bison_frame06_hit.png',
        'player_bison_frame07_attack.png',
        'player_bison_frame08_victory.png'
    ]
    
    for i, frame in enumerate(frames):
        input_path = os.path.join(player_dir, frame)
        output_path = os.path.join(output_dir, f'player_{i}.png')
        if os.path.exists(input_path):
            resize_and_remove_white_bg(input_path, output_path, (32, 32))
        else:
            print(f'Missing: {frame}')

def process_weapon_sprites():
    """处理武器"""
    print('\n=== Processing Weapon Sprites ===')
    weapon_dir = 'assets/sprites/weapons'
    output_dir = 'assets/sprites/weapons_resized'
    os.makedirs(output_dir, exist_ok=True)
    
    weapons = [
        'weapon_whip', 'weapon_wand', 'weapon_knife', 'weapon_axe',
        'weapon_bible', 'weapon_fireball', 'weapon_lightning', 'weapon_holywater'
    ]
    
    for name in weapons:
        input_path = os.path.join(weapon_dir, f'{name}.png')
        output_path = os.path.join(output_dir, f'{name}.png')
        if os.path.exists(input_path):
            resize_and_remove_white_bg(input_path, output_path, (32, 32))

def process_item_sprites():
    """处理道具"""
    print('\n=== Processing Item Sprites ===')
    item_dir = 'assets/sprites/items'
    output_dir = 'assets/sprites/items_resized'
    os.makedirs(output_dir, exist_ok=True)
    
    for i in range(1, 17):
        id_str = str(i).zfill(2)
        input_path = os.path.join(item_dir, f'item_{id_str}_*.png')
        # 找到匹配的文件
        files = glob.glob(input_path)
        if files:
            output_path = os.path.join(output_dir, f'item_{id_str}.png')
            resize_and_remove_white_bg(files[0], output_path, (32, 32))

if __name__ == '__main__':
    print('Starting sprite batch processing...')
    process_player_sprites()
    process_weapon_sprites()
    process_item_sprites()
    print('\n=== Done! Check _resized folders ===')
