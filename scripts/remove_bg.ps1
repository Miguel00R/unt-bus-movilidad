Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class ImageProcessor {
    public static void RemoveBackground(string inputPath, string outputPath, int threshold) {
        byte[] bytes = System.IO.File.ReadAllBytes(inputPath);
        using (var ms = new System.IO.MemoryStream(bytes))
        using (Bitmap orig = new Bitmap(ms)) {
            int w = orig.Width;
            int h = orig.Height;
            using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    g.DrawImage(orig, 0, 0, w, h);
                }

                BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                int totalPixels = w * h;
                int[] pixels = new int[totalPixels];
                Marshal.Copy(data.Scan0, pixels, 0, totalPixels);

                bool[] visited = new bool[totalPixels];
                Queue<int> queue = new Queue<int>();

                Func<int, bool> isWhite = (idx) => {
                    int argb = pixels[idx];
                    int r = (argb >> 16) & 0xFF;
                    int g = (argb >> 8) & 0xFF;
                    int b = argb & 0xFF;
                    return (r >= threshold && g >= threshold && b >= threshold);
                };

                // Border pixels
                for (int x = 0; x < w; x++) {
                    int topIdx = 0 * w + x;
                    if (isWhite(topIdx)) { visited[topIdx] = true; queue.Enqueue(topIdx); }
                    int bottomIdx = (h - 1) * w + x;
                    if (isWhite(bottomIdx)) { visited[bottomIdx] = true; queue.Enqueue(bottomIdx); }
                }
                for (int y = 0; y < h; y++) {
                    int leftIdx = y * w + 0;
                    if (!visited[leftIdx] && isWhite(leftIdx)) { visited[leftIdx] = true; queue.Enqueue(leftIdx); }
                    int rightIdx = y * w + (w - 1);
                    if (!visited[rightIdx] && isWhite(rightIdx)) { visited[rightIdx] = true; queue.Enqueue(rightIdx); }
                }

                while (queue.Count > 0) {
                    int curr = queue.Dequeue();
                    pixels[curr] = 0x00000000;

                    int cx = curr % w;
                    int cy = curr / w;

                    if (cx > 0) {
                        int n = curr - 1;
                        if (!visited[n]) {
                            visited[n] = true;
                            if (isWhite(n)) queue.Enqueue(n);
                        }
                    }
                    if (cx < w - 1) {
                        int n = curr + 1;
                        if (!visited[n]) {
                            visited[n] = true;
                            if (isWhite(n)) queue.Enqueue(n);
                        }
                    }
                    if (cy > 0) {
                        int n = curr - w;
                        if (!visited[n]) {
                            visited[n] = true;
                            if (isWhite(n)) queue.Enqueue(n);
                        }
                    }
                    if (cy < h - 1) {
                        int n = curr + w;
                        if (!visited[n]) {
                            visited[n] = true;
                            if (isWhite(n)) queue.Enqueue(n);
                        }
                    }
                }

                Marshal.Copy(pixels, 0, data.Scan0, totalPixels);
                bmp.UnlockBits(data);
                
                string tempPath = outputPath + ".tmp.png";
                bmp.Save(tempPath, ImageFormat.Png);
                System.IO.File.Copy(tempPath, outputPath, true);
                System.IO.File.Delete(tempPath);
            }
        }
    }
}
"@

$inputPath = "c:\Users\migue\OneDrive\Desktop\proyecto_Autobus\public\escudo-unt.png"
$outputPath = "c:\Users\migue\OneDrive\Desktop\proyecto_Autobus\public\escudo-unt.png"
[ImageProcessor]::RemoveBackground($inputPath, $outputPath, 240)
Write-Output "Successfully removed white background from escudo-unt.png"
