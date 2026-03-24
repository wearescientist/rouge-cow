#!/usr/bin/env python3
"""
音频处理脚本
1. 截取火球音效前1.5秒
2. 统一所有音效音量（响度归一化）
"""

import os
import sys
from pathlib import Path

try:
    from pydub import AudioSegment
    from pydub.effects import normalize
except ImportError:
    print("❌ 需要安装 pydub: pip install pydub")
    print("   同时需要安装 ffmpeg 并添加到系统PATH")
    sys.exit(1)

# 配置
AUDIO_DIR = Path("E:/AI/game/rougelike-cow/assets/audio")
TARGET_DB = -14  # 目标响度 (LUFS近似值，适合游戏音效)
FIREBALL_FILE = "weapons/fireball_v1.mp3"
FIREBALL_DURATION = 1500  # 1.5秒 = 1500毫秒

def process_fireball():
    """截取火球音效前1.5秒"""
    input_path = AUDIO_DIR / FIREBALL_FILE
    output_path = AUDIO_DIR / "weapons/fireball_v1_trimmed.mp3"
    
    if not input_path.exists():
        print(f"❌ 火球音效不存在: {input_path}")
        return False
    
    print(f"\n🔥 处理火球音效...")
    print(f"   原文件: {input_path.name}")
    
    try:
        # 加载音频
        audio = AudioSegment.from_mp3(input_path)
        original_duration = len(audio)
        
        print(f"   原时长: {original_duration/1000:.2f}秒")
        
        # 截取前1.5秒
        if original_duration > FIREBALL_DURATION:
            trimmed = audio[:FIREBALL_DURATION]
            # 添加短促的淡出避免爆音
            trimmed = trimmed.fade_out(100)  # 100ms淡出
            
            # 导出
            trimmed.export(output_path, format="mp3", bitrate="192k")
            
            print(f"   ✂️  截取前1.5秒")
            print(f"   💾 保存为: {output_path.name}")
            
            # 替换原文件
            backup_path = input_path.with_suffix('.mp3.backup')
            input_path.rename(backup_path)
            output_path.rename(input_path)
            
            print(f"   ✅ 已替换原文件 (备份: {backup_path.name})")
            return True
        else:
            print(f"   ⚠️  原时长已小于1.5秒，无需处理")
            return False
            
    except Exception as e:
        print(f"   ❌ 处理失败: {e}")
        return False

def get_audio_files():
    """获取所有音频文件"""
    audio_files = []
    
    for ext in ['*.mp3', '*.ogg', '*.wav']:
        audio_files.extend(AUDIO_DIR.rglob(ext))
    
    # 排除备份文件
    audio_files = [f for f in audio_files if '.backup' not in f.name]
    
    return sorted(audio_files)

def analyze_volume(audio_path):
    """分析音频音量"""
    try:
        ext = audio_path.suffix.lower()
        if ext == '.mp3':
            audio = AudioSegment.from_mp3(audio_path)
        elif ext == '.ogg':
            audio = AudioSegment.from_ogg(audio_path)
        elif ext == '.wav':
            audio = AudioSegment.from_wav(audio_path)
        else:
            return None
        
        # 计算dBFS (相对于满刻度的分贝)
        dbfs = audio.dBFS
        # 计算峰值
        peak = audio.max_dBFS
        
        return {
            'path': audio_path,
            'dbfs': dbfs,
            'peak': peak,
            'duration': len(audio) / 1000
        }
    except Exception as e:
        print(f"   分析失败 {audio_path.name}: {e}")
        return None

def normalize_audio(audio_path, target_db=TARGET_DB):
    """标准化音频音量"""
    try:
        ext = audio_path.suffix.lower()
        
        # 加载
        if ext == '.mp3':
            audio = AudioSegment.from_mp3(audio_path)
        elif ext == '.ogg':
            audio = AudioSegment.from_ogg(audio_path)
        elif ext == '.wav':
            audio = AudioSegment.from_wav(audio_path)
        else:
            return False
        
        # 分析原音量
        original_db = audio.dBFS
        original_peak = audio.max_dBFS
        
        # 计算需要调整的分贝数
        # 限制峰值不超过 -1dB 避免削波
        gain = target_db - original_db
        max_gain = -1 - original_peak
        
        if gain > max_gain:
            gain = max_gain
        
        # 应用增益
        normalized = audio.apply_gain(gain)
        
        # 备份原文件
        backup_path = audio_path.with_suffix(audio_path.suffix + '.backup')
        if not backup_path.exists():
            audio_path.rename(backup_path)
        
        # 导出
        if ext == '.mp3':
            normalized.export(audio_path, format="mp3", bitrate="192k")
        elif ext == '.ogg':
            normalized.export(audio_path, format="ogg", codec="libvorbis")
        elif ext == '.wav':
            normalized.export(audio_path, format="wav")
        
        new_db = normalized.dBFS
        
        return {
            'name': audio_path.name,
            'original_db': original_db,
            'new_db': new_db,
            'gain': gain,
            'backup': backup_path.name
        }
        
    except Exception as e:
        print(f"   处理失败 {audio_path.name}: {e}")
        return None

def main():
    print("=" * 60)
    print("🎵 游戏音效处理工具")
    print("=" * 60)
    
    # 1. 处理火球音效
    print("\n📌 任务1: 截取火球音效")
    process_fireball()
    
    # 2. 音量标准化
    print("\n📌 任务2: 音量标准化")
    print(f"   目标响度: {TARGET_DB} dBFS")
    print("   扫描音频文件...")
    
    audio_files = get_audio_files()
    print(f"   找到 {len(audio_files)} 个音频文件")
    
    if len(audio_files) == 0:
        print("❌ 没有找到音频文件")
        return
    
    # 分析所有文件
    print("\n🔍 分析音量...")
    analyzed = []
    for i, file in enumerate(audio_files, 1):
        result = analyze_volume(file)
        if result:
            analyzed.append(result)
        print(f"   进度: {i}/{len(audio_files)}", end='\r')
    
    print(f"\n   分析完成: {len(analyzed)} 个文件")
    
    if not analyzed:
        print("❌ 没有可处理的文件")
        return
    
    # 显示统计
    db_values = [a['dbfs'] for a in analyzed]
    peak_values = [a['peak'] for a in analyzed]
    
    print(f"\n📊 音量统计:")
    print(f"   最轻: {min(db_values):.1f} dBFS")
    print(f"   最重: {max(db_values):.1f} dBFS")
    print(f"   平均: {sum(db_values)/len(db_values):.1f} dBFS")
    print(f"   峰值最高: {max(peak_values):.1f} dB")
    
    # 标准化处理
    print(f"\n🎚️  开始标准化到 {TARGET_DB} dBFS...")
    processed = []
    failed = []
    
    for i, audio_info in enumerate(analyzed, 1):
        result = normalize_audio(audio_info['path'], TARGET_DB)
        if result:
            processed.append(result)
        else:
            failed.append(audio_info['path'].name)
        print(f"   进度: {i}/{len(analyzed)}", end='\r')
    
    print(f"\n\n✅ 处理完成!")
    print(f"   成功: {len(processed)} 个")
    print(f"   失败: {len(failed)} 个")
    
    if processed:
        print(f"\n📈 调整详情 (前10个):")
        for p in processed[:10]:
            print(f"   {p['name'][:30]:<30} {p['original_db']:+.1f}dB → {p['new_db']:+.1f}dB ({p['gain']:+.1f}dB)")
        
        if len(processed) > 10:
            print(f"   ... 还有 {len(processed)-10} 个")
    
    if failed:
        print(f"\n❌ 失败的文件:")
        for f in failed:
            print(f"   - {f}")
    
    print("\n" + "=" * 60)
    print("💡 提示:")
    print("   - 原文件已备份为 .backup")
    print("   - 如需恢复，删除处理后文件，重命名.backup文件")
    print("   - 游戏内可通过音量滑块进一步调节")
    print("=" * 60)

if __name__ == "__main__":
    main()
