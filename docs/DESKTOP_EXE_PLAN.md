# GitHub Explorer V2 — Windows Electron 正式安裝版 (EXE) 架構與執行計畫書

> **文件版本**：1.0.0  
> **制定日期**：2026-10-22  
> **專案代號**：GitHub-Explorer-V2-Desktop  
> **目標產物**：`dist/GitHub-Explorer-Setup.exe` (Windows NSIS x64 正式安裝程式)

---

## 一、現有技術架構盤點

| 項目 | 目前現有狀態 | 備註 |
| :--- | :--- | :--- |
| **框架體系** | Next.js 14.1.3 (App Router), React 18.2.0, TypeScript 5.4.2 | 完整的 SSR / API Routes / Server Components 全端架構 |
| **造型樣式** | TailwindCSS 3.4.1, Lucide React 0.358.0, Cyber-Dark 自訂主題 | 完全相容桌面客戶端與高解析度螢幕 |
| **資料庫系統** | SQLite (`dev.db`), Prisma 5.11.0 (`@prisma/client`) | 儲存專案快照、我的收藏、每日情報、會員帳號與自訂硬體檔案 |
| **核心 API 路由** | `/api/search`, `/api/trending`, `/api/favorites`, `/api/auth/*`, `/api/health`, `/api/ai-tools`, `/api/compare`, `/api/daily-intel`, `/api/assistant`, `/api/compatibility` | 全部為 Next.js 原生 Route Handlers |
| **現有啟動方式** | `一鍵啟動.bat` -> `scripts/start.ps1` (偵測埠號 3000/3001，執行 `npm run dev`) | **必須 100% 完整保留，不得改動或刪除** |
| **依賴安裝** | `安裝依賴.bat` -> `scripts/install.ps1` | **必須 100% 完整保留** |
| **說明文件** | `README_一鍵啟動.txt`, `README.md`, `docs/*` | **保留現有說明，並擴充安裝版手冊** |

---

## 二、現有資料庫位置與使用方式

1. **開發環境資料庫路徑**：
   * 預設連線字串為 `file:./dev.db`（位於專案工作目錄）。
   * 由 `lib/db/prisma.ts` 中的 `PrismaClient` 讀取 `process.env.DATABASE_URL`。
2. **正式安裝版 (Production Desktop) 資料保護原則**：
   * **不可**將 SQLite 放置於 `Program Files`（Windows 安裝目錄具有唯讀權限保護，寫入會導致 `EACCES` 或資料遺失）。
   * 正式版資料庫統一導向 Windows 標準使用者應用程式目錄：  
     `%APPDATA%\GitHub Explorer V2\radar.db`（即 `C:\Users\<用戶名>\AppData\Roaming\GitHub Explorer V2\radar.db`）。
   * 若使用者曾使用開發版累積收藏，安裝版提供安全無失真複製機制（備份後遷移，絕不覆蓋）。
   * 解除安裝程式（Uninstaller）預設**保留** `%APPDATA%\GitHub Explorer V2\`，防止使用者重灌或升級時遺失個人資料與收藏清單。

---

## 三、打包相容性關鍵問題與技術解決方案

### 1. Next.js 伺服器端正式執行方式 (禁止在安裝版跑 `npm run dev`)
* **方案**：採用 Next.js 官方推薦的 `output: "standalone"` 生產建置。
* **靜態與公開資產**：建置後自動將 `.next/static` 複製至 `.next/standalone/.next/static`，確保無外網時所有 CSS、JS 與圖片皆可本機快顯。
* **伺服器執行檔**：`.next/standalone/server.js`。

### 2. Node.js Runtime 零依賴解決方案 (不可假設使用者電腦已裝 Node.js)
* **方案**：利用 Electron 內建的 `ELECTRON_RUN_AS_NODE=1` 模式呼叫 `process.execPath`。
* **原理**：Electron 本身即由 Chromium + Node.js 完整編譯而成。當指定環境變數 `ELECTRON_RUN_AS_NODE=1` 時，Electron 執行檔本身即可充當百分之百相同架構、穩定且無需外部安裝的 Node.js 引擎！同時亦支援隨安裝包攜帶的獨立便攜 runtime，確保在任何乾淨 Windows 機器皆可開箱即用。

### 3. 連接埠防撞與本機安全綁定 (Loopback Security)
* **方案**：
  * Next.js 伺服器嚴格僅監聽 `127.0.0.1`（Loopback 本地迴路），絕不暴露至區域網路。
  * 啟動前進行動態可用連接埠探測（預設從 3000、3001 或 3200~3999 尋找未被占用的埠）。
  * 透過 `/api/health` 進行健康輪詢檢查（Health Check），成功回傳 HTTP 200 後才開啟主視窗，並於關閉視窗時以程序樹（Process Tree）安全清理所有子程序，不留幽靈行程。

### 4. Electron 核心安全性
* `nodeIntegration: false`
* `contextIsolation: true`
* `sandbox: true`
* 採用獨立沙箱 `preload.js`，僅透過明確有限的 IPC 傳遞窗口控制與版本資訊。
* 所有外部網頁連結（如 GitHub 專案主頁、官方 Demo）一律強制由 Windows 預設瀏覽器（Edge/Chrome 等）開啟，保護桌面核心。

---

## 四、預計新增與修改之檔案清單

### 1. 新增檔案
- `electron/main.ts` / `electron/main.js`：Electron 主程序（程序管理、連接埠探測、健康檢查、視窗管理）。
- `electron/preload.ts` / `electron/preload.js`：安全 Preload 腳本。
- `electron/serverManager.js`：Next.js Standalone 伺服器程序生命週期與日誌管理器。
- `electron/splash.html`：啟動載入與診斷視窗（防止白畫面）。
- `electron-builder.json`：NSIS 安裝程式打包設定檔。
- `scripts/build_installer.ps1`：一鍵自動化建置與封裝 PowerShell 腳本。
- `建立Windows安裝版.bat`：為開發者提供的無終端機一鍵打包 BAT 捷徑。
- `啟動桌面開發版.bat`：桌面模式除錯捷徑。
- `public/icon.ico` / `public/icon.png`：專案桌面圖示資源。
- `docs/DESKTOP_EXE_PLAN.md`：本計畫書。
- `docs/DESKTOP_EXE_TEST_REPORT.md`：測試驗收報告。
- `docs/DESKTOP_EXE_USER_GUIDE.md`：安裝版使用手冊。

### 2. 修改檔案
- `next.config.mjs`：加入 `output: 'standalone'` 與靜態圖片最佳化相容性設定。
- `package.json`：新增 `electron`, `electron-builder`, `concurrently`, `wait-on` 依賴及桌面建置 scripts（`electron:dev`, `electron:build`, `dist:win`）。
- `README.md`：補充正式安裝版 EXE 下載與使用章節。

### 3. 嚴格保護不變之檔案
- `一鍵啟動.bat`
- `安裝依賴.bat`
- `README_一鍵啟動.txt`
- `scripts/start.ps1`
- `scripts/install.ps1`
- 所有現有元件、頁面與 API 邏輯

---

## 五、執行時程與階段劃分

* **Phase A**：架構盤點與計畫書（已完成）
* **Phase B**：Electron 核心程式碼與安全 Preload 開發
* **Phase C**：Next.js Standalone 產物配置與 AppData 資料庫連線配置
* **Phase D**：electron-builder 與 NSIS 安裝精靈設定
* **Phase E**：自動化打包指令與輔助 BAT 建構
* **Phase F**：全流程測試驗收與產物手冊交付
