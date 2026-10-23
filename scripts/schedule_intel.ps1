# ==============================================================================
# GitHub Explorer V2 - 每日情報可選排程輔助腳本 (Asia/Taipei 台北時區)
# 用途：提供使用者手動或透過 Windows 排程每日自動觸發情報更新 API
# 安全原則：
#  1. 本腳本僅於使用者主動執行時提供排程登記指令，絕不未經確認擅自建立 Windows 工作。
#  2. 無須強制管理員權限即可排程於目前使用者登入時執行。
#  3. 提供一鍵建立與一鍵移除選項，避免重複建立工作。
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub Explorer V2 - 每日情報排程工具"

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  GitHub Explorer V2 — 每日開源情報排程設定輔助工具" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "本工具協助您在 Windows 工作排程器中註冊或移除每日自動更新工作。" -ForegroundColor Gray
Write-Host "預設每日早上 09:00 (台北時間) 自動請求本機伺服器更新情報快照。" -ForegroundColor Gray
Write-Host ""
Write-Host "請選擇您要執行的操作：" -ForegroundColor Yellow
Write-Host "  [1] 立即手動測試觸發情報更新 API" -ForegroundColor Green
Write-Host "  [2] 建立 Windows 每日自動更新排程 (每天 09:00)" -ForegroundColor Cyan
Write-Host "  [3] 移除已建立的每日情報更新排程" -ForegroundColor Red
Write-Host "  [4] 離開" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "請輸入選項 (1-4)"

$taskName = "GitHubExplorerV2_DailyIntel"
$apiUrl = "http://localhost:3000/api/daily-intel"

switch ($choice) {
    "1" {
        Write-Host "`n[執行中] 正在呼叫 $apiUrl ..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri $apiUrl -Method Post -TimeoutSec 15
            Write-Host "[成功] 今日開源情報已成功更新！" -ForegroundColor Green
            Write-Host "報告日期：$($response.report.reportDate)" -ForegroundColor White
            Write-Host "情報標題：$($response.report.title)" -ForegroundColor White
        } catch {
            Write-Host "[提示] 本機伺服器可能尚未啟動 (請先執行 一鍵啟動.bat)。" -ForegroundColor Yellow
            Write-Host "錯誤細節: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "`n[排程設定] 正在向 Windows 工作排程器註冊工作: $taskName ..." -ForegroundColor Cyan
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -Command `"try { Invoke-RestMethod -Uri '$apiUrl' -Method Post } catch {}`""
        $trigger = New-ScheduledTaskTrigger -Daily -At 9am
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        
        try {
            Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "GitHub Explorer V2 每日開源情報自動排程" -Force | Out-Null
            Write-Host "[成功] 排程工作已成功建立！" -ForegroundColor Green
            Write-Host "工作名稱: $taskName" -ForegroundColor White
            Write-Host "觸發頻率: 每天 09:00 (Asia/Taipei)" -ForegroundColor White
        } catch {
            Write-Host "[失敗] 無法註冊排程工作: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "`n[排程移除] 正在移除工作: $taskName ..." -ForegroundColor Yellow
        try {
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction Stop
            Write-Host "[成功] 排程工作已安全移除！" -ForegroundColor Green
        } catch {
            Write-Host "[提示] 找不到該排程工作或已被手動刪除。" -ForegroundColor Gray
        }
    }
    Default {
        Write-Host "`n已取消操作。" -ForegroundColor Gray
    }
}

Write-Host ""
pause
