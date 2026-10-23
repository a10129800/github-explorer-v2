# GitHub Explorer V2 — 功能矩陣對照表 (Feature Matrix)

| 功能模組 | 版本狀態 | 頁面位置 | API 路由 | 依賴資料表 / 儲存 | 測試覆蓋 | 完成狀態 |
|---|---|---|---|---|---|---|
| **首頁開源雷達** | 既有 (V1) | `app/page.tsx` | `/api/trending`, `/api/search` | `Repository`, `RepositorySnapshot` | `tests/unit/trend-scoring.test.ts` | 已完成 |
| **全域搜尋與繁中轉譯** | 既有 (V1) | `app/page.tsx` | `/api/search` | `SearchHistory` | `tests/unit/search-query.test.ts` | 已完成 |
| **專案詳細規格頁** | 既有 (V1) | `app/repository/[owner]/[repo]/page.tsx` | `/api/repositories/[owner]/[repo]` | `Repository`, `RepositorySnapshot` | `tests/playwright/e2e.spec.ts` | 已完成 |
| **收藏與稍後研究** | 既有 (V1) | `app/favorites/page.tsx` | `/api/favorites` | `Favorite` | `tests/playwright/e2e.spec.ts` | 已完成 |
| **搜尋足跡歷史** | 既有 (V1) | `app/history/page.tsx` | Local / `/api/search` | `SearchHistory` | `tests/playwright/e2e.spec.ts` | 已完成 |
| **1. 免費 AI 工具尋寶** | 新增 (V2) | `app/ai-tools/page.tsx` | `/api/ai-tools` | `Repository`, `ProjectEnrichment` | `tests/unit/ai-tools.test.ts` | 已完成 |
| **2. Demo 一鍵試玩增強** | 新增 (V2) | `components/DemoModal.tsx` | `/api/demo/verify` | `DemoResource` | `tests/unit/demo-safety.test.ts` | 已完成 |
| **3. 同類專案比較器** | 新增 (V2) | `app/compare/page.tsx` | `/api/compare` | Local / Session / `Repository` | `tests/unit/comparator.test.ts` | 已完成 |
| **4. README 繁中解說** | 新增 (V2) | `components/ReadmeExplainer.tsx` | `/api/repositories/[owner]/[repo]/explain` | `ProjectEnrichment` | `tests/unit/readme-parser.test.ts` | 已完成 |
| **5. 每日開源情報與排程** | 新增 (V2) | `app/daily-intel/page.tsx` | `/api/daily-intel` | `DailyReport`, `RepositorySnapshot` | `tests/unit/daily-intel.test.ts` | 已完成 |
| **6. AI 專案研究助手** | 新增 (V2) | `app/assistant/page.tsx` | `/api/assistant` | `ResearchReport` | `tests/unit/assistant.test.ts` | 已完成 |
| **7. 相似專案推薦** | 新增 (V2) | `components/SimilarReposSection.tsx` | `/api/repositories/[owner]/[repo]/similar` | `Repository` | `tests/unit/similarity.test.ts` | 已完成 |
| **8. Windows／硬體相容性評估** | 新增 (V2) | `app/compatibility/page.tsx` | `/api/compatibility` | `UserHardwareProfile`, `ProjectEnrichment` | `tests/unit/hardware-evaluator.test.ts` | 已完成 |
| **Windows 一鍵啟動體系** | 既有 (V1) | 根目錄 | 無 (本機批次檔) | `一鍵啟動.bat`, `安裝依賴.bat`, `scripts/` | 本機啟動驗證 | 已完成 |
