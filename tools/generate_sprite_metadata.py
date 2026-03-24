#!/usr/bin/env python3
"""
Sprite Metadata Generator - 贴图元数据生成工具
扫描贴图非透明像素，生成精确的碰撞箱和锚点配置

Usage: python tools/generate_sprite_metadata.py
"""

from PIL import Image
import json
import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

class SpriteMetadataGenerator:
    """贴图元数据生成器"""
    
    def __init__(self, threshold: int = 10):
        self.threshold = threshold  # 透明度阈值
        
    def calculate_bounds(self, img: Image.Image) -> Dict[str, Any]:
        """
        计算图片的非透明像素边界
        
        Returns:
            {
                canvasWidth, canvasHeight,
                modelOffsetX, modelOffsetY,
                modelWidth, modelHeight,
                centerX, centerY,
                feetX, feetY
            }
        """
        width, height = img.size
        
        # 转换为RGBA模式
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        pixels = img.load()
        
        min_x, min_y = width, height
        max_x, max_y = 0, 0
        has_visible = False
        
        # 扫描所有像素
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a > self.threshold:
                    has_visible = True
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)
        
        if not has_visible:
            # 完全透明
            return {
                'canvasWidth': width,
                'canvasHeight': height,
                'modelOffsetX': width // 2,
                'modelOffsetY': height // 2,
                'modelWidth': 1,
                'modelHeight': 1,
                'centerX': width // 2,
                'centerY': height // 2,
                'feetX': width // 2,
                'feetY': height
            }
        
        # 模型尺寸
        model_width = max_x - min_x + 1
        model_height = max_y - min_y + 1
        
        # 锚点计算
        center_x = min_x + model_width // 2
        center_y = min_y + model_height // 2
        feet_x = min_x + model_width // 2
        feet_y = max_y + 1
        
        return {
            'canvasWidth': width,
            'canvasHeight': height,
            'modelOffsetX': min_x,
            'modelOffsetY': min_y,
            'modelWidth': model_width,
            'modelHeight': model_height,
            'centerX': center_x,
            'centerY': center_y,
            'feetX': feet_x,
            'feetY': feet_y
        }
    
    def process_image(self, path: str) -> Optional[Dict[str, Any]]:
        """处理单个图片，返回SpriteData配置"""
        try:
            with Image.open(path) as img:
                bounds = self.calculate_bounds(img)
                
                # 计算碰撞箱比例（默认使用模型边界作为碰撞箱）
                # 但留出一点边距让碰撞更真实
                hitbox_ratio_w = 0.95  # 宽度95%作为碰撞箱
                hitbox_ratio_h = 0.95  # 高度95%作为碰撞箱
                
                # 根据图片类型调整碰撞箱
                filename = Path(path).stem.lower()
                
                # 飞行单位碰撞箱略小
                if any(x in filename for x in ['bird', 'pigeon', 'bat', 'bee', 'goose']):
                    hitbox_ratio_w = 0.85
                    hitbox_ratio_h = 0.85
                
                return {
                    'canvasWidth': bounds['canvasWidth'],
                    'canvasHeight': bounds['canvasHeight'],
                    'modelOffsetX': bounds['modelOffsetX'],
                    'modelOffsetY': bounds['modelOffsetY'],
                    'modelWidth': bounds['modelWidth'],
                    'modelHeight': bounds['modelHeight'],
                    'anchor': {
                        'center': {
                            'x': bounds['centerX'],
                            'y': bounds['centerY']
                        },
                        'feet': {
                            'x': bounds['feetX'],
                            'y': bounds['feetY']
                        }
                    },
                    'hitboxRatio': {
                        'w': round(hitbox_ratio_w, 2),
                        'h': round(hitbox_ratio_h, 2)
                    },
                    'shadowOffsetY': 2
                }
        except Exception as e:
            print(f"Error processing {path}: {e}")
            return None
    
    def scan_directory(self, root_dir: str, pattern: str = "*.png") -> Dict[str, Dict]:
        """扫描目录中的所有贴图"""
        results = {}
        root_path = Path(root_dir)
        
        for png_file in root_path.rglob(pattern):
            # 跳过不需要的文件
            if 'outlined_by_color' in str(png_file):
                continue
            if 'backup' in str(png_file):
                continue
                
            relative_path = png_file.relative_to(root_path.parent)
            key = png_file.stem
            
            print(f"Processing: {relative_path}")
            
            data = self.process_image(str(png_file))
            if data:
                data['src'] = str(relative_path).replace('\\', '/')
                results[key] = data
        
        return results
    
    def generate_enemy_metadata(self, enemy_types: Dict) -> Dict[str, Any]:
        """为所有敌人生成元数据"""
        metadata = {}
        
        # 扫描主贴图目录
        sprite_dir = Path("assets/sprites")
        
        # 需要处理的敌人贴图
        enemy_sprites = [
            'chick', 'mouse', 'snail', 'pigeon', 'duck3',
            'rabbit', 'rabbit2', 'bear', 'bird', 'cat', 'crab', 'dog', 'dog2', 
            'duck', 'goose', 'snake', 'turtle', 'pig', 'pig2', 'sheep',
            'squirrel'
        ]
        
        for sprite_name in enemy_sprites:
            sprite_path = sprite_dir / f"{sprite_name}.png"
            if sprite_path.exists():
                print(f"Processing enemy sprite: {sprite_name}")
                data = self.process_image(str(sprite_path))
                if data:
                    # 添加元信息
                    data['meta'] = self._get_enemy_meta(sprite_name, enemy_types)
                    metadata[sprite_name] = data
        
        return metadata
    
    def _get_enemy_meta(self, sprite_name: str, enemy_types: Dict) -> Dict:
        """获取敌人元信息"""
        # 查找对应的敌人类型
        for key, cfg in enemy_types.items():
            if cfg.get('sprite', '').endswith(f"{sprite_name}.png"):
                return {
                    'tier': cfg.get('tier', 1),
                    'size': cfg.get('size', 40),
                    'type': key
                }
        
        # 默认值
        return {'tier': 1, 'size': 40, 'type': 'normal'}
    
    def generate_player_metadata(self) -> Dict[str, Any]:
        """生成玩家贴图元数据（扫描第一帧）"""
        player_path = Path("assets/sprites/player/player_0.png")
        if not player_path.exists():
            print("Warning: player_0.png not found")
            return {}
        
        print("Processing player sprite")
        data = self.process_image(str(player_path))
        if data:
            # 添加动画配置
            data['animation'] = {
                'type': 'horizontal',
                'frames': 8,
                'frameOffsets': [
                    {'x': 0, 'y': 0}, {'x': 0, 'y': 1}, {'x': 0, 'y': 0}, {'x': 0, 'y': -1},
                    {'x': 0, 'y': 0}, {'x': 0, 'y': 1}, {'x': 0, 'y': 0}, {'x': 0, 'y': -1}
                ]
            }
            data['meta'] = {'tier': 0, 'size': 48, 'type': 'player'}
        
        return data
    
    def generate_npc_metadata(self) -> Dict[str, Any]:
        """生成NPC贴图元数据"""
        npc_path = Path("assets/sprites/misc/npc_shopkeeper.png")
        if not npc_path.exists():
            print("Warning: npc_shopkeeper.png not found")
            return {}
        
        print("Processing NPC sprite")
        data = self.process_image(str(npc_path))
        if data:
            data['meta'] = {'tier': 0, 'size': 60, 'type': 'npc'}
        
        return data


def main():
    """主函数"""
    print("=" * 60)
    print("Sprite Metadata Generator v0.32")
    print("=" * 60)
    
    generator = SpriteMetadataGenerator(threshold=10)
    
    # 生成玩家元数据
    player_data = generator.generate_player_metadata()
    
    # 生成NPC元数据
    npc_data = generator.generate_npc_metadata()
    
    # 生成敌人元数据
    # 需要加载 ENEMY_TYPES
    enemy_types = {}
    try:
        # 尝试从 index.js 提取
        import re
        enemies_js = Path("data/enemies/index.js").read_text(encoding='utf-8')
        # 这里简化处理，使用硬映射
    except:
        pass
    
    # 手动扫描所有敌人贴图
    enemy_metadata = generator.scan_directory("assets/sprites", "*.png")
    
    # 合并结果
    output = {
        "_comment": "Auto-generated sprite metadata by SpriteMetadataGenerator",
        "_version": "3.0-pixel-perfect",
        "_generated": "2026-03-07",
        
        "player": player_data,
        "npc_shopkeeper": npc_data
    }
    
    # 添加所有扫描到的贴图
    for key, data in enemy_metadata.items():
        if key not in output and 'src' in data:
            output[key] = data
    
    # 保存为 JSON
    output_path = Path("assets/sprites/metadata_generated.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Generated: {output_path}")
    print(f"Total sprites: {len(output) - 3}")  # 减去注释字段
    print(f"{'='*60}")
    
    # 打印一些统计信息
    print("\nStatistics:")
    for key, data in output.items():
        if key.startswith('_'):
            continue
        model_w = data.get('modelWidth', 0)
        model_h = data.get('modelHeight', 0)
        canvas_w = data.get('canvasWidth', 0)
        canvas_h = data.get('canvasHeight', 0)
        if canvas_w > 0 and canvas_h > 0:
            fill_ratio = (model_w * model_h) / (canvas_w * canvas_h) * 100
            print(f"  {key}: {model_w}x{model_h} (fill: {fill_ratio:.1f}%)")


if __name__ == '__main__':
    main()
