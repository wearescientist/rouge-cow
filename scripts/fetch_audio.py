#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Shen Gen Zhi Yi - Audio Resource Manager
v0.20.0

Features:
1. Download audio from free sources
2. Convert format (OGG/MP3)
3. Normalize volume
4. Generate manifest.json

Usage:
    python fetch_audio.py              # Interactive mode
    python fetch_audio.py manifest     # Generate manifest only
    python fetch_audio.py placeholder  # Create placeholders
    python fetch_audio.py silence      # Generate silence test files
    python fetch_audio.py all          # Do all
"""

import os
import sys
import json
import shutil
import urllib.request
import urllib.error
import ssl
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# SSL config
ssl._create_default_https_context = ssl._create_unverified_context

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
AUDIO_DIR = PROJECT_ROOT / "assets" / "audio"
BGM_DIR = AUDIO_DIR / "bgm"
SFX_DIR = AUDIO_DIR / "sfx"
SF2_DIR = AUDIO_DIR / "sf2"

# Create dirs
for dir_path in [BGM_DIR, SFX_DIR, SF2_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Resource definitions
FREE_RESOURCES = {
    "bgm": [
        {"name": "menu", "filename": "bgm_menu.mp3", "fallback": "generate"},
        {"name": "normal", "filename": "bgm_normal.mp3", "fallback": "generate"},
        {"name": "elite", "filename": "bgm_elite.mp3", "fallback": "generate"},
        {"name": "boss", "filename": "bgm_boss.mp3", "fallback": "generate"},
        {"name": "victory", "filename": "bgm_victory.mp3", "fallback": "generate"}
    ],
    "sfx": [
        {"name": "shoot", "filename": "sfx_shoot.ogg", "fallback": "synth"},
        {"name": "hit", "filename": "sfx_hit.ogg", "fallback": "synth"},
        {"name": "crit", "filename": "sfx_crit.ogg", "fallback": "synth"},
        {"name": "dash", "filename": "sfx_dash.ogg", "fallback": "synth"},
        {"name": "explosion", "filename": "sfx_explosion.ogg", "fallback": "synth"},
        {"name": "levelup", "filename": "sfx_levelup.ogg", "fallback": "synth"},
        {"name": "buy", "filename": "sfx_buy.ogg", "fallback": "synth"},
        {"name": "gem", "filename": "sfx_gem.ogg", "fallback": "synth"},
        {"name": "open", "filename": "sfx_open.ogg", "fallback": "synth"},
        {"name": "chest", "filename": "sfx_chest.ogg", "fallback": "synth"},
        {"name": "gameover", "filename": "sfx_gameover.ogg", "fallback": "synth"}
    ],
    "sf2": [
        {"name": "piano", "filename": "piano.mp3", "fallback": "none"},
        {"name": "strings", "filename": "strings.mp3", "fallback": "none"},
        {"name": "brass", "filename": "brass.mp3", "fallback": "none"},
        {"name": "drums", "filename": "drums.mp3", "fallback": "none"}
    ]
}


def print_header(text: str):
    print(f"\n{'=' * 60}")
    print(f"  {text}")
    print(f"{'=' * 60}")


def print_info(text: str):
    print(f"  [INFO] {text}")


def print_success(text: str):
    print(f"  [OK] {text}")


def print_warning(text: str):
    print(f"  [WARN] {text}")


def print_error(text: str):
    print(f"  [ERR] {text}")


def check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def generate_manifest():
    print_header("Generating manifest.json")
    
    manifest = {
        "version": "0.20.0",
        "generated_by": "fetch_audio.py",
        "bgm": {},
        "sfx": {},
        "sf2": {}
    }
    
    # Scan BGM
    for file_path in BGM_DIR.glob("*.mp3"):
        name = file_path.stem.replace("bgm_", "")
        if file_path.stat().st_size > 0:
            manifest["bgm"][name] = {
                "path": f"assets/audio/bgm/{file_path.name}",
                "loop": True,
                "volume": 0.8
            }
    
    # Scan SFX
    for file_path in SFX_DIR.glob("*.ogg"):
        name = file_path.stem.replace("sfx_", "")
        if file_path.stat().st_size > 0:
            manifest["sfx"][name] = {
                "path": f"assets/audio/sfx/{file_path.name}",
                "volume": 1.0,
                "poolSize": 3
            }
    
    # Scan SF2
    for file_path in SF2_DIR.glob("*.mp3"):
        name = file_path.stem
        if file_path.stat().st_size > 0:
            manifest["sf2"][name] = {
                "path": f"assets/audio/sf2/{file_path.name}"
            }
    
    # Save
    manifest_path = AUDIO_DIR / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print_success(f"Generated manifest.json")
    print_info(f"  BGM: {len(manifest['bgm'])}")
    print_info(f"  SFX: {len(manifest['sfx'])}")
    print_info(f"  SF2: {len(manifest['sf2'])}")


def create_placeholder_files():
    print_header("Creating placeholder files")
    
    for category, items in FREE_RESOURCES.items():
        for item in items:
            if category == "bgm":
                dest_path = BGM_DIR / item["filename"]
            elif category == "sfx":
                dest_path = SFX_DIR / item["filename"]
            else:
                dest_path = SF2_DIR / item["filename"]
            
            if not dest_path.exists():
                dest_path.touch()
                print_info(f"Created: {dest_path.name}")


def generate_silence_files():
    if not check_ffmpeg():
        print_warning("ffmpeg not found, skipping silence generation")
        return
    
    print_header("Generating silence test files")
    
    import subprocess
    
    for category, items in FREE_RESOURCES.items():
        for item in items:
            if category == "bgm":
                dest_path = BGM_DIR / item["filename"]
                duration = 10
            elif category == "sfx":
                dest_path = SFX_DIR / item["filename"]
                duration = 0.5
            else:
                dest_path = SF2_DIR / item["filename"]
                duration = 1
            
            if not dest_path.exists() or dest_path.stat().st_size == 0:
                cmd = [
                    "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                    "-t", str(duration), "-acodec", "libmp3lame", "-q:a", "9",
                    str(dest_path)
                ]
                result = subprocess.run(cmd, capture_output=True)
                if result.returncode == 0:
                    print_info(f"Generated: {dest_path.name}")


def show_download_guide():
    print_header("Free Audio Resources Guide")
    print()
    print("  Recommended free audio sources:")
    print()
    print("  1. OpenGameArt.org")
    print("     - Free game music and SFX")
    print("     - Search: dungeon ambient, battle music, 8bit sfx")
    print()
    print("  2. Freesound.org")
    print("     - Large SFX library")
    print("     - Search: laser, explosion, coin, powerup")
    print()
    print("  3. Itch.io (itch.io/soundtracks/free)")
    print("     - Indie game music")
    print()
    print("  4. Incompetech (incompetech.com)")
    print("     - Kevin MacLeod's royalty-free music")
    print()
    print_info("Download and place files to:")
    print(f"  BGM: {BGM_DIR}")
    print(f"  SFX: {SFX_DIR}")
    print(f"  SF2: {SF2_DIR}")


def interactive_mode():
    print_header("Shen Gen Zhi Yi - Audio Manager v0.20.0")
    print()
    print("  Manage game audio resources")
    print()
    
    if check_ffmpeg():
        print_success("ffmpeg detected")
    else:
        print_warning("ffmpeg not found")
        print_info("Install for best experience: https://ffmpeg.org/download.html")
    
    print()
    print("  Select action:")
    print("  1. View download guide")
    print("  2. Create placeholder files")
    print("  3. Generate silence test files (requires ffmpeg)")
    print("  4. Generate manifest.json")
    print("  5. Do all")
    print("  0. Exit")
    print()
    
    choice = input("  Enter option (0-5): ").strip()
    
    if choice == "1":
        show_download_guide()
    elif choice == "2":
        create_placeholder_files()
    elif choice == "3":
        generate_silence_files()
    elif choice == "4":
        generate_manifest()
    elif choice == "5":
        create_placeholder_files()
        generate_silence_files()
        generate_manifest()
    elif choice == "0":
        print("\n  Tip: Built-in synthesizer works without external files!")
        print("  Select 'Retro 8-bit', 'Modern Synth', or 'Minimal' in settings.\n")
        return
    else:
        print_error("Invalid option")
    
    print()
    input("  Press Enter to continue...")
    interactive_mode()


def main():
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "manifest":
            generate_manifest()
        elif command == "placeholder":
            create_placeholder_files()
        elif command == "silence":
            generate_silence_files()
        elif command == "all":
            create_placeholder_files()
            generate_silence_files()
            generate_manifest()
        else:
            print(f"Unknown command: {command}")
            print("Available: manifest, placeholder, silence, all")
    else:
        interactive_mode()


if __name__ == "__main__":
    main()
