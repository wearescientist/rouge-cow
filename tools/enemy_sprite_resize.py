#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
怪物贴图智能压缩脚本
根据原始像素数动态调整压缩比例
"""

import os
from pathlib import Path
from PIL import Image

# 压缩策略配置
COMPRESSION_STRATEGY = {
    # 像素数阈值 -> (缩放比例, 采样模式, 锐化强度)
    # 采样模式: LANCZOS(高质量), BILINEAR(中等), NEAREST(低质量/像素风)
    
    'huge': {    # > 150k 像素 (如 chick/spr)
        'threshold': 150000,
        'scale': 0.50,           # 50% 压缩
        'resample': Image.LANCZOS,
        'label': '50%'
    },
    'large': {   # 90k-150k 像素
        'threshold': 90000,
        'scale': 0.60,           # 60% 压缩
        'resample': Image.LANCZOS,
        'label': '60%'
    },
    'medium': {  # 70k-90k 像素
        'threshold': 70000,
        'scale': 0.70,           # 70% 压缩
        'resample': Image.LANCZOS,
        'label': '70%'
    },
    'normal': {  # 60k-70k 像素
        'threshold': 60000,
        'scale': 0.75,           # 75% 压缩
        'resample': Image.LANCZOS,
        'label': '75%'
    },
    'small': {   # 50k-60k 像素
        'threshold': 0,
        'scale': 0.85,           # 85% 压缩
        'resample': Image.LANCZOS,
        'label': '85%'
    }
}

def get_compression_config(pixel_count):
    """根据像素数获取压缩配置"""
    for name, config in COMPRESSION_STRATEGY.items():
        if pixel_count >= config['threshold']:
            return config
    return COMPRESSION_STRATEGY['small']

def resize_sprite(input_path, output_path, config):
    """调整单张贴图尺寸"""
    img = Image.open(input_path)
    orig_w, orig_h = img.size
    
    # 计算新尺寸
    new_w = int(orig_w * config['scale'])
    new_h = int(orig_h * config['scale'])
    
    # 确保最小尺寸不小于 128 (避免过度压缩导致模糊)
    new_w = max(new_w, 128)
    new_h = max(new_h, 128)
    
    # 缩放
    resized = img.resize((new_w, new_h), config['resample'])
    
    # 保存
    resized.save(output_path, 'PNG')
    
    return (orig_w, orig_h), (new_w, new_h)

def process_monster_resize(floor_num, base_dir, output_dir):
    """处理整层怪物的尺寸调整"""
    floor_path = Path(base_dir) / f"floor{floor_num}"
    output_floor = Path(output_dir) / f"floor{floor_num}"
    
    results = []
    
    for monster_dir in sorted(floor_path.iterdir()):
        if not monster_dir.is_dir():
            continue
        
        base_id = monster_dir.name
        
        for version_dir in sorted(monster_dir.iterdir()):
            if not version_dir.is_dir():
                continue
            
            version = version_dir.name
            walk_dir = version_dir / "walk"
            
            if not walk_dir.exists():
                continue
            
            # 获取第一帧的尺寸信息
            frame_files = sorted(walk_dir.glob("*.png"))
            if not frame_files:
                continue
            
            # 检查原始尺寸
            sample_img = Image.open(frame_files[0])
            orig_w, orig_h = sample_img.size
            pixel_count = orig_w * orig_h
            
            # 获取压缩配置
            config = get_compression_config(pixel_count)
            
            # 创建输出目录
            out_walk = output_floor / base_id / version / "walk"
            out_walk.mkdir(parents=True, exist_ok=True)
            
            # 处理所有帧
            for frame_file in frame_files:
                output_path = out_walk / frame_file.name
                try:
                    orig_size, new_size = resize_sprite(frame_file, output_path, config)
                except Exception as e:
                    print(f"  错误 {frame_file.name}: {e}")
            
            results.append({
                'name': f"{base_id}/{version}",
                'orig_size': (orig_w, orig_h),
                'pixel_count': pixel_count,
                'new_size': new_size,
                'scale': config['scale'],
                'label': config['label']
            })
            
            print(f"OK {base_id}/{version}: {orig_w}x{orig_h} ({pixel_count:,}px) -> {config['label']}")
    
    return results

def generate_preview_html(floor_num, results, output_dir):
    """生成预览对比HTML"""
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>怪物贴图尺寸压缩对比 - Floor {floor_num}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }}
        h1 {{ text-align: center; color: #ffd700; margin-bottom: 10px; }}
        .subtitle {{ text-align: center; color: #888; margin-bottom: 30px; font-size: 14px; }}
        .legend {{ 
            display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; 
            flex-wrap: wrap; font-size: 13px;
        }}
        .legend-item {{ display: flex; align-items: center; gap: 5px; }}
        .legend-dot {{ width: 12px; height: 12px; border-radius: 2px; }}
        .dot-huge {{ background: #ff4444; }}   <!-- 50% -->
        .dot-large {{ background: #ff8844; }}  <!-- 60% -->
        .dot-medium {{ background: #ffcc44; }} <!-- 70% -->
        .dot-normal {{ background: #88cc44; }} <!-- 75% -->
        .dot-small {{ background: #4488cc; }}  <!-- 85% -->
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            max-width: 1600px;
            margin: 0 auto;
        }}
        
        .card {{
            background: #2a2a3e;
            border-radius: 12px;
            padding: 15px;
            border: 2px solid #444;
        }}
        
        .card.huge {{ border-color: #ff4444; }}   <!-- >150k -->
        .card.large {{ border-color: #ff8844; }}  <!-- 90-150k -->
        .card.medium {{ border-color: #ffcc44; }} <!-- 70-90k -->
        .card.normal {{ border-color: #88cc44; }} <!-- 60-70k -->
        .card.small {{ border-color: #4488cc; }}  <!-- 50-60k -->
        
        .card-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        
        .monster-name {{ font-weight: bold; font-size: 14px; }}
        .compress-tag {{
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }}
        .tag-huge {{ background: #ff4444; color: #fff; }}
        .tag-large {{ background: #ff8844; color: #fff; }}
        .tag-medium {{ background: #ffcc44; color: #000; }}
        .tag-normal {{ background: #88cc44; color: #fff; }}
        .tag-small {{ background: #4488cc; color: #fff; }}
        
        .size-info {{
            font-size: 11px;
            color: #888;
            margin-bottom: 10px;
        }}
        
        .preview {{
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }}
        
        .preview-box {{
            flex: 1;
            text-align: center;
        }}
        
        .preview-box img {{
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            background: #0a0a1e;
        }}
        
        .preview-label {{
            font-size: 11px;
            color: #888;
            margin-top: 5px;
        }}
        
        .preview-label.original {{ color: #ff6b6b; }}
        .preview-label.resized {{ color: #4ecdc4; }}
    </style>
</head>
<body>
    <h1>📐 怪物贴图智能压缩对比</h1>
    <p class="subtitle">根据原始像素数动态调整 | Floor {floor_num}</p>
    
    <div class="legend">
        <div class="legend-item"><div class="legend-dot dot-huge"></div>>150k 像素 → 50%压缩</div>
        <div class="legend-item"><div class="legend-dot dot-large"></div>90-150k → 60%</div>
        <div class="legend-item"><div class="legend-dot dot-medium"></div>70-90k → 70%</div>
        <div class="legend-item"><div class="legend-dot dot-normal"></div>60-70k → 75%</div>
        <div class="legend-item"><div class="legend-dot dot-small"></div>50-60k → 85%</div>
    </div>
    
    <div class="grid">
'''
    
    # 按像素数排序
    results.sort(key=lambda x: x['pixel_count'], reverse=True)
    
    for r in results:
        # 确定卡片样式
        pixels = r['pixel_count']
        if pixels >= 150000:
            card_class, tag_class = 'huge', 'tag-huge'
        elif pixels >= 90000:
            card_class, tag_class = 'large', 'tag-large'
        elif pixels >= 70000:
            card_class, tag_class = 'medium', 'tag-medium'
        elif pixels >= 60000:
            card_class, tag_class = 'normal', 'tag-normal'
        else:
            card_class, tag_class = 'small', 'tag-small'
        
        orig_w, orig_h = r['orig_size']
        new_w, new_h = r['new_size']
        
        html_content += f'''
        <div class="card {card_class}">
            <div class="card-header">
                <span class="monster-name">{r['name']}</span>
                <span class="compress-tag {tag_class}">{r['label']}</span>
            </div>
            <div class="size-info">
                {orig_w}×{orig_h} ({r['pixel_count']:,}px) → {new_w}×{new_h} ({int(r['pixel_count'] * r['scale'] * r['scale']):,}px)
            </div>
            <div class="preview">
                <div class="preview-box">
                    <img src="../generated_assets/monster_walk_curated_by_floor_reworked_v2/floor{floor_num}/{r['name']}/walk/f01.png" 
                         alt="Original" loading="lazy">
                    <div class="preview-label original">原始 {orig_w}×{orig_h}</div>
                </div>
                <div class="preview-box">
                    <img src="../{output_dir}/floor{floor_num}/{r['name']}/walk/f01.png" 
                         alt="Resized" loading="lazy">
                    <div class="preview-label resized">压缩后 {new_w}×{new_h}</div>
                </div>
            </div>
        </div>
'''
    
    html_content += '''
    </div>
</body>
</html>
'''
    
    html_path = Path(__file__).parent / f"resize_preview_floor{floor_num}.html"
    html_path.write_text(html_content, encoding='utf-8')
    return html_path

if __name__ == "__main__":
    # 第一层处理
    BASE_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2"
    OUTPUT_DIR = "generated_assets/monster_walk_curated_by_floor_reworked_v2_resized"
    
    print("="*70)
    print("Monster Sprite Smart Resize")
    print("="*70)
    print("Rule: Higher pixels -> More compression")
    print("-"*70)
    print(">150k pixels -> 50% (Heavy)")
    print(" 90-150k    -> 60% (Medium)")
    print(" 70-90k     -> 70% (Standard)")
    print(" 60-70k     -> 75% (Light)")
    print(" 50-60k     -> 85% (Slight)")
    print("-"*70)
    print()
    
    results = process_monster_resize(1, BASE_DIR, OUTPUT_DIR)
    
    # 生成预览HTML
    html_path = generate_preview_html(1, results, OUTPUT_DIR)
    
    print()
    print("="*70)
    print("Done!")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Preview: {html_path}")
    print("="*70)
