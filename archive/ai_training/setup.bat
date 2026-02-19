@echo off
chcp 65001 >nul
echo ========================================
echo   🤖 AI训练系统 - Windows 配置工具
echo ========================================
echo.

REM 检查Node.js
echo 🔍 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装！
    echo.
    echo 📥 请访问以下链接下载安装：
    echo https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
    echo.
    echo 安装完成后重新运行此脚本
    start https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version
echo.

REM 安装依赖
echo 📦 安装 Playwright...
call npm install
if errorlevel 1 (
    echo ❌ npm install 失败
    pause
    exit /b 1
)

echo.
echo 🌐 下载 Chromium 浏览器...
call npx playwright install chromium
if errorlevel 1 (
    echo ❌ Chromium 安装失败
    pause
    exit /b 1
)

echo.
echo ✅ 配置完成！
echo.
echo ========================================
echo   🚀 运行方式：
echo ========================================
echo.
echo 方式1 - 批处理脚本（推荐）：
echo   train.bat
echo.
echo 方式2 - 带参数运行：
echo   node play_game_windows.js [录制视频0/1] [训练次数]
echo   例如：node play_game_windows.js 1 10
echo.
echo 方式3 - npm命令：
echo   npm run train      - 普通训练
echo   npm run train:video - 录制视频训练
echo.
pause
