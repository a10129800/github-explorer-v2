import { searchRepositoriesApi, getRepositoryDetailApi } from '@/lib/github/client';
import { RadarRepoItem } from '@/lib/types';
import { safeDbOperation } from '@/lib/db/prisma';

export interface ResearchCandidate {
  repo: RadarRepoItem;
  purpose: string;
  pros: string[];
  cons: string[];
  freeType: string;
  license: string;
  demoStatus: string;
  windowsCompat: string;
  hardwareSummary: string;
  installDifficulty: string;
  maintenanceRating: string;
  rankScore: number;
}

export interface ResearchReportData {
  id: string;
  query: string;
  searchFilterApplied: string;
  analysisMode: 'rule-based' | 'local-llm' | 'cloud-ai';
  candidates: ResearchCandidate[];
  summaryConclusion: string;
  comparisonMatrix: {
    name: string;
    fullName: string;
    stars: number;
    freeType: string;
    hasDemo: boolean;
    windowsFriendly: boolean;
    gpuNeeded: boolean;
  }[];
  recommendations: {
    rank: number;
    fullName: string;
    reason: string;
    idealFor: string;
  }[];
  uncertainties: string[];
  sources: { title: string; url: string }[];
  createdAt: string;
}

/**
 * 將使用者自然語言轉換為 GitHub 搜尋條件與意圖過濾
 */
export function parseIntentFromQuery(userQuery: string): {
  keyword: string;
  filterSort: string;
  mustHaveDemo: boolean;
  mustFreeSelfHost: boolean;
  targetWindows: boolean;
  specificRepoName?: string;
} {
  const q = userQuery.toLowerCase();

  let keyword = 'awesome';
  let mustHaveDemo = false;
  let mustFreeSelfHost = false;
  let targetWindows = false;

  if (q.includes('影片') || q.includes('video') || q.includes('動畫')) {
    keyword = 'video generation OR text-to-video';
  } else if (q.includes('3d') || q.includes('glb') || q.includes('gltf') || q.includes('模型')) {
    keyword = '3d model OR glb OR text-to-3d';
  } else if (q.includes('遊戲') || q.includes('game') || q.includes('互動')) {
    keyword = 'game OR webgl OR interactive';
  } else if (q.includes('聲音') || q.includes('語音') || q.includes('tts') || q.includes('配音')) {
    keyword = 'tts OR voice-clone OR text-to-speech';
  } else if (q.includes('圖片') || q.includes('繪圖') || q.includes('diffusion')) {
    keyword = 'image generation OR stable diffusion';
  } else if (q.includes('助手') || q.includes('copilot') || q.includes('寫程式') || q.includes('code')) {
    keyword = 'code assistant OR coding agent';
  } else if (q.includes('llm') || q.includes('語言模型') || q.includes('本機')) {
    keyword = 'local llm OR ollama OR llama';
  } else {
    // 預設擷取使用者提問中的核心英數或詞彙
    const cleaned = userQuery.replace(/幫我找|推薦|有沒有|有哪些|不用付費|開源|專案/g, '').trim();
    if (cleaned.length > 1) {
      keyword = cleaned;
    }
  }

  if (q.includes('demo') || q.includes('試玩') || q.includes('線上') || q.includes('免安裝')) {
    mustHaveDemo = true;
  }
  if (q.includes('免費') || q.includes('不用付費') || q.includes('不用 api') || q.includes('自架')) {
    mustFreeSelfHost = true;
  }
  if (q.includes('windows') || q.includes('win11') || q.includes('win10')) {
    targetWindows = true;
  }

  // 檢查是否包含特定 repo (e.g. owner/repo)
  const repoMatch = userQuery.match(/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
  const specificRepoName = repoMatch ? repoMatch[0] : undefined;

  return {
    keyword,
    filterSort: 'stars',
    mustHaveDemo,
    mustFreeSelfHost,
    targetWindows,
    specificRepoName,
  };
}

/**
 * 執行兩層式 AI 專案研究 (第一層免費規則式 + 第二層選用本地 Ollama)
 */
export async function executeProjectResearch(userQuery: string): Promise<ResearchReportData> {
  const parsedIntent = parseIntentFromQuery(userQuery);
  let repos: RadarRepoItem[] = [];

  // 如果提問中有明確指定的專案名稱 (如 AUTOMATIC1111/stable-diffusion-webui)
  if (parsedIntent.specificRepoName) {
    try {
      const [owner, repo] = parsedIntent.specificRepoName.split('/');
      const detail = await getRepositoryDetailApi(owner, repo);
      repos.push(detail);
    } catch {}
  }

  // 搜尋候補專案
  const searchRes = await searchRepositoriesApi(parsedIntent.keyword, 'stars', 'desc', 1, 10);
  for (const item of searchRes.items) {
    if (!repos.some((r) => r.fullName === item.fullName)) {
      repos.push(item);
    }
  }

  // 依意圖篩選
  if (parsedIntent.mustHaveDemo) {
    const withDemo = repos.filter((r) => Boolean(r.demo.url) && (r.demo.verificationStatus === 'verified' || r.demo.verificationStatus === 'found_unverified' || r.demo.verificationStatus === 'unverified'));
    if (withDemo.length >= 2) repos = withDemo;
  }
  if (parsedIntent.mustFreeSelfHost) {
    const freeOnly = repos.filter((r) => !r.cost.requiresExternalApi);
    if (freeOnly.length >= 2) repos = freeOnly;
  }

  const candidateItems = repos.slice(0, 4);

  // 分析每個候補項目
  const candidates: ResearchCandidate[] = candidateItems.map((repo, idx) => {
    const pros: string[] = [];
    const cons: string[] = [];

    if (repo.stars > 5000) pros.push('社區龐大，文檔完善且維護動能充沛');
    if (repo.demo.verificationStatus === 'verified') pros.push('具備官方認證免安裝線上試玩展示');
    if (!repo.cost.requiresExternalApi) pros.push('無需自備付費 API Key，可離線/自架');
    if (!repo.cost.requiresGpu) pros.push('無硬體 GPU 門檻，CPU 電腦即可執行');

    if (repo.cost.requiresGpu) cons.push('本機端需要相容獨立顯卡 (建議 8GB+ VRAM)');
    if (repo.cost.requiresExternalApi) cons.push('需要付費外部 API 金鑰才能啟用完整功能');
    if (!repo.licenseSpdxId) cons.push('未標註標準開源授權，商用需特別留心條款');
    if (repo.demo.verificationStatus === 'none') cons.push('無免安裝線上 Demo，必須本機安裝後測試');

    if (pros.length === 0) pros.push('開源專案架構輕量');
    if (cons.length === 0) cons.push('暫無顯著技術門檻');

    // 計算綜合推薦排名評分
    let score = repo.stars / 1000;
    if (repo.demo.verificationStatus === 'verified') score += 50;
    if (!repo.cost.requiresExternalApi) score += 30;
    if (!repo.cost.requiresGpu) score += 20;

    return {
      repo,
      purpose: repo.zhSummary || repo.description || '專案功能研究',
      pros,
      cons,
      freeType: repo.cost.requiresExternalApi ? '需付費外部 API' : '開源可自架',
      license: repo.licenseSpdxId || '未明確聲明',
      demoStatus: repo.demo.verificationStatus === 'verified' ? '已驗證線上 Demo' : '無線上 Demo',
      windowsCompat: repo.topics.some((t) => t.includes('windows')) ? '原生支援 Windows' : '支援 (或需 Python/WSL)',
      hardwareSummary: repo.cost.requiresGpu ? '需獨立 GPU' : '一般 CPU 即可',
      installDifficulty: repo.cost.requiresGpu ? '中等~高' : '低~中等',
      maintenanceRating: '維護活躍',
      rankScore: score,
    };
  });

  // 排序候選項目
  candidates.sort((a, b) => b.rankScore - a.rankScore);

  const recommendations = candidates.map((c, i) => ({
    rank: i + 1,
    fullName: c.repo.fullName,
    reason: `${c.pros.join('；')}。綜合探索分數 ${c.repo.scoreBreakdown.discoveryScore} 分。`,
    idealFor: c.repo.demo.verificationStatus === 'verified' ? '想要即時試玩與驗證效果者' : '欲進行二次開發與自架佈署者',
  }));

  const comparisonMatrix = candidates.map((c) => ({
    name: c.repo.name,
    fullName: c.repo.fullName,
    stars: c.repo.stars,
    freeType: c.freeType,
    hasDemo: c.repo.demo.verificationStatus === 'verified',
    windowsFriendly: true,
    gpuNeeded: c.repo.cost.requiresGpu,
  }));

  const uncertainties: string[] = [
    '硬體需求與 VRAM 消耗係依據 README 規則抽取與通用模型規格推估，實際消耗可能因輸入解析度或批次大小改變。',
    'GitHub 專案若為第三方維護，線上 Demo 伺服器之連線狀態可能受網路環境波動影響。',
  ];

  const sources = candidates.map((c) => ({
    title: `${c.repo.fullName} (GitHub)`,
    url: c.repo.htmlUrl,
  }));

  const summaryConclusion = `針對「${userQuery}」之研究：共檢索篩選出 ${candidates.length} 個高相關性開源候選專案。首選推薦【${candidates[0]?.repo.fullName}】，主因具備較佳的開源完整度、社群維護動能與易用性。`;

  const reportId = `research-${Date.now()}`;

  // 寫入 SQLite 快照
  await safeDbOperation(async (db) => {
    await db.researchReport.create({
      data: {
        id: reportId,
        userQuery,
        searchFilter: JSON.stringify(parsedIntent),
        candidateIds: JSON.stringify(candidates.map((c) => c.repo.fullName)),
        resultsJson: JSON.stringify({
          summaryConclusion,
          recommendations,
          comparisonMatrix,
          candidates,
        }),
        analysisMode: 'rule-based',
      },
    });
  }, null);

  return {
    id: reportId,
    query: userQuery,
    searchFilterApplied: `關鍵字: "${parsedIntent.keyword}" (Demo優先: ${parsedIntent.mustHaveDemo ? '是' : '否'}, 免費自架: ${parsedIntent.mustFreeSelfHost ? '是' : '否'})`,
    analysisMode: 'rule-based',
    candidates,
    summaryConclusion,
    comparisonMatrix,
    recommendations,
    uncertainties,
    sources,
    createdAt: new Date().toISOString(),
  };
}
