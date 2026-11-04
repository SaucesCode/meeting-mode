# MeetingMode Chrome Web Store Packaging Script
# Generates a pristine release zip ready for Google Developer Console upload.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$distDir = Join-Path $PSScriptRoot "dist"
$zipPath = Join-Path $PSScriptRoot "meeting-mode-v1.0.0.zip"

Write-Host "Creating clean release build directory..."
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir | Out-Null

$includeFiles = @(
    "manifest.json",
    "background.js",
    "content.js",
    "content.css",
    "popup.html",
    "popup.js",
    "popup.css",
    "options.html",
    "options.js",
    "options.css",
    "PRIVACY.md"
)

foreach ($file in $includeFiles) {
    $src = Join-Path $PSScriptRoot $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $distDir -Force
    }
}

# Copy icons directory
$iconsSrc = Join-Path $PSScriptRoot "icons"
$iconsDst = Join-Path $distDir "icons"
if (Test-Path $iconsSrc) {
    Copy-Item -Recurse -Path $iconsSrc -Destination $iconsDst -Force
}

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "Compressing extension package to $zipPath..."
Compress-Archive -Path "$distDir\*" -DestinationPath $zipPath -Force

# Clean up temp dist folder
Remove-Item -Recurse -Force $distDir

$zipItem = Get-Item $zipPath
$sizeKB = [math]::Round($zipItem.Length / 1KB, 2)
Write-Host "Package created successfully: meeting-mode-v1.0.0.zip ($sizeKB KB)"
