param(
    [string]$ManifestPath = '',
    [string]$ReviewExportRoot = '',
    [string]$OutRoot = ''
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Remove-DirectoryContents {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        Get-ChildItem -LiteralPath $Path -Force | Remove-Item -Force -Recurse
    }
}

function Parse-RowCounts {
    param([string]$Layout, [int]$FrameCount)
    if ($Layout -match '^(\d+)x(\d+)$') {
        $cols = [int]$Matches[1]
        $rows = [int]$Matches[2]
        return @(for ($i = 0; $i -lt $rows; $i++) { $cols })
    }
    if ($Layout -match '^\d+(?:/\d+)+$') {
        return @($Layout.Split('/') | ForEach-Object { [int]$_ })
    }
    return @($FrameCount)
}

function New-FeatureVector {
    param([System.Drawing.Bitmap]$Bitmap, [int]$Size = 32)
    $sample = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($sample)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($Bitmap, 0, 0, $Size, $Size)
    $graphics.Dispose()

    $values = New-Object double[] ($Size * $Size * 2)
    $cursor = 0
    for ($y = 0; $y -lt $Size; $y++) {
        for ($x = 0; $x -lt $Size; $x++) {
            $color = $sample.GetPixel($x, $y)
            $alpha = $color.A / 255.0
            $gray = (($color.R * 0.3) + ($color.G * 0.59) + ($color.B * 0.11)) / 255.0
            $values[$cursor] = $alpha
            $cursor++
            $values[$cursor] = $gray * $alpha
            $cursor++
        }
    }
    $sample.Dispose()
    return $values
}

function Get-AlphaMetrics {
    param([System.Drawing.Bitmap]$Bitmap)
    $minX = $Bitmap.Width
    $minY = $Bitmap.Height
    $maxX = -1
    $maxY = -1
    $sumAlpha = 0.0
    $sumX = 0.0
    $sumY = 0.0

    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        for ($x = 0; $x -lt $Bitmap.Width; $x++) {
            $alpha = $Bitmap.GetPixel($x, $y).A
            if ($alpha -lt 12) { continue }
            $weight = $alpha / 255.0
            $sumAlpha += $weight
            $sumX += $x * $weight
            $sumY += $y * $weight
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }

    if ($maxX -lt $minX -or $maxY -lt $minY) {
        return [PSCustomObject]@{
            Bounds = [System.Drawing.Rectangle]::FromLTRB(0, 0, $Bitmap.Width, $Bitmap.Height)
            Fill = 0.0
            CenterX = $Bitmap.Width / 2.0
            CenterY = $Bitmap.Height / 2.0
        }
    }

    return [PSCustomObject]@{
        Bounds = [System.Drawing.Rectangle]::FromLTRB($minX, $minY, $maxX + 1, $maxY + 1)
        Fill = $sumAlpha
        CenterX = ($sumX / [Math]::Max(1.0, $sumAlpha))
        CenterY = ($sumY / [Math]::Max(1.0, $sumAlpha))
    }
}

function Get-FrameDistance {
    param([object]$A, [object]$B)
    $sum = 0.0
    for ($i = 0; $i -lt $A.Feature.Length; $i++) {
        $sum += [Math]::Abs($A.Feature[$i] - $B.Feature[$i])
    }
    $featureCost = $sum / $A.Feature.Length
    $fillCost = [Math]::Abs($A.Metrics.Fill - $B.Metrics.Fill) / 20000.0
    return ($featureCost + $fillCost)
}

function Get-NearestDistance {
    param([object]$Frame, [array]$Candidates)
    if ($Candidates.Count -eq 0) { return [double]::MaxValue }
    return (($Candidates | ForEach-Object { Get-FrameDistance -A $Frame -B $_ }) | Measure-Object -Minimum).Minimum
}

function Get-AverageFill {
    param([array]$Frames)
    if ($Frames.Count -eq 0) { return 0.0 }
    return ((@($Frames | ForEach-Object { $_.Metrics.Fill }) | Measure-Object -Average).Average)
}

function Get-BestSmoothPath {
    param([array]$Frames)
    if ($Frames.Count -le 2) {
        return @($Frames | Sort-Object SourceIndex)
    }

    $bestPath = @()
    $bestScore = [double]::MaxValue
    foreach ($start in $Frames) {
        $path = [System.Collections.ArrayList]::new()
        [void]$path.Add($start)
        $remaining = [System.Collections.ArrayList]::new()
        foreach ($frame in $Frames) {
            if ($frame.SourceIndex -ne $start.SourceIndex) {
                [void]$remaining.Add($frame)
            }
        }

        while ($remaining.Count -gt 0) {
            $head = $path[0]
            $tail = $path[$path.Count - 1]
            $bestCandidate = $null
            $bestSide = 'tail'
            $bestCost = [double]::MaxValue

            foreach ($candidate in $remaining) {
                $headCost = Get-FrameDistance -A $candidate -B $head
                $tailCost = Get-FrameDistance -A $candidate -B $tail
                if ($headCost -lt $bestCost) {
                    $bestCost = $headCost
                    $bestCandidate = $candidate
                    $bestSide = 'head'
                }
                if ($tailCost -lt $bestCost) {
                    $bestCost = $tailCost
                    $bestCandidate = $candidate
                    $bestSide = 'tail'
                }
            }

            if ($bestSide -eq 'head') {
                $path.Insert(0, $bestCandidate)
            } else {
                [void]$path.Add($bestCandidate)
            }
            [void]$remaining.Remove($bestCandidate)
        }

        $score = 0.0
        for ($i = 1; $i -lt $path.Count; $i++) {
            $score += Get-FrameDistance -A $path[$i - 1] -B $path[$i]
        }

        if ($score -lt $bestScore) {
            $bestScore = $score
            $bestPath = @($path)
        }
    }

    if ($bestPath.Count -gt 1 -and $bestPath[0].Metrics.Fill -gt $bestPath[$bestPath.Count - 1].Metrics.Fill) {
        [array]::Reverse($bestPath)
    }
    return $bestPath
}

function Get-MedoidFrame {
    param([array]$Frames)
    $bestFrame = $Frames[0]
    $bestScore = [double]::MaxValue
    foreach ($frame in $Frames) {
        $score = 0.0
        foreach ($other in $Frames) {
            if ($frame.SourceIndex -eq $other.SourceIndex) { continue }
            $score += Get-FrameDistance -A $frame -B $other
        }
        if ($score -lt $bestScore) {
            $bestScore = $score
            $bestFrame = $frame
        }
    }
    return $bestFrame
}

function Get-PingPongFrames {
    param([array]$Frames)
    if ($Frames.Count -le 1) { return $Frames }
    $result = [System.Collections.ArrayList]::new()
    foreach ($frame in $Frames) { [void]$result.Add($frame) }
    for ($i = $Frames.Count - 2; $i -gt 0; $i--) {
        [void]$result.Add($Frames[$i])
    }
    return @($result)
}

function Get-BehaviorSplit {
    param([array]$Frames, [string]$Layout)
    $rowCounts = Parse-RowCounts -Layout $Layout -FrameCount $Frames.Count
    $rows = @()
    $cursor = 0
    foreach ($count in $rowCounts) {
        $rows += ,@($Frames[$cursor..($cursor + $count - 1)])
        $cursor += $count
    }

    $rowMeans = @($rows | ForEach-Object { Get-AverageFill -Frames $_ })
    $attackStart = -1

    if ($rows.Count -ge 2 -and $Frames.Count -gt 4) {
        for ($start = $rows.Count - 1; $start -ge 1; $start--) {
            $attackFrames = @()
            for ($i = $start; $i -lt $rows.Count; $i++) { $attackFrames += $rows[$i] }
            if ($attackFrames.Count -lt 2) { continue }
            $walkFrames = @()
            for ($i = 0; $i -lt $start; $i++) { $walkFrames += $rows[$i] }
            if ($walkFrames.Count -lt 2) { continue }

            $walkMean = Get-AverageFill -Frames $walkFrames
            $attackMean = Get-AverageFill -Frames $attackFrames
            $lastRowMean = $rowMeans[$rows.Count - 1]
            if ($attackMean -ge ($walkMean * 1.12) -and $lastRowMean -ge ($rowMeans[0] * 1.12)) {
                $attackStart = $start
                break
            }
        }

        if ($attackStart -lt 0 -and $rows[$rows.Count - 1].Count -eq 1 -and $rows.Count -ge 3) {
            $start = $rows.Count - 2
            $attackFrames = @($rows[$start] + $rows[$rows.Count - 1])
            $walkFrames = @()
            for ($i = 0; $i -lt $start; $i++) { $walkFrames += $rows[$i] }
            if ($walkFrames.Count -ge 2) {
                $walkMean = Get-AverageFill -Frames $walkFrames
                $attackMean = Get-AverageFill -Frames $attackFrames
                if ($attackMean -ge ($walkMean * 1.12)) {
                    $attackStart = $start
                }
            }
        }
    }

    $walk = @($Frames)
    $attack = @()
    if ($attackStart -ge 0) {
        $walk = @()
        for ($i = 0; $i -lt $attackStart; $i++) { $walk += $rows[$i] }
        $attack = @()
        for ($i = $attackStart; $i -lt $rows.Count; $i++) { $attack += $rows[$i] }
        if ($walk.Count -lt 2 -or $attack.Count -lt 2) {
            $walk = @($Frames)
            $attack = @()
        }
    }

    return [PSCustomObject]@{
        Walk = @($walk)
        Attack = @($attack)
        RowCounts = $rowCounts
        RowMeans = @($rowMeans | ForEach-Object { [Math]::Round($_, 1) })
    }
}

function New-BehaviorDefinition {
    param(
        [string]$Name,
        [string]$Label,
        [array]$Frames,
        [int]$DelayMs,
        [bool]$PingPong = $true,
        [bool]$SortByFill = $false
    )
    if ($Frames.Count -eq 0) { return $null }
    $ordered = if ($SortByFill) {
        @($Frames | Sort-Object @{ Expression = { $_.Metrics.Fill } }, @{ Expression = { $_.SourceIndex } })
    } else {
        Get-BestSmoothPath -Frames $Frames
    }
    $playback = if ($PingPong) { Get-PingPongFrames -Frames $ordered } else { @($ordered) }
    return [PSCustomObject]@{
        Name = $Name
        Label = $Label
        OrderedFrames = $ordered
        PlaybackFrames = $playback
        DelayMs = $DelayMs
    }
}

function Get-IdleBehavior {
    param([array]$Frames)
    if ($Frames.Count -eq 0) { return $null }
    $medoid = Get-MedoidFrame -Frames $Frames
    $nearest = $null
    $bestDistance = [double]::MaxValue
    foreach ($frame in $Frames) {
        if ($frame.SourceIndex -eq $medoid.SourceIndex) { continue }
        $distance = Get-FrameDistance -A $medoid -B $frame
        if ($distance -lt $bestDistance) {
            $bestDistance = $distance
            $nearest = $frame
        }
    }
    $ordered = @($medoid)
    if ($nearest -and $bestDistance -lt 3.5) {
        $ordered += $nearest
    }
    $playback = if ($ordered.Count -gt 1) { @($ordered + @($ordered[0])) } else { $ordered }
    return [PSCustomObject]@{
        Name = 'idle'
        Label = 'Idle'
        OrderedFrames = $ordered
        PlaybackFrames = $playback
        DelayMs = 420
    }
}

function Save-BehaviorFrames {
    param(
        [array]$Frames,
        [string]$TargetDir
    )
    Ensure-Directory -Path $TargetDir
    Remove-DirectoryContents -Path $TargetDir

    $prepared = @()
    foreach ($frame in $Frames) {
        $bounds = $frame.Metrics.Bounds
        $pad = 2
        $left = [Math]::Max(0, $bounds.X - $pad)
        $top = [Math]::Max(0, $bounds.Y - $pad)
        $right = [Math]::Min($frame.Bitmap.Width, $bounds.Right + $pad)
        $bottom = [Math]::Min($frame.Bitmap.Height, $bounds.Bottom + $pad)
        $rect = [System.Drawing.Rectangle]::FromLTRB($left, $top, $right, $bottom)
        $cropped = $frame.Bitmap.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $metrics = Get-AlphaMetrics -Bitmap $cropped
        $prepared += [PSCustomObject]@{
            Frame = $frame
            Bitmap = $cropped
            Metrics = $metrics
            RelativeCenterX = ($frame.Metrics.CenterX - $left)
            RelativeCenterY = ($frame.Metrics.CenterY - $top)
        }
    }

    $commonLeft = (($prepared | ForEach-Object { $_.RelativeCenterX }) | Measure-Object -Maximum).Maximum
    $commonTop = (($prepared | ForEach-Object { $_.RelativeCenterY }) | Measure-Object -Maximum).Maximum
    $commonRight = (($prepared | ForEach-Object { $_.Bitmap.Width - $_.RelativeCenterX }) | Measure-Object -Maximum).Maximum
    $commonBottom = (($prepared | ForEach-Object { $_.Bitmap.Height - $_.RelativeCenterY }) | Measure-Object -Maximum).Maximum
    $canvasWidth = [int][Math]::Ceiling($commonLeft + $commonRight)
    $canvasHeight = [int][Math]::Ceiling($commonTop + $commonBottom)

    $paths = @()
    for ($i = 0; $i -lt $prepared.Count; $i++) {
        $item = $prepared[$i]
        $canvas = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $offsetX = [int][Math]::Round($commonLeft - $item.RelativeCenterX)
        $offsetY = [int][Math]::Round($commonTop - $item.RelativeCenterY)
        $graphics.DrawImage($item.Bitmap, $offsetX, $offsetY, $item.Bitmap.Width, $item.Bitmap.Height)
        $graphics.Dispose()

        $outPath = Join-Path $TargetDir ('f{0:d2}.png' -f ($i + 1))
        $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
        $item.Bitmap.Dispose()
        $paths += $outPath
    }

    return [PSCustomObject]@{
        Paths = $paths
        Width = $canvasWidth
        Height = $canvasHeight
    }
}

function Get-ShortVersionName {
    param([string]$SourceKey)
    if ($SourceKey -match '^monsters_v(\d+)_') {
        return ('v{0}' -f $Matches[1])
    }
    if ($SourceKey -eq 'monsters_sprites_sheet') { return 'spr' }
    if ($SourceKey -eq 'monsters_sprites_v2_sheet') { return 'spr2' }
    return ($SourceKey -replace '^monsters_', '' -replace '_sheet$', '' -replace '_image$', '')
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ReviewExportRoot)) {
    $ReviewExportRoot = Join-Path $ProjectRoot 'generated_assets\monster_review_export'
}
if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $ReviewExportRoot 'manifest.json'
}
if ([string]::IsNullOrWhiteSpace($OutRoot)) {
    $OutRoot = Join-Path $ProjectRoot 'generated_assets\monster_behavior_preview'
}

$AssetsRoot = Join-Path $OutRoot 'assets'
$MetaRoot = Join-Path $OutRoot 'metadata'
$ReportRoot = Join-Path $OutRoot 'reports'
Ensure-Directory -Path $OutRoot
Ensure-Directory -Path $AssetsRoot
Ensure-Directory -Path $MetaRoot
Ensure-Directory -Path $ReportRoot
Remove-DirectoryContents -Path $AssetsRoot

$manifest = Get-Content -Path $ManifestPath -Encoding UTF8 | ConvertFrom-Json
$entries = @($manifest.entries | Where-Object { $_.category -in @('ready', 'needs_work') })
$catalog = @()

foreach ($entry in $entries) {
    $variantDir = Join-Path $ReviewExportRoot ($entry.path -replace '/', '\')
    if (-not (Test-Path -LiteralPath $variantDir)) { continue }

    $frames = @()
    foreach ($file in (Get-ChildItem -LiteralPath $variantDir -File | Sort-Object Name)) {
        $bitmap = [System.Drawing.Bitmap]::FromFile($file.FullName)
        $metrics = Get-AlphaMetrics -Bitmap $bitmap
        $frames += [PSCustomObject]@{
            SourceIndex = $frames.Count + 1
            Name = $file.Name
            FilePath = $file.FullName
            Bitmap = $bitmap
            Metrics = $metrics
            Feature = (New-FeatureVector -Bitmap $bitmap)
        }
    }
    if ($frames.Count -eq 0) { continue }

    $split = Get-BehaviorSplit -Frames $frames -Layout $entry.layout
    $behaviors = @()
    $idle = Get-IdleBehavior -Frames $split.Walk
    if ($idle) { $behaviors += $idle }

    $walk = New-BehaviorDefinition -Name 'walk' -Label 'Walk' -Frames $split.Walk -DelayMs 240 -PingPong $true -SortByFill $false
    if ($walk) { $behaviors += $walk }

    if ($split.Attack.Count -ge 2) {
        $attack = New-BehaviorDefinition -Name 'attack' -Label 'Attack' -Frames $split.Attack -DelayMs 260 -PingPong $true -SortByFill $true
        if ($attack) { $behaviors += $attack }
    }

    $behaviorEntries = @()
    $version = Get-ShortVersionName -SourceKey $entry.sourceKey
    foreach ($behavior in $behaviors) {
        $targetDir = Join-Path $AssetsRoot "$($entry.category)\$($entry.monster)\$version\$($behavior.Name)"
        $saved = Save-BehaviorFrames -Frames $behavior.PlaybackFrames -TargetDir $targetDir
        $behaviorEntries += [PSCustomObject][ordered]@{
            name = $behavior.Name
            label = $behavior.Label
            delayMs = $behavior.DelayMs
            frameCount = $saved.Paths.Count
            width = $saved.Width
            height = $saved.Height
            sourceFrameIndexes = @($behavior.OrderedFrames | ForEach-Object { $_.SourceIndex })
            frames = @($saved.Paths | ForEach-Object { $_.Replace($ProjectRoot + '\', '') -replace '\\','/' })
        }
    }

    foreach ($frame in $frames) {
        $frame.Bitmap.Dispose()
    }

    $catalog += [PSCustomObject][ordered]@{
        variantId = $entry.variantId
        category = $entry.category
        monster = $entry.monster
        version = $version
        sourceKey = $entry.sourceKey
        layout = $entry.layout
        rowMeans = $split.RowMeans
        behaviors = $behaviorEntries
    }
}

$summary = [PSCustomObject][ordered]@{
    generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    totalVariants = $catalog.Count
    totalBehaviors = (($catalog | ForEach-Object { $_.behaviors.Count }) | Measure-Object -Sum).Sum
    totalFrames = (($catalog | ForEach-Object { ($_.behaviors | ForEach-Object { $_.frameCount }) }) | Measure-Object -Sum).Sum
    categories = @(
        $catalog |
        Group-Object category |
        Sort-Object Name |
        ForEach-Object {
            [PSCustomObject][ordered]@{
                category = $_.Name
                variants = $_.Count
                behaviors = (($_.Group | ForEach-Object { $_.behaviors.Count }) | Measure-Object -Sum).Sum
            }
        }
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-catalog.json'), ($catalog | ConvertTo-Json -Depth 10), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-data.js'), ("window.MONSTER_BEHAVIOR_DATA = " + ($catalog | ConvertTo-Json -Depth 10) + ";"), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $ReportRoot 'behavior-summary.json'), ($summary | ConvertTo-Json -Depth 8), $utf8NoBom)

Write-Output ("Behavior variants: " + $catalog.Count)
Write-Output ("Behavior frames: " + $summary.totalFrames)
