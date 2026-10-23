import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeDbOperation } from '@/lib/db/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: '缺少收藏 ID' }, { status: 400 });
    }

    const deleted = await safeDbOperation(async (db) => {
      // 支援以 favorite ID 或 repositoryId 刪除
      return await db.favorite.deleteMany({
        where: {
          OR: [{ id }, { repositoryId: id }],
        },
      });
    }, null);

    return NextResponse.json({
      success: true,
      deletedCount: deleted?.count || 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '刪除收藏失敗' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, note } = body;

    const updated = await safeDbOperation(async (db) => {
      return await db.favorite.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(note !== undefined && { note }),
          updatedAt: new Date(),
        },
      });
    }, null);

    return NextResponse.json({
      success: true,
      favorite: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '更新收藏狀態失敗' },
      { status: 500 }
    );
  }
}
