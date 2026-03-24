@echo off
chcp 65001 >nul
echo ========================================
echo  游戏数据总控台 - 安装程序
echo  Game Data Master - Installer
echo ========================================
echo.

cd /d %~dp0

echo [1/3] 检查 Node.js 安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+ 
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js 已安装
node --version
echo.

echo [2/3] 安装依赖...
npm install
if errorlevel 1 (
    echo [错误] 安装失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成
echo.

echo [3/3] 安装完成！
echo.
echo 启动方法:
echo   1. 双击 start.bat 启动编辑器
echo   2. 或运行: npm run dev
echo.
echo 访问地址: http://localhost:5173
echo.
pause
