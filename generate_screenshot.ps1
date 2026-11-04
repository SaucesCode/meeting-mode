# Generates a high-resolution 1280x800 store screenshot for Microsoft Edge Add-ons Store
Add-Type -AssemblyName System.Drawing

function New-Font([string]$family, [float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return [System.Drawing.Font]::new($family, [single]$size, $style)
}

$width = 1280
$height = 800
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# 1. Background gradient (Obsidian dark canvas)
$bgRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.ColorTranslator]::FromHtml("#090a0d")), ([System.Drawing.ColorTranslator]::FromHtml("#111317")), 45.0
$g.FillRectangle($bgBrush, $bgRect)

# Subtle background grid lines
$gridPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#161a22")), 1
for ($x = 0; $x -lt $width; $x += 40) {
    $g.DrawLine($gridPen, $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 40) {
    $g.DrawLine($gridPen, 0, $y, $width, $y)
}

# Ambient glowing spotlight behind the browser window
$glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 16, 185, 129))
$g.FillEllipse($glowBrush, 400, 200, 600, 400)

# 2. Mockup Browser Window
$winX = 80
$winY = 80
$winW = 1120
$winH = 640
$winRect = New-Object System.Drawing.Rectangle $winX, $winY, $winW, $winH

# Browser Window Shadow & Surface
$winBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#12151b"))
$g.FillRectangle($winBrush, $winRect)
$winBorderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#222733")), 1.5
$g.DrawRectangle($winBorderPen, $winRect)

# Browser Top Titlebar
$barHeight = 44
$barRect = New-Object System.Drawing.Rectangle $winX, $winY, $winW, $barHeight
$barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0c0e12"))
$g.FillRectangle($barBrush, $barRect)
$g.DrawLine($winBorderPen, $winX, ($winY + $barHeight), ($winX + $winW), ($winY + $barHeight))

# Window Control Dots (macOS/modern style)
$dotRed = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#ff5f56"))
$dotYellow = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#ffbd2e"))
$dotGreen = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#27c93f"))
$g.FillEllipse($dotRed, ($winX + 16), ($winY + 16), 11, 11)
$g.FillEllipse($dotYellow, ($winX + 34), ($winY + 16), 11, 11)
$g.FillEllipse($dotGreen, ($winX + 52), ($winY + 16), 11, 11)

# Tab Bar Mockup
$tabBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#12151b"))
$tabRect = New-Object System.Drawing.Rectangle ($winX + 80), ($winY + 8), 240, 36
$g.FillRectangle($tabBrush, $tabRect)
$tabBorderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#222733")), 1
$g.DrawRectangle($tabBorderPen, $tabRect)

$tabFont = New-Font "Segoe UI" 9.5 ([System.Drawing.FontStyle]::Regular)
$tabTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#9da6b5"))
$g.DrawString("Dashboard - Acme Corp", $tabFont, $tabTextBrush, ($winX + 100), ($winY + 17))

# Address bar mockup
$addrRect = New-Object System.Drawing.Rectangle ($winX + 340), ($winY + 10), 440, 24
$addrBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#181b22"))
$g.FillRectangle($addrBrush, $addrRect)
$addrFont = New-Font "Segoe UI" 8.5 ([System.Drawing.FontStyle]::Regular)
$addrTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#6b7280"))
$g.DrawString("https://app.acme.com/analytics/enterprise", $addrFont, $addrTextBrush, ($winX + 355), ($winY + 14))

# Meeting Mode Toolbar Badge Icon
$badgeRect = New-Object System.Drawing.Rectangle ($winX + $winW - 140), ($winY + 10), 120, 24
$badgeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#064e3b"))
$g.FillRectangle($badgeBrush, $badgeRect)
$badgePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#10b981")), 1
$g.DrawRectangle($badgePen, $badgeRect)
$badgeFont = New-Font "Segoe UI" 8.5 ([System.Drawing.FontStyle]::Bold)
$badgeTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#34d399"))
$g.DrawString("SHIELD: ARMED", $badgeFont, $badgeTextBrush, ($winX + $winW - 130), ($winY + 14))

# 3. Web Page Content Mockup (Enterprise Dashboard with Masked PII & Financials)
$dashFontH1 = New-Font "Segoe UI" 16 ([System.Drawing.FontStyle]::Bold)
$dashTitleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#f2f4f7"))
$g.DrawString("Q4 Revenue & Customer Health", $dashFontH1, $dashTitleBrush, ($winX + 40), ($winY + 70))

# 3 KPI Metric Cards
$metricCardBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#181c24"))
$cardBorderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#262c3a")), 1

# Metric 1: Total Revenue (Masked Blur)
$card1Rect = New-Object System.Drawing.Rectangle ($winX + 40), ($winY + 115), 180, 100
$g.FillRectangle($metricCardBrush, $card1Rect)
$g.DrawRectangle($cardBorderPen, $card1Rect)
$kpiLabelFont = New-Font "Segoe UI" 9 ([System.Drawing.FontStyle]::Regular)
$kpiLabelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#8e98a8"))
$g.DrawString("TOTAL REVENUE", $kpiLabelFont, $kpiLabelBrush, ($winX + 55), ($winY + 130))
# Masked blur block
$maskBlockBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 16, 185, 129))
$g.FillRectangle($maskBlockBrush, ($winX + 55), ($winY + 155), 120, 24)
$maskLabelFont = New-Font "Segoe UI" 8 ([System.Drawing.FontStyle]::Bold)
$maskLabelTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#064e3b"))
$g.DrawString("[CLOAKED: $482,900]", $maskLabelFont, $maskLabelTextBrush, ($winX + 60), ($winY + 160))

# Metric 2: Net MRR (Masked Blur)
$card2Rect = New-Object System.Drawing.Rectangle ($winX + 235), ($winY + 115), 180, 100
$g.FillRectangle($metricCardBrush, $card2Rect)
$g.DrawRectangle($cardBorderPen, $card2Rect)
$g.DrawString("MONTHLY RECURRING", $kpiLabelFont, $kpiLabelBrush, ($winX + 250), ($winY + 130))
$g.FillRectangle($maskBlockBrush, ($winX + 250), ($winY + 155), 110, 24)
$g.DrawString("[CLOAKED: $74,250]", $maskLabelFont, $maskLabelTextBrush, ($winX + 255), ($winY + 160))

# Metric 3: Active Subscriptions
$card3Rect = New-Object System.Drawing.Rectangle ($winX + 430), ($winY + 115), 180, 100
$g.FillRectangle($metricCardBrush, $card3Rect)
$g.DrawRectangle($cardBorderPen, $card3Rect)
$g.DrawString("ACTIVE ACCOUNTS", $kpiLabelFont, $kpiLabelBrush, ($winX + 445), ($winY + 130))
$kpiValFont = New-Font "Segoe UI" 16 ([System.Drawing.FontStyle]::Bold)
$kpiValBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#f2f4f7"))
$g.DrawString("1,429", $kpiValFont, $kpiValBrush, ($winX + 445), ($winY + 152))

# Data Table of Customers (Showing Cloaked Emails and Values)
$tableY = $winY + 235
$g.DrawString("Recent Customer Transactions", $dashFontH1, $dashTitleBrush, ($winX + 40), $tableY)

$rowFont = New-Font "Segoe UI" 9.5 ([System.Drawing.FontStyle]::Regular)
$rowMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#9ca3af"))
$rowWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#e5e7eb"))

# Table Header
$g.DrawLine($cardBorderPen, ($winX + 40), ($tableY + 35), ($winX + 640), ($tableY + 35))
$g.DrawString("CLIENT / COMPANY", $kpiLabelFont, $kpiLabelBrush, ($winX + 40), ($tableY + 42))
$g.DrawString("CONTACT EMAIL", $kpiLabelFont, $kpiLabelBrush, ($winX + 230), ($tableY + 42))
$g.DrawString("AMOUNT", $kpiLabelFont, $kpiLabelBrush, ($winX + 480), ($tableY + 42))
$g.DrawLine($cardBorderPen, ($winX + 40), ($tableY + 62), ($winX + 640), ($tableY + 62))

# Table Row 1
$r1Y = $tableY + 70
$g.DrawString("Stripe Enterprise Client", $rowFont, $rowWhite, ($winX + 40), $r1Y)
$g.FillRectangle($maskBlockBrush, ($winX + 230), $r1Y, 150, 18)
$g.DrawString("[email protected]", $maskLabelFont, $maskLabelTextBrush, ($winX + 235), ($r1Y + 2))
$g.FillRectangle($maskBlockBrush, ($winX + 480), $r1Y, 80, 18)
$g.DrawString("[CLOAKED]", $maskLabelFont, $maskLabelTextBrush, ($winX + 485), ($r1Y + 2))

# Table Row 2
$r2Y = $tableY + 105
$g.DrawString("Salesforce Systems Inc", $rowFont, $rowWhite, ($winX + 40), $r2Y)
$g.FillRectangle($maskBlockBrush, ($winX + 230), $r2Y, 160, 18)
$g.DrawString("[email protected]", $maskLabelFont, $maskLabelTextBrush, ($winX + 235), ($r2Y + 2))
$g.FillRectangle($maskBlockBrush, ($winX + 480), $r2Y, 80, 18)
$g.DrawString("[CLOAKED]", $maskLabelFont, $maskLabelTextBrush, ($winX + 485), ($r2Y + 2))

# Table Row 3
$r3Y = $tableY + 140
$g.DrawString("GitHub Global Sponsor", $rowFont, $rowWhite, ($winX + 40), $r3Y)
$g.FillRectangle($maskBlockBrush, ($winX + 230), $r3Y, 140, 18)
$g.DrawString("[email protected]", $maskLabelFont, $maskLabelTextBrush, ($winX + 235), ($r3Y + 2))
$g.FillRectangle($maskBlockBrush, ($winX + 480), $r3Y, 80, 18)
$g.DrawString("[CLOAKED]", $maskLabelFont, $maskLabelTextBrush, ($winX + 485), ($r3Y + 2))

# 4. Floating MeetingMode In-Page Tactical HUD Panel (On the Right)
$hudX = $winX + 680
$hudY = $winY + 65
$hudW = 390
$hudH = 540
$hudRect = New-Object System.Drawing.Rectangle $hudX, $hudY, $hudW, $hudH

# HUD Drop Shadow & Backdrop
$hudBgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0d0f14"))
$g.FillRectangle($hudBgBrush, $hudRect)
$hudBorderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#1f2430")), 1.5
$g.DrawRectangle($hudBorderPen, $hudRect)

# HUD Header
$hudTitleFont = New-Font "Segoe UI" 12 ([System.Drawing.FontStyle]::Bold)
$hudTitleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#f2f4f7"))
$g.DrawString("MeetingMode HUD", $hudTitleFont, $hudTitleBrush, ($hudX + 20), ($hudY + 16))

# Preset Pills
$presetFont = New-Font "Segoe UI" 8.5 ([System.Drawing.FontStyle]::Bold)
$pillInactiveBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#161a22"))
$pillActiveBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#064e3b"))
$pillActiveBorder = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#10b981")), 1

# Client Demo Pill
$g.FillRectangle($pillInactiveBrush, ($hudX + 20), ($hudY + 48), 110, 32)
$g.DrawString("Client Demo", $presetFont, $rowMuted, ($hudX + 45), ($hudY + 56))

# Team Meet Pill (ACTIVE)
$g.FillRectangle($pillActiveBrush, ($hudX + 138), ($hudY + 48), 110, 32)
$g.DrawRectangle($pillActiveBorder, ($hudX + 138), ($hudY + 48), 110, 32)
$activePillTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#34d399"))
$g.DrawString("Team Meet", $presetFont, $activePillTextBrush, ($hudX + 165), ($hudY + 56))

# Loom Beam Pill
$g.FillRectangle($pillInactiveBrush, ($hudX + 256), ($hudY + 48), 110, 32)
$g.DrawString("Loom Beam", $presetFont, $rowMuted, ($hudX + 285), ($hudY + 56))

# Master Shield Status Banner
$masterRect = New-Object System.Drawing.Rectangle ($hudX + 20), ($hudY + 92), 350, 42
$masterBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 16, 185, 129))
$g.FillRectangle($masterBrush, $masterRect)
$masterPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#10b981")), 1.5
$g.DrawRectangle($masterPen, $masterRect)
$masterFont = New-Font "Segoe UI" 10.5 ([System.Drawing.FontStyle]::Bold)
$g.DrawString("Shield Active (ARMED)", $masterFont, $activePillTextBrush, ($hudX + 35), ($hudY + 104))
$g.DrawString("SAFE", $presetFont, $activePillTextBrush, ($hudX + 325), ($hudY + 105))

# Scope & Mode Segment Strip
$segRect = New-Object System.Drawing.Rectangle ($hudX + 20), ($hudY + 144), 350, 30
$g.FillRectangle($pillInactiveBrush, $segRect)
$segFont = New-Font "Segoe UI" 8 ([System.Drawing.FontStyle]::Bold)
$g.DrawString("SCOPE: THIS WINDOW", $segFont, $rowMuted, ($hudX + 30), ($hudY + 152))
$g.DrawString("MODE: LOCKDOWN (BLUR FOR ALL)", $segFont, $activePillTextBrush, ($hudX + 175), ($hudY + 152))

# Privacy Rules Checkbox List
$rulesTitleFont = New-Font "Segoe UI" 8.5 ([System.Drawing.FontStyle]::Bold)
$g.DrawString("PRIVACY RULES", $rulesTitleFont, $rowMuted, ($hudX + 20), ($hudY + 188))

$ruleItems = @(
    "Messenger, Discord & Chats",
    "Avatars & Profile Pictures",
    "Ghost Form & Password Inputs",
    "Financials ($ & Balances)",
    "Customer & User Emails",
    "API Keys & Secrets",
    "Screen Share Lockdown (Blur for Both)",
    "Silence Web Notifications"
)

$checkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#10b981"))
$ruleY = $hudY + 210

foreach ($rule in $ruleItems) {
    # Item row box
    $itemRect = New-Object System.Drawing.Rectangle ($hudX + 20), $ruleY, 350, 24
    $itemBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#141820"))
    $g.FillRectangle($itemBrush, $itemRect)
    
    # Checkmark indicator
    $g.FillRectangle($checkBrush, ($hudX + 342), ($ruleY + 6), 12, 12)
    
    $ruleFont = New-Font "Segoe UI" 8.5 ([System.Drawing.FontStyle]::Regular)
    $g.DrawString($rule, $ruleFont, $rowWhite, ($hudX + 32), ($ruleY + 4))
    
    $ruleY += 28
}

# Tactical Panic Action Bar at Bottom of HUD
$panicRect = New-Object System.Drawing.Rectangle ($hudX + 20), ($hudY + 450), 350, 36
$panicBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#261418"))
$g.FillRectangle($panicBrush, $panicRect)
$panicPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#ef4444")), 1
$g.DrawRectangle($panicPen, $panicRect)
$panicFont = New-Font "Segoe UI" 9 ([System.Drawing.FontStyle]::Bold)
$panicTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#f87171"))
$g.DrawString("Emergency Panic Curtain", $panicFont, $panicTextBrush, ($hudX + 35), ($hudY + 460))
$kbdFont = New-Font "Segoe UI" 8 ([System.Drawing.FontStyle]::Bold)
$g.DrawString("Alt+Shift+B", $kbdFont, $rowMuted, ($hudX + 295), ($hudY + 461))

# Bottom Branding Tag
$tagFont = New-Font "Segoe UI" 10 ([System.Drawing.FontStyle]::Bold)
$tagBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#6b7280"))
$g.DrawString("MeetingMode - Real-time Presentation Privacy Shield", $tagFont, $tagBrush, ($width / 2 - 170), ($height - 40))

# Save output PNG
$outputPath = Join-Path $PSScriptRoot "screenshot1.png"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$g.Dispose()

Write-Host "Store screenshot generated successfully: $outputPath"
