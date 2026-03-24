#!/usr/bin/env python3
"""
音频格式转换脚本
将 WAV 转换为 OGG 格式（浏览器兼容性更好）
"""

import os
import sys
from pathlib import Path

# 检查是否安装了 pydub
try:
    from pydub import AudioSegment
except ImportError:
    print("❌ 需要安装 pydub: pip install pydub")
    print("   同时需要安装 ffmpeg 并添加到系统PATH")
    sys.exit(1)

# 转换配置
AUDIO_DIR = Path("E:/AI/game/rougelike-cow/assets/audio")
CONVERSIONS = [
    {
        "input": "weapons/whip_crack_Sharp_lea_#1-1772612244854.wav",
        "output": "weapons/whip.ogg",
        "description": "鞭子音效"
    },
    {
        "input": "weapons/Heavy_scythe_slash_s_#4-1772612465296.wav",
        "output": "weapons/scythe.ogg",
        "description": "镰刀音效"
    }
]

def convert_wav_to_ogg(input_path, output_path):
    """转换WAV到OGG"""
    try:
        # 加载WAV文件
        audio = AudioSegment.from_wav(input_path)
        
        # 导出为OGG (使用libvorbis编码)
        audio.export(output_path, format="ogg", codec="libvorbis", bitrate="128k")
        
        return True
    except Exception as e:
        print(f"   错误: {e}")
        return False

def main():
    print("🎵 音频格式转换工具")
    print("=" * 50)
    
    for conv in CONVERSIONS:
        input_file = AUDIO_DIR / conv["input"]
        output_file = AUDIO_DIR / conv["output"]
        
        print(f"\n📁 {conv['description']}")
        print(f"   输入: {input_file.name}")
        print(f"   输出: {output_file.name}")
        
        if not input_file.exists():
            print(f"   ❌ 输入文件不存在!")
            continue
        
        if output_file.exists():
            print(f"   ⚠️ 输出文件已存在，跳过")
            continue
        
        print(f"   🔄 转换中...")
        if convert_wav_to_ogg(str(input_file), str(output_file)):
            # 获取文件大小
            input_size = input_file.stat().st_size / 1024
            output_size = output_file.stat().st_size / 1024
            print(f"   ✅ 完成! ({input_size:.1f}KB → {output_size:.1f}KB)")
        else:
            print(f"   ❌ 转换失败!")
    
    print("\n" + "=" * 50)
    print("转换完成!")
    print("\n如果没有安装依赖，请运行:")
    print("  pip install pydub")
    print("并下载 ffmpeg: https://ffmpeg.org/download.html")

if __name__ == "__main__":
    main()
