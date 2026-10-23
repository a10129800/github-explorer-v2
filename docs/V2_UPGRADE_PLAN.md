# GitHub Explorer V2 — 下一階段完整功能升級計畫

**文件版本**：2.0.0  
**更新日期**：2026-10-22  
**目標專案**：開源專案雷達 (GitHub Explorer V2)  

---

## 一、現有專案盤點與保護策略

### 1. 現有架構盤點
- **核心框架**：Next.js 14.1.3 (App Router)、React 18.2.0、TypeScript 5.4.2
- **樣式系統**：Tailwind CSS 3.4.1、PostCSS (CommonJS 相容)、Lucide React 圖示庫
- **資料庫與 ORM**：SQLite (`file:./dev.db`) + Prisma ORM 5.11.0
- **快取機制**：伺服器端 MemoryCache (TTL + Request Deduplication)
- **測試工具**：Vitest 1.4.0 (單元測試)、Playwright 1.42.1 (E2E 瀏覽器測試)
- **啟動腳本**：
  - `一鍵啟動.bat` (純 ASCII 雙擊腳本，喚起 PowerShell)
  - `安裝依賴.bat` (純 ASCII 依賴安裝腳本)
  - `scripts/start.ps1` (UTF-8 伺服器啟動與自動開啟瀏覽器)
  - `scripts/install.ps1` (UTF-8 依賴下載與 Prisma 產生)
  - `README_一鍵啟動.txt` (繁體中文指引)

### 2. 現有功能清單與路由映射
- **首頁開源雷達**：`app/page.tsx`
  - 頻道：今日雷達 (`today`)、本週崛起 (`this_week`)、本月熱門 (`this_month`)、新興專案 (`emerging`)、Demo 尋寶 (`demos`)、免費開源 (`free-oss`)
  - 7 維度評分：Popularity, Growth, Freshness, Maintenance, Demo, Open Source, Discovery
  - 即時快照折線圖：`components/TrendingChart.tsx`
  - 搜尋與繁中轉譯：`components/SearchFilterBar.tsx`、`lib/search/strategy.ts`
- **專案詳細規格頁**：`app/repository/[owner]/[repo]/page.tsx`
  - 規格表、README 預覽、安裝步驟提煉、Demo 連結、費用與授權分析
- **個人收藏與稍後研究**：`app/favorites/page.tsx`
  - 狀態管理 (`want-to-try`, `want-to-install`, `want-to-study`, `making-similar`, `tried`)
  - JSON / CSV 匯出功能
- **搜尋足跡歷史**：`app/history/page.tsx`
- **現有 API 路由**：
  - `GET /api/health` (健康狀態與 Rate Limit)
  - `GET /api/search` (全域搜尋與繁中編譯)
  - `GET /api/trending` (今日/週/月趨勢)
  - `GET /api/repositories/[owner]/[repo]` (專案詳情與 README)
  - `GET /api/repositories/[owner]/[repo]/snapshots` (歷史 Star 快照)
  - `GET /api/repositories/[owner]/[repo]/demo` (SSRF 安全 Demo 探測)
  - `GET /api/discover` (探索頻道)
  - `GET/POST /api/favorites` & `DELETE/PATCH /api/favorites/[id]` (收藏管理)

### 3. 保護原則
- **不重構/不重建**：保留全部現有頁面、API、元件與資料庫表結構。
- **保護啟動檔案**：絕不修改或覆蓋 `一鍵啟動.bat`、`安裝依賴.bat`。
- **向下相容 Schema**：在 `prisma/schema.prisma` 中僅新增資料模型（`DemoResource`, `ProjectEnrichment`, `DailyReport`, `ResearchReport`, `UserHardwareProfile`），既有表結構維持不變。
- **免費與無 Token 模式**：所有功能預設支援免金鑰規則式運算，未配置 Token 時優雅降級。

---

## 二、八大新增功能升級方案

| 功能編號 | 功能名稱 | 頁面位置 | API 端點 | 核心邏輯模組 |
|---|---|---|---|---|
| 1 | 免費 AI 工具尋寶 | `app/ai-tools/page.tsx` | `/api/ai-tools` | `lib/enrichment/aiTools.ts` |
| 2 | Demo 一鍵試玩 | `components/DemoModal.tsx` / 卡片 | `/api/demo/probe` | `lib/demo/detector.ts` (擴充狀態) |
| 3 | 同類專案比較器 | `app/compare/page.tsx` | `/api/compare` | `lib/compare/comparator.ts` |
| 4 | README 繁中解說 | `components/ReadmeExplainer.tsx` | `/api/repositories/[owner]/[repo]/explain` | `lib/enrichment/readmeParser.ts` |
| 5 | 每日開源情報與排程 | `app/daily-intel/page.tsx` | `/api/daily-intel` | `lib/intel/dailyReport.ts`, `lib/intel/scheduler.ts` |
| 6 | AI 專案研究助手 | `app/assistant/page.tsx` | `/api/assistant` | `lib/assistant/researcher.ts` (雙層架構) |
| 7 | 相似專案推薦 | `components/SimilarReposSection.tsx` | `/api/repositories/[owner]/[repo]/similar` | `lib/recommend/similarity.ts` |
| 8 | Windows/硬體相容性評估 | `app/compatibility/page.tsx` | `/api/compatibility` | `lib/hardware/evaluator.ts` |

---

## 三、執行相依性與驗收清單

1. **Phase 1：資料模型與共用服務**
   - 擴充 `prisma/schema.prisma`，執行 `prisma:generate` 與 `prisma:push`。
   - 建立共用型別 `lib/types/v2.ts`。
2. **Phase 2：AI 工具尋寶與 README 解說**
   - 建立 `/ai-tools`、README 三模式結構化繁中解說。
3. **Phase 3：Demo 試玩與專案比較器**
   - 擴充 Demo 狀態（`verified`, `found_unverified`, `docs_only`, `none`, `check_failed`）。
   - 建立 2～4 專案並列比較器 `/compare`。
4. **Phase 4：相似專案與硬體相容性**
   - 多維度相似度比對與解釋。
   - Windows 10/11, RAM, GPU, WSL2 硬體相容性檢測 `/compatibility`。
5. **Phase 5：每日開源情報與排程**
   - 歷史情報報告、Markdown/JSON 匯出、定時排程引擎。
6. **Phase 6：AI 專案研究助手**
   - 繁中自然語言雙層架構研究報告產出。
7. **Phase 7：整合驗證與測試**
   - 更新單元與 E2E 測試，確保原有功能與新功能無任何衝突。
