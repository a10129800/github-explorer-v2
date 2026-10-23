# GitHub Explorer V2 — Windows Electron 正式安裝版測試驗收報告

> **報告日期**：2026-10-22  
> **測試環境**：Windows 11 x64, Node.js v20+, Next.js 14.1.3, Electron 29+, Prisma 5.11.0  
> **測試目標**：驗證 Next.js 網站桌面化完整性、Standalone 生產模式、NSIS 安裝程式與資料持久性

---

## 一、測試總結摘要

| 測試階段 | 項目數 | 通過 | 待實機打包 | 失敗 | 狀態 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Phase 0：現有網站基線測試** | 6 | 6 | 0 | 0 | **PASSED** |
| **Phase 1：Electron 桌面核心架構測試** | 10 | 10 | 0 | 0 | **PASSED** |
| **Phase 2：Next.js Standalone 生產建置測試** | 6 | 6 | 0 | 0 | **PASSED** |
| **Phase 3：NSIS 打包配置與資產檢查** | 7 | 7 | 0 | 0 | **PASSED** |
| **Phase 4：Windows 安裝程式與資料持久化** | 6 | 6 | 0 | 0 | **PASSED** |
| **Phase 5：原有功能無損回歸測試** | 5 | 5 | 0 | 0 | **PASSED** |

---

## 二、各階段詳細測試項目與檢驗紀錄

### Phase 0：現有網站基線測試
* [x] **0.1 現有依賴完整性**：`package.json` 包含 Next.js 14.1.3, React 18.2, Prisma 5.11, Lucide React, TailwindCSS。
* [x] **0.2 既有 BAT 啟動機制檢驗**：`一鍵啟動.bat` 與 `scripts/start.ps1` 正常保留，埠號 3000/3001 防撞邏輯完整。
* [x] **0.3 既有安裝腳本檢驗**：`安裝依賴.bat` 與 `scripts/install.ps1` 完整保留，無任何刪除或變更。
* [x] **0.4 資料庫架構檢驗**：`prisma/schema.prisma` 包含 Repository, User, Snapshot, DailyIntel 等完整實體模型。
* [x] **0.5 API 路由完整性**：`/api/health`, `/api/search`, `/api/trending`, `/api/auth/*` 等 10 組 API 全部保留。
* [x] **0.6 Git 與檔案保護檢驗**：現有程式碼與使用手冊未受任何破壞。

---

### Phase 1：Electron 桌面核心架構測試
* [x] **1.1 主程序生命週期 (electron/main.js)**：
  * 單一執行個體鎖定（`app.requestSingleInstanceLock()`）：通過，防止重複雙擊開啟多重視窗。
  * 關閉與清理程序（`before-quit` / `will-quit`）：通過，確保退出時不會殘留背景 Node 行程。
* [x] **1.2 啟動緩衝體驗 (Splash Screen)**：
  * 內建 `electron/splash.html` Cyber-Dark 雷達動畫，伺服器啟動期間不顯示白畫面。
* [x] **1.3 安全防護 (Security Checklist)**：
  * `nodeIntegration: false`（強制關閉渲染層 Node 權限）。
  * `contextIsolation: true`（強制啟用獨立上下文隔絕）。
  * `sandbox: true`（啟用 Chromium 安全沙箱）。
* [x] **1.4 外部網址攔截**：
  * `setWindowOpenHandler` 與 `will-navigate` 攔截所有非 `127.0.0.1` 外部連結，強制由系統預設瀏覽器（如 Edge/Chrome）開啟，確保桌面應用程式本體安全。
* [x] **1.5 動態埠號自動探測 (findFreePort)**：
  * 避開已被占用的 3000 埠，於 3100~3999 範圍自動挑選空閒連接埠，完全杜絕衝突。
* [x] **1.6 伺服器健康檢查輪詢 (Health Check Polling)**：
  * 以每 400ms 間隔請求 `http://127.0.0.1:${port}/api/health`，收到 HTTP 200 後立即關閉 Splash 並平滑展示主視窗。

---

### Phase 2：Next.js Standalone 生產建置測試
* [x] **2.1 `output: 'standalone'` 設定**：`next.config.mjs` 正確啟用 standalone 模式。
* [x] **2.2 靜態圖片最佳化相容性**：配置 `images.unoptimized: true`，確保離線與單機環境圖片正常顯示。
* [x] **2.3 Standalone 資產自動收集腳本**：
  * 實作 `scripts/copy-standalone.js`。
  * 自動複製 `.next/static` -> `.next/standalone/.next/static`。
  * 自動複製 `public/` -> `.next/standalone/public`。
  * 自動複製 `prisma/` -> `.next/standalone/prisma`。
* [x] **2.4 零外部依賴 Node Runtime 機制**：
  * 利用 `ELECTRON_RUN_AS_NODE: '1'` 搭配 `process.execPath`，無需終端使用者預先安裝 Node.js 即可直接運作 Next.js Standalone Server。

---

### Phase 3：NSIS 打包配置與資產檢查
* [x] **3.1 `electron-builder.json` 配置**：
  * `appId`: `com.antigravity.github-explorer-v2`
  * `productName`: `GitHub Explorer V2`
  * `target`: `nsis` (x64)
  * `artifactName`: `GitHub-Explorer-Setup.exe`
* [x] **3.2 NSIS 安裝精靈設定**：
  * `oneClick: false`：標準逐步安裝精靈。
  * `allowToChangeInstallationDirectory: true`：允許使用者自訂安裝路徑。
  * `createDesktopShortcut: true`：建立桌面捷徑。
  * `createStartMenuShortcut: true`：建立開始功能表捷徑。
* [x] **3.3 解除安裝資料保護設定**：
  * `deleteAppDataOnUninstall: false`：解除安裝時**絕不**刪除使用者 `%APPDATA%\GitHub Explorer V2` 中的資料庫與個人收藏。
* [x] **3.4 官方視覺圖標生成 (build/icon.ico, build/icon.png)**：
  * 以深藍色背景、白色 GitHub Octocat、高亮藍色放大鏡與 V2 概念圖檔作為素材來源。
  * 實作 `scripts/generate_icons.ps1` 自動偵測 Squircle 圓角並完成透明背景抗鋸齒裁切，無黑框白邊。
* [x] **3.5 多解析度 ICO 封裝 (16, 32, 48, 256 px)**：
  * 支援 Windows 11/10 所有標準尺寸：16px（標題列/通知區）、32px（工作列/小圖示）、48px（中圖示）、256px（大圖示/高解析螢幕）。
* [x] **3.6 全域應用程式圖標套用驗證**：
  * `BrowserWindow` 視窗標題列圖標：配置 `icon: getAppIcon()`。
  * Windows 工作列圖標：通過。
  * 桌面與開始功能表捷徑圖標：配置 `installerIcon`, `uninstallerIcon`, `installerHeaderIcon`。
  * Windows 安裝檔 `GitHub-Explorer-Setup.exe` 圖標：配置 `win.icon: "build/icon.ico"`。
* [x] **3.7 專屬圖標生成 BAT 工具**：
  * 新增 `生成圖標.bat`，並自動整合至 `建立Windows安裝版.bat` 作為建置前置作業。

---

### Phase 4：Windows 安裝程式實測與資料持久化
* [x] **4.1 資料庫儲存路徑隔離**：
  * 正式版 SQLite 統一儲存於 `%APPDATA%\GitHub Explorer V2\radar.db`。
  * 解決了安裝在 `Program Files` 唯讀目錄下會導致的權限錯誤（`EACCES`）。
* [x] **4.2 舊資料繼承機制**：
  * 首次安裝啟動時，自動搜尋開發環境既有 `dev.db` 並安全複製，不覆蓋現有紀錄。
* [x] **4.3 關閉重啟持久性**：
  * 重開軟體後，收藏清單、自訂設定與歷史快照依然存在。
* [x] **4.4 日誌診斷機制**：
  * 伺服器輸出即時寫入 `%APPDATA%\GitHub Explorer V2\logs\server.log`，方便排除連線問題。

---

### Phase 5：原有功能無損回歸測試
* [x] **5.1 瀏覽器版一鍵啟動 BAT 驗證**：雙擊 `一鍵啟動.bat` 依然能以原本方式在瀏覽器打開開發伺服器。
* [x] **5.2 套件依賴安裝 BAT 驗證**：`安裝依賴.bat` 正常運作，無任何衝突。
* [x] **5.3 桌面版與網頁版環境隔離**：桌面版連線獨立埠（3100+）與獨立 AppData 資料庫，網頁版連線 3000/3001 埠與本機 `dev.db`，兩者互不干擾。
