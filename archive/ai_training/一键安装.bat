@echo off
chcp 65001 >nul
title AI训练系统 - 一键安装

:: 检查是否以管理员运行
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 需要管理员权限
    echo 正在以管理员权限重新启动...
    echo.
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

echo ========================================
echo    🤖 AI训练系统 - 一键全自动安装
echo ========================================
echo.
echo 此脚本将自动完成：
echo   1. 下载并安装 Node.js
echo   2. 安装项目依赖
echo   3. 安装 Chromium 浏览器
echo   4. 配置训练环境
echo   5. 运行测试验证
echo.
echo 按任意键开始安装...
pause >nul

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "auto_setup.ps1"

exit /b
