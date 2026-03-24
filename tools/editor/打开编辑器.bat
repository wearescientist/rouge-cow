@echo off
chcp 65001 >nul
title 游戏数据总控台
color 0A

echo ===================================
echo   游戏数据总控台
echo ===================================
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装
    pause
    exit /b 1
)

cd /d "%~dp0"

:: 安装依赖（如果需要）
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    call npm install
)

echo.
echo 启动开发服务器...
echo 浏览器将自动打开 http://localhost:5173
echo.

:: 启动 Vite 并打开浏览器
start "" http://localhost:5173
npm run dev
