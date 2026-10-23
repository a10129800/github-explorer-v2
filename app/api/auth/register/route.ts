import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, email } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '請提供使用者名稱與密碼' },
        { status: 400 }
      );
    }

    const { user, token } = await registerUser(username, password, email);

    const res = NextResponse.json({
      success: true,
      message: '註冊成功！已自動登入',
      user,
    });

    res.cookies.set('auth_token', token, {
      httpOnly: false, // 允許前端讀取狀態
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '註冊失敗' },
      { status: 400 }
    );
  }
}
