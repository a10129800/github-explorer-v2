import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryDetailApi } from '@/lib/github/client';
import { findSimilarRepositories } from '@/lib/recommend/similarity';

export async function GET(
  req: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5', 10);

    const repoDetail = await getRepositoryDetailApi(owner, repo);
    const similarRepos = await findSimilarRepositories(repoDetail, limit);

    return NextResponse.json({
      success: true,
      currentRepo: {
        fullName: repoDetail.fullName,
        topics: repoDetail.topics,
        language: repoDetail.language,
        stars: repoDetail.stars,
      },
      similar: similarRepos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '取得相似專案失敗' },
      { status: 500 }
    );
  }
}
