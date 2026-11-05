# MeetingMode Chrome & Edge Web Store Packaging Script
# Generates a pristine release zip ready for Developer Console upload.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$rootDir = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $rootDir "manifest.json"
$manifestJson = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifestJson.version

$distDir = Join-Path $rootDir "dist"
$zipPath = Join-Path $rootDir "meeting-mode-v$version.zip"

Write-Host "Creating clean release build directory for v$version..."
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
    $src = Join-Path $rootDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $distDir -Force
    }
}

# Copy icons directory
$iconsSrc = Join-Path $rootDir "icons"
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
Write-Host "Package created successfully: meeting-mode-v$version.zip ($sizeKB KB)"
