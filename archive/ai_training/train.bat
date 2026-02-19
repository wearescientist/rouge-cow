@echo off
chcp 65001 >nul
REM AI游戏训练系统 - Windows版本

cd /d "%~dp0"

set "COUNT_FILE=count.txt"
set "TRAIN_COUNT=0"

REM 读取当前训练次数
if exist "%COUNT_FILE%" (
    set /p TRAIN_COUNT=<"%COUNT_FILE%"
) else (
    set TRAIN_COUNT=0
)

REM 递增计数
set /a TRAIN_COUNT+=1
echo %TRAIN_COUNT% > "%COUNT_FILE%"

REM 计算是否是第10次（需要录制视频）
set "RECORD_VIDEO=0"
set /a "MODULO=TRAIN_COUNT %% 10"
if %MODULO% == 0 set "RECORD_VIDEO=1"

echo ========================================
echo     🤖 AI训练 #%TRAIN_COUNT%
echo ========================================
echo 录制视频: %RECORD_VIDEO%
echo.

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: Node.js 未安装
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查playwright
if not exist "node_modules\playwright" (
    echo 📦 安装 Playwright...
    npm install playwright
    npx playwright install chromium
)

echo 🚀 启动训练...
node play_game_windows.js %RECORD_VIDEO% %TRAIN_COUNT%

if %RECORD_VIDEO% == 1 (
    echo.
    echo 🎥 视频已保存到 videos 目录
)

echo.
echo ========================================
echo     ✅ 训练 #%TRAIN_COUNT% 完成
echo ========================================
pause
