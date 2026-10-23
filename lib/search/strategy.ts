import { SearchFilters } from '@/lib/types';

interface QueryCompilationResult {
  githubQuery: string;
  explanation: string;
  parsedFilters: Partial<SearchFilters>;
  isChineseConverted: boolean;
}

const CHINESE_TECH_INTENTS: Record<string, { terms: string[]; topics?: string[]; preferDemo?: boolean }> = {
  '小遊戲': { terms: ['browser game', 'html5 game'], topics: ['game', 'browser-game'], preferDemo: true },
  '遊戲': { terms: ['game', 'game engine'], topics: ['game'] },
  '玩': { terms: ['interactive', 'playable'], preferDemo: true },
  '文字轉3d': { terms: ['text to 3d', 'gaussian splatting', 'nerf'], topics: ['3d'] },
  '3d': { terms: ['threejs', 'webgl', '3d'], topics: ['threejs', 'webgl'], preferDemo: true },
  '影片生成': { terms: ['video generation', 'text to video'], topics: ['video-generation', 'ai'] },
  '圖片生成': { terms: ['image generation', 'diffusion', 'stable diffusion'], topics: ['diffusion'] },
  '文字轉語音': { terms: ['text to speech', 'tts', 'voice synthesis'], topics: ['tts'] },
  '語音': { terms: ['speech', 'voice', 'audio'], topics: ['audio'] },
  '大模型': { terms: ['llm', 'large language model'], topics: ['llm'] },
  '知識庫': { terms: ['rag', 'vector database'], topics: ['rag'] },
  '自架': { terms: ['self-hosted', 'homelab', 'docker'], topics: ['self-hosted'] },
  '自託管': { terms: ['self-hosted'], topics: ['self-hosted'] },
  '生產力': { terms: ['productivity', 'cli', 'workflow'], topics: ['productivity', 'cli'] },
  '終端機': { terms: ['cli', 'tui', 'terminal'], topics: ['cli', 'tui'] },
  '視覺化': { terms: ['data visualization', 'dataviz', 'dashboard'], topics: ['data-visualization'] },
  '爬蟲': { terms: ['scraper', 'web crawler'], topics: ['scraper'] },
  '創意': { terms: ['creative coding', 'generative art'], topics: ['creative-coding'], preferDemo: true },
  '冷門': { terms: ['niche', 'experimental'] },
  '初學': { terms: ['beginner friendly', 'starter kit'], topics: ['beginner-friendly'] },
  '新手': { terms: ['beginner friendly', 'good first issue'] },
};

const LANG_MAP: Record<string, string> = {
  python: 'Python',
  rust: 'Rust',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  go: 'Go',
  golang: 'Go',
  cpp: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  'c#': 'C#',
  java: 'Java',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dart: 'Dart',
  php: 'PHP',
};

/**
 * 組合與編譯 GitHub 官方 Search Query
 * 支援原生語法（如 topic:xxx, stars:>100）及繁體中文語意分析
 */
export function compileSearchQuery(filters: SearchFilters): QueryCompilationResult {
  const rawInput = (filters.query || '').trim();
  const queryParts: string[] = [];
  const explanationParts: string[] = [];
  let isChinese = /[\u4e00-\u9fa5]/.test(rawInput);
  let parsedFilters: Partial<SearchFilters> = {};

  if (!rawInput && !filters.language && !filters.starsMin && !filters.timeRange) {
    // 預設優質熱門雷達
    queryParts.push('stars:>100');
    explanationParts.push('預設搜尋活躍優質專案 (stars:>100)');
  } else if (!isChinese) {
    // 原生英文 / GitHub 搜尋語法
    if (rawInput) {
      queryParts.push(rawInput);
      explanationParts.push(`原生語法檢索: "${rawInput}"`);
    }
  } else {
    // 繁體中文語意規則式分析
    const lower = rawInput.toLowerCase();
    const matchedTerms: string[] = [];
    let detectedLang: string | undefined;

    // 1. 偵測語言
    for (const [key, langName] of Object.entries(LANG_MAP)) {
      if (new RegExp(`\\b${key}\\b|用\\s*${key}|以\\s*${key}`, 'i').test(lower)) {
        detectedLang = langName;
        filters.language = langName;
        explanationParts.push(`偵測指定程式語言: ${langName}`);
        break;
      }
    }

    // 2. 匹配意圖詞典
    for (const [zhKey, config] of Object.entries(CHINESE_TECH_INTENTS)) {
      if (lower.includes(zhKey)) {
        matchedTerms.push(config.terms[0]);
        if (config.preferDemo) {
          parsedFilters.demoOnly = true;
        }
        explanationParts.push(`識別主題「${zhKey}」➔ 轉換為關鍵字 "${config.terms[0]}"`);
      }
    }

    // 3. 處理「最近很紅」、「新興」等時效偏好
    if (lower.includes('最近') || lower.includes('近期') || lower.includes('最新')) {
      parsedFilters.timeRange = 'month';
      explanationParts.push('加入時效條件：近 30 天內有活躍提交');
    }

    if (matchedTerms.length > 0) {
      queryParts.push(matchedTerms.join(' '));
    } else {
      // 提取核心詞彙
      const cleaned = lower.replace(/找|有沒有|請問|推薦|相關|好玩的|好用的|工具|專案|的|用/g, ' ').trim();
      if (cleaned) {
        queryParts.push(cleaned);
        explanationParts.push(`擷取關鍵意圖詞：「${cleaned}」`);
      } else {
        queryParts.push(rawInput);
      }
    }
  }

  // 補充結構化篩選條件
  if (filters.language && filters.language !== 'all') {
    queryParts.push(`language:${filters.language}`);
  }

  if (filters.starsMin !== undefined || filters.starsMax !== undefined) {
    if (filters.starsMin !== undefined && filters.starsMax !== undefined) {
      queryParts.push(`stars:${filters.starsMin}..${filters.starsMax}`);
    } else if (filters.starsMin !== undefined) {
      queryParts.push(`stars:>=${filters.starsMin}`);
    } else if (filters.starsMax !== undefined) {
      queryParts.push(`stars:<=${filters.starsMax}`);
    }
  }

  if (filters.timeRange && filters.timeRange !== 'any') {
    const d = new Date();
    if (filters.timeRange === 'today') d.setDate(d.getDate() - 1);
    else if (filters.timeRange === 'week') d.setDate(d.getDate() - 7);
    else if (filters.timeRange === 'month') d.setMonth(d.getMonth() - 1);
    else if (filters.timeRange === 'year') d.setFullYear(d.getFullYear() - 1);
    queryParts.push(`pushed:>=${d.toISOString().split('T')[0]}`);
  }

  if (filters.createdRange && filters.createdRange !== 'any') {
    const d = new Date();
    if (filters.createdRange === '30d') d.setDate(d.getDate() - 30);
    else if (filters.createdRange === '90d') d.setDate(d.getDate() - 90);
    else if (filters.createdRange === '1y') d.setFullYear(d.getFullYear() - 1);
    queryParts.push(`created:>=${d.toISOString().split('T')[0]}`);
  }

  // 排除封存的倉庫
  queryParts.push('archived:false');

  const finalQuery = queryParts.join(' ').trim();
  const explanation = explanationParts.length > 0 
    ? `規則式轉譯解析：${explanationParts.join('；')}` 
    : '直接採用輸入搜尋語法';

  return {
    githubQuery: finalQuery,
    explanation,
    parsedFilters,
    isChineseConverted: isChinese,
  };
}
