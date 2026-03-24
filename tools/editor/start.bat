@echo off
chcp 65001 >nul
echo 启动游戏数据总控台...
echo.

start "后端服务器" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 2 >nul
start "前端开发服务器" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo 等待服务器启动...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo 游戏数据总控台已启动!
echo 后端: http://localhost:3000
echo 前端: http://localhost:5173
pause
