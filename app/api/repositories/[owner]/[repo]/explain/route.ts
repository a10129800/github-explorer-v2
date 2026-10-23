import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryDetailApi, getRepositoryReadmeApi } from '@/lib/github/client';
import { parseReadmeToZhExplanation } from '@/lib/enrichment/readmeParser';

export async function GET(
  req: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const mode = (req.nextUrl.searchParams.get('mode') || 'quick') as 'quick' | 'install' | 'technical';

    const [repoDetail, rawReadme] = await Promise.all([
      getRepositoryDetailApi(owner, repo),
      getRepositoryReadmeApi(owner, repo),
    ]);

    const structuredExplanation = parseReadmeToZhExplanation(
      repoDetail.fullName,
      repoDetail.htmlUrl,
      rawReadme,
      {
        description: repoDetail.description || undefined,
        language: repoDetail.language,
        topics: repoDetail.topics,
        licenseSpdxId: repoDetail.licenseSpdxId,
        homepage: repoDetail.homepage,
        stars: repoDetail.stars,
      }
    );

    structuredExplanation.mode = mode;

    return NextResponse.json({
      success: true,
      explanation: structuredExplanation,
      rawReadmeSnippet: rawReadme.slice(0, 3000), // 提供安全摘要預覽
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '生成 README 繁體中文解說失敗' },
      { status: 500 }
    );
  }
}
