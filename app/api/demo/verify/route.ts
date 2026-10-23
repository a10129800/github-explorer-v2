import { NextRequest, NextResponse } from 'next/server';
import { verifyDemoUrlSafely } from '@/lib/demo/safety';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json(
        { success: false, error: '請提供欲驗證的 Demo 網址' },
        { status: 400 }
      );
    }

    const checkResult = await verifyDemoUrlSafely(url);

    return NextResponse.json({
      success: true,
      url,
      checkResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Demo 網址安全檢查失敗' },
      { status: 500 }
    );
  }
}
