import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeDbOperation } from '@/lib/db/prisma';
import { getRepositoryDetailApi } from '@/lib/github/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const favorites = await safeDbOperation(async (db) => {
      const records = await db.favorite.findMany({
        include: {
          repository: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return records.map((f) => ({
        id: f.id,
        repositoryId: f.repositoryId,
        status: f.status,
        note: f.note,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        repository: {
          id: f.repository.id,
          githubId: f.repository.githubId,
          fullName: f.repository.fullName,
          ownerLogin: f.repository.ownerLogin,
          name: f.repository.name,
          description: f.repository.description,
          homepage: f.repository.homepage,
          htmlUrl: f.repository.htmlUrl,
          language: f.repository.language,
          stars: f.repository.stars,
          forks: f.repository.forks,
          openIssues: f.repository.openIssues,
          createdAt: f.repository.createdAt.toISOString(),
          updatedAt: f.repository.updatedAt.toISOString(),
          pushedAt: f.repository.pushedAt.toISOString(),
          licenseSpdxId: f.repository.licenseSpdxId,
          topics: f.repository.topics ? JSON.parse(f.repository.topics) : [],
          archived: f.repository.archived,
          fetchedAt: f.repository.fetchedAt.toISOString(),
        },
      }));
    }, []);

    return NextResponse.json({
      items: favorites,
      totalCount: favorites.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '無法取得收藏資料' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, status = 'want-to-try', note = '' } = body;

    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json({ error: '缺少 fullName 專案全稱' }, { status: 400 });
    }

    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) {
      return NextResponse.json({ error: 'fullName 格式錯誤，應為 owner/repo' }, { status: 400 });
    }

    // 確保 repository 記錄存在於 DB 中
    const repoItem = await getRepositoryDetailApi(owner, repo);

    const saved = await safeDbOperation(async (db) => {
      // 取得 DB 中的 Repository 記錄 ID
      const repoRecord = await db.repository.findUnique({
        where: { fullName },
      });

      if (!repoRecord) {
        throw new Error('專案資料未建立');
      }

      const favorite = await db.favorite.upsert({
        where: { repositoryId: repoRecord.id },
        create: {
          repositoryId: repoRecord.id,
          status,
          note,
        },
        update: {
          status,
          note,
          updatedAt: new Date(),
        },
      });

      return favorite;
    }, null);

    return NextResponse.json({
      success: true,
      favorite: saved,
      repository: repoItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '新增收藏失敗' },
      { status: 500 }
    );
  }
}
