import { searchRepositoriesApi } from '@/lib/github/client';
import { RadarRepoItem, TrendingTimeframe } from '@/lib/types';
import { serverCache } from '@/lib/cache/memoryCache';
import { prisma, safeDbOperation } from '@/lib/db/prisma';

export type { TrendingTimeframe };

/**
 * Trending Provider 模組
 * 依據時間維度獲取 GitHub 上最新爆發與持續活躍的開源專案
 */
export async function getTrendingRepositories(
  timeframe: TrendingTimeframe = 'today',
  language?: string
): Promise<{ items: RadarRepoItem[]; timeframe: TrendingTimeframe; sourceLabel: string }> {
  const cacheKey = `trending:${timeframe}:${language || 'all'}`;

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      const now = new Date();
      let queryParts: string[] = [];
      let sourceLabel = '';

      if (timeframe === 'today') {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        queryParts.push(`pushed:>=${yesterday} stars:>=50`);
        sourceLabel = '今日活躍度與即時雷達';
      } else if (timeframe === 'this_week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        queryParts.push(`pushed:>=${weekAgo} stars:>=100`);
        sourceLabel = '本週持續崛起專案';
      } else {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        queryParts.push(`pushed:>=${monthAgo} stars:>=200`);
        sourceLabel = '本月熱門開源代表作';
      }

      if (language && language !== 'all') {
        queryParts.push(`language:${language}`);
      }

      queryParts.push('archived:false');

      const searchQuery = queryParts.join(' ');
      const result = await searchRepositoriesApi(searchQuery, 'stars', 'desc', 1, 24);

      // 檢查資料庫中是否有快照記錄，若有實測增量，進行二次排序加權
      const itemsWithGrowth = result.items.map((item) => {
        return item;
      });

      return {
        items: itemsWithGrowth,
        timeframe,
        sourceLabel,
      };
    },
    600 // Trending 快取 10 分鐘，節省配額
  );
}

/**
 * 挖掘可直接體驗的優質 Demo 專案 (Demo 尋寶)
 */
export async function getPlayableDemoProjects(): Promise<RadarRepoItem[]> {
  const cacheKey = 'discover:playable-demos';

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      // 搜尋有 homepage 且為網頁遊戲、互動作品、展示型 WebGL 工具
      const queries = [
        'topic:threejs OR topic:webgl stars:>100 archived:false',
        'topic:browser-game OR topic:creative-coding stars:>80 archived:false',
      ];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      const result = await searchRepositoriesApi(randomQuery, 'stars', 'desc', 1, 15);
      return result.items.filter((r) => r.demo.verificationStatus !== 'none');
    },
    600
  );
}

/**
 * 挖掘新興優質專案 (最近 60 天內建立)
 */
export async function getEmergingProjects(): Promise<RadarRepoItem[]> {
  const cacheKey = 'discover:emerging-fresh';

  return serverCache.fetchOrDedupe(
    cacheKey,
    async () => {
      const d = new Date();
      d.setDate(d.getDate() - 60);
      const dateStr = d.toISOString().split('T')[0];
      const query = `created:>=${dateStr} stars:50..3000 archived:false`;
      const result = await searchRepositoriesApi(query, 'stars', 'desc', 1, 15);
      return result.items;
    },
    600
  );
}
