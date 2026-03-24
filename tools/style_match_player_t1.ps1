param(
    [string]$InputRoot = "generated_assets/monster_walk_curated_by_floor_reworked_v2/floor1",
    [string]$OutputRoot = "generated_assets/monster_walk_player_style_t1/floor1",
    [int]$CanvasSize = 48,
    [int]$TargetHeight = 36,
    [int]$PixelBlock = 4
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$T1CommonMobs = @(
    "bat",
    "chick",
    "crab",
    "fox",
    "ghost",
    "rabbit2",
    "snail",
    "snake"
)

function Get-AlphaBounds {
    param([System.Drawing.Bitmap]$Bitmap)

    $minX = $Bitmap.Width
    $minY = $Bitmap.Height
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        for ($x = 0; $x -lt $Bitmap.Width; $x++) {
            if ($Bitmap.GetPixel($x, $y).A -gt 8) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -lt 0 -or $maxY -lt 0) {
        return [System.Drawing.Rectangle]::new(0, 0, $Bitmap.Width, $Bitmap.Height)
    }

    return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
}

function Set-NearestGraphics {
    param([System.Drawing.Graphics]$Graphics)

    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
}

function Clamp-Color {
    param([double]$Value)

    if ($Value -lt 0) { return 0 }
    if ($Value -gt 255) { return 255 }
    return [int][Math]::Round($Value)
}

function Apply-StyleAdjustments {
    param([System.Drawing.Bitmap]$Bitmap)

    $saturation = 0.82
    $contrast = 0.9

    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        for ($x = 0; $x -lt $Bitmap.Width; $x++) {
            $pixel = $Bitmap.GetPixel($x, $y)
            if ($pixel.A -eq 0) {
                continue
            }

            $gray = ($pixel.R * 0.299) + ($pixel.G * 0.587) + ($pixel.B * 0.114)
            $r = ($gray * (1 - $saturation)) + ($pixel.R * $saturation)
            $g = ($gray * (1 - $saturation)) + ($pixel.G * $saturation)
            $b = ($gray * (1 - $saturation)) + ($pixel.B * $saturation)

            $r = (($r - 127.5) * $contrast) + 127.5
            $g = (($g - 127.5) * $contrast) + 127.5
            $b = (($b - 127.5) * $contrast) + 127.5

            if ($y -ge [int]($Bitmap.Height * 0.72)) {
                $shadowMix = 0.9 + (0.08 * (($y - ($Bitmap.Height * 0.72)) / ($Bitmap.Height * 0.28)))
                $r *= (1.0 - ($shadowMix - 0.9))
                $g *= (1.0 - ($shadowMix - 0.92))
                $b *= 0.98
            }

            $Bitmap.SetPixel(
                $x,
                $y,
                [System.Drawing.Color]::FromArgb(
                    $pixel.A,
                    (Clamp-Color $r),
                    (Clamp-Color $g),
                    (Clamp-Color $b)
                )
            )
        }
    }
}

function Save-StyledSprite {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$CanvasSize,
        [int]$TargetHeight,
        [int]$PixelBlock
    )

    $source = [System.Drawing.Bitmap]::FromFile($SourcePath)
    try {
        $bounds = Get-AlphaBounds -Bitmap $source
        $crop = $source.Clone($bounds, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $scale = $TargetHeight / [double]$crop.Height
            $drawW = [Math]::Max(1, [int][Math]::Round($crop.Width * $scale))
            $drawH = [Math]::Max(1, [int][Math]::Round($crop.Height * $scale))
            $smallW = [Math]::Max(1, [int][Math]::Round($drawW / [double]$PixelBlock))
            $smallH = [Math]::Max(1, [int][Math]::Round($drawH / [double]$PixelBlock))

            $small = [System.Drawing.Bitmap]::new($smallW, $smallH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $pixelated = [System.Drawing.Bitmap]::new($drawW, $drawH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $canvas = [System.Drawing.Bitmap]::new($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

            try {
                $gSmall = [System.Drawing.Graphics]::FromImage($small)
                $gPixel = [System.Drawing.Graphics]::FromImage($pixelated)
                $gCanvas = [System.Drawing.Graphics]::FromImage($canvas)

                try {
                    Set-NearestGraphics -Graphics $gSmall
                    Set-NearestGraphics -Graphics $gPixel
                    Set-NearestGraphics -Graphics $gCanvas

                    $gSmall.Clear([System.Drawing.Color]::Transparent)
                    $gPixel.Clear([System.Drawing.Color]::Transparent)
                    $gCanvas.Clear([System.Drawing.Color]::Transparent)

                    $gSmall.DrawImage($crop, 0, 0, $smallW, $smallH)
                    $gPixel.DrawImage($small, 0, 0, $drawW, $drawH)

                    Apply-StyleAdjustments -Bitmap $pixelated

                    $destX = [int][Math]::Floor(($CanvasSize - $drawW) / 2.0)
                    $destY = [int][Math]::Max(2, $CanvasSize - $drawH - 4)

                    $outlineMatrix = [System.Drawing.Imaging.ColorMatrix]::new()
                    $outlineMatrix.Matrix00 = 0
                    $outlineMatrix.Matrix11 = 0
                    $outlineMatrix.Matrix22 = 0
                    $outlineMatrix.Matrix33 = 0.55
                    $outlineMatrix.Matrix44 = 1

                    $imageAttrs = [System.Drawing.Imaging.ImageAttributes]::new()
                    $imageAttrs.SetColorMatrix($outlineMatrix)

                    foreach ($offset in @(
                        @(-1, 0), @(1, 0), @(0, -1), @(0, 1),
                        @(-1, -1), @(1, -1), @(-1, 1), @(1, 1)
                    )) {
                        $gCanvas.DrawImage(
                            $pixelated,
                            [System.Drawing.Rectangle]::new($destX + $offset[0], $destY + $offset[1], $drawW, $drawH),
                            0,
                            0,
                            $pixelated.Width,
                            $pixelated.Height,
                            [System.Drawing.GraphicsUnit]::Pixel,
                            $imageAttrs
                        )
                    }

                    $gCanvas.DrawImage($pixelated, $destX, $destY, $drawW, $drawH)

                    $targetDir = Split-Path -Parent $TargetPath
                    if (-not (Test-Path $targetDir)) {
                        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                    }
                    $canvas.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
                }
                finally {
                    $gSmall.Dispose()
                    $gPixel.Dispose()
                    $gCanvas.Dispose()
                }
            }
            finally {
                $small.Dispose()
                $pixelated.Dispose()
                $canvas.Dispose()
            }
        }
        finally {
            $crop.Dispose()
        }
    }
    finally {
        $source.Dispose()
    }
}

$processed = 0

foreach ($monster in $T1CommonMobs) {
    $monsterDir = Join-Path $InputRoot $monster
    if (-not (Test-Path $monsterDir)) {
        continue
    }

    foreach ($versionDir in Get-ChildItem -Path $monsterDir -Directory) {
        $walkDir = Join-Path $versionDir.FullName "walk"
        if (-not (Test-Path $walkDir)) {
            continue
        }

        foreach ($frame in @("f01.png", "f02.png", "f03.png", "f04.png")) {
            $src = Join-Path $walkDir $frame
            if (-not (Test-Path $src)) {
                continue
            }

            $relative = $src.Substring((Resolve-Path $InputRoot).Path.Length).TrimStart('\')
            $dst = Join-Path $OutputRoot $relative
            Save-StyledSprite -SourcePath $src -TargetPath $dst -CanvasSize $CanvasSize -TargetHeight $TargetHeight -PixelBlock $PixelBlock
            $processed++
        }

        Write-Output ("OK {0}/{1}" -f $monster, $versionDir.Name)
    }
}

Write-Output ("Generated {0} frames into {1}" -f $processed, $OutputRoot)
