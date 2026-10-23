import { serverCache } from '@/lib/cache/memoryCache';
import { prisma, safeDbOperation } from '@/lib/db/prisma';
import { 
  RadarRepoItem, 
  DemoVerificationStatus, 
  RepositorySnapshotData 
} from '@/lib/types';
import { detectRepoDemo } from '@/lib/demo/detector';
import { analyzeCostAndLicense } from '@/lib/cost/analyzer';
import { calculateTrendScores } from '@/lib/scoring/engine';

const GITHUB_API_BASE = 'https://api.github.com';

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: string | null;
  hasToken: boolean;
}

let latestRateLimit: RateLimitState = {
  limit: 60,
  remaining: 60,
  resetAt: null,
  hasToken: Boolean(process.env.GITHUB_TOKEN),
};

export function getLatestRateLimit(): RateLimitState {
  return {
    ...latestRateLimit,
    hasToken: Boolean(process.env.GITHUB_TOKEN),
  };
}

function updateRateLimitFromHeaders(headers: Headers) {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (limit && remaining) {
    latestRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetAt: reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : null,
      hasToken: Boolean(process.env.GITHUB_TOKEN),
    };
  }
}

/**
 * 伺服器端基礎 Fetch 封裝（含逾時控制、Token 認證與重試）
 */
async function fetchGithubApi<T>(endpoint: string, retries = 2): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
  const token = process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Explorer-Radar-v2',
  };

  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 秒超時

    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: 'no-store', // 由後端 memoryCache 控制
      });
      clearTimeout(timeoutId);
      updateRateLimitFromHeaders(res.headers);

      if (res.ok) {
        return (await res.json()) as T;
      }

      if (res.status === 403 || res.status === 429) {
        const resetTime = latestRateLimit.resetAt ? `將於 ${new Date(latestRateLimit.resetAt).toLocaleTimeString()} 重置` : '';
        throw new Error(`GitHub API 請求次數已達上限 (${latestRateLimit.remaining}/${latestRateLimit.limit})。${resetTime}。建議於 .env 設定 GITHUB_TOKEN 解除配額限制。`);
      }

      if (res.status === 404) {
        throw new Error('未找到指定的 GitHub Repository 或資源 (404)');
      }

      if (res.status >= 500 && attempt < retries) {
        // 指數退避
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        continue;
      }

      throw new Error(`GitHub API 回應錯誤 [${res.status}]: ${res.statusText}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        if (attempt < retries) continue;
        throw new Error('GitHub API 請求逾時 (8s)，請檢查網路或稍後重試');
      }
      if (attempt >= retries) {
        throw err;
      }
    }
  }

  throw new Error('無法完成 GitHub API 連線');
}

/**
 * 將原始 GitHub Repo 資料轉換為雷達標準項目，並記錄歷史快照
 */
export async function transformAndPersistRepo(
  raw: any,
  sourceLabel = 'search-sync'
): Promise<RadarRepoItem> {
  const fullName = raw.full_name;
  const topics: string[] = Array.isArray(raw.topics) ? raw.topics : [];
  const licenseKey = raw.license?.spdx_id || raw.license?.key || null;

  // 1. 安全偵測 Demo
  const demo = detectRepoDemo(raw.homepage, raw.html_url, raw.has_pages);

  // 2. 授權與費用分析
  const cost = analyzeCostAndLicense(licenseKey, '', raw.description || '', topics);

  // 3. 嘗試自 SQLite 讀取過去歷史快照比對成長
  const existingSnapshots = await safeDbOperation<RepositorySnapshotData[]>(async (db) => {
    const record = await db.repository.findUnique({
      where: { fullName },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'asc' },
          take: 15,
        },
      },
    });

    if (!record) return [];
    return record.snapshots.map((s) => ({
      capturedAt: s.capturedAt.toISOString(),
      stars: s.stars,
      forks: s.forks,
      openIssues: s.openIssues,
      trendSource: s.trendSource || undefined,
      trendRank: s.trendRank || undefined,
    }));
  }, []);

  // 4. 計算趨勢評分
  const trendResult = calculateTrendScores({
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count || 0,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at || raw.updated_at,
    hasDemo: demo.verificationStatus !== 'none',
    isDemoVerified: demo.verificationStatus === 'verified',
    isOpenSourceApproved: cost.isOpenSourceApproved,
    hasLicense: Boolean(licenseKey),
    snapshots: existingSnapshots,
  });

  // 5. 非同步背景寫入快照 (受控更新：同一專案 1 小時內不重複寫入相同快照)
  safeDbOperation(async (db) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const repoRecord = await db.repository.upsert({
      where: { fullName },
      create: {
        fullName,
        githubId: raw.id,
        ownerLogin: raw.owner?.login || '',
        name: raw.name,
        description: raw.description,
        homepage: raw.homepage,
        htmlUrl: raw.html_url,
        language: raw.language,
        stars: raw.stargazers_count,
        forks: raw.forks_count,
        openIssues: raw.open_issues_count || 0,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at),
        pushedAt: new Date(raw.pushed_at || raw.updated_at),
        licenseSpdxId: licenseKey,
        topics: JSON.stringify(topics),
        archived: Boolean(raw.archived),
        fetchedAt: new Date(),
      },
      update: {
        stars: raw.stargazers_count,
        forks: raw.forks_count,
        openIssues: raw.open_issues_count || 0,
        pushedAt: new Date(raw.pushed_at || raw.updated_at),
        fetchedAt: new Date(),
      },
    });

    // 檢查是否有 1 小時內的快照
    const recentSnap = await db.repositorySnapshot.findFirst({
      where: {
        repositoryId: repoRecord.id,
        capturedAt: { gte: oneHourAgo },
      },
    });

    if (!recentSnap) {
      await db.repositorySnapshot.create({
        data: {
          repositoryId: repoRecord.id,
          stars: raw.stargazers_count,
          forks: raw.forks_count,
          openIssues: raw.open_issues_count || 0,
          trendSource: sourceLabel,
        },
      });
    }
  }, null).catch(() => {});

  return {
    id: String(raw.id || fullName),
    githubId: raw.id,
    fullName,
    ownerLogin: raw.owner?.login || '',
    name: raw.name,
    description: raw.description,
    zhSummary: raw.description || '（作者未提供說明）',
    homepage: raw.homepage || null,
    htmlUrl: raw.html_url,
    language: raw.language || null,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at || raw.updated_at,
    licenseSpdxId: licenseKey,
    topics,
    archived: Boolean(raw.archived),
    fetchedAt: new Date().toISOString(),

    recentStarGrowth: trendResult.recentGrowth,
    growthRateStr: trendResult.growthStr,
    trendProfile: trendResult.profile,
    scoreBreakdown: trendResult.scores,
    scoreReasons: trendResult.reasons,

    demo,
    cost,
    snapshots: existingSnapshots,
  };
}

/**
 * 伺服器端搜尋 Repository (含 5 分鐘快取)
 */
export async function searchRepositoriesApi(
  query: string,
  sort: string = 'stars',
  order: 'desc' | 'asc' = 'desc',
  page = 1,
  perPage = 20
): Promise<{ items: RadarRepoItem[]; totalCount: number }> {
  const cacheKey = `search:${query}:${sort}:${order}:${page}:${perPage}`;

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      const q = encodeURIComponent(query);
      const endpoint = `/search/repositories?q=${q}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`;
      const data = await fetchGithubApi<{ total_count: number; items: any[] }>(endpoint);

      const items: RadarRepoItem[] = [];
      for (const raw of data.items || []) {
        items.push(await transformAndPersistRepo(raw, 'search-result'));
      }

      return {
        items,
        totalCount: data.total_count || 0,
      };
    },
    300 // 5 分鐘快取
  );
}

/**
 * 取得單一 Repository 詳細資訊
 */
export async function getRepositoryDetailApi(owner: string, repo: string): Promise<RadarRepoItem> {
  const cacheKey = `repo:${owner}/${repo}`;

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      const raw = await fetchGithubApi<any>(`/repos/${owner}/${repo}`);
      return transformAndPersistRepo(raw, 'direct-lookup');
    },
    300
  );
}

/**
 * 取得 Repository 的 README 內容
 */
export async function getRepositoryReadmeApi(owner: string, repo: string): Promise<string> {
  const cacheKey = `readme:${owner}/${repo}`;

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      try {
        const data = await fetchGithubApi<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/readme`);
        if (data.encoding === 'base64' && data.content) {
          return Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf-8');
        }
        return '';
      } catch {
        return '（專案未提供 README 或暫時無法讀取）';
      }
    },
    600 // README 快取 10 分鐘
  );
}

/**
 * 取得 Repository 的 Releases 列表
 */
export async function getRepositoryReleasesApi(owner: string, repo: string): Promise<any[]> {
  try {
    return await fetchGithubApi<any[]>(`/repos/${owner}/${repo}/releases?per_page=5`);
  } catch {
    return [];
  }
}
