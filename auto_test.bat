@echo off
chcp 65001 >nul
echo 🧪 开始自动化测试：重开游戏后能否攻击

:: 检查 Chrome 是否安装
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not exist %CHROME_PATH% (
    echo ❌ 未找到 Chrome，请手动测试
    pause
    exit /b 1
)

echo 🧪 启动 Chrome 进行测试...
start "" %CHROME_PATH% --auto-open-devtools-for-tabs "file:///%~dp0index.html?test=restart"

echo 🧪 等待测试完成（约30秒）...
timeout /t 30 /nobreak >nul

echo 🧪 测试完成，请查看 Chrome 控制台输出
echo 🧪 如果页面背景变绿色 = 测试通过
echo 🧪 如果页面背景变红色 = 测试失败
pause
