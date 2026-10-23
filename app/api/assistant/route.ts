import { NextRequest, NextResponse } from 'next/server';
import { executeProjectResearch } from '@/lib/assistant/researcher';
import { safeDbOperation } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: '請輸入研究問題或感興趣的專案方向' },
        { status: 400 }
      );
    }

    const report = await executeProjectResearch(query);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI 專案研究助手運算失敗' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 讀取歷史研究報告清單
    const history = await safeDbOperation(async (db) => {
      return await db.researchReport.findMany({
        select: {
          id: true,
          userQuery: true,
          analysisMode: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }, []);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '無法取得歷史研究紀錄' },
      { status: 500 }
    );
  }
}
