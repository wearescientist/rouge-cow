# 游戏测试脚本
$ErrorActionPreference = "Stop"

try {
    Write-Host "=== 肉鸽牛牛游戏测试 ===" -ForegroundColor Cyan
    
    # 1. 检查文件编码
    Write-Host "`n[1/5] 检查文件编码..." -ForegroundColor Yellow
    $bytes = [System.IO.File]::ReadAllBytes("index.html") | Select-Object -First 3
    if ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
        Write-Host "  ✓ index.html: UTF-8 BOM" -ForegroundColor Green
    } else {
        Write-Host "  ✗ index.html: 无BOM，添加中..." -ForegroundColor Red
        $content = [System.IO.File]::ReadAllText("index.html", [System.Text.Encoding]::UTF8)
        [System.IO.File]::WriteAllText("index.html", $content, [System.Text.Encoding]::UTF8)
    }
    
    # 2. 检查贴图文件
    Write-Host "`n[2/5] 检查贴图文件..." -ForegroundColor Yellow
    $requiredSprites = @(
        "assets/sprites/tiles/walls/layer1_wall.png",
        "assets/sprites/tiles/walls/layer1_door.png",
        "assets/sprites/tiles/floors/layer1_floor_mycelium.png"
    )
    foreach ($sprite in $requiredSprites) {
        if (Test-Path $sprite) {
            Write-Host "  ✓ $sprite" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $sprite 缺失!" -ForegroundColor Red
        }
    }
    
    # 3. 语法检查 - 查找明显的语法错误
    Write-Host "`n[3/5] JavaScript语法检查..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText("index.html", [System.Text.Encoding]::UTF8)
    
    # 检查基本的语法问题
    $issues = @()
    
    # 检查未闭合的括号
    $parenOpen = ($content -split '\(').Count
    $parenClose = ($content -split '\)').Count
    if ($parenOpen -ne $parenClose) {
        $issues += "圆括号不匹配: ($parenOpen vs $parenClose)"
    }
    
    $braceOpen = ($content -split '\{').Count
    $braceClose = ($content -split '\}').Count
    if ($braceOpen -ne $braceClose) {
        $issues += "花括号不匹配: {$braceOpen vs $braceClose}"
    }
    
    $bracketOpen = ($content -split '\[').Count
    $bracketClose = ($content -split '\]').Count
    if ($bracketOpen -ne $bracketClose) {
        $issues += "方括号不匹配: [$bracketOpen vs $bracketClose]"
    }
    
    if ($issues.Count -eq 0) {
        Write-Host "  ✓ 语法检查通过" -ForegroundColor Green
    } else {
        foreach ($issue in $issues) {
            Write-Host "  ✗ $issue" -ForegroundColor Red
        }
    }
    
    # 4. 检查关键配置
    Write-Host "`n[4/5] 检查游戏配置..." -ForegroundColor Yellow
    if ($content -match "ROOM_WIDTH:\s*(\d+)") {
        $roomWidth = $matches[1]
        Write-Host "  ✓ 房间宽度: $roomWidth" -ForegroundColor Green
    }
    if ($content -match "WALL_THICKNESS:\s*(\d+)") {
        $wallThick = $matches[1]
        Write-Host "  ✓ 墙厚度: $wallThick" -ForegroundColor Green
    }
    
    # 5. 启动浏览器测试
    Write-Host "`n[5/5] 启动浏览器测试..." -ForegroundColor Yellow
    $htmlPath = (Get-Item "index.html").FullName
    Write-Host "  正在打开: $htmlPath" -ForegroundColor Cyan
    Start-Process "chrome.exe" -ArgumentList "$htmlPath" -ErrorAction SilentlyContinue
    
    Write-Host "`n=== 测试完成 ===" -ForegroundColor Cyan
    Write-Host "请检查浏览器中的游戏画面:" -ForegroundColor White
    Write-Host "  1. 墙是否正确显示紫色菌丝纹理" -ForegroundColor Gray
    Write-Host "  2. 门是否填满门洞区域" -ForegroundColor Gray
    Write-Host "  3. 四面墙是否有正确的翻转效果" -ForegroundColor Gray
    Write-Host "  4. 整个房间是否完整显示" -ForegroundColor Gray
    
} catch {
    Write-Host "`n错误: $_" -ForegroundColor Red
    exit 1
}
