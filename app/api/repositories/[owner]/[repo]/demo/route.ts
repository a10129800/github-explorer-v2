import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryDetailApi, getRepositoryReadmeApi } from '@/lib/github/client';
import { detectRepoDemo, isSafePublicUrl } from '@/lib/demo/detector';

export async function GET(
  _request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const detail = await getRepositoryDetailApi(owner, repo);
    const readme = await getRepositoryReadmeApi(owner, repo);

    const demo = detectRepoDemo(detail.homepage, detail.htmlUrl, undefined, readme);

    // 若有候選 Demo 網址，進行安全驗證探測
    let isReachable = false;
    let statusCode: number | null = null;

    if (demo.url && isSafePublicUrl(demo.url)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000); // 4 秒快速探測
        const probeRes = await fetch(demo.url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'GitHub-Explorer-Radar-DemoProbe/2.0',
          },
        });
        clearTimeout(timeout);
        statusCode = probeRes.status;
        if (probeRes.ok || probeRes.status === 405 || probeRes.status === 403) {
          isReachable = true;
          demo.verificationStatus = 'verified';
        }
      } catch {
        // 探測失敗保持 unverified
      }
    }

    return NextResponse.json({
      demo,
      probeResult: {
        testedUrl: demo.url,
        isSafe: isSafePublicUrl(demo.url),
        isReachable,
        statusCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Demo 分析失敗' },
      { status: 500 }
    );
  }
}
