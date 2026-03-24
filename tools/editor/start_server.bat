@echo off
chcp 65001 >nul
echo ==========================================
echo   游戏数据总控台 - Game Data Master
echo ==========================================
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [1/3] 检查依赖...

:: 安装后端依赖
if not exist "server\node_modules" (
    echo  正在安装后端依赖...
    cd server
    call npm install
    cd ..
) else (
    echo  后端依赖已安装
)

:: 安装前端依赖
if not exist "node_modules" (
    echo  正在安装前端依赖...
    call npm install
) else (
    echo  前端依赖已安装
)

echo.
echo [2/3] 启动后端服务...
start "后端服务" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] 启动前端服务...
start "前端服务" cmd /k "npm run dev"

echo.
echo ==========================================
echo   服务启动完成！
echo   前端: http://localhost:5173
echo   后端: http://localhost:3000
echo ==========================================
echo.
pause
