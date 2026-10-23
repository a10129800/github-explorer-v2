import { GithubRepo, GithubSearchResponse, ApiRateLimit, SearchFilters, RepoAnalysis } from '../types';

const API_BASE = 'https://api.github.com';

// 記憶體與 Session 快取機制
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分鐘快取

// Rate Limit 狀態追蹤
let currentRateLimit: ApiRateLimit = {
  limit: 60,
  remaining: 60,
  resetTime: null,
  hasCustomToken: false,
  tokenSource: 'none'
};

type RateLimitListener = (rateLimit: ApiRateLimit) => void;
const rateLimitListeners: RateLimitListener[] = [];

export function subscribeRateLimit(listener: RateLimitListener): () => void {
  rateLimitListeners.push(listener);
  listener(currentRateLimit);
  return () => {
    const idx = rateLimitListeners.indexOf(listener);
    if (idx !== -1) rateLimitListeners.splice(idx, 1);
  };
}

function notifyRateLimit(headers: Headers) {
  const limitHeader = headers.get('x-ratelimit-limit');
  const remainingHeader = headers.get('x-ratelimit-remaining');
  const resetHeader = headers.get('x-ratelimit-reset');

  const limit = limitHeader ? parseInt(limitHeader, 10) : currentRateLimit.limit;
  const remaining = remainingHeader ? parseInt(remainingHeader, 10) : currentRateLimit.remaining;
  const resetTime = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : currentRateLimit.resetTime;

  const userToken = typeof window !== 'undefined' ? localStorage.getItem('gh_explorer_token') : null;
  const envToken = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN) : undefined;
  const hasToken = Boolean(userToken || envToken);
  const tokenSource: 'user' | 'env' | 'none' = userToken ? 'user' : (envToken ? 'env' : 'none');

  currentRateLimit = {
    limit,
    remaining,
    resetTime,
    hasCustomToken: hasToken,
    tokenSource
  };

  rateLimitListeners.forEach(listener => listener(currentRateLimit));
}

// 獲取目前的授權標頭
function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };

  const userToken = typeof window !== 'undefined' ? localStorage.getItem('gh_explorer_token') : null;
  const envToken = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN) : undefined;
  const activeToken = userToken || envToken;

  if (activeToken && activeToken.trim()) {
    headers['Authorization'] = `Bearer ${activeToken.trim()}`;
  }

  return headers;
}

// 基礎通用 Fetch 封裝
async function fetchWithCache<T>(url: string, useCache = true): Promise<T> {
  const cacheKey = url;
  if (useCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() < cached.expiry) {
      return cached.data as T;
    }
    cache.delete(cacheKey);
  }

  const response = await fetch(url, {
    headers: getHeaders()
  });

  notifyRateLimit(response.headers);

  if (!response.ok) {
    if (response.status === 403) {
      const reset = currentRateLimit.resetTime 
        ? `（將於 ${currentRateLimit.resetTime.toLocaleTimeString()} 重設）` 
        : '';
      throw new Error(`GitHub API 請求次數已達上限 ${reset}。建議在右上角填寫 GitHub Personal Access Token 解鎖至每小時 5,000 次。`);
    }
    if (response.status === 422) {
      throw new Error('搜尋條件語法錯誤，請簡化關鍵字或檢查篩選器。');
    }
    if (response.status === 404) {
      throw new Error('找不到指定的 GitHub 專案或資源。');
    }
    throw new Error(`GitHub API 回應錯誤 [${response.status}]: ${response.statusText}`);
  }

  const data = await response.json();
  if (useCache) {
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
  }
  return data;
}

/**
 * 搜尋 Repositories
 */
export async function searchRepositories(
  filters: SearchFilters, 
  customQueryOverride?: string
): Promise<GithubSearchResponse> {
  let q = (customQueryOverride || filters.query || '').trim();

  // 若完全無輸入，給予預設優質熱門探索詞
  if (!q && !filters.topic && !filters.language) {
    q = 'stars:>100';
  }

  const queryParts: string[] = [];
  if (q) {
    queryParts.push(q);
  }

  // 依語言篩選
  if (filters.language && filters.language !== 'all') {
    queryParts.push(`language:${filters.language}`);
  }

  // 依 Star 數量篩選
  if (filters.starRange && filters.starRange !== 'any') {
    queryParts.push(`stars:${filters.starRange}`);
  }

  // 依最近更新時間篩選
  if (filters.updateTime && filters.updateTime !== 'any') {
    const date = new Date();
    if (filters.updateTime === '7d') date.setDate(date.getDate() - 7);
    else if (filters.updateTime === '30d') date.setDate(date.getDate() - 30);
    else if (filters.updateTime === '90d') date.setDate(date.getDate() - 90);
    else if (filters.updateTime === '1y') date.setFullYear(date.getFullYear() - 1);
    const dateStr = date.toISOString().split('T')[0];
    queryParts.push(`pushed:>=${dateStr}`);
  }

  // 依建立時間篩選 (尋找新專案)
  if (filters.createdTime && filters.createdTime !== 'any') {
    const date = new Date();
    if (filters.createdTime === '30d') date.setDate(date.getDate() - 30);
    else if (filters.createdTime === '90d') date.setDate(date.getDate() - 90);
    else if (filters.createdTime === '1y') date.setFullYear(date.getFullYear() - 1);
    const dateStr = date.toISOString().split('T')[0];
    queryParts.push(`created:>=${dateStr}`);
  }

  // 依 Topic 篩選
  if (filters.topic && filters.topic.trim()) {
    queryParts.push(`topic:${filters.topic.trim()}`);
  }

  const finalQuery = encodeURIComponent(queryParts.join(' '));
  
  // GitHub API 排序支援：stars, forks, updated (若選 treasure 則由前端加權自訂排序)
  let sortParam = '';
  if (filters.sort === 'stars' || filters.sort === 'forks' || filters.sort === 'updated') {
    sortParam = `&sort=${filters.sort}&order=${filters.order || 'desc'}`;
  }

  const page = filters.page || 1;
  const perPage = Math.min(filters.perPage || 24, 30);

  const url = `${API_BASE}/search/repositories?q=${finalQuery}${sortParam}&page=${page}&per_page=${perPage}`;
  return fetchWithCache<GithubSearchResponse>(url);
}

/**
 * 取得單一 Repo 完整資訊
 */
export async function getRepoDetails(owner: string, repo: string): Promise<GithubRepo> {
  const url = `${API_BASE}/repos/${owner}/${repo}`;
  return fetchWithCache<GithubRepo>(url);
}

/**
 * 取得 README 內容 (解碼 base64)
 */
export async function getRepoReadme(owner: string, repo: string): Promise<string> {
  try {
    const url = `${API_BASE}/repos/${owner}/${repo}/readme`;
    const res = await fetchWithCache<{ content: string; encoding: string }>(url);
    if (res.encoding === 'base64' && res.content) {
      // 處理 UTF-8 base64 解碼
      const binary = atob(res.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    }
    return '';
  } catch (err) {
    return '（此專案未提供 README 或無法讀取）';
  }
}

/**
 * 取得 Releases 資訊
 */
export async function getRepoReleases(owner: string, repo: string): Promise<any[]> {
  try {
    const url = `${API_BASE}/repos/${owner}/${repo}/releases?per_page=3`;
    return await fetchWithCache<any[]>(url);
  } catch (err) {
    return [];
  }
}

/**
 * 再找十個類似專案 (依據語言、關鍵 Topics 與相近 Star 深度比對)
 */
export async function getSimilarRepos(sourceRepo: GithubRepo, count = 10): Promise<GithubRepo[]> {
  const queryParts: string[] = [];

  // 挑選最有代表性的 Topics
  if (sourceRepo.topics && sourceRepo.topics.length > 0) {
    const selectedTopics = sourceRepo.topics.slice(0, 2);
    queryParts.push(selectedTopics.map(t => `topic:${t}`).join(' '));
  } else if (sourceRepo.description) {
    // 提取 description 中 2~3 個英文關鍵詞
    const words = sourceRepo.description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'from', 'this', 'that', 'your', 'have'].includes(w.toLowerCase()))
      .slice(0, 2);
    if (words.length > 0) {
      queryParts.push(words.join(' '));
    }
  }

  if (sourceRepo.language) {
    queryParts.push(`language:${sourceRepo.language}`);
  }

  // 排除自己
  const query = `${queryParts.join(' ')} -repo:${sourceRepo.full_name}`.trim();
  if (!query) {
    return [];
  }

  const res = await searchRepositories({
    query,
    language: 'all',
    starRange: 'any',
    updateTime: 'any',
    createdTime: 'any',
    sort: 'stars',
    order: 'desc',
    topic: '',
    page: 1,
    perPage: count
  });

  return res.items.filter(r => r.full_name !== sourceRepo.full_name).slice(0, count);
}

/**
 * 隨機探索模式 (隨機選取熱門又具創意的搜尋詞與 Star 區間)
 */
export async function getRandomTreasureProjects(): Promise<GithubRepo[]> {
  const surpriseQueries = [
    'topic:creative-coding stars:50..3000',
    'topic:generative-art stars:30..2500',
    'topic:webgl stars:100..4000',
    'topic:browser-game stars:50..3500',
    'topic:self-hosted stars:100..5000',
    'topic:cli-app stars:80..3000',
    'topic:tui stars:50..2000',
    '"unusual" OR "weird" stars:50..3000',
    'topic:text-to-3d stars:50..4000',
    'topic:threejs stars:100..5000'
  ];

  const randomQuery = surpriseQueries[Math.floor(Math.random() * surpriseQueries.length)];
  const randomPage = Math.floor(Math.random() * 3) + 1; // 隨機第 1~3 頁提升隨機性

  const res = await searchRepositories({
    query: randomQuery,
    language: 'all',
    starRange: 'any',
    updateTime: 'any',
    createdTime: 'any',
    sort: 'updated',
    order: 'desc',
    topic: '',
    page: randomPage,
    perPage: 16
  });

  return res.items;
}

/**
 * 啟發式專案深入用途分析 (根據 README 與 Metadata 提取安裝步驟、難度與依賴)
 */
export function analyzeRepoUsage(repo: GithubRepo, readme = ''): RepoAnalysis {
  const content = (readme + ' ' + (repo.description || '')).toLowerCase();
  
  // 1. 難度評估
  let difficulty: RepoAnalysis['difficultyEstimate'] = '中等難度';
  if (content.includes('beginner friendly') || content.includes('good first issue') || content.includes('simple example') || content.includes('zero dependency')) {
    difficulty = '入門友善';
  } else if (content.includes('cuda') || content.includes('caffe') || content.includes('kernel') || content.includes('distributed cluster') || content.includes('kubernetes')) {
    difficulty = '進階專業';
  } else if (!readme || readme.length < 50) {
    difficulty = '尚未確認';
  }

  // 2. 額外需求 (API Key, GPU, 付費服務)
  const requiresExtraKeys = content.includes('api_key') || content.includes('openai_api_key') || content.includes('api key') || content.includes('huggingface_token');
  const possibleRequirements: string[] = [];
  if (content.includes('openai')) possibleRequirements.push('OpenAI API Key (可能需要付費或自備金鑰)');
  if (content.includes('anthropic') || content.includes('claude')) possibleRequirements.push('Anthropic API Key');
  if (content.includes('cuda') || content.includes('gpu')) possibleRequirements.push('NVIDIA GPU 獨立顯卡與 CUDA 環境');
  if (content.includes('docker') || content.includes('docker-compose')) possibleRequirements.push('Docker / 容器化環境');
  if (content.includes('huggingface')) possibleRequirements.push('Hugging Face 帳號與 Token');

  // 3. 提取安裝指引
  const installSteps: string[] = [];
  if (readme) {
    const codeBlockRegex = /```(?:bash|sh|shell|cmd|powershell)?\s*([\s\S]*?)```/gi;
    let match;
    while ((match = codeBlockRegex.exec(readme)) !== null && installSteps.length < 3) {
      const codeSnippet = match[1].trim();
      if (
        codeSnippet.includes('npm install') || 
        codeSnippet.includes('pip install') || 
        codeSnippet.includes('cargo') || 
        codeSnippet.includes('git clone') ||
        codeSnippet.includes('docker run')
      ) {
        installSteps.push(codeSnippet.split('\n').slice(0, 4).join('\n'));
      }
    }
  }

  // 4. 中文摘要 (若已有 description 則結合啟發式繁中用途解讀)
  let translatedSummaryZh = repo.description || '該專案未提供簡介說明。';
  const isAi = content.includes('ai') || content.includes('machine learning') || content.includes('llm') || content.includes('diffusion');

  return {
    translatedSummaryZh,
    difficultyEstimate: difficulty,
    requiresExtraKeys,
    possibleRequirements,
    installSteps,
    hasDemo: Boolean(repo.homepage && repo.homepage.startsWith('http')),
    demoUrl: repo.homepage || undefined,
    isAiRelated: isAi
  };
}
