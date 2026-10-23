import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryDetailApi } from '@/lib/github/client';
import { compareRepositories } from '@/lib/compare/comparator';
import { RadarRepoItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoNames: string[] = body.repos || [];

    if (!Array.isArray(repoNames) || repoNames.length < 2) {
      return NextResponse.json(
        { success: false, error: '請提供至少 2 個欲比較的 GitHub 專案名稱 (例如: ["facebook/react", "vuejs/core"])' },
        { status: 400 }
      );
    }

    if (repoNames.length > 4) {
      return NextResponse.json(
        { success: false, error: '比較專案數量上限為 4 個' },
        { status: 400 }
      );
    }

    // 取得所有候選專案詳情
    const items: RadarRepoItem[] = [];
    const errors: string[] = [];

    for (const fullName of repoNames) {
      const parts = fullName.trim().split('/');
      if (parts.length !== 2) {
        errors.push(`專案名稱格式不符: "${fullName}"，應為 "owner/repo"`);
        continue;
      }
      try {
        const repo = await getRepositoryDetailApi(parts[0], parts[1]);
        items.push(repo);
      } catch (err: any) {
        errors.push(`無法取得 "${fullName}": ${err.message}`);
      }
    }

    if (items.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `成功檢索的專案不足 2 個，無法進行比較。錯誤記錄：${errors.join('；')}`,
        },
        { status: 400 }
      );
    }

    const comparisonResult = compareRepositories(items);

    return NextResponse.json({
      success: true,
      comparison: comparisonResult,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '專案比較運算失敗' },
      { status: 500 }
    );
  }
}
