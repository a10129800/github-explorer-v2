# UTF-8 編碼設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub Explorer V2 — 開源專案雷達 (執行中)"

# 切換到專案根目錄 (此腳本上一層)
$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "          GitHub Explorer V2 — 開源專案雷達" -ForegroundColor Cyan
Write-Host "        Discover What's Rising in Open Source" -ForegroundColor DarkCyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查 Node.js 是否安裝
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "【錯誤】未在系統中偵測到 Node.js！" -ForegroundColor Red
    Write-Host "本專案需要 Node.js 執行環境。" -ForegroundColor Yellow
    Write-Host "請先前往官方網站下載並安裝 Node.js LTS 版本：" -ForegroundColor Yellow
    Write-Host "官方網址：https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "安裝完成後，請重新執行「一鍵啟動.bat」。" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

$nodeVer = node -v
Write-Host "[環境檢查] Node.js 版本：$nodeVer (已安裝)" -ForegroundColor Green

# 2. 檢查 package.json 是否存在
if (-not (Test-Path "package.json")) {
    Write-Host "【錯誤】找不到 package.json 檔案！" -ForegroundColor Red
    Write-Host "目前路徑：$((Get-Location).Path)" -ForegroundColor Yellow
    Write-Host "請確認此檔案位於專案根目錄中。" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

# 3. 檢查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "【注意】尚未偵測到 node_modules 目錄，專案尚未安裝依賴套件。" -ForegroundColor Yellow
    $ans = Read-Host "請問是否立即為您執行安裝依賴？(Y/N，預設 Y)"
    if ($ans -eq "N" -or $ans -eq "n") {
        Write-Host ""
        Write-Host "請先手動雙擊執行「安裝依賴.bat」完成套件安裝後再啟動。" -ForegroundColor Yellow
        Write-Host "=======================================================" -ForegroundColor Cyan
        Read-Host "按 Enter 鍵結束..."
        exit 1
    }

    Write-Host ""
    Write-Host "[正在安裝依賴套件，請稍候...]" -ForegroundColor Cyan
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "【錯誤】依賴安裝失敗，請檢查網路連線或錯誤訊息。" -ForegroundColor Red
        Read-Host "按 Enter 鍵結束..."
        exit $LASTEXITCODE
    }

    Write-Host "[正在同步資料庫客戶端 Prisma Client...]" -ForegroundColor Cyan
    & npm run prisma:generate | Out-Null
    Write-Host "[依賴套件安裝完成！]" -ForegroundColor Green
    Write-Host ""
}

# 4. 檢查連接埠 (3000 或 3001)
$targetPort = 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $targetPort = 3001
    Write-Host "-------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "【埠號提示】偵測到 3000 埠目前已被其他程式使用。" -ForegroundColor Yellow
    Write-Host "Next.js 將會自動切換至連接埠 3001。" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
}

$siteUrl = "http://localhost:$targetPort"

# 5. 提示即將啟動與自動開啟瀏覽器
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  正在啟動開發伺服器 (npm run dev)..." -ForegroundColor Green
Write-Host ""
Write-Host "  專案網址：$siteUrl" -ForegroundColor White
Write-Host "  ★ 系統將在 3 秒後自動為您在瀏覽器打開網站畫面！" -ForegroundColor Yellow
Write-Host ""
Write-Host "  【重要提醒】" -ForegroundColor Red
Write-Host "  ★ 使用網站期間，請務必「保持此黑色視窗開啟」！" -ForegroundColor Yellow
Write-Host "  ★ 若關閉此視窗，伺服器就會停止，瀏覽器便會顯示「無法連上這個網站 (ERR_CONNECTION_REFUSED)」。" -ForegroundColor Yellow
Write-Host "  ★ 若要停止網站運作：請在此視窗按下鍵盤 [Ctrl + C]" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 背景排程：3 秒後自動呼叫預設瀏覽器打開網頁
Start-Job -ScriptBlock {
    param($url)
    Start-Sleep -Seconds 3
    Start-Process $url
} -ArgumentList $siteUrl | Out-Null

# 6. 執行啟動 (npm run dev)
& npm run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Red
    Write-Host "【網站執行中斷或啟動失敗】結束代碼：$LASTEXITCODE" -ForegroundColor Red
    Write-Host "請檢視上方日誌訊息以了解詳細原因。" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "網站伺服器已正常停止。" -ForegroundColor Gray
}

Write-Host ""
Read-Host "按 Enter 鍵結束..."
