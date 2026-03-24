[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$SourceRoot = (
    Get-ChildItem -LiteralPath 'E:\AI\game' -Directory |
    Where-Object { $_.Name -like 'Kimi_Agent_*' } |
    Sort-Object Name |
    Select-Object -First 1 -ExpandProperty FullName
)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutRoot = Join-Path $ProjectRoot 'generated_assets\monster_preview'
$MetaRoot = Join-Path $OutRoot 'metadata'
$ReportRoot = Join-Path $OutRoot 'reports'
$FramesRoot = Join-Path $OutRoot 'frames'

$Monsters = @(
    'bat','bear','bee','chick','crab','duck3','fox','ghost','goose','mimic','mother',
    'nibei','panther','pigeon','rabbit2','snail','snake','tiaotiao','tiezhua',
    'turtle','wolf_king','yinya'
)

$SourceFolders = @(
    'monsters',
    'monsters_sprites',
    'monsters_sprites_v2',
    'monsters_v1',
    'monsters_v2',
    'monsters_v3',
    'monsters_v4',
    'monsters_v5',
    'monsters_v6',
    'monsters_v7',
    'monsters_v8',
    'monsters_v9',
    'monsters_v10'
)

$GameTypeMap = @{
    bat = @{ tier = 1; role = 'flying_small'; displayName = 'Bat' }
    bear = @{ tier = 2; role = 'tank'; displayName = 'Bear' }
    bee = @{ tier = 2; role = 'flying_speed'; displayName = 'Bee' }
    chick = @{ tier = 1; role = 'flying_small'; displayName = 'Chick' }
    crab = @{ tier = 2; role = 'tank'; displayName = 'Crab' }
    duck3 = @{ tier = 1; role = 'ground_small'; displayName = 'Duck3' }
    fox = @{ tier = 2; role = 'ranged'; displayName = 'Fox' }
    ghost = @{ tier = 3; role = 'ethereal'; displayName = 'Ghost' }
    goose = @{ tier = 2; role = 'ranged'; displayName = 'Goose' }
    mimic = @{ tier = 3; role = 'boss_like'; displayName = 'Mimic' }
    mother = @{ tier = 4; role = 'boss'; displayName = 'Mother' }
    nibei = @{ tier = 2; role = 'tank'; displayName = 'Nibei' }
    panther = @{ tier = 2; role = 'speed'; displayName = 'Panther' }
    pigeon = @{ tier = 1; role = 'flying_small'; displayName = 'Pigeon' }
    rabbit2 = @{ tier = 2; role = 'speed'; displayName = 'Rabbit2' }
    snail = @{ tier = 1; role = 'ground_small'; displayName = 'Snail' }
    snake = @{ tier = 2; role = 'ranged'; displayName = 'Snake' }
    tiaotiao = @{ tier = 2; role = 'assassin'; displayName = 'Tiaotiao' }
    tiezhua = @{ tier = 2; role = 'assassin'; displayName = 'Tiezhua' }
    turtle = @{ tier = 3; role = 'boss_like'; displayName = 'Turtle' }
    wolf_king = @{ tier = 3; role = 'boss_like'; displayName = 'Wolf King' }
    yinya = @{ tier = 2; role = 'assassin'; displayName = 'Yinya' }
}

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

function ConvertTo-JsonLiteral {
    param([object]$Value)
    return ($Value | ConvertTo-Json -Depth 12)
}

function Smooth-Array {
    param([double[]]$Values, [int]$Radius = 2)
    $out = New-Object 'double[]' $Values.Length
    for ($i = 0; $i -lt $Values.Length; $i++) {
        $sum = 0.0
        $count = 0
        for ($j = [Math]::Max(0, $i - $Radius); $j -le [Math]::Min($Values.Length - 1, $i + $Radius); $j++) {
            $sum += $Values[$j]
            $count++
        }
        $out[$i] = $sum / [Math]::Max(1, $count)
    }
    return $out
}

function Find-Bounds {
    param([double[]]$Values, [double]$Threshold)
    $start = 0
    $end = $Values.Length - 1
    while ($start -lt $Values.Length -and $Values[$start] -lt $Threshold) { $start++ }
    while ($end -ge 0 -and $Values[$end] -lt $Threshold) { $end-- }
    if ($start -ge $end) {
        return @{ Start = 0; End = $Values.Length - 1 }
    }
    return @{ Start = $start; End = $end }
}

function Get-BlurDiffProfile {
    param([System.Drawing.Bitmap]$Bitmap)
    $maxDim = [Math]::Max($Bitmap.Width, $Bitmap.Height)
    $scale = [Math]::Min(1.0, 320.0 / $maxDim)
    $sampleW = [Math]::Max(48, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(48, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = New-Object System.Drawing.Bitmap $sampleW, $sampleH
    $g = [System.Drawing.Graphics]::FromImage($sample)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $g.Dispose()

    $blurW = [Math]::Max(24, [int]($sampleW / 8))
    $blurH = [Math]::Max(24, [int]($sampleH / 8))
    $blurSmall = New-Object System.Drawing.Bitmap $blurW, $blurH
    $blurGraphics = [System.Drawing.Graphics]::FromImage($blurSmall)
    $blurGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $blurGraphics.DrawImage($sample, 0, 0, $blurW, $blurH)
    $blurGraphics.Dispose()

    $blurModel = New-Object System.Drawing.Bitmap $sampleW, $sampleH
    $modelGraphics = [System.Drawing.Graphics]::FromImage($blurModel)
    $modelGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $modelGraphics.DrawImage($blurSmall, 0, 0, $sampleW, $sampleH)
    $modelGraphics.Dispose()
    $blurSmall.Dispose()

    $row = New-Object 'double[]' $sampleH
    $col = New-Object 'double[]' $sampleW
    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            $pixel = $sample.GetPixel($x, $y)
            $model = $blurModel.GetPixel($x, $y)
            $diff = [Math]::Abs($pixel.R - $model.R) + [Math]::Abs($pixel.G - $model.G) + [Math]::Abs($pixel.B - $model.B)
            $row[$y] += $diff
            $col[$x] += $diff
        }
    }
    $sample.Dispose()
    $blurModel.Dispose()

    return [PSCustomObject]@{
        Row = (Smooth-Array -Values $row)
        Col = (Smooth-Array -Values $col)
    }
}

function Count-Clusters {
    param([double[]]$Values, [double]$Threshold, [int]$MinRun = 4)
    $clusters = 0
    $run = 0
    foreach ($value in $Values) {
        if ($value -ge $Threshold) {
            $run++
        } else {
            if ($run -ge $MinRun) { $clusters++ }
            $run = 0
        }
    }
    if ($run -ge $MinRun) { $clusters++ }
    return $clusters
}

function Get-MedianValue {
    param([double[]]$Values)
    if (-not $Values -or $Values.Length -eq 0) { return 0.0 }
    $sorted = $Values | Sort-Object
    $mid = [int]([Math]::Floor($sorted.Count / 2))
    if (($sorted.Count % 2) -eq 1) {
        return [double]$sorted[$mid]
    }
    return ([double]$sorted[$mid - 1] + [double]$sorted[$mid]) / 2.0
}

function Test-ExpandedIntersection {
    param([object]$A, [object]$B, [int]$PadX, [int]$PadY)
    $leftA = $A.X - $PadX
    $topA = $A.Y - $PadY
    $rightA = $A.X + $A.Width + $PadX
    $bottomA = $A.Y + $A.Height + $PadY
    $leftB = $B.X - $PadX
    $topB = $B.Y - $PadY
    $rightB = $B.X + $B.Width + $PadX
    $bottomB = $B.Y + $B.Height + $PadY
    return ($leftA -lt $rightB -and $rightA -gt $leftB -and $topA -lt $bottomB -and $bottomA -gt $topB)
}

function Merge-ComponentBoxes {
    param([array]$Boxes)
    if ($Boxes.Count -le 1) { return $Boxes }
    $changed = $true
    $result = @($Boxes)
    while ($changed) {
        $changed = $false
        for ($i = 0; $i -lt $result.Count; $i++) {
            for ($j = $i + 1; $j -lt $result.Count; $j++) {
                $padX = [int][Math]::Max(4, [Math]::Round([Math]::Min($result[$i].Width, $result[$j].Width) * 0.22))
                $padY = [int][Math]::Max(4, [Math]::Round([Math]::Min($result[$i].Height, $result[$j].Height) * 0.22))
                if (Test-ExpandedIntersection -A $result[$i] -B $result[$j] -PadX $padX -PadY $padY) {
                    $merged = [PSCustomObject]@{
                        X = [Math]::Min($result[$i].X, $result[$j].X)
                        Y = [Math]::Min($result[$i].Y, $result[$j].Y)
                        Width = [Math]::Max($result[$i].X + $result[$i].Width, $result[$j].X + $result[$j].Width) - [Math]::Min($result[$i].X, $result[$j].X)
                        Height = [Math]::Max($result[$i].Y + $result[$i].Height, $result[$j].Y + $result[$j].Height) - [Math]::Min($result[$i].Y, $result[$j].Y)
                        Area = $result[$i].Area + $result[$j].Area
                    }
                    $temp = @()
                    for ($k = 0; $k -lt $result.Count; $k++) {
                        if ($k -ne $i -and $k -ne $j) { $temp += $result[$k] }
                    }
                    $temp += $merged
                    $result = $temp
                    $changed = $true
                    break
                }
            }
            if ($changed) { break }
        }
    }
    return $result
}

function Get-ProjectionSegments {
    param([double[]]$Values, [double]$Threshold, [int]$MinRun = 4, [int]$Pad = 2)
    $segments = @()
    $start = -1
    for ($i = 0; $i -lt $Values.Length; $i++) {
        if ($Values[$i] -ge $Threshold) {
            if ($start -lt 0) { $start = $i }
        } elseif ($start -ge 0) {
            if (($i - $start) -ge $MinRun) {
                $segments += [PSCustomObject]@{
                    Start = [Math]::Max(0, $start - $Pad)
                    End = [Math]::Min($Values.Length - 1, ($i - 1) + $Pad)
                }
            }
            $start = -1
        }
    }
    if ($start -ge 0 -and (($Values.Length - $start) -ge $MinRun)) {
        $segments += [PSCustomObject]@{
            Start = [Math]::Max(0, $start - $Pad)
            End = $Values.Length - 1
        }
    }
    return $segments
}

function Merge-CloseSegments {
    param([array]$Segments, [int]$GapThreshold = 4)
    if ($Segments.Count -le 1) { return $Segments }
    $sorted = @($Segments | Sort-Object Start)
    $merged = @($sorted[0])
    for ($i = 1; $i -lt $sorted.Count; $i++) {
        $last = $merged[-1]
        $gap = $sorted[$i].Start - $last.End - 1
        if ($gap -le $GapThreshold) {
            $merged[-1] = [PSCustomObject]@{
                Start = $last.Start
                End = [Math]::Max($last.End, $sorted[$i].End)
            }
        } else {
            $merged += $sorted[$i]
        }
    }
    return $merged
}

function Filter-SegmentsByStrength {
    param([double[]]$Values, [array]$Segments)
    if ($Segments.Count -le 1) { return $Segments }
    $stats = @(
        $Segments | ForEach-Object {
            $slice = $Values[$_.Start..$_.End]
            [PSCustomObject]@{
                Start = $_.Start
                End = $_.End
                Length = ($_.End - $_.Start + 1)
                Avg = (($slice | Measure-Object -Average).Average)
            }
        }
    )
    $medianLength = Get-MedianValue -Values @($stats | ForEach-Object { [double]$_.Length })
    $medianAvg = Get-MedianValue -Values @($stats | ForEach-Object { [double]$_.Avg })
    $filtered = @(
        $stats | Where-Object {
            $_.Avg -ge ($medianAvg * 0.58) -and $_.Length -ge [Math]::Max(4, $medianLength * 0.46)
        } | ForEach-Object {
            [PSCustomObject]@{ Start = $_.Start; End = $_.End }
        }
    )
    if ($filtered.Count -eq 0) { return $Segments }
    return $filtered
}

function Get-CellRangesFromSegments {
    param([array]$Segments, [int]$AxisLength)
    if ($Segments.Count -le 0) {
        return @([PSCustomObject]@{ Start = 0; End = $AxisLength - 1 })
    }
    if ($Segments.Count -eq 1) {
        return @([PSCustomObject]@{ Start = 0; End = $AxisLength - 1 })
    }
    $centers = @($Segments | ForEach-Object { ($_.Start + $_.End) / 2.0 })
    $gaps = @()
    for ($i = 1; $i -lt $centers.Count; $i++) {
        $gaps += ($centers[$i] - $centers[$i - 1])
    }
    $avgGap = if ($gaps.Count -gt 0) { (($gaps | Measure-Object -Average).Average) } else { $AxisLength }
    $pad = [int][Math]::Round($avgGap * 0.14)
    $ranges = @()
    for ($i = 0; $i -lt $centers.Count; $i++) {
        $left = if ($i -eq 0) {
            0
        } else {
            [int]([Math]::Floor(($centers[$i - 1] + $centers[$i]) / 2.0))
        }
        $right = if ($i -eq ($centers.Count - 1)) {
            $AxisLength - 1
        } else {
            [int]([Math]::Ceiling(($centers[$i] + $centers[$i + 1]) / 2.0)) - 1
        }
        $ranges += [PSCustomObject]@{
            Start = [Math]::Max(0, $left - $pad)
            End = [Math]::Min($AxisLength - 1, $right + $pad)
        }
    }
    return $ranges
}

function Get-AxisGroups {
    param([double[]]$Centers, [double]$Tolerance)
    $groups = @()
    foreach ($center in ($Centers | Sort-Object)) {
        $placed = $false
        for ($i = 0; $i -lt $groups.Count; $i++) {
            if ([Math]::Abs($center - $groups[$i].Center) -le $Tolerance) {
                $items = @($groups[$i].Items)
                $items += $center
                $groups[$i] = [PSCustomObject]@{
                    Center = (($items | Measure-Object -Average).Average)
                    Items = $items
                }
                $placed = $true
                break
            }
        }
        if (-not $placed) {
            $groups += [PSCustomObject]@{
                Center = $center
                Items = @($center)
            }
        }
    }
    return @($groups | Sort-Object Center)
}

function Get-NearestAxisGroupIndex {
    param([double]$Center, [array]$Groups)
    $best = 0
    $bestDist = [double]::MaxValue
    for ($i = 0; $i -lt $Groups.Count; $i++) {
        $dist = [Math]::Abs($Center - $Groups[$i].Center)
        if ($dist -lt $bestDist) {
            $best = $i
            $bestDist = $dist
        }
    }
    return $best
}

function Merge-BoundingBox {
    param([object]$A, [object]$B)
    $left = [Math]::Min($A.X, $B.X)
    $top = [Math]::Min($A.Y, $B.Y)
    $right = [Math]::Max($A.X + $A.Width, $B.X + $B.Width)
    $bottom = [Math]::Max($A.Y + $A.Height, $B.Y + $B.Height)
    return [PSCustomObject]@{
        X = $left
        Y = $top
        Width = $right - $left
        Height = $bottom - $top
        Area = $A.Area + $B.Area
        CenterX = $left + (($right - $left) / 2.0)
        CenterY = $top + (($bottom - $top) / 2.0)
    }
}

function Get-BitmapTransparencyRatio {
    param([System.Drawing.Bitmap]$Bitmap)
    $stepX = [Math]::Max(1, [int]($Bitmap.Width / 40))
    $stepY = [Math]::Max(1, [int]($Bitmap.Height / 40))
    $transparent = 0
    $samples = 0
    for ($y = 0; $y -lt $Bitmap.Height; $y += $stepY) {
        for ($x = 0; $x -lt $Bitmap.Width; $x += $stepX) {
            $samples++
            if ($Bitmap.GetPixel($x, $y).A -lt 245) {
                $transparent++
            }
        }
    }
    return ($transparent / [Math]::Max(1, $samples))
}

function Get-AlphaComponentScan {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [int]$MaxDim = 384,
        [int]$AlphaThreshold = 12
    )
    $scale = [Math]::Min(1.0, $MaxDim / [Math]::Max($Bitmap.Width, $Bitmap.Height))
    $sampleW = [Math]::Max(96, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(96, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = [System.Drawing.Bitmap]::new($sampleW, $sampleH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($sample)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $graphics.Dispose()

    $count = $sampleW * $sampleH
    $visited = [bool[]]::new($count)
    $components = @()
    $minArea = [Math]::Max(8, [int]($count * 0.00005))

    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            $idx = ($y * $sampleW) + $x
            if ($visited[$idx]) { continue }
            $visited[$idx] = $true
            if ($sample.GetPixel($x, $y).A -lt $AlphaThreshold) { continue }

            $queue = [System.Collections.Generic.Queue[int]]::new()
            $queue.Enqueue($idx)
            $area = 0
            $minX = $x
            $minY = $y
            $maxX = $x
            $maxY = $y

            while ($queue.Count -gt 0) {
                $current = $queue.Dequeue()
                $cx = $current % $sampleW
                $cy = [int][Math]::Floor($current / $sampleW)
                $area++
                if ($cx -lt $minX) { $minX = $cx }
                if ($cy -lt $minY) { $minY = $cy }
                if ($cx -gt $maxX) { $maxX = $cx }
                if ($cy -gt $maxY) { $maxY = $cy }

                for ($ny = [Math]::Max(0, $cy - 1); $ny -le [Math]::Min($sampleH - 1, $cy + 1); $ny++) {
                    for ($nx = [Math]::Max(0, $cx - 1); $nx -le [Math]::Min($sampleW - 1, $cx + 1); $nx++) {
                        $nIdx = ($ny * $sampleW) + $nx
                        if ($visited[$nIdx]) { continue }
                        $visited[$nIdx] = $true
                        if ($sample.GetPixel($nx, $ny).A -ge $AlphaThreshold) {
                            $queue.Enqueue($nIdx)
                        }
                    }
                }
            }

            if ($area -ge $minArea) {
                $components += [PSCustomObject]@{
                    X = $minX
                    Y = $minY
                    Width = $maxX - $minX + 1
                    Height = $maxY - $minY + 1
                    Area = $area
                    CenterX = $minX + (($maxX - $minX + 1) / 2.0)
                    CenterY = $minY + (($maxY - $minY + 1) / 2.0)
                }
            }
        }
    }
    $sample.Dispose()

    return [PSCustomObject]@{
        Boxes = @($components | Sort-Object Area -Descending)
        SampleWidth = $sampleW
        SampleHeight = $sampleH
        ScaleX = ($Bitmap.Width / $sampleW)
        ScaleY = ($Bitmap.Height / $sampleH)
    }
}

function Get-CoreComponentCount {
    param([array]$Boxes)
    if ($Boxes.Count -le 1) { return $Boxes.Count }
    $areas = @($Boxes | ForEach-Object { [double]$_.Area })
    $bestRatio = 1.0
    $bestIndex = 0
    $limit = [Math]::Min(18, $areas.Count - 1)
    for ($i = 0; $i -lt $limit; $i++) {
        $next = [Math]::Max(1.0, $areas[$i + 1])
        $ratio = $areas[$i] / $next
        if ($ratio -gt $bestRatio) {
            $bestRatio = $ratio
            $bestIndex = $i
        }
    }
    if ($bestRatio -lt 1.65) {
        $threshold = $areas[0] * 0.42
        return [Math]::Max(1, @($areas | Where-Object { $_ -ge $threshold }).Count)
    }
    return ($bestIndex + 1)
}

function Get-LayoutLabel {
    param([array]$RowIndexes)
    if ($RowIndexes.Count -eq 0) { return 'single' }
    $counts = @(
        $RowIndexes |
        Group-Object |
        Sort-Object { [int]$_.Name } |
        ForEach-Object { $_.Count }
    )
    if ($counts.Count -eq 1 -and $counts[0] -eq 1) {
        return 'single'
    }
    if (($counts | Select-Object -Unique).Count -eq 1) {
        return ('{0}x{1}' -f $counts[0], $counts.Count)
    }
    return ($counts -join '/')
}

function Get-AlphaFrameDetection {
    param([System.Drawing.Bitmap]$Bitmap)
    if ((Get-BitmapTransparencyRatio -Bitmap $Bitmap) -lt 0.12) {
        return $null
    }

    $scan = Get-AlphaComponentScan -Bitmap $Bitmap
    if ($scan.Boxes.Count -eq 0) {
        return $null
    }

    $coreCount = Get-CoreComponentCount -Boxes $scan.Boxes
    $coreBoxes = @($scan.Boxes | Select-Object -First $coreCount)
    if ($coreBoxes.Count -eq 0) {
        return $null
    }

    $medianWidth = Get-MedianValue -Values @($coreBoxes | ForEach-Object { [double]$_.Width })
    $medianHeight = Get-MedianValue -Values @($coreBoxes | ForEach-Object { [double]$_.Height })
    $medianArea = Get-MedianValue -Values @($coreBoxes | ForEach-Object { [double]$_.Area })
    $rowGroups = Get-AxisGroups -Centers @($coreBoxes | ForEach-Object { [double]$_.CenterY }) -Tolerance ([Math]::Max(8, $medianHeight * 0.62))
    $colGroups = Get-AxisGroups -Centers @($coreBoxes | ForEach-Object { [double]$_.CenterX }) -Tolerance ([Math]::Max(8, $medianWidth * 0.62))
    $frameMap = @{}

    foreach ($box in $coreBoxes) {
        $rowIndex = Get-NearestAxisGroupIndex -Center $box.CenterY -Groups $rowGroups
        $colIndex = Get-NearestAxisGroupIndex -Center $box.CenterX -Groups $colGroups
        $key = "$rowIndex|$colIndex"
        if ($frameMap.ContainsKey($key)) {
            $frameMap[$key] = Merge-BoundingBox -A $frameMap[$key] -B $box
        } else {
            $frameMap[$key] = $box
        }
    }

    foreach ($box in ($scan.Boxes | Select-Object -Skip $coreCount)) {
        if ($box.Area -lt [Math]::Max(8, $medianArea * 0.015)) { continue }
        if (
            $box.CenterX -gt ($scan.SampleWidth * 0.88) -and
            $box.CenterY -gt ($scan.SampleHeight * 0.88) -and
            $box.Area -lt ($medianArea * 0.08)
        ) {
            continue
        }

        $bestKey = $null
        $bestScore = [double]::MaxValue
        foreach ($key in $frameMap.Keys) {
            $candidate = $frameMap[$key]
            $padX = [int][Math]::Max(6, [Math]::Round($candidate.Width * 0.18))
            $padY = [int][Math]::Max(6, [Math]::Round($candidate.Height * 0.18))
            if (-not (Test-ExpandedIntersection -A $candidate -B $box -PadX $padX -PadY $padY)) { continue }
            $score = [Math]::Abs($candidate.CenterX - $box.CenterX) + [Math]::Abs($candidate.CenterY - $box.CenterY)
            if ($score -lt $bestScore) {
                $bestScore = $score
                $bestKey = $key
            }
        }
        if ($bestKey) {
            $frameMap[$bestKey] = Merge-BoundingBox -A $frameMap[$bestKey] -B $box
        }
    }

    $sortedFrames = @(
        $frameMap.GetEnumerator() |
        ForEach-Object {
            $parts = $_.Key.Split('|')
            [PSCustomObject]@{
                RowIndex = [int]$parts[0]
                ColIndex = [int]$parts[1]
                Box = $_.Value
            }
        } |
        Sort-Object RowIndex, ColIndex
    )
    if ($sortedFrames.Count -eq 0) {
        return $null
    }

    $boxes = @()
    foreach ($item in $sortedFrames) {
        $padX = [int][Math]::Max(2, [Math]::Round($item.Box.Width * 0.03))
        $padY = [int][Math]::Max(2, [Math]::Round($item.Box.Height * 0.03))
        $left = [Math]::Max(0, [Math]::Floor(($item.Box.X - $padX) * $scan.ScaleX))
        $top = [Math]::Max(0, [Math]::Floor(($item.Box.Y - $padY) * $scan.ScaleY))
        $right = [Math]::Min($Bitmap.Width, [Math]::Ceiling(($item.Box.X + $item.Box.Width + $padX) * $scan.ScaleX))
        $bottom = [Math]::Min($Bitmap.Height, [Math]::Ceiling(($item.Box.Y + $item.Box.Height + $padY) * $scan.ScaleY))
        $boxes += [PSCustomObject]@{
            X = [int]$left
            Y = [int]$top
            Width = [int][Math]::Max(1, $right - $left)
            Height = [int][Math]::Max(1, $bottom - $top)
        }
    }

    return [PSCustomObject]@{
        Boxes = $boxes
        Kind = if ($boxes.Count -gt 1) { 'sheet' } else { 'single' }
        Layout = Get-LayoutLabel -RowIndexes @($sortedFrames | ForEach-Object { $_.RowIndex })
    }
}

function Get-ProjectionFrameDetection {
    param([System.Drawing.Bitmap]$Bitmap)
    $profile = Get-BlurDiffProfile -Bitmap $Bitmap
    $rowRadius = [Math]::Max(4, [int]($profile.Row.Length / 28))
    $colRadius = [Math]::Max(4, [int]($profile.Col.Length / 28))
    $rowSignal = Smooth-Array -Values (Smooth-Array -Values $profile.Row -Radius $rowRadius) -Radius $rowRadius
    $colSignal = Smooth-Array -Values (Smooth-Array -Values $profile.Col -Radius $colRadius) -Radius $colRadius
    $rowMargin = [Math]::Max(4, [int]($rowSignal.Length * 0.1))
    $colMargin = [Math]::Max(4, [int]($colSignal.Length * 0.1))
    $rowBase = (($rowSignal[0..($rowMargin - 1)] + $rowSignal[($rowSignal.Length - $rowMargin)..($rowSignal.Length - 1)]) | Measure-Object -Average).Average
    $colBase = (($colSignal[0..($colMargin - 1)] + $colSignal[($colSignal.Length - $colMargin)..($colSignal.Length - 1)]) | Measure-Object -Average).Average
    $rowMax = ($rowSignal | Measure-Object -Maximum).Maximum
    $colMax = ($colSignal | Measure-Object -Maximum).Maximum
    $rowThreshold = [Math]::Max($rowBase + (($rowMax - $rowBase) * 0.26), $rowBase + 120)
    $colThreshold = [Math]::Max($colBase + (($colMax - $colBase) * 0.26), $colBase + 120)
    $rowSegments = @(Get-ProjectionSegments -Values $rowSignal -Threshold $rowThreshold -MinRun ([Math]::Max(6, $rowRadius)) -Pad 2)
    $colSegments = @(Get-ProjectionSegments -Values $colSignal -Threshold $colThreshold -MinRun ([Math]::Max(6, $colRadius)) -Pad 2)
    $rowSegments = @(Merge-CloseSegments -Segments $rowSegments -GapThreshold ([Math]::Max(4, [int]($rowRadius * 1.5))))
    $colSegments = @(Merge-CloseSegments -Segments $colSegments -GapThreshold ([Math]::Max(4, [int]($colRadius * 1.5))))
    $rowSegments = @(Filter-SegmentsByStrength -Values $rowSignal -Segments $rowSegments)
    $colSegments = @(Filter-SegmentsByStrength -Values $colSignal -Segments $colSegments)
    if ($rowSegments.Count -eq 0) {
        $rowSegments = @([PSCustomObject]@{ Start = 0; End = $rowSignal.Length - 1 })
    }
    if ($colSegments.Count -eq 0) {
        $colSegments = @([PSCustomObject]@{ Start = 0; End = $colSignal.Length - 1 })
    }
    if ($rowSegments.Count -le 1 -and $colSegments.Count -le 1) {
        return [PSCustomObject]@{
            Boxes = @([PSCustomObject]@{ X = 0; Y = 0; Width = $Bitmap.Width; Height = $Bitmap.Height })
            Kind = 'single'
            Layout = 'single'
        }
    }
    if (($rowSegments.Count * $colSegments.Count) -gt 25) {
        return [PSCustomObject]@{
            Boxes = @([PSCustomObject]@{ X = 0; Y = 0; Width = $Bitmap.Width; Height = $Bitmap.Height })
            Kind = 'single'
            Layout = 'single'
        }
    }
    $rowCount = $rowSegments.Count
    $colCount = $colSegments.Count
    $cellWidth = $Bitmap.Width / $colCount
    $cellHeight = $Bitmap.Height / $rowCount
    $boxes = @()
    for ($row = 0; $row -lt $rowCount; $row++) {
        for ($col = 0; $col -lt $colCount; $col++) {
            $left = [int]([Math]::Floor($col * $cellWidth))
            $top = [int]([Math]::Floor($row * $cellHeight))
            $right = [int]([Math]::Ceiling(($col + 1) * $cellWidth))
            $bottom = [int]([Math]::Ceiling(($row + 1) * $cellHeight))
            $boxes += [PSCustomObject]@{
                X = $left
                Y = $top
                Width = [Math]::Max(1, [Math]::Min($Bitmap.Width, $right) - $left)
                Height = [Math]::Max(1, [Math]::Min($Bitmap.Height, $bottom) - $top)
            }
        }
    }
    return [PSCustomObject]@{
        Boxes = $boxes
        Kind = 'sheet'
        Layout = ('{0}x{1}' -f $colCount, $rowCount)
    }
}

function Get-ImageFrameDetection {
    param([System.Drawing.Bitmap]$Bitmap)
    $alphaDetection = Get-AlphaFrameDetection -Bitmap $Bitmap
    if ($alphaDetection -and $alphaDetection.Boxes.Count -gt 0) {
        return $alphaDetection
    }
    $maxDim = [Math]::Max($Bitmap.Width, $Bitmap.Height)
    $scale = [Math]::Min(1.0, 256.0 / $maxDim)
    $sampleW = [Math]::Max(96, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(96, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = [System.Drawing.Bitmap]::new($sampleW, $sampleH)
    $graphics = [System.Drawing.Graphics]::FromImage($sample)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $graphics.Dispose()

    $blurW = [Math]::Max(24, [int]($sampleW / 9))
    $blurH = [Math]::Max(24, [int]($sampleH / 9))
    $blurSmall = [System.Drawing.Bitmap]::new($blurW, $blurH)
    $blurGraphics = [System.Drawing.Graphics]::FromImage($blurSmall)
    $blurGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $blurGraphics.DrawImage($sample, 0, 0, $blurW, $blurH)
    $blurGraphics.Dispose()

    $blurModel = [System.Drawing.Bitmap]::new($sampleW, $sampleH)
    $modelGraphics = [System.Drawing.Graphics]::FromImage($blurModel)
    $modelGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $modelGraphics.DrawImage($blurSmall, 0, 0, $sampleW, $sampleH)
    $modelGraphics.Dispose()
    $blurSmall.Dispose()

    $count = $sampleW * $sampleH
    $diff = [int[]]::new($count)
    $sum = 0.0
    $maxDiff = 0
    $cornerSum = 0.0
    $cornerCount = 0
    $cornerW = [Math]::Max(12, [int]($sampleW * 0.18))
    $cornerH = [Math]::Max(12, [int]($sampleH * 0.18))
    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            $pixel = $sample.GetPixel($x, $y)
            $model = $blurModel.GetPixel($x, $y)
            $value = [int]([Math]::Abs($pixel.R - $model.R) + [Math]::Abs($pixel.G - $model.G) + [Math]::Abs($pixel.B - $model.B))
            $idx = ($y * $sampleW) + $x
            $diff[$idx] = $value
            $sum += $value
            if ($value -gt $maxDiff) { $maxDiff = $value }
            $isCorner = (
                (($x -lt $cornerW) -or ($x -ge ($sampleW - $cornerW))) -and
                (($y -lt $cornerH) -or ($y -ge ($sampleH - $cornerH)))
            )
            if ($isCorner) {
                $cornerSum += $value
                $cornerCount++
            }
        }
    }
    $sample.Dispose()
    $blurModel.Dispose()

    $globalMean = $sum / [Math]::Max(1, $count)
    $cornerMean = $cornerSum / [Math]::Max(1, $cornerCount)
    $threshold = [Math]::Max([Math]::Max($cornerMean + 24, $globalMean * 1.22), [Math]::Max($maxDiff * 0.16, 22))
    $minArea = [Math]::Max(18, [int]($count * 0.00018))
    $visited = [bool[]]::new($count)
    $components = @()

    for ($idx = 0; $idx -lt $count; $idx++) {
        if ($visited[$idx] -or $diff[$idx] -lt $threshold) { continue }
        $queue = [System.Collections.Generic.Queue[int]]::new()
        $queue.Enqueue($idx)
        $visited[$idx] = $true
        $area = 0
        $minX = $sampleW
        $minY = $sampleH
        $maxX = 0
        $maxY = 0

        while ($queue.Count -gt 0) {
            $current = $queue.Dequeue()
            $x = $current % $sampleW
            $y = [int][Math]::Floor($current / $sampleW)
            $area++
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }

            for ($ny = [Math]::Max(0, $y - 1); $ny -le [Math]::Min($sampleH - 1, $y + 1); $ny++) {
                for ($nx = [Math]::Max(0, $x - 1); $nx -le [Math]::Min($sampleW - 1, $x + 1); $nx++) {
                    $nIdx = ($ny * $sampleW) + $nx
                    if (-not $visited[$nIdx] -and $diff[$nIdx] -ge $threshold) {
                        $visited[$nIdx] = $true
                        $queue.Enqueue($nIdx)
                    }
                }
            }
        }

        if ($area -ge $minArea) {
            $components += [PSCustomObject]@{
                X = $minX
                Y = $minY
                Width = ($maxX - $minX + 1)
                Height = ($maxY - $minY + 1)
                Area = $area
            }
        }
    }

    $projectionDetection = Get-ProjectionFrameDetection -Bitmap $Bitmap
    if ($components.Count -eq 0) {
        return $projectionDetection
    }

    $components = Merge-ComponentBoxes -Boxes $components
    if ($components.Count -gt 1) {
        $medianArea = Get-MedianValue -Values @($components | ForEach-Object { [double]$_.Area })
        $minKeep = [Math]::Max(18, $medianArea * 0.22)
        $components = @(
            $components | Where-Object {
                $_.Area -ge $minKeep -and -not (
                    ($_.X + $_.Width / 2) -gt ($sampleW * 0.86) -and
                    ($_.Y + $_.Height / 2) -gt ($sampleH * 0.88) -and
                    $_.Height -lt ($sampleH * 0.12)
                )
            }
        )
    }
    if ($components.Count -eq 0) {
        $components = @([PSCustomObject]@{ X = 0; Y = 0; Width = $sampleW; Height = $sampleH; Area = ($sampleW * $sampleH) })
    }

    $scaleX = $Bitmap.Width / $sampleW
    $scaleY = $Bitmap.Height / $sampleH
    $scaledBoxes = @(
        $components | ForEach-Object {
            [PSCustomObject]@{
                X = [int]([Math]::Floor($_.X * $scaleX))
                Y = [int]([Math]::Floor($_.Y * $scaleY))
                Width = [int]([Math]::Ceiling($_.Width * $scaleX))
                Height = [int]([Math]::Ceiling($_.Height * $scaleY))
                Area = $_.Area
                CenterX = $_.X + ($_.Width / 2.0)
                CenterY = $_.Y + ($_.Height / 2.0)
                SampleWidth = $_.Width
                SampleHeight = $_.Height
            }
        }
    )

    $componentDetection = $null
    if ($scaledBoxes.Count -gt 1) {
        $medianWidth = Get-MedianValue -Values @($scaledBoxes | ForEach-Object { [double]$_.SampleWidth })
        $medianHeight = Get-MedianValue -Values @($scaledBoxes | ForEach-Object { [double]$_.SampleHeight })
        $rowGroups = Get-AxisGroups -Centers @($scaledBoxes | ForEach-Object { [double]$_.CenterY }) -Tolerance ([Math]::Max(10, $medianHeight * 0.65))
        $colGroups = Get-AxisGroups -Centers @($scaledBoxes | ForEach-Object { [double]$_.CenterX }) -Tolerance ([Math]::Max(10, $medianWidth * 0.65))
        $sortedBoxes = @(
            $scaledBoxes | Sort-Object `
                @{ Expression = {
                    $center = $_.CenterY
                    $best = 0
                    $bestDist = [double]::MaxValue
                    for ($i = 0; $i -lt $rowGroups.Count; $i++) {
                        $dist = [Math]::Abs($center - $rowGroups[$i].Center)
                        if ($dist -lt $bestDist) { $bestDist = $dist; $best = $i }
                    }
                    $best
                } }, `
                @{ Expression = {
                    $center = $_.CenterX
                    $best = 0
                    $bestDist = [double]::MaxValue
                    for ($i = 0; $i -lt $colGroups.Count; $i++) {
                        $dist = [Math]::Abs($center - $colGroups[$i].Center)
                        if ($dist -lt $bestDist) { $bestDist = $dist; $best = $i }
                    }
                    $best
                } }
        )
        $componentDetection = [PSCustomObject]@{
            Boxes = $sortedBoxes
            Kind = 'sheet'
            Layout = ('{0}x{1}' -f $colGroups.Count, $rowGroups.Count)
        }
    } else {
        $componentDetection = [PSCustomObject]@{
            Boxes = $scaledBoxes
            Kind = 'single'
            Layout = 'single'
        }
    }

    if ($projectionDetection.Kind -eq 'sheet') {
        $projectionCount = $projectionDetection.Boxes.Count
        $componentCount = $componentDetection.Boxes.Count
        if ($componentDetection.Kind -eq 'single' -or $projectionCount -ge ($componentCount + 2)) {
            return $projectionDetection
        }
    }
    return $componentDetection
}

function Get-EnergyBox {
    param([System.Drawing.Bitmap]$Bitmap)
    $maxDim = [Math]::Max($Bitmap.Width, $Bitmap.Height)
    $scale = [Math]::Min(1.0, 256.0 / $maxDim)
    $sampleW = [Math]::Max(32, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(32, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = New-Object System.Drawing.Bitmap $sampleW, $sampleH
    $g = [System.Drawing.Graphics]::FromImage($sample)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $g.Dispose()

    $blurW = [Math]::Max(24, [int]($sampleW / 8))
    $blurH = [Math]::Max(24, [int]($sampleH / 8))
    $blurSmall = New-Object System.Drawing.Bitmap $blurW, $blurH
    $blurGraphics = [System.Drawing.Graphics]::FromImage($blurSmall)
    $blurGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $blurGraphics.DrawImage($sample, 0, 0, $blurW, $blurH)
    $blurGraphics.Dispose()

    $blurModel = New-Object System.Drawing.Bitmap $sampleW, $sampleH
    $modelGraphics = [System.Drawing.Graphics]::FromImage($blurModel)
    $modelGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $modelGraphics.DrawImage($blurSmall, 0, 0, $sampleW, $sampleH)
    $modelGraphics.Dispose()
    $blurSmall.Dispose()

    $row = New-Object 'double[]' $sampleH
    $col = New-Object 'double[]' $sampleW
    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            $pixel = $sample.GetPixel($x, $y)
            $model = $blurModel.GetPixel($x, $y)
            $energy = [Math]::Abs($pixel.R - $model.R) + [Math]::Abs($pixel.G - $model.G) + [Math]::Abs($pixel.B - $model.B)
            $row[$y] += $energy
            $col[$x] += $energy
        }
    }
    $blurModel.Dispose()

    $row = Smooth-Array -Values $row
    $col = Smooth-Array -Values $col
    $rowMargin = [Math]::Max(2, [int]($sampleH * 0.1))
    $colMargin = [Math]::Max(2, [int]($sampleW * 0.1))
    $rowBase = (($row[0..($rowMargin - 1)] + $row[($sampleH - $rowMargin)..($sampleH - 1)]) | Measure-Object -Average).Average
    $colBase = (($col[0..($colMargin - 1)] + $col[($sampleW - $colMargin)..($sampleW - 1)]) | Measure-Object -Average).Average
    $rowThreshold = [Math]::Max($rowBase * 1.2, $rowBase + 600)
    $colThreshold = [Math]::Max($colBase * 1.18, $colBase + 420)

    $rowBounds = Find-Bounds -Values $row -Threshold $rowThreshold
    $colBounds = Find-Bounds -Values $col -Threshold $colThreshold
    $pad = 6
    $left = [Math]::Max(0, $colBounds.Start - $pad)
    $top = [Math]::Max(0, $rowBounds.Start - $pad)
    $right = [Math]::Min($sampleW - 1, $colBounds.End + $pad)
    $bottom = [Math]::Min($sampleH - 1, $rowBounds.End + $pad)
    $sample.Dispose()

    return [PSCustomObject]@{
        X = [int]([Math]::Floor($left / $scale))
        Y = [int]([Math]::Floor($top / $scale))
        Width = [int]([Math]::Ceiling(($right - $left + 1) / $scale))
        Height = [int]([Math]::Ceiling(($bottom - $top + 1) / $scale))
    }
}

function Get-DominantForegroundBox {
    param([System.Drawing.Bitmap]$Bitmap)
    $maxDim = [Math]::Max($Bitmap.Width, $Bitmap.Height)
    $scale = [Math]::Min(1.0, 192.0 / $maxDim)
    $sampleW = [Math]::Max(72, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(72, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = [System.Drawing.Bitmap]::new($sampleW, $sampleH)
    $graphics = [System.Drawing.Graphics]::FromImage($sample)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $graphics.Dispose()

    $blurW = [Math]::Max(18, [int]($sampleW / 8))
    $blurH = [Math]::Max(18, [int]($sampleH / 8))
    $blurSmall = [System.Drawing.Bitmap]::new($blurW, $blurH)
    $blurGraphics = [System.Drawing.Graphics]::FromImage($blurSmall)
    $blurGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $blurGraphics.DrawImage($sample, 0, 0, $blurW, $blurH)
    $blurGraphics.Dispose()

    $blurModel = [System.Drawing.Bitmap]::new($sampleW, $sampleH)
    $modelGraphics = [System.Drawing.Graphics]::FromImage($blurModel)
    $modelGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $modelGraphics.DrawImage($blurSmall, 0, 0, $sampleW, $sampleH)
    $modelGraphics.Dispose()
    $blurSmall.Dispose()

    $count = $sampleW * $sampleH
    $diff = [int[]]::new($count)
    $sum = 0.0
    $maxDiff = 0
    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            $pixel = $sample.GetPixel($x, $y)
            $model = $blurModel.GetPixel($x, $y)
            $value = [int]([Math]::Abs($pixel.R - $model.R) + [Math]::Abs($pixel.G - $model.G) + [Math]::Abs($pixel.B - $model.B))
            $idx = ($y * $sampleW) + $x
            $diff[$idx] = $value
            $sum += $value
            if ($value -gt $maxDiff) { $maxDiff = $value }
        }
    }
    $sample.Dispose()
    $blurModel.Dispose()

    $threshold = [Math]::Max(($sum / [Math]::Max(1, $count) * 1.35), [Math]::Max($maxDiff * 0.18, 18))
    $visited = [bool[]]::new($count)
    $minArea = [Math]::Max(10, [int]($count * 0.00022))
    $components = @()
    for ($idx = 0; $idx -lt $count; $idx++) {
        if ($visited[$idx] -or $diff[$idx] -lt $threshold) { continue }
        $queue = [System.Collections.Generic.Queue[int]]::new()
        $queue.Enqueue($idx)
        $visited[$idx] = $true
        $area = 0
        $minX = $sampleW
        $minY = $sampleH
        $maxX = 0
        $maxY = 0
        while ($queue.Count -gt 0) {
            $current = $queue.Dequeue()
            $x = $current % $sampleW
            $y = [int][Math]::Floor($current / $sampleW)
            $area++
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
            for ($ny = [Math]::Max(0, $y - 1); $ny -le [Math]::Min($sampleH - 1, $y + 1); $ny++) {
                for ($nx = [Math]::Max(0, $x - 1); $nx -le [Math]::Min($sampleW - 1, $x + 1); $nx++) {
                    $nIdx = ($ny * $sampleW) + $nx
                    if (-not $visited[$nIdx] -and $diff[$nIdx] -ge $threshold) {
                        $visited[$nIdx] = $true
                        $queue.Enqueue($nIdx)
                    }
                }
            }
        }
        if ($area -ge $minArea) {
            $components += [PSCustomObject]@{
                X = $minX
                Y = $minY
                Width = $maxX - $minX + 1
                Height = $maxY - $minY + 1
                Area = $area
            }
        }
    }

    if ($components.Count -eq 0) {
        return Get-EnergyBox -Bitmap $Bitmap
    }

    $components = Merge-ComponentBoxes -Boxes $components
    $main = $components | Sort-Object Area -Descending | Select-Object -First 1
    $padX = [int][Math]::Round($main.Width * 0.08)
    $padY = [int][Math]::Round($main.Height * 0.08)
    return [PSCustomObject]@{
        X = [int]([Math]::Max(0, [Math]::Floor(($main.X - $padX) / $scale)))
        Y = [int]([Math]::Max(0, [Math]::Floor(($main.Y - $padY) / $scale)))
        Width = [int]([Math]::Min($Bitmap.Width, [Math]::Ceiling(($main.Width + ($padX * 2)) / $scale)))
        Height = [int]([Math]::Min($Bitmap.Height, [Math]::Ceiling(($main.Height + ($padY * 2)) / $scale)))
    }
}

function Get-AlphaContentBox {
    param([System.Drawing.Bitmap]$Bitmap)
    if ((Get-BitmapTransparencyRatio -Bitmap $Bitmap) -lt 0.03) {
        return $null
    }

    $scale = [Math]::Min(1.0, 256.0 / [Math]::Max($Bitmap.Width, $Bitmap.Height))
    $sampleW = [Math]::Max(64, [int]([Math]::Round($Bitmap.Width * $scale)))
    $sampleH = [Math]::Max(64, [int]([Math]::Round($Bitmap.Height * $scale)))
    $sample = [System.Drawing.Bitmap]::new($sampleW, $sampleH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($sample)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($Bitmap, 0, 0, $sampleW, $sampleH)
    $graphics.Dispose()

    $minX = $sampleW
    $minY = $sampleH
    $maxX = -1
    $maxY = -1
    for ($y = 0; $y -lt $sampleH; $y++) {
        for ($x = 0; $x -lt $sampleW; $x++) {
            if ($sample.GetPixel($x, $y).A -lt 12) { continue }
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
    $sample.Dispose()

    if ($maxX -lt $minX -or $maxY -lt $minY) {
        return $null
    }

    $padX = [int][Math]::Max(2, [Math]::Round(($maxX - $minX + 1) * 0.04))
    $padY = [int][Math]::Max(2, [Math]::Round(($maxY - $minY + 1) * 0.04))
    $left = [Math]::Max(0, [Math]::Floor(($minX - $padX) / $scale))
    $top = [Math]::Max(0, [Math]::Floor(($minY - $padY) / $scale))
    $right = [Math]::Min($Bitmap.Width, [Math]::Ceiling(($maxX + 1 + $padX) / $scale))
    $bottom = [Math]::Min($Bitmap.Height, [Math]::Ceiling(($maxY + 1 + $padY) / $scale))
    return [PSCustomObject]@{
        X = [int]$left
        Y = [int]$top
        Width = [int][Math]::Max(1, $right - $left)
        Height = [int][Math]::Max(1, $bottom - $top)
    }
}

function Merge-Boxes {
    param([array]$Boxes, [int]$MaxWidth, [int]$MaxHeight)
    $left = ($Boxes | Measure-Object X -Minimum).Minimum
    $top = ($Boxes | Measure-Object Y -Minimum).Minimum
    $right = ($Boxes | ForEach-Object { $_.X + $_.Width } | Measure-Object -Maximum).Maximum
    $bottom = ($Boxes | ForEach-Object { $_.Y + $_.Height } | Measure-Object -Maximum).Maximum
    $padX = [int]([Math]::Ceiling(($right - $left) * 0.05))
    $padY = [int]([Math]::Ceiling(($bottom - $top) * 0.05))
    $x = [Math]::Max(0, $left - $padX)
    $y = [Math]::Max(0, $top - $padY)
    $r = [Math]::Min($MaxWidth, $right + $padX)
    $b = [Math]::Min($MaxHeight, $bottom + $padY)
    return [System.Drawing.Rectangle]::FromLTRB($x, $y, $r, $b)
}

function Get-TopLevelFileVariant {
    param([string]$Folder, [string]$Monster)
    $path = Join-Path $SourceRoot "$Folder\$Monster.png"
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    return [PSCustomObject]@{
        Monster = $Monster
        Kind = 'image'
        SourceFolder = $Folder
        SourceKey = "${Folder}_image"
        SourceVersion = $Folder
        Path = $path
    }
}

function Get-FrameDirVariant {
    param([string]$Monster)
    $path = Join-Path $SourceRoot "monsters_v1\$Monster"
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    $frames = @(Get-ChildItem -LiteralPath $path -File -Filter 'frame_*.png' | Sort-Object Name)
    if ($frames.Count -lt 2) { return $null }
    return [PSCustomObject]@{
        Monster = $Monster
        Kind = 'frame_dir'
        SourceFolder = 'monsters_v1'
        SourceKey = 'monsters_v1_frames'
        SourceVersion = 'monsters_v1'
        Path = $path
    }
}

function Get-VariantDefinitions {
    $variants = @()
    foreach ($monster in $Monsters) {
        foreach ($folder in $SourceFolders) {
            $variant = Get-TopLevelFileVariant -Folder $folder -Monster $monster
            if ($variant) { $variants += $variant }
        }
        $frameVariant = Get-FrameDirVariant -Monster $monster
        if ($frameVariant) { $variants += $frameVariant }
    }
    return $variants
}

function Get-FramesForVariant {
    param([object]$Variant)
    $frames = @()
    if ($Variant.Kind -eq 'frame_dir') {
        foreach ($file in (Get-ChildItem -LiteralPath $Variant.Path -File -Filter 'frame_*.png' | Sort-Object Name)) {
            $bmp = [System.Drawing.Bitmap]::FromFile($file.FullName)
            $frames += [PSCustomObject]@{ Index = $frames.Count + 1; Bitmap = $bmp }
        }
        return [PSCustomObject]@{ Frames = $frames; Layout = 'sequence' }
    }

    $bmp = [System.Drawing.Bitmap]::FromFile($Variant.Path)
    if ($Variant.Kind -eq 'image') {
        $detection = Get-ImageFrameDetection -Bitmap $bmp
        foreach ($box in $detection.Boxes) {
            $rect = [System.Drawing.Rectangle]::FromLTRB(
                [Math]::Max(0, $box.X),
                [Math]::Max(0, $box.Y),
                [Math]::Min($bmp.Width, $box.X + $box.Width),
                [Math]::Min($bmp.Height, $box.Y + $box.Height)
            )
            if ($rect.Width -lt 8 -or $rect.Height -lt 8) { continue }
            $clone = $bmp.Clone($rect, $bmp.PixelFormat)
            $frames += [PSCustomObject]@{ Index = $frames.Count + 1; Bitmap = $clone }
        }
        $bmp.Dispose()
        if ($frames.Count -eq 0) {
            $fallback = [System.Drawing.Bitmap]::FromFile($Variant.Path)
            $frames += [PSCustomObject]@{ Index = 1; Bitmap = $fallback }
            return [PSCustomObject]@{ Frames = $frames; Layout = 'single'; ResolvedKind = 'single' }
        }
        return [PSCustomObject]@{ Frames = $frames; Layout = $detection.Layout; ResolvedKind = $detection.Kind }
    }

    $frames += [PSCustomObject]@{ Index = 1; Bitmap = $bmp }
    return [PSCustomObject]@{ Frames = $frames; Layout = 'single'; ResolvedKind = 'single' }
}

function Save-CroppedFrames {
    param(
        [object]$Variant,
        [string]$SourceKey,
        [string]$Category,
        [array]$Frames,
        [array]$Boxes
    )
    $targetDir = Join-Path $FramesRoot "$Category\$SourceKey\$($Variant.Monster)"
    Ensure-Directory -Path $targetDir
    $canvasWidth = (($Boxes | ForEach-Object { $_.Width }) | Measure-Object -Maximum).Maximum
    $canvasHeight = (($Boxes | ForEach-Object { $_.Height }) | Measure-Object -Maximum).Maximum
    $saved = @()
    for ($i = 0; $i -lt $Frames.Count; $i++) {
        $frame = $Frames[$i]
        $box = $Boxes[$i]
        $outPath = Join-Path $targetDir ('frame_{0:d2}.png' -f $frame.Index)
        $cropRect = [System.Drawing.Rectangle]::FromLTRB(
            [Math]::Max(0, $box.X),
            [Math]::Max(0, $box.Y),
            [Math]::Min($frame.Bitmap.Width, $box.X + $box.Width),
            [Math]::Min($frame.Bitmap.Height, $box.Y + $box.Height)
        )
        if ($cropRect.Width -lt 1 -or $cropRect.Height -lt 1) {
            $cropRect = [System.Drawing.Rectangle]::FromLTRB(0, 0, $frame.Bitmap.Width, $frame.Bitmap.Height)
        }
        $cropped = $frame.Bitmap.Clone($cropRect, $frame.Bitmap.PixelFormat)
        $canvas = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($canvas)
        $g.Clear([System.Drawing.Color]::Transparent)
        $offsetX = [int]([Math]::Round(($canvasWidth - $cropped.Width) / 2))
        $offsetY = [int]($canvasHeight - $cropped.Height)
        $g.DrawImage($cropped, $offsetX, $offsetY, $cropped.Width, $cropped.Height)
        $g.Dispose()
        $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
        $cropped.Dispose()
        $saved += $outPath
    }
    return [PSCustomObject]@{
        Paths = $saved
        CanvasWidth = $canvasWidth
        CanvasHeight = $canvasHeight
    }
}

Ensure-Directory -Path $OutRoot
Ensure-Directory -Path $MetaRoot
Ensure-Directory -Path $ReportRoot
Ensure-Directory -Path $FramesRoot
Ensure-Directory -Path (Join-Path $FramesRoot 'game_fit')
Ensure-Directory -Path (Join-Path $FramesRoot 'other_fit')
Remove-DirectoryContents -Path (Join-Path $FramesRoot 'game_fit')
Remove-DirectoryContents -Path (Join-Path $FramesRoot 'other_fit')

$variants = Get-VariantDefinitions
$catalog = @()
$summaryEntries = @()

foreach ($variant in $variants) {
    $pack = Get-FramesForVariant -Variant $variant
    $frames = $pack.Frames
    if ($frames.Count -eq 0) { continue }

    $boxes = @()
    foreach ($frame in $frames) {
        $alphaBox = Get-AlphaContentBox -Bitmap $frame.Bitmap
        if ($alphaBox) {
            $boxes += $alphaBox
        } else {
            $boxes += Get-DominantForegroundBox -Bitmap $frame.Bitmap
        }
    }

    $category = if ($GameTypeMap.ContainsKey($variant.Monster)) { 'game_fit' } else { 'other_fit' }
    $resolvedKind = if ($variant.Kind -eq 'frame_dir') { 'frame_dir' } else { $pack.ResolvedKind }
    $sourceKey = if ($variant.Kind -eq 'frame_dir') { $variant.SourceKey } else { "$($variant.SourceVersion)_$resolvedKind" }
    $savedPack = Save-CroppedFrames -Variant $variant -SourceKey $sourceKey -Category $category -Frames $frames -Boxes $boxes
    $saved = $savedPack.Paths
    $displayName = if ($GameTypeMap.ContainsKey($variant.Monster)) { $GameTypeMap[$variant.Monster].displayName } else { $variant.Monster }
    $tier = if ($GameTypeMap.ContainsKey($variant.Monster)) { $GameTypeMap[$variant.Monster].tier } else { $null }
    $role = if ($GameTypeMap.ContainsKey($variant.Monster)) { $GameTypeMap[$variant.Monster].role } else { 'other' }
    $qualityScore = if ($resolvedKind -eq 'frame_dir') { 94 } elseif ($resolvedKind -eq 'sheet') { 84 } else { 70 }
    $variantId = "$($variant.Monster)__$sourceKey"
    $notes = switch ($resolvedKind) {
        'frame_dir' { 'Single-source frame sequence' }
        'sheet' { 'Single-source sprite sheet split' }
        default { 'Single-source still frame' }
    }

    $entry = [PSCustomObject][ordered]@{
        variantId = $variantId
        id = $variant.Monster
        displayName = $displayName
        fitCategory = $category
        tier = $tier
        roleHint = $role
        sourceFolder = $variant.SourceFolder
        sourceKey = $sourceKey
        sourceVersion = $variant.SourceVersion
        sourceKind = $resolvedKind
        layout = $pack.Layout
        sourcePath = $variant.Path
        frameCount = $saved.Count
        frameWidth = $savedPack.CanvasWidth
        frameHeight = $savedPack.CanvasHeight
        cropBox = @{
            x = (($boxes | ForEach-Object { $_.X }) | Measure-Object -Minimum).Minimum
            y = (($boxes | ForEach-Object { $_.Y }) | Measure-Object -Minimum).Minimum
            width = $savedPack.CanvasWidth
            height = $savedPack.CanvasHeight
        }
        anchor = @{
            center = @{
                x = [int]([Math]::Round($savedPack.CanvasWidth / 2))
                y = [int]([Math]::Round($savedPack.CanvasHeight / 2))
            }
            feet = @{
                x = [int]([Math]::Round($savedPack.CanvasWidth / 2))
                y = $savedPack.CanvasHeight
            }
        }
        qualityScore = $qualityScore
        selected = $true
        notes = $notes
        frames = @($saved | ForEach-Object { $_.Replace($ProjectRoot + '\', '') -replace '\\','/' })
    }
    $catalog += $entry

    $summaryEntries += [PSCustomObject][ordered]@{
        variantId = $variantId
        id = $variant.Monster
        sourceKey = $sourceKey
        sourceVersion = $variant.SourceVersion
        sourceKind = $resolvedKind
        frameCount = $saved.Count
        fitCategory = $category
    }

    foreach ($frame in $frames) {
        $frame.Bitmap.Dispose()
    }
}

$sourceBreakdown = @(
    $catalog |
    Group-Object sourceKey |
    ForEach-Object {
        [PSCustomObject][ordered]@{
            sourceKey = $_.Name
            count = $_.Count
            totalFrames = (($_.Group | ForEach-Object { $_.frameCount }) | Measure-Object -Sum).Sum
        }
    }
)

$catalogJson = ConvertTo-JsonLiteral -Value $catalog
$summaryJson = ConvertTo-JsonLiteral -Value ([ordered]@{
    generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    totalVariants = $catalog.Count
    totalFrames = ($catalog | Measure-Object frameCount -Sum).Sum
    gameFitCount = @($catalog | Where-Object fitCategory -eq 'game_fit').Count
    otherFitCount = @($catalog | Where-Object fitCategory -eq 'other_fit').Count
    sourceBreakdown = $sourceBreakdown
    entries = $summaryEntries
})

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'catalog.json'), $catalogJson, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'preview-data.js'), ("window.MONSTER_PREVIEW_DATA = " + $catalogJson + ";"), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $ReportRoot 'selection-summary.json'), $summaryJson, $utf8NoBom)

Write-Output ("Generated monster preview variants: " + $catalog.Count)
