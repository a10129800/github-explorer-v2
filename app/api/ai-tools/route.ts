import { NextRequest, NextResponse } from 'next/server';
import { searchRepositoriesApi } from '@/lib/github/client';
import {
  AICategory,
  AI_CATEGORY_DEFINITIONS,
  classifyAICategory,
  determineFreeType,
  estimateWindowsCompat,
  estimateInstallDifficulty,
  AIToolItem,
} from '@/lib/enrichment/aiTools';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || 'all') as AICategory | 'all';
    const keyword = searchParams.get('q') || '';
    const language = searchParams.get('language') || '';
    const freeOnly = searchParams.get('freeOnly') === 'true';
    const noGpu = searchParams.get('noGpu') === 'true';
    const demoOnly = searchParams.get('demoOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '15', 10);

    // 1. 建立 GitHub Search 搜尋語法
    let queryParts: string[] = [];

    if (category !== 'all' && AI_CATEGORY_DEFINITIONS[category]) {
      queryParts.push(`(${AI_CATEGORY_DEFINITIONS[category].query})`);
    } else {
      queryParts.push('(topic:ai OR topic:machine-learning OR "artificial intelligence")');
    }

    if (keyword.trim()) {
      queryParts.push(keyword.trim());
    }

    if (language.trim()) {
      queryParts.push(`language:${language.trim()}`);
    }

    const searchQuery = queryParts.join(' ');

    // 2. 呼叫 GitHub API
    const result = await searchRepositoriesApi(searchQuery, 'stars', 'desc', page, perPage);

    // 3. 補充專案屬性與分類標註
    const items: AIToolItem[] = result.items.map((repo) => {
      const detectedCat = category !== 'all' ? category : classifyAICategory(repo.topics, repo.description || '', repo.name);
      const freeInfo = determineFreeType(repo.licenseSpdxId, repo.description || '');
      const winInfo = estimateWindowsCompat(repo.topics, repo.description || '');
      const diffInfo = estimateInstallDifficulty(repo.description || '', repo.language);

      return {
        id: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        ownerLogin: repo.ownerLogin,
        description: repo.description || '（專案未提供說明）',
        zhPurpose: repo.zhSummary || repo.description || '開源 AI 工具',
        category: detectedCat,
        categoryLabel: AI_CATEGORY_DEFINITIONS[detectedCat]?.label || '其他開源 AI',
        stars: repo.stars,
        forks: repo.forks,
        language: repo.language,
        updatedAt: repo.updatedAt,
        licenseName: repo.licenseSpdxId || '未明確聲明',
        licenseSpdxId: repo.licenseSpdxId,
        freeType: freeInfo.freeType,
        freeTypeLabel: freeInfo.label,
        freeTypeDescription: freeInfo.description,
        requiresApiKey: repo.cost.requiresExternalApi,
        requiredApiProviders: repo.cost.requiredApiProviders,
        requiresGpu: repo.cost.requiresGpu,
        canRunLocal: !repo.cost.requiresExternalApi,
        hasDemo: Boolean(repo.demo.url) && (repo.demo.verificationStatus === 'verified' || repo.demo.verificationStatus === 'unverified' || repo.demo.verificationStatus === 'found_unverified'),
        demoUrl: repo.demo.url,
        demoVerificationStatus: repo.demo.verificationStatus,
        windowsCompat: winInfo.compat,
        windowsCompatLabel: winInfo.label,
        installDifficulty: diffInfo.difficulty,
        installDifficultyLabel: diffInfo.label,
        maintenanceStatus: 'active',
        limitations: freeInfo.limitations,
        htmlUrl: repo.htmlUrl,
        homepage: repo.homepage,
        evidenceSource: 'GitHub 官方 Repository 與 License 規則抽取',
      };
    });

    // 4. 客戶端條件進階篩選 (在結果中精確過濾)
    let filteredItems = items;
    if (freeOnly) {
      filteredItems = filteredItems.filter((i) => i.freeType === 'free-selfhost' || i.freeType === 'free-tier');
    }
    if (noGpu) {
      filteredItems = filteredItems.filter((i) => !i.requiresGpu);
    }
    if (demoOnly) {
      filteredItems = filteredItems.filter((i) => i.hasDemo);
    }

    return NextResponse.json({
      success: true,
      items: filteredItems,
      totalCount: result.totalCount,
      page,
      perPage,
      categories: Object.entries(AI_CATEGORY_DEFINITIONS).map(([key, val]) => ({
        id: key,
        label: val.label,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '查詢 AI 工具尋寶清單失敗' },
      { status: 500 }
    );
  }
}
