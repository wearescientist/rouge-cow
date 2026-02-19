# 肉鸽牛牛 AI训练系统 - 全自动安装脚本
# 以管理员权限运行

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🤖 AI训练系统 - 全自动安装" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置路径
$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$NodeVersion = "20.11.0"
$NodeInstaller = "$env:TEMP\node-v$NodeVersion-x64.msi"
$NodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi"

# 检查是否已安装 Node.js
Write-Host "🔍 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
        $NodeInstalled = $true
    } else {
        $NodeInstalled = $false
    }
} catch {
    $NodeInstalled = $false
}

# 下载并安装 Node.js
if (-not $NodeInstalled -or $Force) {
    Write-Host "📥 下载 Node.js v$NodeVersion..." -ForegroundColor Yellow
    
    try {
        # 使用 BITS 或 Invoke-WebRequest 下载
        if (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $NodeUrl -Destination $NodeInstaller -DisplayName "下载 Node.js"
        } else {
            Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeInstaller -UseBasicParsing
        }
        
        Write-Host "✅ 下载完成" -ForegroundColor Green
        Write-Host "📦 安装 Node.js（请按提示操作）..." -ForegroundColor Yellow
        
        # 运行安装程序
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", "$NodeInstaller", "/passive", "/norestart" -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Node.js 安装成功" -ForegroundColor Green
            
            # 刷新环境变量
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            # 验证安装
            Start-Sleep -Seconds 2
            $nodeVersion = node --version 2>$null
            Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
        } else {
            throw "安装程序返回错误码: $($process.ExitCode)"
        }
    } catch {
        Write-Host "❌ 安装失败: $_" -ForegroundColor Red
        Write-Host "请手动下载安装: https://nodejs.org/" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# 切换到项目目录
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "📁 项目目录: $PSScriptRoot" -ForegroundColor Gray

# 安装 npm 依赖
Write-Host ""
Write-Host "📦 安装项目依赖..." -ForegroundColor Yellow

try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install 失败" }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 依赖安装失败: $_" -ForegroundColor Red
    pause
    exit 1
}

# 安装 Playwright Chromium
Write-Host ""
Write-Host "🌐 安装 Chromium 浏览器..." -ForegroundColor Yellow
Write-Host "（这可能需要几分钟，请耐心等待）" -ForegroundColor Gray

try {
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw "Chromium 安装失败" }
    Write-Host "✅ Chromium 安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Chromium 安装失败: $_" -ForegroundColor Red
    pause
    exit 1
}

# 创建必要的目录
Write-Host ""
Write-Host "📂 创建数据目录..." -ForegroundColor Yellow
$dirs = @("data", "videos")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   创建 $dir/" -ForegroundColor Gray
    }
}

# 初始化计数文件
if (-not (Test-Path "count.txt")) {
    "0" | Out-File "count.txt" -Encoding ASCII
    Write-Host "   初始化 count.txt" -ForegroundColor Gray
}

# 运行配置测试
Write-Host ""
Write-Host "🧪 运行配置测试..." -ForegroundColor Yellow
node test_config.js

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   🎉 安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "运行方式:" -ForegroundColor Cyan
Write-Host "  1. 双击 train.bat" -ForegroundColor White
Write-Host "  2. 或在命令行运行: node play_game_windows.js 0 1" -ForegroundColor White
Write-Host ""

$runNow = Read-Host "是否立即运行第一次训练? (Y/n)"
if ($runNow -eq "" -or $runNow -eq "Y" -or $runNow -eq "y") {
    Write-Host ""
    Write-Host "🚀 启动训练..." -ForegroundColor Green
    & "$PSScriptRoot\train.bat"
} else {
    Write-Host ""
    Write-Host "💡 稍后运行请执行: train.bat" -ForegroundColor Gray
    pause
}
