#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
检查游戏中所有音效调用和配置
"""

import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.parent
INDEX_FILE = SCRIPT_DIR / "index.html"
AUDIO_DIR = SCRIPT_DIR / "assets/audio"

def extract_audio_calls():
    """提取所有音效调用"""
    content = INDEX_FILE.read_text(encoding='utf-8')
    
    # 匹配 audioCtrl.playXXX 或 audioCtrl.play('xxx')
    pattern1 = r'audioCtrl\.(play\w+)\([^)]*\)'
    pattern2 = r"audioCtrl\.play\(['\"](\w+)['\"]"
    
    calls = []
    
    # 方法调用 playWeapon, playHit 等
    for match in re.finditer(pattern1, content):
        method = match.group(1)
        line_num = content[:match.start()].count('\n') + 1
        calls.append((line_num, method, match.group(0)))
    
    # 通用调用 play('xxx')
    for match in re.finditer(pattern2, content):
        sfx_type = match.group(1)
        line_num = content[:match.start()].count('\n') + 1
        calls.append((line_num, f"play('{sfx_type}')", match.group(0)))
    
    return sorted(set(calls), key=lambda x: x[0])

def check_audio_files():
    """检查所有音频文件"""
    files = []
    for ext in ['*.mp3', '*.ogg', '*.wav']:
        files.extend(AUDIO_DIR.rglob(ext))
    
    # 排除备份文件
    files = [f for f in files if not f.suffix.endswith('.bak')]
    
    return sorted(files)

def main():
    print("=" * 60)
    print("[AUDIO] 音效系统检查报告")
    print("=" * 60)
    
    # 1. 检查所有音效调用
    print("\n[游戏中所有音效调用]")
    calls = extract_audio_calls()
    
    # 统计不同类型的调用
    call_types = {}
    for line, method, code in calls:
        call_types[method] = call_types.get(method, 0) + 1
    
    for method, count in sorted(call_types.items()):
        print(f"  {method}: {count}次")
    
    # 2. 检查音频文件
    print("\n[音频文件列表]")
    files = check_audio_files()
    
    categories = {}
    for f in files:
        rel_path = f.relative_to(AUDIO_DIR)
        parts = rel_path.parts
        if len(parts) > 1:
            cat = parts[0]
        else:
            cat = "(根目录)"
        
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(rel_path.name)
    
    for cat, files in sorted(categories.items()):
        print(f"\n  {cat}: {len(files)}个文件")
        for f in sorted(files)[:5]:
            print(f"    - {f}")
        if len(files) > 5:
            print(f"    ... 还有 {len(files)-5} 个")
    
    # 3. 检查AudioController配置
    print("\n[AudioController 配置检查]")
    controller_file = SCRIPT_DIR / "src/systems/AudioController.js"
    if controller_file.exists():
        content = controller_file.read_text(encoding='utf-8')
        
        # 检查武器配置
        if 'whip:' in content:
            print("  [OK] 武器音效已配置")
        
        # 检查命中配置
        if 'bird:' in content:
            print("  [OK] 命中音效已配置")
        
        # 检查UI配置
        if 'click:' in content:
            print("  [OK] UI音效已配置")
    
    print("\n" + "=" * 60)
    print("检查完成！")

if __name__ == "__main__":
    main()
