import { NextRequest, NextResponse } from 'next/server';
import { generateDailyIntelReport, getTaipeiDateString } from '@/lib/intel/dailyReport';
import { safeDbOperation } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');
    const exportFormat = searchParams.get('export'); // "md" | "json"

    const todayDate = getTaipeiDateString();
    const targetDate = dateQuery || todayDate;

    // 檢查是否有歷史快照記錄清單
    if (searchParams.get('list') === 'true') {
      const historyList = await safeDbOperation(async (db) => {
        return await db.dailyReport.findMany({
          select: {
            id: true,
            reportDate: true,
            title: true,
            summary: true,
            generatedAt: true,
            status: true,
          },
          orderBy: { reportDate: 'desc' },
          take: 30,
        });
      }, []);

      return NextResponse.json({
        success: true,
        history: historyList,
      });
    }

    const report = await generateDailyIntelReport(false);

    if (exportFormat === 'md') {
      return new NextResponse(report.exportMarkdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="daily-intel-${report.reportDate}.md"`,
        },
      });
    }

    if (exportFormat === 'json') {
      return new NextResponse(report.exportJson, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="daily-intel-${report.reportDate}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '取得每日開源情報失敗' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 手動立即重新產生報告
    const report = await generateDailyIntelReport(true);
    return NextResponse.json({
      success: true,
      message: `成功更新 ${report.reportDate} 之開源情報`,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '手動產生每日情報失敗' },
      { status: 500 }
    );
  }
}
