param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$source = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class SquareShellBuilder {
    private struct SeedResult {
        public int X;
        public int Y;
        public bool Found;
    }

    public static void BuildVariants(string inputPath, string outputPrimary, string outputMid, string outputFar) {
        using (var original = new Bitmap(inputPath)) {
            using (var square = BuildSquareCanvas(original)) {
                SaveVariant(square, outputPrimary, 22, 2);
                SaveVariant(square, outputMid, 38, 2);
                SaveVariant(square, outputFar, 56, 3);
            }
        }
    }

    private static Bitmap BuildSquareCanvas(Bitmap original) {
        int size = Math.Max(original.Width, original.Height);
        Bitmap square = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(square)) {
            g.Clear(Color.Transparent);
            int offsetX = (size - original.Width) / 2;
            int offsetY = (size - original.Height) / 2;
            g.DrawImage(original, offsetX, offsetY, original.Width, original.Height);
        }
        return square;
    }

    private static void SaveVariant(Bitmap sourceSquare, string outputPath, int expandPx, int smoothPasses) {
        using (var bitmap = new Bitmap(sourceSquare.Width, sourceSquare.Height, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(bitmap)) {
                g.DrawImage(sourceSquare, 0, 0, sourceSquare.Width, sourceSquare.Height);
            }

            Rectangle rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            BitmapData data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            try {
                int stride = data.Stride;
                int total = stride * bitmap.Height;
                byte[] bytes = new byte[total];
                Marshal.Copy(data.Scan0, bytes, 0, total);

                bool[] mask = BuildCenterMask(bytes, bitmap.Width, bitmap.Height, stride, 180, 150, 72);
                if (mask == null) {
                    throw new InvalidOperationException("center white region not found");
                }

                if (expandPx > 0) {
                    mask = Dilate(mask, bitmap.Width, bitmap.Height, expandPx);
                }

                for (int i = 0; i < smoothPasses; i++) {
                    mask = Smooth(mask, bitmap.Width, bitmap.Height);
                }

                ApplyMask(bytes, mask, bitmap.Width, bitmap.Height, stride);
                Marshal.Copy(bytes, 0, data.Scan0, total);
            } finally {
                bitmap.UnlockBits(data);
            }

            bitmap.Save(outputPath, ImageFormat.Png);
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
            if (!IsHoleCandidate(bytes, x, y, stride, brightnessThreshold, channelTolerance)) continue;
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
                    if (IsHoleCandidate(bytes, x, y, stride, brightnessThreshold, channelTolerance)) {
                        return new SeedResult { X = x, Y = y, Found = true };
                    }
                }
            }
        }
        return new SeedResult { Found = false };
    }

    private static bool IsHoleCandidate(byte[] bytes, int x, int y, int stride, int brightnessThreshold, int channelTolerance) {
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

    private static bool[] Smooth(bool[] mask, int width, int height) {
        bool[] result = new bool[mask.Length];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int count = 0;
                int total = 0;
                for (int oy = -1; oy <= 1; oy++) {
                    for (int ox = -1; ox <= 1; ox++) {
                        int nx = x + ox;
                        int ny = y + oy;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                        total++;
                        if (mask[ny * width + nx]) count++;
                    }
                }
                result[y * width + x] = count >= Math.Max(3, total / 2);
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
    $primary = Join-Path $directory ($baseName + "_organic_primary.png")
    $mid = Join-Path $directory ($baseName + "_organic_mid.png")
    $far = Join-Path $directory ($baseName + "_organic_far.png")
    [SquareShellBuilder]::BuildVariants($path, $primary, $mid, $far)
    Write-Output "rebuilt: $primary"
    Write-Output "rebuilt: $mid"
    Write-Output "rebuilt: $far"
}
