# 肉鸽牛牛 - 自动化测试脚本
# 测试：重开游戏后能否攻击

$ErrorActionPreference = "Continue"
Write-Host "🧪 开始自动化测试：重开游戏后能否攻击" -ForegroundColor Cyan

# 查找 Chrome
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chrome = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chrome = $path
        break
    }
}

if (-not $chrome) {
    Write-Host "❌ 未找到 Chrome，尝试使用 Edge..." -ForegroundColor Yellow
    $edgePaths = @(
        "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $edgePaths) {
        if (Test-Path $path) {
            $chrome = $path
            break
        }
    }
}

if (-not $chrome) {
    Write-Host "❌ 未找到 Chrome 或 Edge，请手动测试" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ 找到浏览器: $chrome" -ForegroundColor Green

# 游戏路径
$gamePath = Join-Path $PSScriptRoot "index.html"
$testUrl = "file:///$($gamePath -replace '\\', '/')?test=restart"

Write-Host "🧪 启动浏览器进行测试..." -ForegroundColor Cyan
Write-Host "   URL: $testUrl" -ForegroundColor Gray

# 启动 Chrome 并打开开发者工具
$proc = Start-Process -FilePath $chrome -ArgumentList @(
    "--auto-open-devtools-for-tabs",
    "--window-size=1280,720",
    $testUrl
) -PassThru

Write-Host "🧪 等待测试完成（约30秒）..." -ForegroundColor Cyan

# 等待测试完成
$timeout = 35
for ($i = 1; $i -le $timeout; $i++) {
    Write-Host "   等待中... $i/$timeout" -ForegroundColor Gray -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r`n" -NoNewline
    
    # 检查进程是否还在运行
    if ($proc.HasExited) {
        Write-Host "`n⚠️ 浏览器已关闭" -ForegroundColor Yellow
        break
    }
}

Write-Host "`n🧪 测试时间结束" -ForegroundColor Cyan
Write-Host "🧪 请查看浏览器控制台输出：" -ForegroundColor Yellow
Write-Host "   - 绿色背景 = ✅ 测试通过（重开后可以攻击）" -ForegroundColor Green
Write-Host "   - 红色背景 = ❌ 测试失败（重开后不能攻击）" -ForegroundColor Red

# 询问是否关闭浏览器
$close = Read-Host "`n是否关闭浏览器? (y/n)"
if ($close -eq 'y') {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已关闭浏览器" -ForegroundColor Green
}

Write-Host "`n🧪 测试完成" -ForegroundColor Cyan
pause
