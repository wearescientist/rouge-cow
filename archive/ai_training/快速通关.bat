@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI快速通关训练

set NODE_PATH=..\..\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

echo 🐮 牛牛肉鸽 AI 快速通关训练
echo ===========================
echo.
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未找到，请运行 一键安装.bat
    pause
    exit /b 1
)
echo 此模式：AI玩到通关或死亡（默认加速2倍）
echo.

node play_game_windows.js --speed=2 --mode=clear --max-time=600

echo.
echo 按任意键退出...
pause >nul
