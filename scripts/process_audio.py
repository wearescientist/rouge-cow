#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
音频处理脚本
- 火球音效截取到1.5秒
- 统一所有音效音量到-14dB
使用soundfile + ffmpeg命令行，无需ffprobe
"""

import os
import sys
import io
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path
from imageio_ffmpeg import get_ffmpeg_exe

# 设置UTF-8输出
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置ffmpeg路径
ffmpeg_path = get_ffmpeg_exe()
SCRIPT_DIR = Path(__file__).parent.parent
ASSETS_DIR = SCRIPT_DIR / "assets/audio"
FIREBALL_FILE = ASSETS_DIR / "weapons" / "fireball_v1.mp3"
TARGET_DB = -14.0
FIREBALL_DURATION = 1.5  # 秒

def get_dbfs(samples):
    """计算音频的dBFS值"""
    if len(samples) == 0:
        return -96.0
    rms = np.sqrt(np.mean(samples ** 2))
    if rms == 0:
        return -96.0
    return 20 * np.log10(rms)

def apply_gain(samples, gain_db):
    """应用增益到音频样本"""
    gain_linear = 10 ** (gain_db / 20)
    return np.clip(samples * gain_linear, -1.0, 1.0)

def load_audio_ffmpeg(file_path):
    """使用ffmpeg加载音频文件为numpy数组"""
    cmd = [
        ffmpeg_path,
        '-i', str(file_path),
        '-f', 'f32le',
        '-acodec', 'pcm_f32le',
        '-ar', '44100',
        '-ac', '2',
        '-loglevel', 'error',
        '-'
    ]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg错误: {result.stderr.decode('utf-8', errors='ignore')}")
    
    audio = np.frombuffer(result.stdout, dtype=np.float32)
    # 转换为立体声 (2通道)
    if len(audio) % 2 != 0:
        audio = audio[:-1]
    audio = audio.reshape(-1, 2)
    return audio, 44100

def save_audio_ffmpeg(file_path, samples, sample_rate=44100):
    """使用ffmpeg保存音频"""
    # 确保样本在有效范围内
    samples = np.clip(samples, -1.0, 1.0)
    
    # 转换为字节
    audio_bytes = samples.astype(np.float32).tobytes()
    
    # 确定输出格式
    ext = file_path.suffix.lower()
    if ext == '.mp3':
        codec = 'libmp3lame'
        bitrate = '192k'
    elif ext == '.ogg':
        codec = 'libvorbis'
        bitrate = '192k'
    elif ext == '.wav':
        codec = 'pcm_s16le'
        bitrate = None
    else:
        codec = 'pcm_s16le'
        bitrate = None
    
    cmd = [
        ffmpeg_path,
        '-f', 'f32le',
        '-ar', str(sample_rate),
        '-ac', '2',
        '-i', '-',
        '-c:a', codec,
        '-y',
        '-loglevel', 'error'
    ]
    if bitrate:
        cmd.extend(['-b:a', bitrate])
    cmd.append(str(file_path))
    
    result = subprocess.run(cmd, input=audio_bytes)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg保存失败: {file_path}")

def trim_fireball():
    """截取火球音效到1.5秒"""
    if not FIREBALL_FILE.exists():
        print(f"[ERROR] 找不到火球文件: {FIREBALL_FILE}")
        return False
    
    print(f"[FIREBALL] 处理火球音效: {FIREBALL_FILE.name}")
    
    # 加载音频
    samples, sr = load_audio_ffmpeg(FIREBALL_FILE)
    original_duration = len(samples) / sr
    
    print(f"  原时长: {original_duration:.2f}秒")
    print(f"  采样率: {sr}Hz")
    print(f"  通道数: {samples.shape[1]}")
    
    if original_duration <= FIREBALL_DURATION:
        print(f"  [WARN] 原时长已小于{FIREBALL_DURATION}秒，无需截取")
        return True
    
    # 截取前1.5秒
    end_sample = int(FIREBALL_DURATION * sr)
    trimmed = samples[:end_sample].copy()
    
    # 添加短淡出避免爆音 (最后100ms)
    fade_samples = int(0.1 * sr)
    if fade_samples < len(trimmed):
        fade_curve = np.linspace(1.0, 0.0, fade_samples)
        trimmed[-fade_samples:] *= fade_curve.reshape(-1, 1)
    
    # 备份原文件
    backup_path = FIREBALL_FILE.with_suffix('.mp3.bak')
    FIREBALL_FILE.rename(backup_path)
    print(f"  已备份: {backup_path.name}")
    
    # 保存
    save_audio_ffmpeg(FIREBALL_FILE, trimmed, sr)
    print(f"  [OK] 截取到 {FIREBALL_DURATION}秒 并保存")
    
    return True

def normalize_volume():
    """统一所有音效音量"""
    audio_files = []
    
    # 收集所有音频文件
    for ext in ['*.mp3', '*.ogg', '*.wav']:
        audio_files.extend(ASSETS_DIR.rglob(ext))
    
    # 排除备份文件
    audio_files = [f for f in audio_files if not f.suffix.endswith('.bak')]
    
    print(f"\n[VOLUME] 开始音量统一，共 {len(audio_files)} 个文件")
    print(f"  目标音量: {TARGET_DB}dB\n")
    
    processed = 0
    errors = []
    
    for i, file_path in enumerate(audio_files, 1):
        try:
            rel_path = file_path.relative_to(ASSETS_DIR)
            print(f"[{i}/{len(audio_files)}] {rel_path}", end=" ")
            
            # 加载音频
            samples, sr = load_audio_ffmpeg(file_path)
            
            # 获取当前dB
            current_db = get_dbfs(samples)
            
            # 计算需要调整的增益
            gain = TARGET_DB - current_db
            
            if abs(gain) < 0.5:
                print(f"-> 无需调整 ({current_db:.1f}dB)")
                processed += 1
                continue
            
            # 调整音量
            normalized = apply_gain(samples, gain)
            
            # 备份原文件
            backup_path = file_path.with_suffix(file_path.suffix + '.bak')
            if not backup_path.exists():
                file_path.rename(backup_path)
            
            # 保存
            save_audio_ffmpeg(file_path, normalized, sr)
            
            print(f"-> {current_db:.1f}dB -> {TARGET_DB}dB")
            processed += 1
            
        except Exception as e:
            print(f"-> [ERROR] {e}")
            errors.append((file_path, str(e)))
    
    print(f"\n[DONE] 完成: {processed}/{len(audio_files)} 个文件")
    if errors:
        print(f"[ERROR] 失败: {len(errors)} 个")
        for path, err in errors[:5]:
            print(f"  - {path.name}: {err}")
    
    return len(errors) == 0

def cleanup_backups():
    """清理备份文件"""
    backup_files = list(ASSETS_DIR.rglob('*.bak'))
    if not backup_files:
        print("[INFO] 没有备份文件需要清理")
        return
    
    print(f"[CLEANUP] 发现 {len(backup_files)} 个备份文件")
    for f in backup_files:
        f.unlink()
    print("  已清理")

def main():
    print("="*50)
    print("音频处理工具")
    print("="*50)
    print(f"ffmpeg路径: {ffmpeg_path}")
    print(f"资源目录: {ASSETS_DIR}")
    
    if len(sys.argv) > 1 and sys.argv[1] == '--cleanup':
        cleanup_backups()
        return
    
    # 1. 处理火球音效
    print("\n[任务1] 火球音效截取")
    try:
        if not trim_fireball():
            print("  [SKIP] 跳过")
    except Exception as e:
        print(f"  [ERROR] {e}")
    
    # 2. 统一音量
    print("\n" + "="*50)
    try:
        normalize_volume()
    except Exception as e:
        print(f"[ERROR] {e}")
    
    print("\n" + "="*50)
    print("[COMPLETE] 全部完成！")
    print("  如需清理备份文件，运行: python process_audio.py --cleanup")

if __name__ == "__main__":
    main()
