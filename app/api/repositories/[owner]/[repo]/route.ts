import { NextRequest, NextResponse } from 'next/server';
import { 
  getRepositoryDetailApi, 
  getRepositoryReadmeApi, 
  getRepositoryReleasesApi 
} from '@/lib/github/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    if (!owner || !repo) {
      return NextResponse.json({ error: '缺少必要的 owner 與 repo 參數' }, { status: 400 });
    }

    const [detail, readme, releases] = await Promise.all([
      getRepositoryDetailApi(owner, repo),
      getRepositoryReadmeApi(owner, repo),
      getRepositoryReleasesApi(owner, repo),
    ]);

    return NextResponse.json({
      repository: detail,
      readme,
      releases,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '無法取得 Repository 詳情' },
      { status: error.message?.includes('404') ? 404 : 500 }
    );
  }
}
