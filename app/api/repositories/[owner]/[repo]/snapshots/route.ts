import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeDbOperation } from '@/lib/db/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const fullName = `${owner}/${repo}`;

    const snapshots = await safeDbOperation(async (db) => {
      const record = await db.repository.findUnique({
        where: { fullName },
        include: {
          snapshots: {
            orderBy: { capturedAt: 'asc' },
            take: 50,
          },
        },
      });

      if (!record) return [];
      return record.snapshots.map((s) => ({
        id: s.id,
        capturedAt: s.capturedAt.toISOString(),
        stars: s.stars,
        forks: s.forks,
        openIssues: s.openIssues,
        trendSource: s.trendSource,
        trendRank: s.trendRank,
      }));
    }, []);

    return NextResponse.json({
      fullName,
      snapshots,
      count: snapshots.length,
      hasHistoricalData: snapshots.length >= 2,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '無法取得歷史快照' },
      { status: 500 }
    );
  }
}
