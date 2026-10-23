import { NextRequest, NextResponse } from 'next/server';
import { getTrendingRepositories, TrendingTimeframe } from '@/lib/trending/provider';
import { getLatestRateLimit } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || 'today') as TrendingTimeframe;
    const language = searchParams.get('language') || undefined;

    const data = await getTrendingRepositories(timeframe, language);
    const rateLimit = getLatestRateLimit();

    return NextResponse.json({
      items: data.items,
      timeframe: data.timeframe,
      sourceLabel: data.sourceLabel,
      totalCount: data.items.length,
      rateLimit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '無法取得趨勢資料' },
      { status: 500 }
    );
  }
}
