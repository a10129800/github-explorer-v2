import { NextRequest, NextResponse } from 'next/server';
import { compileSearchQuery } from '@/lib/search/strategy';
import { searchRepositoriesApi, getLatestRateLimit } from '@/lib/github/client';
import { SearchFilters, SearchResultResponse } from '@/lib/types';
import { safeDbOperation } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const language = searchParams.get('language') || undefined;
    const starsMin = searchParams.get('starsMin') ? parseInt(searchParams.get('starsMin')!, 10) : undefined;
    const starsMax = searchParams.get('starsMax') ? parseInt(searchParams.get('starsMax')!, 10) : undefined;
    const timeRange = (searchParams.get('timeRange') as any) || 'any';
    const createdRange = (searchParams.get('createdRange') as any) || 'any';
    const sortBy = searchParams.get('sortBy') || 'stars';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(30, parseInt(searchParams.get('perPage') || '18', 10));

    const filters: SearchFilters = {
      query,
      language,
      starsMin,
      starsMax,
      timeRange,
      createdRange,
      sortBy: sortBy as any,
      page,
      perPage,
    };

    // 1. 編譯搜尋語法與繁體中文轉譯
    const compilation = compileSearchQuery(filters);

    // 2. 映射 GitHub API 接受之 sort 欄位
    let apiSort = 'stars';
    let apiOrder: 'desc' | 'asc' = 'desc';
    if (sortBy === 'updated') {
      apiSort = 'updated';
    } else if (sortBy === 'forks') {
      apiSort = 'forks';
    }

    // 3. 執行後端 API 搜尋
    const result = await searchRepositoriesApi(
      compilation.githubQuery,
      apiSort,
      apiOrder,
      page,
      perPage
    );

    // 若使用者選擇「依探索價值 discovery」排序，進行前端評分權重排序
    let sortedItems = result.items;
    if (sortBy === 'discovery') {
      sortedItems = [...result.items].sort(
        (a, b) => b.scoreBreakdown.discoveryScore - a.scoreBreakdown.discoveryScore
      );
    }

    // 4. 記錄搜尋歷史至資料庫
    if (query.trim()) {
      safeDbOperation(async (db) => {
        await db.searchHistory.create({
          data: {
            query: query.trim(),
            filters: JSON.stringify(filters),
          },
        });
      }, null).catch(() => {});
    }

    const rateLimit = getLatestRateLimit();

    const responseData: SearchResultResponse = {
      items: sortedItems,
      totalCount: result.totalCount,
      page,
      perPage,
      hasMore: page * perPage < result.totalCount,
      queryExplained: compilation.explanation,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
        hasToken: rateLimit.hasToken,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '搜尋發生錯誤，請稍後重試' },
      { status: 500 }
    );
  }
}
