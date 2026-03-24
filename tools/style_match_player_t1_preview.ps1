param(
    [string]$InputRoot = "generated_assets/monster_walk_curated_by_floor_reworked_v2/floor1",
    [string]$OutputRoot = "generated_assets/monster_walk_player_style_t1_v2/floor1",
    [int]$CanvasSize = 48
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$PreviewSet = @(
    @{ Name = "bat"; Version = "v2"; MaxW = 34; MaxH = 22; PixelBlock = 2; Saturation = 0.90; Contrast = 0.96; OutlineAlpha = 0.20; YOffset = -2 },
    @{ Name = "bat"; Version = "v3"; MaxW = 34; MaxH = 22; PixelBlock = 2; Saturation = 0.90; Contrast = 0.96; OutlineAlpha = 0.20; YOffset = -2 },
    @{ Name = "chick"; Version = "spr"; MaxW = 24; MaxH = 36; PixelBlock = 2; Saturation = 0.92; Contrast = 0.95; OutlineAlpha = 0.18; YOffset = 0 },
    @{ Name = "crab"; Version = "v4"; MaxW = 36; MaxH = 24; PixelBlock = 2; Saturation = 0.90; Contrast = 0.96; OutlineAlpha = 0.20; YOffset = 1 }
    @{ Name = "fox"; Version = "v1"; MaxW = 34; MaxH = 26; PixelBlock = 2; Saturation = 0.91; Contrast = 0.96; OutlineAlpha = 0.20; YOffset = 1 },
    @{ Name = "fox"; Version = "v3"; MaxW = 34; MaxH = 26; PixelBlock = 2; Saturation = 0.91; Contrast = 0.96; OutlineAlpha = 0.20; YOffset = 1 },
    @{ Name = "ghost"; Version = "v3"; MaxW = 26; MaxH = 34; PixelBlock = 2; Saturation = 0.86; Contrast = 0.94; OutlineAlpha = 0.14; YOffset = -1 },
    @{ Name = "ghost"; Version = "v4"; MaxW = 26; MaxH = 34; PixelBlock = 2; Saturation = 0.86; Contrast = 0.94; OutlineAlpha = 0.14; YOffset = -1 },
    @{ Name = "rabbit2"; Version = "v2"; MaxW = 26; MaxH = 36; PixelBlock = 2; Saturation = 0.91; Contrast = 0.95; OutlineAlpha = 0.18; YOffset = 0 },
    @{ Name = "rabbit2"; Version = "v4"; MaxW = 26; MaxH = 36; PixelBlock = 2; Saturation = 0.91; Contrast = 0.95; OutlineAlpha = 0.18; YOffset = 0 },
    @{ Name = "snail"; Version = "v1"; MaxW = 34; MaxH = 24; PixelBlock = 2; Saturation = 0.89; Contrast = 0.95; OutlineAlpha = 0.18; YOffset = 2 },
    @{ Name = "snail"; Version = "v4"; MaxW = 34; MaxH = 24; PixelBlock = 2; Saturation = 0.89; Contrast = 0.95; OutlineAlpha = 0.18; YOffset = 2 },
    @{ Name = "snake"; Version = "v4"; MaxW = 34; MaxH = 20; PixelBlock = 2; Saturation = 0.88; Contrast = 0.95; OutlineAlpha = 0.16; YOffset = 3 }
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

function Set-GraphicsMode {
    param(
        [System.Drawing.Graphics]$Graphics,
        [ValidateSet("Nearest", "Smooth")]
        [string]$Mode
    )

    if ($Mode -eq "Nearest") {
        $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    } else {
        $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    }

    $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
}

function Clamp-Color {
    param([double]$Value)

    if ($Value -lt 0) { return 0 }
    if ($Value -gt 255) { return 255 }
    return [int][Math]::Round($Value)
}

function Apply-StyleAdjustments {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [double]$Saturation,
        [double]$Contrast
    )

    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        for ($x = 0; $x -lt $Bitmap.Width; $x++) {
            $pixel = $Bitmap.GetPixel($x, $y)
            if ($pixel.A -eq 0) {
                continue
            }

            $gray = ($pixel.R * 0.299) + ($pixel.G * 0.587) + ($pixel.B * 0.114)
            $r = ($gray * (1 - $Saturation)) + ($pixel.R * $Saturation)
            $g = ($gray * (1 - $Saturation)) + ($pixel.G * $Saturation)
            $b = ($gray * (1 - $Saturation)) + ($pixel.B * $Saturation)

            $r = (($r - 127.5) * $Contrast) + 127.5
            $g = (($g - 127.5) * $Contrast) + 127.5
            $b = (($b - 127.5) * $Contrast) + 127.5

            if ($y -ge [int]($Bitmap.Height * 0.78)) {
                $r *= 0.96
                $g *= 0.97
                $b *= 0.99
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

function Add-Outline {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Bitmap]$Bitmap,
        [int]$X,
        [int]$Y,
        [int]$W,
        [int]$H,
        [double]$Alpha
    )

    $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
    $matrix.Matrix00 = 0
    $matrix.Matrix11 = 0
    $matrix.Matrix22 = 0
    $matrix.Matrix33 = $Alpha
    $matrix.Matrix44 = 1

    $attrs = [System.Drawing.Imaging.ImageAttributes]::new()
    try {
        $attrs.SetColorMatrix($matrix)
        foreach ($offset in @(@(-1,0), @(1,0), @(0,-1), @(0,1))) {
            $Graphics.DrawImage(
                $Bitmap,
                [System.Drawing.Rectangle]::new($X + $offset[0], $Y + $offset[1], $W, $H),
                0,
                0,
                $Bitmap.Width,
                $Bitmap.Height,
                [System.Drawing.GraphicsUnit]::Pixel,
                $attrs
            )
        }
    }
    finally {
        $attrs.Dispose()
    }
}

function Save-PreviewSprite {
    param(
        [hashtable]$Config,
        [string]$FrameName
    )

    $src = Join-Path $InputRoot ("{0}\{1}\walk\{2}" -f $Config.Name, $Config.Version, $FrameName)
    $dst = Join-Path $OutputRoot ("{0}\{1}\walk\{2}" -f $Config.Name, $Config.Version, $FrameName)

    if (-not (Test-Path $src)) {
        return $false
    }

    $source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $src))
    try {
        $bounds = Get-AlphaBounds -Bitmap $source
        $crop = $source.Clone($bounds, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $fitScale = [Math]::Min($Config.MaxW / [double]$crop.Width, $Config.MaxH / [double]$crop.Height)
            $drawW = [Math]::Max(1, [int][Math]::Round($crop.Width * $fitScale))
            $drawH = [Math]::Max(1, [int][Math]::Round($crop.Height * $fitScale))
            $smallW = [Math]::Max(1, [int][Math]::Round($drawW / [double]$Config.PixelBlock))
            $smallH = [Math]::Max(1, [int][Math]::Round($drawH / [double]$Config.PixelBlock))

            $resized = [System.Drawing.Bitmap]::new($drawW, $drawH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $small = [System.Drawing.Bitmap]::new($smallW, $smallH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $pixelated = [System.Drawing.Bitmap]::new($drawW, $drawH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $canvas = [System.Drawing.Bitmap]::new($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

            try {
                $gResize = [System.Drawing.Graphics]::FromImage($resized)
                $gSmall = [System.Drawing.Graphics]::FromImage($small)
                $gPixel = [System.Drawing.Graphics]::FromImage($pixelated)
                $gCanvas = [System.Drawing.Graphics]::FromImage($canvas)

                try {
                    Set-GraphicsMode -Graphics $gResize -Mode Smooth
                    Set-GraphicsMode -Graphics $gSmall -Mode Nearest
                    Set-GraphicsMode -Graphics $gPixel -Mode Nearest
                    Set-GraphicsMode -Graphics $gCanvas -Mode Nearest

                    $gResize.Clear([System.Drawing.Color]::Transparent)
                    $gSmall.Clear([System.Drawing.Color]::Transparent)
                    $gPixel.Clear([System.Drawing.Color]::Transparent)
                    $gCanvas.Clear([System.Drawing.Color]::Transparent)

                    $gResize.DrawImage($crop, 0, 0, $drawW, $drawH)
                    $gSmall.DrawImage($resized, 0, 0, $smallW, $smallH)
                    $gPixel.DrawImage($small, 0, 0, $drawW, $drawH)

                    Apply-StyleAdjustments -Bitmap $pixelated -Saturation $Config.Saturation -Contrast $Config.Contrast

                    $destX = [int][Math]::Floor(($CanvasSize - $drawW) / 2.0)
                    $destY = [int][Math]::Floor(($CanvasSize - $drawH) / 2.0) + [int]$Config.YOffset

                    Add-Outline -Graphics $gCanvas -Bitmap $pixelated -X $destX -Y $destY -W $drawW -H $drawH -Alpha $Config.OutlineAlpha
                    $gCanvas.DrawImage($pixelated, $destX, $destY, $drawW, $drawH)

                    $targetDir = Split-Path -Parent $dst
                    if (-not (Test-Path $targetDir)) {
                        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                    }
                    $canvas.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
                    return $true
                }
                finally {
                    $gResize.Dispose()
                    $gSmall.Dispose()
                    $gPixel.Dispose()
                    $gCanvas.Dispose()
                }
            }
            finally {
                $resized.Dispose()
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
foreach ($config in $PreviewSet) {
    foreach ($frame in @("f01.png", "f02.png", "f03.png", "f04.png")) {
        if (Save-PreviewSprite -Config $config -FrameName $frame) {
            $processed++
        }
    }
    Write-Output ("Preview OK {0}/{1}" -f $config.Name, $config.Version)
}

Write-Output ("Generated {0} preview frames into {1}" -f $processed, $OutputRoot)
