$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ShellTintProcessor
{
    private static float GetLuminance(float r, float g, float b)
    {
        return ((r * 0.299f) + (g * 0.587f) + (b * 0.114f)) / 255f;
    }

    public static Bitmap Recolor(Bitmap source, Color dark, Color mid, Color light, float contrast, float brightness)
    {
        Rectangle rect = new Rectangle(0, 0, source.Width, source.Height);
        Bitmap src = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(src))
        {
            g.DrawImage(source, 0, 0, source.Width, source.Height);
        }

        Bitmap dst = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        int bytes = Math.Abs(srcData.Stride) * source.Height;
        byte[] srcBuffer = new byte[bytes];
        byte[] dstBuffer = new byte[bytes];
        Marshal.Copy(srcData.Scan0, srcBuffer, 0, bytes);

        for (int i = 0; i < bytes; i += 4)
        {
            byte b = srcBuffer[i];
            byte g = srcBuffer[i + 1];
            byte r = srcBuffer[i + 2];
            byte a = srcBuffer[i + 3];

            if (a == 0)
            {
                continue;
            }

            float sourceLum = GetLuminance(r, g, b);
            float rampLum = ((sourceLum - 0.5f) * contrast) + 0.5f;
            rampLum = Math.Max(0f, Math.Min(1f, rampLum));
            rampLum = Math.Max(0f, Math.Min(1f, rampLum * brightness));

            Color c1;
            Color c2;
            float t;
            if (rampLum < 0.5f)
            {
                c1 = dark;
                c2 = mid;
                t = rampLum / 0.5f;
            }
            else
            {
                c1 = mid;
                c2 = light;
                t = (rampLum - 0.5f) / 0.5f;
            }

            float rr = c1.R + ((c2.R - c1.R) * t);
            float gg = c1.G + ((c2.G - c1.G) * t);
            float bb = c1.B + ((c2.B - c1.B) * t);

            float recolorLum = Math.Max(0.001f, GetLuminance(rr, gg, bb));
            float preserveScale = sourceLum / recolorLum;
            rr = Math.Max(0f, Math.Min(255f, rr * preserveScale));
            gg = Math.Max(0f, Math.Min(255f, gg * preserveScale));
            bb = Math.Max(0f, Math.Min(255f, bb * preserveScale));

            float alphaNorm = a / 255f;
            float edgeBoost = 0.82f + (alphaNorm * 0.18f);
            dstBuffer[i] = (byte)Math.Max(0, Math.Min(255, bb * edgeBoost));
            dstBuffer[i + 1] = (byte)Math.Max(0, Math.Min(255, gg * edgeBoost));
            dstBuffer[i + 2] = (byte)Math.Max(0, Math.Min(255, rr * edgeBoost));
            dstBuffer[i + 3] = a;
        }

        Marshal.Copy(dstBuffer, 0, dstData.Scan0, bytes);
        src.UnlockBits(srcData);
        dst.UnlockBits(dstData);
        src.Dispose();
        return dst;
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$srcDir = Join-Path (Get-Location) 'assets\sprites\tiles'
$outDir = Join-Path (Get-Location) 'assets\sprites\tiles\floor_shells'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$themes = @(
    @{
        key = 'greenhouse'
        floor = 2
        roles = @{
            far = @{ dark = '#1d3010'; mid = '#4e6f25'; light = '#9cbb54'; contrast = 1.06; brightness = 1 }
            mid = @{ dark = '#203612'; mid = '#56792b'; light = '#a9c862'; contrast = 1.04; brightness = 1 }
            primary = @{ dark = '#274017'; mid = '#628a33'; light = '#b7d56f'; contrast = 1.02; brightness = 1 }
        }
    },
    @{
        key = 'nerve'
        floor = 3
        roles = @{
            far = @{ dark = '#181126'; mid = '#4a3270'; light = '#8967b5'; contrast = 1.06; brightness = 1 }
            mid = @{ dark = '#1b1430'; mid = '#523982'; light = '#9b79c5'; contrast = 1.04; brightness = 1 }
            primary = @{ dark = '#231a3a'; mid = '#614495'; light = '#ab87d0'; contrast = 1.02; brightness = 1 }
        }
    },
    @{
        key = 'furnace'
        floor = 4
        roles = @{
            far = @{ dark = '#100d19'; mid = '#33254b'; light = '#7d4d30'; contrast = 1.06; brightness = 1 }
            mid = @{ dark = '#151021'; mid = '#413060'; light = '#a35425'; contrast = 1.04; brightness = 1 }
            primary = @{ dark = '#1c142a'; mid = '#534077'; light = '#d66a1d'; contrast = 1.02; brightness = 1 }
        }
    },
    @{
        key = 'courtyard'
        floor = 5
        roles = @{
            far = @{ dark = '#1a070a'; mid = '#5a171d'; light = '#9d3438'; contrast = 1.06; brightness = 1 }
            mid = @{ dark = '#22090c'; mid = '#6b1c24'; light = '#b34145'; contrast = 1.04; brightness = 1 }
            primary = @{ dark = '#2b0c10'; mid = '#7c222a'; light = '#c94e4f'; contrast = 1.02; brightness = 1 }
        }
    },
    @{
        key = 'core'
        floor = 6
        roles = @{
            far = @{ dark = '#151126'; mid = '#3e2d67'; light = '#867046'; contrast = 1.06; brightness = 1 }
            mid = @{ dark = '#19152f'; mid = '#49367a'; light = '#98814e'; contrast = 1.04; brightness = 1 }
            primary = @{ dark = '#211c3a'; mid = '#57408c'; light = '#b49558'; contrast = 1.02; brightness = 1 }
        }
    }
)

$sourceByRole = @{
    far = 'back_organic_far.png'
    mid = 'back_organic_mid.png'
    primary = 'back_organic_primary.png'
}

function Convert-HexColor([string]$hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

foreach ($theme in $themes) {
    foreach ($roleName in @('far', 'mid', 'primary')) {
        $srcPath = Join-Path $srcDir $sourceByRole[$roleName]
        $role = $theme.roles[$roleName]
        $bitmap = [System.Drawing.Bitmap]::new($srcPath)
        try {
            $result = [ShellTintProcessor]::Recolor(
                $bitmap,
                (Convert-HexColor $role.dark),
                (Convert-HexColor $role.mid),
                (Convert-HexColor $role.light),
                [single]$role.contrast,
                [single]$role.brightness
            )
            try {
                $outName = "floor$($theme.floor)_shell_$($theme.key)_$roleName.png"
                $outPath = Join-Path $outDir $outName
                $result.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
                Write-Output $outName
            } finally {
                $result.Dispose()
            }
        } finally {
            $bitmap.Dispose()
        }
    }
}
