# UTF-8 編碼設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub Explorer V2 - 安裝依賴套件"

# 切換到專案根目錄
$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "          GitHub Explorer V2 — 安裝專案依賴" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查 Node.js 是否安裝
Write-Host "[檢查環境] 正在檢查 Node.js..." -ForegroundColor Gray
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host ""
    Write-Host "【錯誤】未在系統中偵測到 Node.js！" -ForegroundColor Red
    Write-Host "本專案需要 Node.js 執行環境。" -ForegroundColor Yellow
    Write-Host "請先前往官方網站下載並安裝 Node.js LTS 版本：" -ForegroundColor Yellow
    Write-Host "官方網址：https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "安裝完成後，請重新執行「安裝依賴.bat」。" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

$nodeVer = node -v
Write-Host "- Node.js 版本：$nodeVer (已安裝)" -ForegroundColor Green

# 2. 檢查 npm 是否可用
Write-Host "[檢查環境] 正在檢查 npm 套件管理員..." -ForegroundColor Gray
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host ""
    Write-Host "【錯誤】未在系統中偵測到 npm 指令！" -ForegroundColor Red
    Write-Host "請確認 Node.js 安裝完整並已加入系統 PATH 環境變數。" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

$npmVer = npm -v
Write-Host "- npm 版本：v$npmVer (已安裝)" -ForegroundColor Green
Write-Host ""

# 3. 檢查 package.json 是否存在
Write-Host "[檢查專案] 正在檢查專案根目錄檔案..." -ForegroundColor Gray
if (-not (Test-Path "package.json")) {
    Write-Host ""
    Write-Host "【錯誤】找不到 package.json 檔案！" -ForegroundColor Red
    Write-Host "目前路徑：$((Get-Location).Path)" -ForegroundColor Yellow
    Write-Host "請確認本檔案位於專案根目錄中。" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}
Write-Host "- 專案設定檔 package.json 確認存在。" -ForegroundColor Green
Write-Host ""

# 4. 執行 npm install
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[執行安裝] 正在執行 npm install 安裝專案依賴套件..." -ForegroundColor Yellow
Write-Host "(初次安裝約需 1 至 3 分鐘，請稍候，切勿關閉視窗)" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Red
    Write-Host "【安裝失敗】npm install 過程中發生錯誤，結束代碼：$LASTEXITCODE" -ForegroundColor Red
    Write-Host "請檢視上方終端機日誌以排查問題。" -ForegroundColor Yellow
    Write-Host "常見原因：網路連線逾時、防火牆阻擋或 Node.js 版本過舊。" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Red
    Read-Host "按 Enter 鍵結束..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[生成資料庫客戶端] 正在同步 Prisma Client..." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
& npm run prisma:generate | Out-Null

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "【安裝成功！】所有必要套件與依賴已安裝完畢。" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor White
Write-Host "您現在可以直接關閉此視窗，並雙擊【一鍵啟動.bat】即可啟動網站！" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Read-Host "按 Enter 鍵結束..."
