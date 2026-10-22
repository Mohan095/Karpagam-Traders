Add-Type -AssemblyName System.Drawing

$sourcePath = 'd:\Final year\karpagam-traders\frontend\public\logo.png'
$destDir = 'd:\Final year\karpagam-traders\frontend\public\icons'

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source logo does not exist"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $s, $s)
    $targetPath = Join-Path $destDir "icon-${s}x${s}.png"
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# Maskable icons (with background and 15% safe padding for Android adaptive icons)
$maskSizes = @(192, 512)
foreach ($ms in $maskSizes) {
    $bmp = New-Object System.Drawing.Bitmap $ms, $ms
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#8B0000'))
    $g.FillRectangle($bgBrush, 0, 0, $ms, $ms)
    $pad = [int]($ms * 0.12)
    $innerSize = $ms - 2 * $pad
    $g.DrawImage($img, $pad, $pad, $innerSize, $innerSize)
    $targetPath = Join-Path $destDir "maskable-icon-${ms}x${ms}.png"
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

# Copy to favicon and apple-touch-icon
Copy-Item (Join-Path $destDir "icon-192x192.png") 'd:\Final year\karpagam-traders\frontend\public\apple-touch-icon.png' -Force
Copy-Item (Join-Path $destDir "icon-192x192.png") 'd:\Final year\karpagam-traders\frontend\public\favicon.ico' -Force
Copy-Item (Join-Path $destDir "icon-192x192.png") 'd:\Final year\karpagam-traders\frontend\public\favicon.png' -Force

$img.Dispose()
Write-Output 'PWA Icons successfully refreshed from Goddess Emblem logo!'
