import { NextResponse } from 'next/server';
import { getLatestRateLimit, RateLimitState } from '@/lib/github/client';
import { safeDbOperation } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let rateLimit: RateLimitState;
    try {
      rateLimit = getLatestRateLimit();
    } catch (e: any) {
      console.warn('[HealthCheck] Rate limit retrieval failed:', e.message);
      rateLimit = { limit: 60, remaining: 60, resetAt: null, hasToken: false };
    }

    // 測試資料庫連線狀態 (具有 IF NOT EXISTS 自動建立與安全降級)
    const dbStatus = await safeDbOperation(async (db) => {
      await db.$queryRaw`SELECT 1`;
      return 'connected';
    }, 'uninitialized-or-degraded');

    return NextResponse.json({
      status: 'ok',
      product: 'GitHub Explorer V2 — 開源專案雷達',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      port: process.env.PORT,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
        hasToken: rateLimit.hasToken,
      },
    });
  } catch (fatalErr: any) {
    console.error('[HealthCheck] 致命錯誤捕獲:', fatalErr);
    // 即使發生異常，亦回傳 status: degraded 的 HTTP 200，保證 Electron 主程序不因單次內部錯誤而永久卡死
    return NextResponse.json({
      status: 'degraded',
      error: fatalErr.message || '健康檢查運行時出現降級錯誤',
      timestamp: new Date().toISOString()
    });
  }
}
