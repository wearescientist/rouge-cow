@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI分数训练

set NODE_PATH=..\..\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

echo 🐮 牛牛肉鸽 AI 分数训练系统 v3.0
echo ===========================
echo.
echo 目标：AI获得尽可能高的分数
echo 击杀+10分 探索房间+50分 道具+50分 通关加成
echo.

node play_game_windows.js --speed=2 --max-time=600

echo.
echo 按任意键退出...
pause >nul
