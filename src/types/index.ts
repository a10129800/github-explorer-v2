export interface GithubOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: GithubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
  } | null;
  archived: boolean;
  disabled: boolean;
  default_branch: string;
  has_pages?: boolean;
  has_wiki?: boolean;
}

export interface GithubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GithubRepo[];
}

export interface ScoreBreakdown {
  freshness: number;    // 最近更新評分 (0-25)
  community: number;    // 社群與話題度 (0-25)
  documentation: number;// 文件與說明豐富度 (0-25)
  usability: number;    // 實用性與 Demo 展示 (0-25)
}

export interface TreasureMetrics {
  popularityScore: number; // 0-100 熱門程度
  treasureScore: number;   // 0-100 探索價值/寶藏指數
  badge: {
    label: string;
    color: string;
    icon: string;
  };
  reasons: string[];       // 可解釋評分依據
  breakdown: ScoreBreakdown;
  hasDemo: boolean;
  isFresh: boolean;
  isNiche: boolean;
}

export interface SearchFilters {
  query: string;
  language: string;
  starRange: string;      // e.g. "any", "10..500", "500..2000", "2000..10000", "10000..*"
  updateTime: string;    // e.g. "any", "7d", "30d", "90d", "1y"
  createdTime: string;   // e.g. "any", "30d", "90d", "1y"
  sort: string;          // "best-match", "stars", "forks", "updated", "treasure"
  order: 'desc' | 'asc';
  topic: string;
  page: number;
  perPage: number;
}

export interface ApiRateLimit {
  limit: number;
  remaining: number;
  resetTime: Date | null;
  hasCustomToken: boolean;
  tokenSource: 'env' | 'user' | 'none';
}

export interface CategoryItem {
  id: string;
  name: string;
  enName: string;
  icon: string;
  description: string;
  query: string;
  tags: string[];
  highlight?: boolean;
}

export interface RepoAnalysis {
  translatedSummaryZh: string;
  difficultyEstimate: '入門友善' | '中等難度' | '進階專業' | '尚未確認';
  requiresExtraKeys: boolean;
  possibleRequirements: string[];
  installSteps: string[];
  hasDemo: boolean;
  demoUrl?: string;
  isAiRelated: boolean;
}
