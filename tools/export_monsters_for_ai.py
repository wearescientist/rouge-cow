#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导出所有怪物贴图供AI重绘
打包为低清像素风格重绘使用
"""

import os
import shutil
from pathlib import Path
import json

def export_monsters():
    """导出所有怪物贴图到统一目录"""
    
    # 源目录
    base_dir = Path("generated_assets/monster_walk_curated_by_floor_reworked_v2")
    
    # 输出目录
    export_dir = Path("generated_assets/export_for_ai_redraw")
    export_dir.mkdir(exist_ok=True)
    
    # 收集所有怪物信息
    monsters_info = []
    
    for floor_num in range(1, 7):
        floor_dir = base_dir / f"floor{floor_num}"
        if not floor_dir.exists():
            continue
            
        floor_export_dir = export_dir / f"floor{floor_num}"
        floor_export_dir.mkdir(exist_ok=True)
        
        # 遍历该层的所有怪物
        for monster_dir in floor_dir.iterdir():
            if not monster_dir.is_dir():
                continue
                
            monster_id = monster_dir.name
            
            # 遍历版本
            for version_dir in monster_dir.iterdir():
                if not version_dir.is_dir():
                    continue
                    
                version = version_dir.name
                walk_dir = version_dir / "walk"
                
                if not walk_dir.exists():
                    continue
                
                # 创建导出子目录
                export_monster_dir = floor_export_dir / f"{monster_id}_{version}"
                export_monster_dir.mkdir(exist_ok=True)
                
                # 复制所有帧
                frames = []
                for i in range(1, 5):
                    frame_file = walk_dir / f"f0{i}.png"
                    if frame_file.exists():
                        dest_file = export_monster_dir / f"f0{i}.png"
                        shutil.copy2(frame_file, dest_file)
                        frames.append(f"f0{i}.png")
                
                if frames:
                    monsters_info.append({
                        "floor": floor_num,
                        "monster_id": monster_id,
                        "version": version,
                        "frames": frames,
                        "export_path": str(export_monster_dir.relative_to(export_dir))
                    })
                    print(f"[OK] Floor{floor_num}: {monster_id}_{version} ({len(frames)} frames)")
    
    # 生成汇总JSON
    summary_file = export_dir / "monsters_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(monsters_info, f, ensure_ascii=False, indent=2)
    
    print(f"\n[COMPLETE] Export finished!")
    print(f"[DIR] Export directory: {export_dir}")
    print(f"[STATS] Total {len(monsters_info)} monster variants")
    print(f"[FILE] Summary file: {summary_file}")
    
    return export_dir

if __name__ == "__main__":
    export_monsters()
