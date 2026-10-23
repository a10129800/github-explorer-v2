import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryDetailApi } from '@/lib/github/client';
import { evaluateHardwareCompatibility, UserHardwareInput } from '@/lib/hardware/evaluator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoFullName = body.repoFullName?.trim();
    const hardware: UserHardwareInput = body.hardware;

    if (!repoFullName || !repoFullName.includes('/')) {
      return NextResponse.json(
        { success: false, error: '請提供有效的專案完整名稱 (例如: "AUTOMATIC1111/stable-diffusion-webui")' },
        { status: 400 }
      );
    }

    if (!hardware) {
      return NextResponse.json(
        { success: false, error: '請提供電腦硬體規格參數以進行評估' },
        { status: 400 }
      );
    }

    const [owner, repo] = repoFullName.split('/');
    const repoDetail = await getRepositoryDetailApi(owner, repo);

    const evaluation = evaluateHardwareCompatibility(repoDetail, hardware);

    return NextResponse.json({
      success: true,
      repo: {
        fullName: repoDetail.fullName,
        name: repoDetail.name,
        stars: repoDetail.stars,
        language: repoDetail.language,
        htmlUrl: repoDetail.htmlUrl,
      },
      evaluation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '硬體相容性評估失敗' },
      { status: 500 }
    );
  }
}
