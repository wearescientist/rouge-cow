@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI极速分数训练

set NODE_PATH=..\..\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

echo 🐮 牛牛肉鸽 AI 极速分数训练
echo ===========================
echo.
echo 10倍速快速获得分数
echo.

node play_game_windows.js --speed=10 --max-time=300

echo.
echo 按任意键退出...
pause >nul
