import { NextRequest, NextResponse } from 'next/server';
import { loginUser, loginWithGitHubToken } from '@/lib/auth/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, githubToken } = body;

    let result;

    if (githubToken && githubToken.trim()) {
      // 透過 GitHub Token 快速登入
      result = await loginWithGitHubToken(githubToken.trim());
    } else if (username && password) {
      // 一般帳號密碼登入
      result = await loginUser(username, password);
    } else {
      return NextResponse.json(
        { success: false, error: '請輸入帳號密碼或貼上 GitHub Token' },
        { status: 400 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: (result as any).isNewAccount ? '歡迎！已自動為您建立新帳號並登入' : '登入成功！',
      user: result.user,
      isNewAccount: (result as any).isNewAccount,
    });

    res.cookies.set('auth_token', result.token, {
      httpOnly: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '登入失敗' },
      { status: 400 }
    );
  }
}
