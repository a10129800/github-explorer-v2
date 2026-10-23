import { NextRequest, NextResponse } from 'next/server';
import { getPlayableDemoProjects, getEmergingProjects } from '@/lib/trending/provider';
import { searchRepositoriesApi } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all';

    let demos: any[] = [];
    let emerging: any[] = [];
    let nicheGems: any[] = [];
    let selfHosted: any[] = [];

    if (mode === 'demos' || mode === 'all') {
      demos = await getPlayableDemoProjects();
    }
    if (mode === 'emerging' || mode === 'all') {
      emerging = await getEmergingProjects();
    }
    if (mode === 'niche' || mode === 'all') {
      const res = await searchRepositoriesApi('stars:50..2000 pushed:>=2024-01-01', 'stars', 'desc', 1, 10);
      nicheGems = res.items.filter((r) => r.scoreBreakdown.discoveryScore >= 70);
    }
    if (mode === 'self-hosted' || mode === 'all') {
      const res = await searchRepositoriesApi('topic:self-hosted stars:>150', 'stars', 'desc', 1, 10);
      selfHosted = res.items;
    }

    return NextResponse.json({
      mode,
      demos,
      emerging,
      nicheGems,
      selfHosted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '發現頻道載入失敗' },
      { status: 500 }
    );
  }
}
