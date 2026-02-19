@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI限时训练

set NODE_PATH=..\..\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

echo 🐮 牛牛肉鸽 AI 限时训练
echo ===========================
echo.
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未找到，请运行 一键安装.bat
    pause
    exit /b 1
)
echo 此模式：固定60秒训练（旧模式）
echo.

node play_game_windows.js --speed=2 --mode=time

echo.
echo 按任意键退出...
pause >nul
