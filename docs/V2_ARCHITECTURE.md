# GitHub Explorer V2 — 系統架構與技術設計 (Architecture Design)

## 一、系統架構概覽

本專案採用 **Next.js 14 App Router + TypeScript + Tailwind CSS** 的現代化全端架構，後端搭配 **Prisma ORM + SQLite (`dev.db`)**，整合 GitHub REST API 提供多維度開源專案探索、分析與決策支援。

```
┌─────────────────────────────────────────────────────────────┐
│                   瀏覽器端 (Frontend UI)                     │
│  - Cyber-Dark 現代設計系統 (Tailwind CSS, Lucide Icons)     │
│  - 趨勢雷達頻道 (今日/本週/本月/新興/Demo/免費開源)          │
│  - V2 八大核心頁面與元件 (AI尋寶, 比較器, 情報, 助手, 相容性)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                Next.js API 路由層 (App Router)              │
│  /api/ai-tools            /api/compare                      │
│  /api/daily-intel         /api/assistant                    │
│  /api/compatibility       /api/demo/verify                  │
│  /api/repositories/...    /api/trending                     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼───────────────┐
│     領域業務邏輯層 (lib/)   │ │    資料儲存與安全防護層     │
│ - aiTools: AI分類與免費性質│ │ - Prisma ORM + SQLite (dev.db)│
│ - comparator: 專案多維對比 │ │ - memoryCache: 記憶體快取防重  │
│ - readmeParser: 11項解說   │ │ - safety: SSRF 防禦與 IP 檢查 │
│ - dailyReport: 台北時區報告│ │ - rateLimit: GitHub 配額監控  │
│ - researcher: 雙層意圖研究 │ └───────────────────────────────┘
│ - evaluator: 硬體相容引擎  │
└──────────────┬─────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                  外部服務 (External Services)               │
│ - GitHub REST API v3 (Search, Repos, Readme, Releases)      │
│ - (選用) 本機 Ollama 服務 (http://localhost:11434)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、八大功能模組架構

### 1. 免費 AI 工具尋寶 (`lib/enrichment/aiTools.ts`)
- **分類體系**：涵蓋文字轉影片、圖片生成、本機 LLM、語音合成 (TTS)、口型同步、3D 生成等 11 個標準領域。
- **費用評估引擎**：依據 SPDX 授權條款、README 關鍵字（`OPENAI_API_KEY`、`CUDA`、`non-commercial`）精確區分「開源免費自架」、「開源但需高昂算力/API」、「免費方案 (Free Tier)」與「免費試用」。

### 2. Demo 一鍵試玩增強 (`lib/demo/safety.ts`, `components/DemoModal.tsx`)
- **SSRF 防禦**：伺服器端探測嚴格限制僅接受 HTTP/HTTPS，透過 DNS 解析攔截私有網段 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)、Loopback (`127.0.0.0/8`, `::1`) 及雲端 Metadata (`169.254.169.254`)。
- **狀態分類**：提供 `verified`、`found_unverified`、`docs-only`、`none`、`check_failed`，絕不因探測超時即判定連結不存在。

### 3. 同類專案比較器 (`lib/compare/comparator.ts`)
- **多維度矩陣**：比較 Stars、Forks、語言技術棧、授權、免費自架條件、Demo、Windows 原生支援、GPU/算力需求、安裝難度、近期維護。
- **情境決策推論**：依據資料客觀產出「免安裝試玩」、「企業長期支援」與「低算力零成本」之推薦。

### 4. README 繁體中文結構化解說 (`lib/enrichment/readmeParser.ts`)
- **11 項抽取器**：核心用途、適合情境、主要功能、起步步驟、Windows 安裝、GPU 門檻、API 需求、授權條款、Demo、限制、原始連結。
- **三種閱讀模式**：快速理解、安裝教學、技術細節。
- **XSS 安全防護**：過濾 `<script>` 標籤、清理 `javascript:` 惡意連結協定。

### 5. 每日開源情報與排程 (`lib/intel/dailyReport.ts`)
- **台北時區排程鎖**：以 `Asia/Taipei` 日期字串 (`YYYY-MM-DD`) 與唯一執行 ID 防止同一天重複產生。
- **真實數據承諾**：嚴格區分即時數據與本機快照歷史，無足夠採樣時標記「正在累積歷史資料」，絕不捏造過去 7 天或 30 天之成長率。
- **多格式匯出**：自動產生結構化 JSON 與 GitHub-Flavored Markdown。

### 6. AI 專案研究助手 (`lib/assistant/researcher.ts`)
- **兩層式架構**：
  - 第一層：免費、純本機規則之自然語言檢索合成器，將中文提問轉換為 GitHub 關鍵字與意圖過濾。
  - 第二層：選用之本機 Ollama 服務或客製 API，若不可用自動優雅降級回第一層。

### 7. 相似專案推薦 (`lib/recommend/similarity.ts`)
- **多維度相似度計算**：Jaccard Topics 相似度 (45%) + 文本關鍵字 Token (35%) + 程式語言一致性 (20%)。
- **客觀可解釋性**：為每筆推薦清楚羅列「相似原因」與「主要差異」。

### 8. Windows／硬體相容性評估 (`lib/hardware/evaluator.ts`)
- **環境規則引擎**：依據專案所需算力與語言生態，比對使用者輸入之 OS、RAM、GPU 品牌、VRAM 大小、WSL2 與 Docker 配置。
- **最佳執行路徑指引**：自動判斷採用「Windows 原生執行」或「WSL2 (Ubuntu 容器)」，並提供無 GPU 時的量化與 CPU 替代建議。

---

## 三、資料庫模型設計 (`prisma/schema.prisma`)

| 資料表 | 用途 | 關鍵索引 |
|---|---|---|
| `Repository` | 儲存專案核心 GitHub 元數據與快取 | `stars`, `language`, `pushedAt` |
| `RepositorySnapshot` | 定期採樣專案星數與 Forks，計算真實成長趨勢 | `[repositoryId, capturedAt]`, `capturedAt` |
| `DemoResource` | 儲存已驗證或偵測到之官方 Demo 連結與驗證結果 | `repositoryId`, `verificationStatus` |
| `ProjectEnrichment` | 保存 AI 領域分類、免費性質、中文解說與相容性 | `repositoryId`, `aiCategory`, `freeType` |
| `DailyReport` | 儲存每日情報歷史紀錄 (日期鎖 `reportDate`) | `reportDate` (唯一), `generatedAt` |
| `ResearchReport` | 儲存 AI 專案研究報告與分析結果 | `createdAt` |
| `UserHardwareProfile` | 儲存使用者自訂硬體設定 (亦同步於瀏覽器本機) | `id` |
| `Favorite` | 使用者個人收藏庫 | `repositoryId` (唯一), `status` |
| `SearchHistory` | 本地搜尋查詢關鍵字足跡 | `createdAt` |

---

## 四、資安與穩定性防護

1. **零金鑰外洩保證**：
   - 伺服器端環境變數 `GITHUB_TOKEN` 絕不回傳給前端，日誌隱藏 Token。
2. **防範 SSRF 與惡意探測**：
   - DNS 預解析並阻擋所有迴路、私有 IP 及雲端服務商 Metadata IP。
3. **安全資料庫降級 (`safeDbOperation`)**：
   - 資料庫未初始化或遷移暫未執行時，提供優雅記憶體降級，避免伺服器 500 崩潰。
4. **Windows 編碼與路徑防護**：
   - 啟動批次檔維持純 ASCII，PowerShell 腳本嚴格使用 UTF-8，支援中文專案目錄路徑與自動開啟瀏覽器。
