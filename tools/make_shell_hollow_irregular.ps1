param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths,
    [int]$Expansion = 16,
    [string]$Suffix = "_hollow_irregular",
    [int]$SeedRadius = 80,
    [int]$BrightnessThreshold = 150,
    [int]$ChannelTolerance = 72
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$source = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ShellHollowProcessor {
    private struct SeedResult {
        public int X;
        public int Y;
        public bool Found;
    }

    public static void Process(string inputPath, string outputPath, int expansion, int seedRadius, int brightnessThreshold, int channelTolerance) {
        using (var original = new Bitmap(inputPath)) {
            using (var source = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb)) {
                using (var g = Graphics.FromImage(source)) {
                    g.DrawImage(original, 0, 0, original.Width, original.Height);
                }

                Rectangle rect = new Rectangle(0, 0, source.Width, source.Height);
                BitmapData data = source.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                try {
                    int stride = data.Stride;
                    int total = stride * source.Height;
                    byte[] bytes = new byte[total];
                    Marshal.Copy(data.Scan0, bytes, 0, total);

                    bool[] mask = BuildCenterMask(bytes, source.Width, source.Height, stride, seedRadius, brightnessThreshold, channelTolerance);
                    if (mask == null) {
                        throw new InvalidOperationException("center white region not found");
                    }

                    if (expansion > 0) {
                        mask = Dilate(mask, source.Width, source.Height, expansion);
                    }

                    ApplyMask(bytes, mask, source.Width, source.Height, stride);
                    Marshal.Copy(bytes, 0, data.Scan0, total);
                } finally {
                    source.UnlockBits(data);
                }

                source.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    private static bool[] BuildCenterMask(byte[] bytes, int width, int height, int stride, int seedRadius, int brightnessThreshold, int channelTolerance) {
        SeedResult seed = FindSeed(bytes, width, height, stride, seedRadius, brightnessThreshold, channelTolerance);
        if (!seed.Found) return null;

        bool[] visited = new bool[width * height];
        bool[] mask = new bool[width * height];
        Queue<int> queue = new Queue<int>();
        int start = seed.Y * width + seed.X;
        queue.Enqueue(start);
        visited[start] = true;

        int[] offsets = new int[] { -1, 1, 0, 0 };
        int[] yOffsets = new int[] { 0, 0, -1, 1 };

        while (queue.Count > 0) {
            int idx = queue.Dequeue();
            int x = idx % width;
            int y = idx / width;
            if (!IsHoleCandidate(bytes, x, y, width, height, stride, brightnessThreshold, channelTolerance)) continue;
            mask[idx] = true;

            for (int i = 0; i < 4; i++) {
                int nx = x + offsets[i];
                int ny = y + yOffsets[i];
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int nidx = ny * width + nx;
                if (visited[nidx]) continue;
                visited[nidx] = true;
                queue.Enqueue(nidx);
            }
        }

        return mask;
    }

    private static SeedResult FindSeed(byte[] bytes, int width, int height, int stride, int seedRadius, int brightnessThreshold, int channelTolerance) {
        int cx = width / 2;
        int cy = height / 2;
        for (int radius = 0; radius <= seedRadius; radius++) {
            for (int y = Math.Max(0, cy - radius); y <= Math.Min(height - 1, cy + radius); y++) {
                for (int x = Math.Max(0, cx - radius); x <= Math.Min(width - 1, cx + radius); x++) {
                    if (IsHoleCandidate(bytes, x, y, width, height, stride, brightnessThreshold, channelTolerance)) {
                        return new SeedResult { X = x, Y = y, Found = true };
                    }
                }
            }
        }
        return new SeedResult { Found = false };
    }

    private static bool IsHoleCandidate(byte[] bytes, int x, int y, int width, int height, int stride, int brightnessThreshold, int channelTolerance) {
        int index = y * stride + x * 4;
        byte b = bytes[index];
        byte g = bytes[index + 1];
        byte r = bytes[index + 2];
        byte a = bytes[index + 3];
        if (a < 8) return false;
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        int avg = (r + g + b) / 3;
        return avg >= brightnessThreshold && (max - min) <= channelTolerance;
    }

    private static bool[] Dilate(bool[] mask, int width, int height, int expansion) {
        bool[] result = new bool[mask.Length];
        Array.Copy(mask, result, mask.Length);
        List<Point> offsets = new List<Point>();
        int radiusSq = expansion * expansion;
        for (int y = -expansion; y <= expansion; y++) {
            for (int x = -expansion; x <= expansion; x++) {
                if ((x * x) + (y * y) <= radiusSq) {
                    offsets.Add(new Point(x, y));
                }
            }
        }

        for (int idx = 0; idx < mask.Length; idx++) {
            if (!mask[idx]) continue;
            int baseX = idx % width;
            int baseY = idx / width;
            foreach (Point offset in offsets) {
                int nx = baseX + offset.X;
                int ny = baseY + offset.Y;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                result[ny * width + nx] = true;
            }
        }
        return result;
    }

    private static void ApplyMask(byte[] bytes, bool[] mask, int width, int height, int stride) {
        for (int idx = 0; idx < mask.Length; idx++) {
            if (!mask[idx]) continue;
            int x = idx % width;
            int y = idx / width;
            int baseIndex = y * stride + x * 4;
            bytes[baseIndex + 3] = 0;
        }
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies "System.Drawing"

foreach ($path in $Paths) {
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Warning "skip_missing: $path"
        continue
    }

    $directory = Split-Path -Path $path -Parent
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($path)
    $output = Join-Path $directory ($baseName + $Suffix + ".png")
    [ShellHollowProcessor]::Process($path, $output, $Expansion, $SeedRadius, $BrightnessThreshold, $ChannelTolerance)
    Write-Output "generated: $output"
}
