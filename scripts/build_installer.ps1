# UTF-8 編碼設定
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub Explorer V2 — 建立 Windows 安裝版 (EXE)"

# 切換到專案根目錄
$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "       GitHub Explorer V2 — Windows 安裝程式建置工具" -ForegroundColor Cyan
Write-Host "             建立正式發行版: GitHub-Explorer-Setup.exe" -ForegroundColor DarkCyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "【重要說明】" -ForegroundColor Yellow
Write-Host "★ 此腳本為開發者用來「編譯並打包正式安裝版 EXE」的工具。" -ForegroundColor Gray
Write-Host "★ 安裝後的終端使用者只要雙擊安裝包即可，不需執行此腳本。" -ForegroundColor Gray
Write-Host "★ 建置過程絕不刪除或重設現有資料庫，安全保留所有收藏與設定。" -ForegroundColor Gray
Write-Host ""

# 1. 檢查 Node.js 與 npm
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "【錯誤】未在系統中偵測到 Node.js！" -ForegroundColor Red
    Write-Host "建置安裝程式需要 Node.js 環境，請先前往 https://nodejs.org/ 安裝 LTS 版本。" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

$nodeVer = node -v
Write-Host "[1/6 系統檢查] Node.js 版本：$nodeVer (合格)" -ForegroundColor Green

# 2. 檢查依賴套件
if (-not (Test-Path "node_modules")) {
    Write-Host "[2/6 安裝依賴] 尚未安裝 node_modules，正在執行 npm install..." -ForegroundColor Cyan
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "【錯誤】依賴套件安裝失敗！" -ForegroundColor Red
        Read-Host "按 Enter 鍵結束..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[2/6 依賴檢查] node_modules 已就緒" -ForegroundColor Green
}

# 3. 檢查 Electron 與打包套件
$electronPkg = Test-Path "node_modules\electron"
$builderPkg = Test-Path "node_modules\electron-builder"
if (-not $electronPkg -or -not $builderPkg) {
    Write-Host "[3/6 套件同步] 正在安裝 Electron 與 electron-builder 打包套件..." -ForegroundColor Cyan
    & npm install --save-dev electron electron-builder cross-env
    if ($LASTEXITCODE -ne 0) {
        Write-Host "【錯誤】Electron 打包套件安裝失敗！" -ForegroundColor Red
        Read-Host "按 Enter 鍵結束..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[3/6 套件檢查] Electron 打包環境已就緒" -ForegroundColor Green
}

# 4. 生成多解析度專業應用程式圖標 (ICO / PNG)
Write-Host "[4/7 圖標生成] 正在生成 Windows 多解析度圖標 (icon.ico / PNG)..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "generate_icons.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Host "【警告】圖標生成提示非致命錯誤，繼續建置流程" -ForegroundColor Yellow
}

# 5. 生成 Prisma Client
Write-Host "[5/7 資料庫設定] 正在生成 Prisma 客戶端..." -ForegroundColor Cyan
& npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "【警告】Prisma generate 發生非嚴重提示，繼續建置流程" -ForegroundColor Yellow
}

# 6. 編譯 Next.js Standalone 生產版產物
Write-Host "[6/7 專案編譯] 正在執行 Next.js Standalone 生產模式編譯 (npm run electron:build)..." -ForegroundColor Cyan
& npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "【錯誤】Next.js 生產建置失敗，請檢視上方編譯日誌！" -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Red
    Read-Host "按 Enter 鍵結束..."
    exit $LASTEXITCODE
}
Write-Host "[6/7 專案編譯] Next.js Standalone 生產產物與資產複製完成！" -ForegroundColor Green

# 7. 執行 Electron-Builder 封裝 NSIS 安裝程式
Write-Host ""
Write-Host "[7/7 安裝包封裝] 正在封裝 Windows NSIS 安裝程式 (electron-builder)..." -ForegroundColor Cyan
Write-Host "請稍候，此步驟通常需要 1~2 分鐘..." -ForegroundColor Gray
Get-Process -Name "GitHub Explorer V2" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
& npx electron-builder --win nsis
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "【錯誤】Electron 安裝程式打包失敗！" -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Red
    Read-Host "按 Enter 鍵結束..."
    exit $LASTEXITCODE
}

# 7. 檢查與驗證產物
$distDir = Join-Path $ScriptDir "dist"
$setupExe = Join-Path $distDir "GitHub-Explorer-Setup.exe"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
if (Test-Path $setupExe) {
    $fileInfo = Get-Item $setupExe
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    $hash = (Get-FileHash -Path $setupExe -Algorithm SHA256).Hash

    Write-Host "  ★ 恭喜！正式 Windows 安裝程式建置成功！ ★" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  檔案名稱：$($fileInfo.Name)" -ForegroundColor White
    Write-Host "  完整路徑：$setupExe" -ForegroundColor Cyan
    Write-Host "  檔案大小：$fileSizeMB MB" -ForegroundColor Yellow
    Write-Host "  SHA-256 ：$hash" -ForegroundColor Gray
    Write-Host ""
    Write-Host "【安裝與測試方式】" -ForegroundColor White
    Write-Host "1. 前往 $distDir 資料夾。" -ForegroundColor Gray
    Write-Host "2. 直接雙擊「GitHub-Explorer-Setup.exe」即可啟動 Windows 安裝精靈！" -ForegroundColor Yellow
    Write-Host "3. 依精靈指示完成安裝，並可勾選於桌面與開始功能表建立捷徑。" -ForegroundColor Gray
    Write-Host "4. 解除安裝時，您的個人資料庫與收藏將安全保留於 %APPDATA% 目錄中。" -ForegroundColor Gray
} else {
    Write-Host "【注意】未在預期位置發現 GitHub-Explorer-Setup.exe，請檢視 dist 目錄。" -ForegroundColor Yellow
    if (Test-Path $distDir) {
        Get-ChildItem $distDir | Format-Table Name, Length, LastWriteTime
    }
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "按 Enter 鍵結束..."
