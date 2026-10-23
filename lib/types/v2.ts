// ==============================================================================
// GitHub Explorer V2 - 純型別定義檔 (Pure Type Definitions)
// 絕不引入 @prisma/client、node:fs 或後端客戶端，確保前端 Client Component 安全匯入
// ==============================================================================

import { RadarRepoItem } from './index';

// 1. AI 工具尋寶型別
export type AICategory =
  | 'text-to-video'
  | 'image-gen'
  | 'image-to-video'
  | 'voice-tts'
  | 'lip-sync'
  | '3d-gen'
  | '3d-viewer'
  | 'code-assistant'
  | 'local-llm'
  | 'workflow'
  | 'other';

export type FreeType =
  | 'free-selfhost'       // 開源且可免費自架
  | 'open-source-costly'  // 開源但可能需要昂貴硬體/GPU/付費 API
  | 'free-tier'           // 商業產品提供免費方案
  | 'free-trial'          // 免費試用但有限制
  | 'unknown';            // 費用或授權尚未確認

export type WindowsCompat =
  | 'native'            // 原生支援 Windows
  | 'wsl2-recommended'  // 建議使用 WSL2
  | 'docker-required'   // 需要 Docker
  | 'unsupported'       // 不支援 Windows
  | 'unknown';          // 尚未確認

export interface AIToolItem {
  id: string;
  fullName: string;
  name: string;
  ownerLogin: string;
  description: string;
  zhPurpose: string;
  category: AICategory;
  categoryLabel: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  licenseName: string;
  licenseSpdxId: string | null;
  freeType: FreeType;
  freeTypeLabel: string;
  freeTypeDescription: string;
  requiresApiKey: boolean;
  requiredApiProviders: string[];
  requiresGpu: boolean;
  canRunLocal: boolean;
  hasDemo: boolean;
  demoUrl: string | null;
  demoVerificationStatus: string;
  windowsCompat: WindowsCompat;
  windowsCompatLabel: string;
  installDifficulty: 'easy' | 'medium' | 'hard' | 'unknown';
  installDifficultyLabel: string;
  maintenanceStatus: 'active' | 'normal' | 'stale';
  limitations: string[];
  htmlUrl: string;
  homepage: string | null;
  evidenceSource: string;
}

// 2. 專案比較器型別
export interface ComparisonDimension {
  id: string;
  name: string;
  category: '基礎指標' | '技術與硬體' | '授權與費用' | '體驗與維護';
  values: Record<string, string | number | boolean | null>;
  highlightBestId?: string;
  notes?: string;
}

export interface RepoComparisonSummary {
  repoId: string;
  fullName: string;
  name: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  keyStrengths: string[];
  keyLimitations: string[];
  bestFor: string;
  installDifficulty: string;
  windowsRating: string;
  gpuRating: string;
  freeRating: string;
}

export interface ComparisonResult {
  repos: RadarRepoItem[];
  dimensions: ComparisonDimension[];
  summaries: RepoComparisonSummary[];
  recommendations: {
    useCase: string;
    recommendedRepoFullName: string;
    reason: string;
  }[];
  generatedAt: string;
}

// 3. 每日開源情報型別
export interface DailyReportSection {
  title: string;
  badge: string;
  description: string;
  items: RadarRepoItem[];
}

export interface GeneratedDailyReport {
  id: string;
  reportDate: string;
  timezone: string;
  title: string;
  summary: string;
  sections: DailyReportSection[];
  exportMarkdown: string;
  exportJson: string;
  generatedAt: string;
  dataSource: string;
  status: 'completed' | 'generating' | 'failed';
  errorMsg?: string;
}

// 4. AI 專案研究助手型別
export interface ResearchCandidate {
  repo: RadarRepoItem;
  purpose: string;
  pros: string[];
  cons: string[];
  freeType: string;
  license: string;
  demoStatus: string;
  windowsCompat: string;
  hardwareSummary: string;
  installDifficulty: string;
  maintenanceRating: string;
  rankScore: number;
}

export interface ResearchReportData {
  id: string;
  query: string;
  searchFilterApplied: string;
  analysisMode: 'rule-based' | 'local-llm' | 'cloud-ai';
  candidates: ResearchCandidate[];
  summaryConclusion: string;
  comparisonMatrix: {
    name: string;
    fullName: string;
    stars: number;
    freeType: string;
    hasDemo: boolean;
    windowsFriendly: boolean;
    gpuNeeded: boolean;
  }[];
  recommendations: {
    rank: number;
    fullName: string;
    reason: string;
    idealFor: string;
  }[];
  uncertainties: string[];
  sources: { title: string; url: string }[];
  createdAt: string;
}

// 5. 硬體相容性評估型別
export interface UserHardwareInput {
  os: 'Windows 10' | 'Windows 11' | 'Linux' | 'macOS' | 'other';
  cpuArch: 'x64' | 'ARM64' | 'unknown';
  ramGb: number;
  gpuType: 'NVIDIA' | 'AMD' | 'Intel' | 'integrated' | 'none' | 'unknown';
  vramGb: number;
  hasWsl2: boolean;
  hasDocker: boolean;
  hasPython: boolean;
  hasNode: boolean;
  freeDiskGb: number;
  targetIntent: 'play' | 'develop' | 'video-gen' | 'image-gen' | '3d' | 'games';
}

export type CompatibilityRating =
  | 'ready'
  | 'compatible-tweaks'
  | 'extra-hardware'
  | 'unsupported'
  | 'insufficient-data';

export interface CompatibilityEvaluationResult {
  rating: CompatibilityRating;
  ratingLabel: string;
  ratingColor: string;
  summary: string;
  reasons: string[];
  potentialPitfalls: string[];
  minRequirements: {
    os: string;
    ram: string;
    gpu: string;
    vram: string;
    disk: string;
  };
  recommendedRequirements: {
    os: string;
    ram: string;
    gpu: string;
    vram: string;
    disk: string;
  };
  windowsInstallGuide: {
    recommendedPath: 'Windows 原生執行' | 'WSL2 (Ubuntu 容器)' | 'Docker 容器' | '雲端 / Demo 免安裝';
    steps: string[];
    needsCuda: boolean;
    needsWsl2: boolean;
    needsDocker: boolean;
  };
  hasCpuAlternative: boolean;
  cpuAlternativeAdvice?: string;
  estimatedDifficulty: '低 (容易)' | '中等' | '偏高' | '極高';
  officialDocUrl: string;
}
