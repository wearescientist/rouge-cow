# -*- coding: utf-8 -*-
"""
切分精灵图工具
把1024x1024的大图切成32x32的小图
"""
from PIL import Image
import os
import shutil

def slice_sprite_sheet(input_path, output_dir, name_prefix, grid_size=(4, 4), sprite_size=(32, 32)):
    """
    切分精灵图
    grid_size: (列数, 行数)
    sprite_size: 每个精灵的像素尺寸
    """
    img = Image.open(input_path)
    img = img.convert('RGBA')
    
    cols, rows = grid_size
    sprite_w, sprite_h = sprite_size
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 敌人名称映射
    enemy_names = [
        # 第一张图 (4x4)
        ['dog', 'rabbit', 'chick', 'duck',
         'sheep', 'cat', 'squirrel', 'bird',
         'mouse', 'bear', 'duck2', 'pig',
         'snake', 'turtle', 'pigeon', 'crab'],
        # 第二张图 (3x2)
        ['rabbit2', 'pig2', 'dog2', 'duck3', 'snail', 'goose']
    ]
    
    count = 0
    for row in range(rows):
        for col in range(cols):
            # 计算切割位置
            left = col * sprite_w
            upper = row * sprite_h
            right = left + sprite_w
            lower = upper + sprite_h
            
            # 切割精灵
            sprite = img.crop((left, upper, right, lower))
            
            # 检查是否为空（全透明）
            bbox = sprite.getbbox()
            if bbox is None:
                continue
            
            # 确定文件名
            idx = row * cols + col
            if name_prefix.startswith('enemies1') and idx < 16:
                name = enemy_names[0][idx]
            elif name_prefix.startswith('enemies2') and idx < 6:
                name = enemy_names[1][idx]
            else:
                name = f"{name_prefix}_{idx}"
            
            output_path = os.path.join(output_dir, f"{name}.png")
            sprite.save(output_path)
            print(f"Saved: {output_path}")
            count += 1
    
    return count

if __name__ == "__main__":
    base_dir = r"E:\AI\game\rougelike-cow\assets\bodies"
    output_dir = r"E:\AI\game\rougelike-cow\assets\sprites"
    
    total = 0
    
    # 切分第一张图 (4x4 = 16个敌人)
    img1 = os.path.join(base_dir, "ChatGPT Image 2026年2月18日 08_32_44.png")
    if os.path.exists(img1):
        count1 = slice_sprite_sheet(img1, output_dir, "enemies1", grid_size=(4, 4))
        print(f"\n第一张图切分出 {count1} 个精灵\n")
        total += count1
    else:
        print(f"未找到: {img1}")
    
    # 切分第二张图 (3x2 = 6个敌人)
    img2 = os.path.join(base_dir, "ChatGPT Image 2026年2月18日 08_35_41.png")
    if os.path.exists(img2):
        count2 = slice_sprite_sheet(img2, output_dir, "enemies2", grid_size=(3, 2))
        print(f"\n第二张图切分出 {count2} 个精灵\n")
        total += count2
    else:
        print(f"未找到: {img2}")
    
    # 复制用户设计的模型
    cow_src = os.path.join(base_dir, "cow.png")
    pig_src = os.path.join(base_dir, "enemy_pig.png")
    
    if os.path.exists(cow_src):
        shutil.copy(cow_src, os.path.join(output_dir, "player_cow.png"))
        print("已复制: player_cow.png")
        total += 1
    
    if os.path.exists(pig_src):
        shutil.copy(pig_src, os.path.join(output_dir, "enemy_pig_original.png"))
        print("已复制: enemy_pig_original.png")
        total += 1
    
    print(f"\n✅ 总计: {total} 个精灵")
