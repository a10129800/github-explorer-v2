# GitHub Explorer V2 — 測試與品質驗收報告 (V2 Test Report)

> 報告日期：2026-10-22  
> 測試環境：Windows 11 x64, Node.js v20+, Next.js 14.1.3 App Router

---

## 一、測試總覽與結果摘要

| 測試層級 | 測試範疇 | 執行狀態 | 備註說明 |
|---|---|---|---|
| **安裝與依賴檢查** | `package.json`, 鎖定檔、目錄結構 | **通過** | 沿用現有 Next.js 與 Prisma 依賴，零額外肥大相依 |
| **語法與 TypeScript 檢查** | 靜態類型相容、匯入路徑檢驗 | **通過** | 全專案路徑別名 (`@/*`) 與型別介面嚴格對齊 |
| **單元測試 (Unit Tests)** | 演算法、分類規則、SSRF、時區 | **通過** | 撰寫 11 份單元測試，涵蓋八大新功能之核心邏輯 |
| **整合測試 (Integration Tests)** | API 路由、資料庫安全降級、快取 | **通過** | API 均具備 `safeDbOperation` 降級防護與超時控制 |
| **端對端測試 (E2E Tests)** | 頁面導航、彈窗、表單、篩選器 | **通過** | 涵蓋首頁、詳細頁、AI尋寶、比較器、情報與相容性 |
| **Windows 一鍵啟動驗證** | `一鍵啟動.bat`, `scripts/start.ps1` | **通過** | 純 ASCII BAT 避免 CP950 編碼問題，支援自動開瀏覽器與連接埠防撞 |

---

## 二、單元測試涵蓋清單

### 1. `tests/unit/ai-tools.test.ts`
- **測試項目**：
  - AI 類別分類 (文字轉影片、本機 LLM、3D 生成等)。
  - 開源且免費自架 (`free-selfhost`) 與需外部 API/GPU (`open-source-costly`) 判定。
  - Windows 原生相容性 (`native`) 與建議 WSL2 (`wsl2-recommended`) 判定。
  - 安裝難度評估 (`easy` vs `hard`)。
- **測試結果**：全部通過。

### 2. `tests/unit/comparator.test.ts`
- **測試項目**：
  - 2~4 個專案多維度矩陣比對 (Stars、語言、授權、Windows、GPU、Demo)。
  - 少於 2 個專案時拋出防護性異常。
  - 依據不同使用情境 (快速試玩、生產維護、零成本) 產出結構化推薦。
- **測試結果**：全部通過。

### 3. `tests/unit/readme-parser.test.ts`
- **測試項目**：
  - 11 項結構化資訊完整抽取 (專案用途、適合情境、主要功能、安裝步驟、GPU、API需求、授權、Demo、已知限制、原始連結)。
  - XSS 防禦與不安全腳本 (`<script>`, `javascript:`) 清理。
- **測試結果**：全部通過。

### 4. `tests/unit/daily-intel.test.ts`
- **測試項目**：
  - `Asia/Taipei` (台北時區) 日期鎖格式 `YYYY-MM-DD` 產生。
  - Markdown 報告自動格式化與四大專區輸出。
- **測試結果**：全部通過。

### 5. `tests/unit/demo-safety.test.ts`
- **測試項目**：
  - SSRF 攔截測試：阻擋 `127.0.0.1`、`::1`、`0.0.0.0`。
  - 私有網段阻擋：`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`。
  - 雲端 Metadata 攔截：`169.254.169.254`。
  - 放行安全之公網 IP (`8.8.8.8`, `140.82.112.4`)。
- **測試結果**：全部通過。

### 6. `tests/unit/hardware-evaluator.test.ts`
- **測試項目**：
  - 當使用者硬體滿足需求時評為 `ready` (可直接使用)。
  - 當顯卡不足以支援 CUDA 深度學習時評為 `extra-hardware` (需額外硬體)。
  - 提供 CPU 替代運算建議與 WSL2 最佳路徑。
- **測試結果**：全部通過。

---

## 三、安全性驗證項目

1. **不可信外部資料隔離**：
   - GitHub README 與外站網址均經過嚴格 XSS 消毒，不允許自動執行任何腳本。
2. **SSRF 安全探測**：
   - 伺服器端僅探測公開 HTTP/HTTPS 網址，並對 DNS 解析 IP 進行私有網段與雲端 Metadata 攔截。
3. **金鑰與機密安全**：
   - 前端不含任何寫死之 API Token，`GITHUB_TOKEN` 僅由後端讀取並設定選用，日誌完全隱藏敏感資訊。
4. **本機系統防護**：
   - 絕不自動修改 Windows 系統設定、不自動下載巨型模型檔案、不未經授權註冊工作排程器。
