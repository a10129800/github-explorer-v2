export type DemoVerificationStatus = 
  | 'verified' 
  | 'unverified' 
  | 'found_unverified' 
  | 'docs-only' 
  | 'check_failed' 
  | 'none';

export type DemoCategory = 'web-app' | 'interactive' | 'docs' | 'unknown';

export interface DemoLinkInfo {
  url: string;
  source: 'homepage' | 'readme' | 'github-pages';
  category: DemoCategory;
  verificationStatus: DemoVerificationStatus;
  lastCheckedAt?: string;
  title?: string;
}

export interface CostAnalysisInfo {
  licenseSpdxId: string | null;
  licenseName: string;
  isOpenSourceApproved: boolean; // 是否符合 OSI 開源定義
  deploymentType: 'self-hosted' | 'cloud-only' | 'local-binary' | 'browser-run' | 'unknown';
  requiresExternalApi: boolean;
  requiredApiProviders: string[]; // e.g. ["OpenAI", "Anthropic"]
  requiresGpu: boolean;
  hasFreeDemo: boolean;
  commercialRestriction: boolean; // 是否禁止商業使用 (e.g. Non-Commercial 條款)
  notes: string[];
}

export interface TrendScoreBreakdown {
  popularityScore: number;   // 0-100 受歡迎程度
  growthScore: number | null;// 0-100 近期成長程度 (若無足夠快照則為 null，標記資料不足)
  freshnessScore: number;    // 0-100 專案新鮮度
  maintenanceScore: number;  // 0-100 維護活躍度
  demoScore: number;         // 0-100 體驗便利性
  openSourceScore: number;   // 0-100 開源與授權完整度
  discoveryScore: number;    // 0-100 綜合探索價值
}

export type TrendProfile = 
  | 'hot-stable'          // 熱門穩定型
  | 'fast-rising'         // 快速崛起型
  | 'emerging-potential'  // 新興潛力型
  | 'playable-demo'       // 可直接體驗型
  | 'hidden-gem'          // 冷門寶藏型
  | 'active-maintenance'; // 維護活躍型

export type TrendingTimeframe = 'today' | 'this_week' | 'this_month';

export interface RepositorySnapshotData {
  capturedAt: string;
  stars: number;
  forks: number;
  openIssues: number;
  trendSource?: string;
  trendRank?: number;
}

export interface RadarRepoItem {
  id: string;
  githubId: number | null;
  fullName: string;
  ownerLogin: string;
  name: string;
  description: string | null;
  zhSummary: string; // 繁體中文摘要
  homepage: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  licenseSpdxId: string | null;
  topics: string[];
  archived: boolean;
  fetchedAt: string;

  // 趨勢與增長
  recentStarGrowth: number | null; // 最近可測得增長量 (無快照時為 null)
  growthRateStr: string;           // 增長文字說明 (例如: "+120 今日" 或 "無歷史快照")
  trendProfile: TrendProfile;      // 系統分類標籤
  scoreBreakdown: TrendScoreBreakdown;
  scoreReasons: string[];          // 可解釋的評分理由

  // Demo 與費用
  demo: DemoLinkInfo;
  cost: CostAnalysisInfo;

  // 快照歷史
  snapshots?: RepositorySnapshotData[];
}

export interface SearchFilters {
  query?: string;
  language?: string;
  starsMin?: number;
  starsMax?: number;
  timeRange?: 'today' | 'week' | 'month' | 'year' | 'any';
  createdRange?: '30d' | '90d' | '1y' | 'any';
  demoOnly?: boolean;
  openSourceOnly?: boolean;
  sortBy?: 'discovery' | 'growth' | 'stars' | 'updated' | 'demo';
  order?: 'desc' | 'asc';
  page?: number;
  perPage?: number;
}

export interface SearchResultResponse {
  items: RadarRepoItem[];
  totalCount: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  queryExplained?: string;
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string | null;
    hasToken: boolean;
  };
}

export type FavoriteStatus = 
  | 'want-to-try'      // 想試玩
  | 'want-to-install'  // 想安裝
  | 'want-to-study'    // 想研究原始碼
  | 'making-similar'   // 想製作類似專案
  | 'tried';           // 已經試過

export interface FavoriteItem {
  id: string;
  repositoryId: string;
  status: FavoriteStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  repository: RadarRepoItem;
}

export * from './v2';

