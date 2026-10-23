# UTF-8 編碼設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub Explorer V2 — 啟動桌面開發版"

$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "       GitHub Explorer V2 — 啟動桌面開發版 (Electron)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查依賴
if (-not (Test-Path "node_modules\electron")) {
    Write-Host "[正在安裝 Electron 開發套件...]" -ForegroundColor Cyan
    & npm install --save-dev electron
}

Write-Host "正在啟動 Electron 桌面客戶端..." -ForegroundColor Green
& npx electron .

Write-Host ""
Write-Host "桌面程式已關閉。" -ForegroundColor Gray
Read-Host "按 Enter 鍵結束..."
