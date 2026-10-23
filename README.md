# GitHub Explorer V2 — 開源專案雷達
### *Discover What's Rising in Open Source*

> 一套專為開發者、開源愛好者與技術決策者設計的開源情報儀表板。  
> 擺脫傳統固化的總 Star 排行榜，透過**真實 GitHub REST API、歷史快照成長追蹤、安全 Demo 探測、授權與費用審計，以及 V2 八大全新升級功能**，幫助您第一時間捕捉正在崛起、可免安裝線上試玩且具備高度研究價值的優質開源專案。

---

## ⚡ Windows 一鍵啟動 (桌面使用者首選)

本專案已為 Windows 桌面使用者提供**零終端機指令**的極簡啟動方式：

1. **第一次使用**：雙擊 `安裝依賴.bat`（或直接雙擊 `一鍵啟動.bat`，系統會自動偵測並提示安裝）。
2. **日常啟動**：雙擊 `一鍵啟動.bat`。
   - 自動檢測 Node.js 與環境。
   - 自動編譯 Prisma 資料庫 Schema。
   - 自動防撞連接埠（若 3000 被占用自動使用 3001）。
   - 自動於預設瀏覽器中開啟 `http://localhost:3000`（或 `http://localhost:3001`）。
3. **停止服務**：於終端機視窗中按下 `Ctrl + C`，或直接關閉該視窗即可。

---

## 🚀 V2 八大全新升級功能

1. **免費 AI 工具尋寶 (`/ai-tools`)**
   - 快速篩選文字轉影片、圖片生成、本機 LLM、語音合成 (TTS)、口型同步與 3D 生成等熱門開源 AI 工具。
   - 嚴格區分「開源免費自架」、「開源但需高昂算力/外部API」、「商業免費方案 (Free Tier)」與「免費試用」，絕不把開源等同於零費用。
2. **Demo 一鍵試玩體驗 (`DemoModal`)**
   - 一鍵開啟官方線上展示頁或 Playground，免安裝直接於瀏覽器互動驗證。
   - 伺服器端 SSRF 防護攔截私有 IP 與雲端 Metadata，未充分驗證連結給予清楚警示。
3. **同類專案比較器 (`/compare`)**
   - 支援 2～4 個 GitHub 專案橫向對比。
   - 多維度比對 Stars、語言技術棧、授權條款、Windows 相容性、GPU 門檻、安裝難度與免費自架條件，並針對「免安裝試玩」、「企業長期支援」與「低算力成本」產出情境化推薦。
4. **README 繁體中文結構化解說 (`ReadmeExplainer`)**
   - 規則引擎自動自英文 README 提煉 11 項關鍵指標，提供「快速理解」、「安裝教學」與「技術細節」3 種閱讀模式。
   - XSS 安全防禦，絕不自動執行外部程式碼，支援一鍵複製繁體中文筆記。
5. **每日開源情報與排程 (`/daily-intel`)**
   - 以台北時區 (`Asia/Taipei`) 每日自動編譯熱門趨勢、新興潛力星、AI 工具專區與免安裝 Demo 專區。
   - 支援一鍵匯出 Markdown 與 JSON 報告，並提供可選的 Windows 工作排程輔助腳本 (`scripts/schedule_intel.ps1`)。
6. **AI 專案研究助手 (`/assistant`)**
   - 雙層架構：第一層免費規則驅動，將中文提問轉換為精準 GitHub 檢索條件；第二層支援選用之本機 Ollama 服務。
   - 產出包含候選分析、優缺點、硬體門檻與可追溯來源的研究報告。
7. **相似專案推薦 (`SimilarReposSection`)**
   - 多維度運算 Topics 標籤 (45%) + 關鍵字語意 (35%) + 語言生態 (20%)。
   - 羅列相似原因與主要差異，客觀尋找同領域之開源替代工具。
8. **Windows／硬體相容性評估 (`/compatibility`)**
   - 輸入電腦之 OS、RAM、GPU 品牌、VRAM 大小與 WSL2/Docker 設定。
   - 評定相容等級（可直接使用 / 需額外硬體 / 大致相容），指引 Windows 原生或 WSL2 最佳路徑，並提供無 GPU 時的 CPU 替代方案。

---

## 🛠️ 技術架構與相依

- **框架**: Next.js 14.1.3 (App Router)
- **語言**: TypeScript 5
- **樣式系統**: Tailwind CSS (Cyber-Dark 科技深色風格、毛玻璃視覺)
- **圖示庫**: Lucide React
- **ORM & 資料庫**: Prisma ORM + SQLite (`file:./dev.db`)
- **安全防護**: SSRF IP 檢查器、XSS 防護、安全非阻塞資料庫降級 (`safeDbOperation`)
- **單元測試**: Vitest
- **E2E 瀏覽器測試**: Playwright

---

## 📦 環境變數設定（選填）

複製 `.env.example` 建立 `.env`：

```bash
cp .env.example .env
```

```env
# GitHub Personal Access Token (選填，將 API 限額自 60 次提升至 5,000 次/小時)
GITHUB_TOKEN=your_github_token_here

# 資料庫連線路徑
DATABASE_URL="file:./dev.db"
```

> 🔒 **安全性保證**：`GITHUB_TOKEN` 僅由伺服器端讀取，絕不會暴露給瀏覽器前端。若未設定 Token，系統會以公開訪客模式正常運作。

---

## 🧪 測試執行

```bash
# 執行單元測試 (涵蓋 AI分類、比較器、README解析、SSRF安全、時區、硬體評估等)
npm run test

# 執行端到端 E2E 瀏覽器測試
npm run test:e2e
```

---

---

## 🖥️ Windows 正式安裝版 EXE (Electron 桌面應用程式)

本專案已完成正式 Windows 桌面化打包架構，產出獨立安裝程式（**終端使用者電腦無需安裝 Node.js 或開發環境**）：

1. **一鍵建置安裝包**：雙擊根目錄的 **`建立Windows安裝版.bat`**。
   * 自動以官方高解析度素材產生多解析度圖標（包含 16/32/48/256px，亦可單獨執行 `生成圖標.bat`）。
   * 自動執行 Next.js Standalone 生產模式編譯。
   * 收集靜態與 Prisma 資源，透過 `electron-builder` 產生標準 Windows NSIS 安裝精靈。
   * 產物位於：`dist/GitHub-Explorer-Setup.exe`。
2. **安裝與啟動**：
   * 雙擊 `GitHub-Explorer-Setup.exe` 依安裝精靈完成安裝。
   * 可自由選擇安裝目錄，自動建立桌面與開始功能表捷徑。
   * 啟動時自動於本機隔離埠（`127.0.0.1`）啟動內嵌 Next.js 服務引擎，就緒後自動顯示主視窗。
3. **資料安全與個人收藏保留**：
   * 正式版 SQLite 資料庫統一存放於 `%APPDATA%\GitHub Explorer V2\radar.db`，解除安裝時預設保留使用者資料庫。

---

## 📚 專案文檔索引

- [docs/DESKTOP_EXE_USER_GUIDE.md](file:///f:/IDE/軟體開發/github/docs/DESKTOP_EXE_USER_GUIDE.md) — **Windows 桌面安裝版完整使用指南**
- [docs/DESKTOP_EXE_TEST_REPORT.md](file:///f:/IDE/軟體開發/github/docs/DESKTOP_EXE_TEST_REPORT.md) — **Windows Electron 正式安裝版測試驗收報告**
- [docs/DESKTOP_EXE_PLAN.md](file:///f:/IDE/軟體開發/github/docs/DESKTOP_EXE_PLAN.md) — **Windows Electron 正式安裝版架構與執行計畫書**
- [docs/V2_UPGRADE_PLAN.md](file:///f:/IDE/軟體開發/github/docs/V2_UPGRADE_PLAN.md) — V2 功能升級規劃
- [docs/V2_FEATURE_MATRIX.md](file:///f:/IDE/軟體開發/github/docs/V2_FEATURE_MATRIX.md) — 功能對照與完成狀態表
- [docs/V2_TEST_REPORT.md](file:///f:/IDE/軟體開發/github/docs/V2_TEST_REPORT.md) — 測試與品質驗收報告
- [docs/V2_USER_GUIDE.md](file:///f:/IDE/軟體開發/github/docs/V2_USER_GUIDE.md) — 網頁版使用者操作手冊
- [docs/V2_ARCHITECTURE.md](file:///f:/IDE/軟體開發/github/docs/V2_ARCHITECTURE.md) — 系統架構與技術設計

---

*GitHub Explorer V2 — 堅持真實資料、客觀分析、開源探索。*

