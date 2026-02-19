@echo off
chcp 65001 >nul
title 牛牛肉鸽 - 训练数据查看

echo 🐮 牛牛肉鸽 AI 训练数据
echo ===========================
echo.

if not exist "..\..\data" (
    echo 暂无训练数据，请先运行训练！
    goto :end
)

cd ..\..\data

:: 显示训练次数
echo 📊 训练统计：
if exist "train_count.txt" (
    set /p count=<train_count.txt
    echo    总训练次数: %count%
) else (
    echo    总训练次数: 0
)

echo.
echo 📁 最近5次训练数据：

:: 列出最近的JSON文件
for /f "tokens=*" %%a in ('dir /b /o-d train_*.json 2^>nul ^| findstr "\.json$" ^| head -5') do (
    for %%F in ("%%a") do set "filename=%%~nF"
    echo    - %%a
)

echo.
echo 🎬 视频记录（每10次自动录制）：
dir /b ..\videos\*.webm 2>nul | findstr "\.webm$" >nul
if errorlevel 1 (
    echo    暂无视频记录
) else (
    for /f "tokens=*" %%a in ('dir /b ..\videos\*.webm 2^>nul ^| findstr "\.webm$"') do (
        echo    - %%a
    )
)

echo.
echo 📈 数据文件夹位置:
echo    %cd%
echo.
echo 按1打开数据文件夹，按其他键退出...
choice /c 1q /n /m "选择:"
if errorlevel 2 goto :end
if errorlevel 1 start explorer "%cd%"

:end
cd ..\archive\ai_training
echo.
pause
