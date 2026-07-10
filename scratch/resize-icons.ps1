Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\1\.gemini\antigravity\brain\422ec6ef-f666-47b1-b555-238de84b2656\uncanny_iris_v2_1780116232500.png"

if (!(Test-Path $srcPath)) {
    Write-Error "Master icon not found at $srcPath"
    Exit 1
}

# Dest paths
$publicIconPath = "c:\Users\1\Downloads\Projects\AI_Game_Studio_Agent_Team\mvp\public\icon.png"
$publicLogoPath = "c:\Users\1\Downloads\Projects\AI_Game_Studio_Agent_Team\mvp\public\logo.png"

# Copy master to public icon and logo
Copy-Item -Path $srcPath -Destination $publicIconPath -Force
Copy-Item -Path $srcPath -Destination $publicLogoPath -Force
Write-Host "Copied master decided icon to public/icon.png and public/logo.png"

# Load the master image for resizing
$srcImage = [System.Drawing.Image]::FromFile($publicIconPath)

function Resize-Image {
    param(
        [string]$destPath,
        [int]$width,
        [int]$height
    )
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($srcImage, 0, 0, $width, $height)
    
    # Ensure destination directory exists
    $dir = Split-Path $destPath
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Save image (as PNG)
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    Write-Host "Successfully generated: $destPath ($width x $height)"
}

# Web favicons
Resize-Image "c:\Users\1\Downloads\Projects\AI_Game_Studio_Agent_Team\mvp\public\favicon.png" 32 32
Resize-Image "c:\Users\1\Downloads\Projects\AI_Game_Studio_Agent_Team\mvp\app\favicon.ico" 32 32

# Android mipmap launcher sizes
$resDir = "c:\Users\1\Downloads\Projects\AI_Game_Studio_Agent_Team\mvp\android\app\src\main\res"

Resize-Image "$resDir\mipmap-mdpi\ic_launcher.png" 48 48
Resize-Image "$resDir\mipmap-hdpi\ic_launcher.png" 72 72
Resize-Image "$resDir\mipmap-xhdpi\ic_launcher.png" 96 96
Resize-Image "$resDir\mipmap-xxhdpi\ic_launcher.png" 144 144
Resize-Image "$resDir\mipmap-xxxhdpi\ic_launcher.png" 192 192

Resize-Image "$resDir\mipmap-mdpi\ic_launcher_round.png" 48 48
Resize-Image "$resDir\mipmap-hdpi\ic_launcher_round.png" 72 72
Resize-Image "$resDir\mipmap-xhdpi\ic_launcher_round.png" 96 96
Resize-Image "$resDir\mipmap-xxhdpi\ic_launcher_round.png" 144 144
Resize-Image "$resDir\mipmap-xxxhdpi\ic_launcher_round.png" 192 192

# Adaptive foreground:
Resize-Image "$resDir\mipmap-mdpi\ic_launcher_foreground.png" 108 108
Resize-Image "$resDir\mipmap-hdpi\ic_launcher_foreground.png" 162 162
Resize-Image "$resDir\mipmap-xhdpi\ic_launcher_foreground.png" 216 216
Resize-Image "$resDir\mipmap-xxhdpi\ic_launcher_foreground.png" 324 324
Resize-Image "$resDir\mipmap-xxxhdpi\ic_launcher_foreground.png" 432 432

# Clean up handle
$srcImage.Dispose()
Write-Host "All assets successfully synchronized and generated from Variant B Master."
