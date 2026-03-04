@echo off
chcp 65001 >nul
title 牛牛肉鸽 - AI 智能训练系统

echo.
echo 牛牛肉鸽 AI 智能训练系统 v4.1 (武器升级学习版)
echo =====================================
echo.

set "NODE_CMD=E:\AI\game\rougelike-cow\tools\nodejs\node.exe"

if not exist "%NODE_CMD%" (
    echo 未找到 Node.js！
    pause
    exit /b 1
)

echo 请选择训练模式：
echo   1 - 单次训练
echo   2 - 连续训练
echo   3 - 观察模式
echo   4 - 查看学习进度
echo.
choice /c 1234 /n /m "选择 1-4: "

if errorlevel 4 goto :view
if errorlevel 3 goto :observe
if errorlevel 2 goto :continuous
if errorlevel 1 goto :single

:single
echo.
echo 选择速度：
echo   1 - 1x    2 - 2x    3 - 5x    4 - 10x
echo   5 - 20x   6 - 50x   7 - 100x
echo.
choice /c 1234567 /n /m "选择 1-7: "
set s=%errorlevel%
goto :run_single

:run_single
if %s%==1 set speed=1
if %s%==2 set speed=2
if %s%==3 set speed=5
if %s%==4 set speed=10
if %s%==5 set speed=20
if %s%==6 set speed=50
if %s%==7 set speed=100
echo.
echo 使用 %speed%x 速度训练
echo.
"%NODE_CMD%" "%~dp0play_game_windows.js" --speed=%speed% --max-time=300
goto :end

:continuous
set /p r="训练局数 (默认10): "
if "%r%"=="" set r=10
echo.
echo 选择速度：
echo   1 - 1x    2 - 2x    3 - 5x    4 - 10x
echo   5 - 20x   6 - 50x   7 - 100x
echo.
choice /c 1234567 /n /m "选择 1-7: "
set s=%errorlevel%
goto :run_continuous

:run_continuous
if %s%==1 set speed=1
if %s%==2 set speed=2
if %s%==3 set speed=5
if %s%==4 set speed=10
if %s%==5 set speed=20
if %s%==6 set speed=50
if %s%==7 set speed=100
echo.
echo 使用 %speed%x 速度训练 %r% 局
echo.
"%NODE_CMD%" "%~dp0continuous_training.js" --rounds=%r% --speed=%speed% --max-time=300
goto :end

:observe
set /p r="局数 (默认3): "
if "%r%"=="" set r=3
"%NODE_CMD%" "%~dp0continuous_training.js" --rounds=%r% --speed=1 --max-time=600
goto :end

:view
"%NODE_CMD%" "%~dp0show_ai_progress.js"
goto :end

:end
echo.
pause
