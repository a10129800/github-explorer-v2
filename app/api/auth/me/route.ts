import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken } from '@/lib/auth/service';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await getCurrentUserFromToken(token);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, user: null });
  }
}

export async function DELETE() {
  const res = NextResponse.json({
    success: true,
    message: '已成功登出',
  });

  res.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
  });

  return res;
}
