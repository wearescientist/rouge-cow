@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI批量训练

set NODE_PATH=..\..\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未找到，请运行 一键安装.bat
    pause
    exit /b 1
)

echo 🐮 牛牛肉鸽 AI 批量训练
echo ===========================
echo.
echo 此模式会连续运行多次训练（加速模式）
echo.

set /p count="请输入训练次数 (默认5): "
if "%count%"=="" set count=5

echo.
echo 选择训练模式：
echo 1. 快速通关 (2倍速)
echo 2. 极速训练 (10倍速)
echo 3. 限时模式 (2倍速, 60秒)
choice /c 123 /n /m "请选择 (1-3): "

if errorlevel 3 (
    set "params=--speed=2 --mode=time"
    set "mode_name=限时模式"
)
if errorlevel 2 (
    set "params=--speed=10 --mode=clear --max-time=180"
    set "mode_name=极速通关"
)
if errorlevel 1 (
    set "params=--speed=2 --mode=clear"
    set "mode_name=快速通关"
)

echo.
echo 开始批量训练: %count% 次，模式: %mode_name%
echo 按 Ctrl+C 可随时停止
echo.

for /l %%i in (1,1,%count%) do (
    echo.
    echo ═══════════════════════════════════════
    echo   批量训练 [%%i/%count%]
    echo ═══════════════════════════════════════
    node play_game_windows.js %params%
    
    if errorlevel 1 (
        echo ⚠️ 训练 %%i 出现错误，继续下一次...
    )
    
    timeout /t 2 /nobreak >nul
)

echo.
echo ═══════════════════════════════════════
echo   ✅ 批量训练完成！共 %count% 次
echo ═══════════════════════════════════════
echo.
pause
