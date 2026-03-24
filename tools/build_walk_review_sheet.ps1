param(
    [string]$BaseRoot = '',
    [string]$MetaRoot = '',
    [string]$OutDir = '',
    [int]$Columns = 4,
    [int]$FrameWidth = 96,
    [int]$FrameHeight = 96
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($BaseRoot)) {
    $BaseRoot = $projectRoot
}
if ([string]::IsNullOrWhiteSpace($MetaRoot)) {
    $MetaRoot = Join-Path $BaseRoot 'generated_assets\monster_behavior_preview\metadata'
}
if ([string]::IsNullOrWhiteSpace($OutDir)) {
    $OutDir = Join-Path $projectRoot 'reports\walk_review'
}
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$editorData = Get-Content -Path (Join-Path $MetaRoot 'behavior-editor-data.json') -Encoding UTF8 | ConvertFrom-Json
$edits = Get-Content -Path (Join-Path $MetaRoot 'behavior-edits.json') -Encoding UTF8 | ConvertFrom-Json
$walkMap = @{}
foreach ($item in $edits.behaviors) {
    if ($item.behaviorName -eq 'walk') {
        $walkMap[$item.behaviorKey] = $item
    }
}

$reviewItems = @()
foreach ($variant in $editorData) {
    $key = "$($variant.variantId)::walk"
    if (-not $walkMap.ContainsKey($key)) { continue }
    $edit = $walkMap[$key]
    $activeFrames = @($edit.frames | Where-Object { -not $_.deleted })
    if ($activeFrames.Count -le 4) { continue }
    $reviewItems += [PSCustomObject]@{
        variantId = $variant.variantId
        category = $variant.category
        monster = $variant.monster
        version = $variant.version
        sourceFrames = @($variant.sourceFrames)
        activeIndexes = @($activeFrames | ForEach-Object { [int]$_.sourceIndex })
    }
}

$reviewItems = @($reviewItems | Sort-Object monster, version)
$summaryPath = Join-Path $OutDir 'walk_over4_summary.json'
[System.IO.File]::WriteAllText($summaryPath, ($reviewItems | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding($false)))

$frameW = $FrameWidth
$frameH = $FrameHeight
$gap = 10
$headerH = 36
$itemH = $frameH + 74
$itemW = $gap + (9 * ($frameW + $gap))
$rows = [Math]::Ceiling([Math]::Max(1, $reviewItems.Count) / $columns)
$pageW = $itemW * $columns
$pageH = ($rows * $itemH) + 20

$bmp = New-Object System.Drawing.Bitmap($pageW, $pageH)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.Clear([System.Drawing.Color]::FromArgb(14, 11, 10))
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$titleFont = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font('Consolas', 10, [System.Drawing.FontStyle]::Regular)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 231, 212))
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(203, 182, 154))
$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(31, 24, 21))
$activeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 74, 54))
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(96, 76, 60), 1)
$activePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 194, 134), 2)
$normalPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(88, 72, 62), 2)

foreach ($index in 0..($reviewItems.Count - 1)) {
    $item = $reviewItems[$index]
    $col = $index % $columns
    $row = [Math]::Floor($index / $columns)
    $ox = $col * $itemW
    $oy = $row * $itemH
    $panelRect = New-Object System.Drawing.RectangleF(($ox + 4), ($oy + 4), ($itemW - 12), ($itemH - 12))
    $gfx.FillRectangle($panelBrush, $panelRect)
    $gfx.DrawRectangle($panelPen, $panelRect.X, $panelRect.Y, $panelRect.Width, $panelRect.Height)
    $gfx.DrawString("$($item.monster) $($item.version) [$($item.category)]", $titleFont, $textBrush, ($ox + 12), ($oy + 8))
    $gfx.DrawString(("active: " + (($item.activeIndexes -join ','))), $smallFont, $mutedBrush, ($ox + 12), ($oy + 30))
    for ($i = 0; $i -lt $item.sourceFrames.Count; $i++) {
        $frameIndex = $i + 1
        $x = $ox + $gap + ($i * ($frameW + $gap))
        $y = $oy + $headerH + 18
        $rect = New-Object System.Drawing.Rectangle($x, $y, $frameW, $frameH)
        $fullPath = Join-Path $BaseRoot ($item.sourceFrames[$i] -replace '/', '\')
        if (Test-Path -LiteralPath $fullPath) {
            $src = [System.Drawing.Bitmap]::new($fullPath)
            $ratio = [Math]::Min($frameW / $src.Width, $frameH / $src.Height)
            $drawW = [Math]::Max(1, [int]($src.Width * $ratio))
            $drawH = [Math]::Max(1, [int]($src.Height * $ratio))
            $dx = $x + [int](($frameW - $drawW) / 2)
            $dy = $y + [int](($frameH - $drawH) / 2)
            $gfx.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 16, 14))), $rect)
            $gfx.DrawImage($src, $dx, $dy, $drawW, $drawH)
            $src.Dispose()
        }
        if ($item.activeIndexes -contains $frameIndex) {
            $gfx.FillRectangle($activeBrush, $rect)
            if (Test-Path -LiteralPath $fullPath) {
                $src = [System.Drawing.Bitmap]::new($fullPath)
                $ratio = [Math]::Min($frameW / $src.Width, $frameH / $src.Height)
                $drawW = [Math]::Max(1, [int]($src.Width * $ratio))
                $drawH = [Math]::Max(1, [int]($src.Height * $ratio))
                $dx = $x + [int](($frameW - $drawW) / 2)
                $dy = $y + [int](($frameH - $drawH) / 2)
                $gfx.DrawImage($src, $dx, $dy, $drawW, $drawH)
                $src.Dispose()
            }
            $gfx.DrawRectangle($activePen, $rect)
        } else {
            $gfx.DrawRectangle($normalPen, $rect)
        }
        $gfx.DrawString(("f" + $frameIndex.ToString('00')), $smallFont, $textBrush, ($x + 4), ($y + $frameH + 8))
    }
}

$outPath = Join-Path $OutDir 'walk_over4_sheet.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$gfx.Dispose()
$bmp.Dispose()
$titleFont.Dispose()
$smallFont.Dispose()
$textBrush.Dispose()
$mutedBrush.Dispose()
$panelBrush.Dispose()
$activeBrush.Dispose()
$panelPen.Dispose()
$activePen.Dispose()
$normalPen.Dispose()

Write-Output $outPath
Write-Output $summaryPath
