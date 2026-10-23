# UTF-8 編碼設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 載入 .NET System.Drawing 圖形組件
Add-Type -AssemblyName System.Drawing

$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

$buildDir = Join-Path $ScriptDir "build"
$publicDir = Join-Path $ScriptDir "public"
$iconsDir = Join-Path $buildDir "icons"

if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir -Force | Out-Null }
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir -Force | Out-Null }
if (-not (Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null }

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  GitHub Explorer V2 — Windows 專業圖標 (ICO/PNG) 生成器" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 尋找使用者上傳的高解析度來源圖檔
$sourceCandidates = @(
    "C:\Users\mice\.gemini\antigravity-ide\brain\b354a368-5e1d-4d90-8b2f-999dd58908c9\.user_uploaded\media_1792674509848.jpg",
    (Join-Path $buildDir "source-icon.jpg"),
    (Join-Path $ScriptDir "assets\icon.png")
)

$sourceFile = $null
foreach ($cand in $sourceCandidates) {
    if (Test-Path $cand) {
        $sourceFile = $cand
        break
    }
}

if (-not $sourceFile) {
    Write-Host "【錯誤】找不到圖標來源圖檔！" -ForegroundColor Red
    exit 1
}

Write-Host "[來源圖檔] $sourceFile" -ForegroundColor Green

# 複製一份原始檔留存
Copy-Item $sourceFile (Join-Path $buildDir "icon-original.jpg") -Force

# 載入原始圖檔進行裁切與透明度處理
$rawBitmap = [System.Drawing.Bitmap]::FromFile($sourceFile)
$width = $rawBitmap.Width
$height = $rawBitmap.Height

Write-Host "[圖檔資訊] 原始尺寸: ${width}x${height} 像素" -ForegroundColor Gray

# 1. 偵測圖示主體 (深藍色圓角矩形) 邊界，去除外圍黑色背景
$minX = $width; $maxX = 0; $minY = $height; $maxY = 0

for ($y = 0; $y -lt $height; $y += 2) {
    for ($x = 0; $x -lt $width; $x += 2) {
        $pixel = $rawBitmap.GetPixel($x, $y)
        # 若非純黑外框 (藍色或白色主體)
        if ($pixel.R -gt 25 -or $pixel.G -gt 35 -or $pixel.B -gt 55) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# 確保裁切區域為正方形 (1:1)，避免拉伸變形
$iconWidth = $maxX - $minX
$iconHeight = $maxY - $minY
$maxSide = [Math]::Max($iconWidth, $iconHeight)
$centerX = [int]($minX + $iconWidth / 2)
$centerY = [int]($minY + $iconHeight / 2)

$cropX = [Math]::Max(0, [int]($centerX - $maxSide / 2))
$cropY = [Math]::Max(0, [int]($centerY - $maxSide / 2))
$cropW = [Math]::Min($maxSide, $width - $cropX)
$cropH = [Math]::Min($maxSide, $height - $cropY)

Write-Host "[自動裁切] 裁切置中正方形範圍: X=$cropX, Y=$cropY, 寬高=$cropW" -ForegroundColor Gray

# 裁切出乾淨正方形區域
$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$croppedBmp = $rawBitmap.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$rawBitmap.Dispose()

# 2. 為圓角外緣建立透明度遮罩 (去除黑色硬角，建立平滑抗鋸齒透明邊緣)
$radius = [int]($cropW * 0.22) # 標準現代 Squircle 圓角半徑
for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $dx = 0; $dy = 0
        $inCorner = $false

        if ($x -lt $radius -and $y -lt $radius) {
            $dx = $radius - $x; $dy = $radius - $y; $inCorner = $true
        } elseif ($x -ge ($cropW - $radius) -and $y -lt $radius) {
            $dx = $x - ($cropW - $radius); $dy = $radius - $y; $inCorner = $true
        } elseif ($x -lt $radius -and $y -ge ($cropH - $radius)) {
            $dx = $radius - $x; $dy = $y - ($cropH - $radius); $inCorner = $true
        } elseif ($x -ge ($cropW - $radius) -and $y -ge ($cropH - $radius)) {
            $dx = $x - ($cropW - $radius); $dy = $y - ($cropH - $radius); $inCorner = $true
        }

        if ($inCorner) {
            $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)
            if ($dist -gt $radius) {
                # 圓角外側：完全透明
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } elseif ($dist -gt ($radius - 1.5)) {
                # 邊緣抗鋸齒羽化
                $alpha = [int]((($radius - $dist) / 1.5) * 255)
                $alpha = [Math]::Max(0, [Math]::Min(255, $alpha))
                $orig = $croppedBmp.GetPixel($x, $y)
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $orig.R, $orig.G, $orig.B))
            }
        }
    }
}

# 3. 縮放生成各種尺寸 (高品質雙立方插值)
function Resize-Bitmap($src, $targetSize) {
    $dest = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $targetSize, $targetSize)
    $g.Dispose()
    return $dest
}

$bmp256 = Resize-Bitmap $croppedBmp 256
$bmp128 = Resize-Bitmap $croppedBmp 128
$bmp64  = Resize-Bitmap $croppedBmp 64
$bmp48  = Resize-Bitmap $croppedBmp 48
$bmp32  = Resize-Bitmap $croppedBmp 32
$bmp16  = Resize-Bitmap $croppedBmp 16
$croppedBmp.Dispose()

# 儲存獨立 PNG 檔案
$bmp256.Save((Join-Path $buildDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp256.Save((Join-Path $publicDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp256.Save((Join-Path $iconsDir "256x256.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp48.Save((Join-Path $iconsDir "48x48.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp32.Save((Join-Path $iconsDir "32x32.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp16.Save((Join-Path $iconsDir "16x16.png"), [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "[PNG 生成成功] 256x256, 48x48, 32x32, 16x16 PNG 檔案已寫入 build/ 及 public/" -ForegroundColor Green

# 4. 建立 Windows 標準多解析度 .ICO 檔案 (包含 256, 48, 32, 16 像素規格)
function Convert-BitmapsToIco($bitmaps, $icoPath) {
    $pngStreams = @()
    foreach ($bmp in $bitmaps) {
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += $ms
    }

    $fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # 1. ICONDIR Header (6 bytes)
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type: 1 = ICO
    $bw.Write([uint16]$pngStreams.Count) # Image count

    # 2. ICONDIRENTRY[] (16 bytes each)
    $offset = 6 + ($pngStreams.Count * 16)
    for ($i = 0; $i -lt $pngStreams.Count; $i++) {
        $bmp = $bitmaps[$i]
        $w = if ($bmp.Width -ge 256) { 0 } else { [byte]$bmp.Width }
        $h = if ($bmp.Height -ge 256) { 0 } else { [byte]$bmp.Height }
        $bytesLen = [uint32]$pngStreams[$i].Length

        $bw.Write([byte]$w)            # Width
        $bw.Write([byte]$h)            # Height
        $bw.Write([byte]0)             # Colors
        $bw.Write([byte]0)             # Reserved
        $bw.Write([uint16]1)           # Planes
        $bw.Write([uint16]32)          # BitCount (32-bit RGBA)
        $bw.Write([uint32]$bytesLen)   # BytesInRes
        $bw.Write([uint32]$offset)     # ImageOffset

        $offset += $bytesLen
    }

    # 3. 寫入各圖片之原始 PNG 資料
    for ($i = 0; $i -lt $pngStreams.Count; $i++) {
        $bytes = $pngStreams[$i].ToArray()
        $bw.Write($bytes)
        $pngStreams[$i].Dispose()
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
}

$icoList = @($bmp256, $bmp48, $bmp32, $bmp16)
$outIco = Join-Path $buildDir "icon.ico"
Convert-BitmapsToIco $icoList $outIco
Copy-Item $outIco (Join-Path $publicDir "icon.ico") -Force
Copy-Item $outIco (Join-Path $publicDir "favicon.ico") -Force

# 釋放 Bitmap 記憶體
$bmp256.Dispose(); $bmp128.Dispose(); $bmp64.Dispose(); $bmp48.Dispose(); $bmp32.Dispose(); $bmp16.Dispose()

Write-Host "[ICO 生成成功] 多解析度 Windows icon.ico 已寫入:" -ForegroundColor Green
Write-Host "  -> $outIco" -ForegroundColor Cyan
Write-Host "  -> $(Join-Path $publicDir 'icon.ico')" -ForegroundColor Cyan
Write-Host "  -> $(Join-Path $publicDir 'favicon.ico')" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
