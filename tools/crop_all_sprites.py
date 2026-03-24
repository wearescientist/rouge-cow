#!/usr/bin/env python3
"""
裁剪所有贴图 - 包括主目录和 outlined_by_color 所有颜色变体
"""

from PIL import Image
import shutil
from pathlib import Path

def restore_backup():
    """从备份恢复"""
    backup_dir = Path('assets/sprites_backup')
    sprite_dir = Path('assets/sprites')
    
    if not backup_dir.exists():
        print('[ERROR] 备份不存在！')
        return False
    
    print('[INFO] 从备份恢复...')
    if sprite_dir.exists():
        shutil.rmtree(sprite_dir)
    shutil.copytree(backup_dir, sprite_dir)
    print('[OK] 恢复完成')
    return True

def crop_image(path):
    """裁剪单个图片"""
    try:
        with Image.open(path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            bbox = img.getbbox()
            if not bbox:
                return None
            
            cropped = img.crop(bbox)
            cropped.save(path)
            return True
    except Exception as e:
        print(f'  [ERROR] {path}: {e}')
        return False

def crop_all():
    """裁剪所有贴图"""
    if not restore_backup():
        return
    
    sprite_dir = Path('assets/sprites')
    
    # 1. 主目录贴图
    main_patterns = ['*.png', 'player/*.png', 'misc/*.png', 'items/*.png']
    
    for pattern in main_patterns:
        for png_file in sprite_dir.glob(pattern):
            if 'outlined_by_color' in str(png_file):
                continue
            crop_image(str(png_file))
    
    # 2. outlined_by_color 所有颜色
    colors = ['blue', 'cyan', 'gold', 'green', 'lime', 'magenta', 
              'orange', 'pink', 'purple', 'red', 'white', 'yellow']
    
    for color in colors:
        color_dir = sprite_dir / 'outlined_by_color' / color
        if not color_dir.exists():
            continue
        
        print(f'[CROP] outlined_by_color/{color}...')
        count = 0
        for png_file in color_dir.glob('*.png'):
            if crop_image(str(png_file)):
                count += 1
        print(f'  {count} files')
    
    print('\n[OK] 所有贴图裁剪完成！')

if __name__ == '__main__':
    crop_all()
