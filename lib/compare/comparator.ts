import { RadarRepoItem } from '@/lib/types';

export interface ComparisonDimension {
  id: string;
  name: string;
  category: '基礎指標' | '技術與硬體' | '授權與費用' | '體驗與維護';
  values: Record<string, string | number | boolean | null>; // repoId -> display value
  highlightBestId?: string;
  notes?: string;
}

export interface RepoComparisonSummary {
  repoId: string;
  fullName: string;
  name: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  keyStrengths: string[];
  keyLimitations: string[];
  bestFor: string;
  installDifficulty: string;
  windowsRating: string;
  gpuRating: string;
  freeRating: string;
}

export interface ComparisonResult {
  repos: RadarRepoItem[];
  dimensions: ComparisonDimension[];
  summaries: RepoComparisonSummary[];
  recommendations: {
    useCase: string;
    recommendedRepoFullName: string;
    reason: string;
  }[];
  generatedAt: string;
}

/**
 * 比較 2~4 個專案並產生結構化對比矩陣與依據分析
 */
export function compareRepositories(items: RadarRepoItem[]): ComparisonResult {
  if (items.length < 2) {
    throw new Error('比較器至少需要 2 個專案');
  }
  if (items.length > 4) {
    throw new Error('專案比較上限為 4 個專案');
  }

  // 1. 各維度欄位定義
  const dimStars: ComparisonDimension = {
    id: 'stars',
    name: 'GitHub Stars',
    category: '基礎指標',
    values: {},
  };
  const dimForks: ComparisonDimension = {
    id: 'forks',
    name: 'GitHub Forks',
    category: '基礎指標',
    values: {},
  };
  const dimLanguage: ComparisonDimension = {
    id: 'language',
    name: '主要程式語言',
    category: '技術與硬體',
    values: {},
  };
  const dimLicense: ComparisonDimension = {
    id: 'license',
    name: '開源授權條款',
    category: '授權與費用',
    values: {},
  };
  const dimFreeTerms: ComparisonDimension = {
    id: 'free_terms',
    name: '免費使用條件',
    category: '授權與費用',
    values: {},
  };
  const dimDemo: ComparisonDimension = {
    id: 'demo',
    name: '線上 Demo / 展示',
    category: '體驗與維護',
    values: {},
  };
  const dimWindows: ComparisonDimension = {
    id: 'windows_compat',
    name: 'Windows 相容性',
    category: '技術與硬體',
    values: {},
  };
  const dimGpu: ComparisonDimension = {
    id: 'gpu_req',
    name: 'GPU / 算力需求',
    category: '技術與硬體',
    values: {},
  };
  const dimInstall: ComparisonDimension = {
    id: 'install_difficulty',
    name: '預估安裝難度',
    category: '技術與硬體',
    values: {},
  };
  const dimMaintenance: ComparisonDimension = {
    id: 'maintenance',
    name: '近期維護狀態',
    category: '體驗與維護',
    values: {},
  };
  const dimUpdate: ComparisonDimension = {
    id: 'last_update',
    name: '最近更新時間',
    category: '體驗與維護',
    values: {},
  };

  let highestStarId = items[0].id;
  let maxStars = -1;

  for (const item of items) {
    const id = item.id;
    dimStars.values[id] = item.stars;
    if (item.stars > maxStars) {
      maxStars = item.stars;
      highestStarId = id;
    }

    dimForks.values[id] = item.forks;
    dimLanguage.values[id] = item.language || '未知';
    dimLicense.values[id] = item.licenseSpdxId || '未明確聲明';

    // 免費條件
    dimFreeTerms.values[id] = item.cost.requiresExternalApi
      ? '開源，但需自備付費外部 API'
      : item.cost.isOpenSourceApproved
      ? '完全開源免費自架'
      : '依專案授權條款而定';

    // Demo
    dimDemo.values[id] =
      item.demo.verificationStatus === 'verified'
        ? '已驗證官方 Demo 可直接體驗'
        : (item.demo.verificationStatus === 'found_unverified' || item.demo.verificationStatus === 'unverified')
        ? '疑似提供 Demo (未充分驗證)'
        : item.demo.verificationStatus === 'docs-only'
        ? '僅文件教學無可執行 Demo'
        : '無線上 Demo';

    // Windows
    dimWindows.values[id] = item.topics.some((t) => t.includes('windows'))
      ? '原生支援 Windows'
      : item.language === 'Python'
      ? '支援 (建議 Python 3.10+ 或 WSL2)'
      : '支援';

    // GPU
    dimGpu.values[id] = item.cost.requiresGpu ? '需獨立 GPU (建議 8GB+ VRAM)' : '一般 CPU 即可執行';

    // Install
    dimInstall.values[id] = item.demo.verificationStatus === 'verified'
      ? '極低 (可直接免安裝試玩)'
      : item.cost.requiresGpu
      ? '中等~高 (需 CUDA 驅動)'
      : '低~中等 (一般套件管理器安裝)';

    // Maintenance
    const pushDate = new Date(item.pushedAt);
    const daysSincePush = Math.floor((Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24));
    dimMaintenance.values[id] =
      daysSincePush < 14 ? '非常活躍 (近兩週有提交)' : daysSincePush < 60 ? '正常維護中' : '維護放緩 (超過 60 天未更新)';

    dimUpdate.values[id] = pushDate.toLocaleDateString('zh-TW');
  }

  dimStars.highlightBestId = highestStarId;

  // 2. 彙整各專案優勢、劣勢與定位
  const summaries: RepoComparisonSummary[] = items.map((item) => {
    const strengths: string[] = [];
    const limitations: string[] = [];

    if (item.stars > 5000) strengths.push('社群廣大、Stars 星數高、問題解決資源豐富');
    if (item.demo.verificationStatus === 'verified') strengths.push('具備免安裝官方線上 Demo，可立即驗證功能');
    if (item.cost.isOpenSourceApproved && !item.cost.requiresExternalApi) strengths.push('完全符合開源定義且無外部付費 API 依賴');
    if (item.scoreBreakdown.freshnessScore > 75) strengths.push('技術棧新穎，近期程式碼更新頻繁');

    if (item.cost.requiresGpu) limitations.push('本機端運算對顯卡算力與顯示記憶體有較高門檻');
    if (item.cost.requiresExternalApi) limitations.push('依賴第三方 API，需要自付 Token 呼叫成本');
    if (!item.licenseSpdxId) limitations.push('未標註標準 SPDX 授權條款，商用前需謹慎評估');
    if (item.demo.verificationStatus === 'none') limitations.push('無免安裝線上 Demo，必須本機編譯或佈署才能體驗');

    if (strengths.length === 0) strengths.push('專案結構單純，適合學習或客製化二次開發');
    if (limitations.length === 0) limitations.push('暫無顯著技術門檻限制');

    let bestFor = '一般學習與功能參考';
    if (item.demo.verificationStatus === 'verified') bestFor = '想 30 秒內快速體驗成果、免安裝試玩的使用者';
    else if (item.cost.isOpenSourceApproved && !item.cost.requiresGpu) bestFor = '想要輕量自架、節省算力成本的開發團隊';
    else if (item.stars > 10000) bestFor = '追求長期穩定性、生態系完整與生產環境落地的團隊';

    return {
      repoId: item.id,
      fullName: item.fullName,
      name: item.name,
      stars: item.stars,
      forks: item.forks,
      language: item.language || '未知',
      license: item.licenseSpdxId || '未明確聲明',
      keyStrengths: strengths,
      keyLimitations: limitations,
      bestFor,
      installDifficulty: String(dimInstall.values[item.id]),
      windowsRating: String(dimWindows.values[item.id]),
      gpuRating: String(dimGpu.values[item.id]),
      freeRating: String(dimFreeTerms.values[item.id]),
    };
  });

  // 3. 推薦場景
  const recommendations: { useCase: string; recommendedRepoFullName: string; reason: string }[] = [];

  // 情境 1: 最容易上手/想立即體驗
  const demoCandidate = items.find((i) => i.demo.verificationStatus === 'verified') || items[0];
  recommendations.push({
    useCase: '若希望在 1 分鐘內快速了解專案效果 (免安裝試玩)',
    recommendedRepoFullName: demoCandidate.fullName,
    reason: demoCandidate.demo.verificationStatus === 'verified'
      ? '該專案提供經官方認證的線上展示頁，無需安裝環境即可直接互動。'
      : '相較之下具備更親切的文件入口。',
  });

  // 情境 2: 最具社群穩定度與生產安全性
  const mostStarsRepo = [...items].sort((a, b) => b.stars - a.stars)[0];
  recommendations.push({
    useCase: '若用於企業或追求最廣泛社群維護與長期支援',
    recommendedRepoFullName: mostStarsRepo.fullName,
    reason: `擁有 ${mostStarsRepo.stars.toLocaleString()} Stars 與活躍維護動能，第三方外掛與除錯資源最豐富。`,
  });

  // 情境 3: 本機成本最低 (無需 GPU / 付費 API)
  const lowCostRepo = items.find((i) => !i.cost.requiresGpu && !i.cost.requiresExternalApi) || items[0];
  recommendations.push({
    useCase: '若本機電腦沒有獨立高階顯卡，且不想支付 API 呼叫費',
    recommendedRepoFullName: lowCostRepo.fullName,
    reason: '依據分析無硬性 GPU 門檻或外部 API 金鑰依賴，一般 CPU 個人電腦或文書筆電即可順利執行。',
  });

  return {
    repos: items,
    dimensions: [
      dimStars,
      dimForks,
      dimLanguage,
      dimLicense,
      dimFreeTerms,
      dimDemo,
      dimWindows,
      dimGpu,
      dimInstall,
      dimMaintenance,
      dimUpdate,
    ],
    summaries,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
