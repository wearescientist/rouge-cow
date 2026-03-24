param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths,
    [int]$HoleWidth = 960,
    [int]$HoleHeight = 960,
    [int]$OffsetX = 0,
    [int]$OffsetY = 0,
    [string]$Suffix = "_hollow"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

foreach ($path in $Paths) {
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Warning "skip_missing: $path"
        continue
    }

    $source = [System.Drawing.Bitmap]::new($path)
    try {
        $target = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($target)
            try {
                $graphics.DrawImage($source, 0, 0, $source.Width, $source.Height)
                $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $transparent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                try {
                    $x = [int][Math]::Round((($source.Width - $HoleWidth) / 2.0) + $OffsetX)
                    $y = [int][Math]::Round((($source.Height - $HoleHeight) / 2.0) + $OffsetY)
                    $graphics.FillRectangle($transparent, $x, $y, $HoleWidth, $HoleHeight)
                } finally {
                    $transparent.Dispose()
                }
            } finally {
                $graphics.Dispose()
            }

            $directory = Split-Path -Path $path -Parent
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($path)
            $output = Join-Path $directory ($baseName + $Suffix + ".png")
            $target.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Output "generated: $output"
        } finally {
            $target.Dispose()
        }
    } finally {
        $source.Dispose()
    }
}
