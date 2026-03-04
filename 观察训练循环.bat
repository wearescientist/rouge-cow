@echo off
chcp 65001 >nul
title AI观察训练循环系统
echo.
echo ============================================
echo  🤖 牛牛肉鸽 - AI观察训练循环系统
echo ============================================
echo.
echo 选择模式:
echo   [1] 快速观察 (单轮60秒观察)
echo   [2] 完整循环 (多轮训练+修复)
echo   [3] 查看历史报告
echo   [4] 清理数据
echo   [0] 退出
echo.
set /p choice="请输入选项 (0-4): "

if "%choice%"=="1" goto quick_observe
if "%choice%"=="2" goto full_loop
if "%choice%"=="3" goto view_history
if "%choice%"=="4" goto cleanup
if "%choice%"=="0" goto exit
goto invalid

:quick_observe
echo.
echo 🚀 启动快速观察模式...
cd /d "%~dp0"
node ai_quick_observe.js
goto end

:full_loop
echo.
echo 🚀 启动完整循环模式...
cd /d "%~dp0"
node ai_observation_loop.js
goto end

:view_history
echo.
echo 📊 查看历史报告...
if exist "ai_loop_history.json" (
    type ai_loop_history.json | more
) else (
    echo 暂无历史数据
)
pause
goto end

:cleanup
echo.
echo 🧹 清理数据...
echo 删除bug_reports? (Y/N)
set /p confirm=""
if /i "%confirm%"=="Y" (
    if exist bug_reports rmdir /s /q bug_reports
    echo ✅ bug_reports 已删除
)
echo 删除data? (Y/N)
set /p confirm=""
if /i "%confirm%"=="Y" (
    if exist data rmdir /s /q data
    echo ✅ data 已删除
)
echo 删除历史? (Y/N)
set /p confirm=""
if /i "%confirm%"=="Y" (
    if exist ai_loop_history.json del ai_loop_history.json
    echo ✅ 历史文件已删除
)
pause
goto end

:invalid
echo.
echo ❌ 无效选项
pause
goto end

:exit
echo.
echo 👋 再见
timeout /t 1 >nul
exit

:end
echo.
echo 按任意键返回主菜单...
pause >nul
cls
goto start
