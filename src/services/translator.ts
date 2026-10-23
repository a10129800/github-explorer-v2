/**
 * 繁體中文需求轉 GitHub 搜尋語法轉換器
 * 依據規則：採用透明、可解釋的規則庫與啟發式關鍵字映射策略
 */

interface TranslationResult {
  original: string;
  mappedKeywords: string[];
  detectedLanguage?: string;
  recommendedFilters?: {
    stars?: string;
    topic?: string;
  };
  finalQuery: string;
  explanation: string;
  isTranslated: boolean;
}

// 常見中文技術關鍵字至英文搜尋術語映射表
const KEYWORD_MAP: Record<string, string[]> = {
  // AI 與多媒體生成
  '影片生成': ['video generation', 'ai video', 'text-to-video'],
  '視頻生成': ['video generation', 'text-to-video'],
  '文字轉3d': ['text to 3d', '3d generation', 'nerf', 'gaussian splatting'],
  '3d模型': ['3d', 'threejs', '3d model', 'webgl'],
  '圖片生成': ['image generation', 'diffusion', 'stable diffusion', 'text-to-image'],
  '聲音生成': ['audio generation', 'voice synthesis', 'tts', 'text to speech'],
  '文字轉語音': ['text to speech', 'tts', 'voice synthesis'],
  '語音識別': ['speech recognition', 'whisper', 'voice to text'],
  '大語言模型': ['llm', 'large language model', 'gpt', 'local-llm'],
  '大型語言模型': ['llm', 'large language model', 'rag'],
  '提示詞': ['prompt', 'prompt engineering'],
  '知識庫': ['rag', 'vector database', 'retrieval-augmented-generation'],
  
  // 遊戲與視覺
  '瀏覽器遊戲': ['browser game', 'html5 game', 'web-game', 'canvas game'],
  '網頁遊戲': ['web game', 'browser game', 'phaser'],
  '獨立遊戲': ['indie game', 'godot', 'game engine'],
  '創意編程': ['creative coding', 'generative art', 'canvas', 'p5js', 'shaders'],
  '著色器': ['shaders', 'glsl', 'webgl-shader'],
  '生成藝術': ['generative art', 'algorithmic art', 'canvas'],
  '動畫': ['animation', 'motion', 'interactive animation'],
  '資料視覺化': ['data visualization', 'charts', 'd3', 'dataviz'],
  '數據可視化': ['data visualization', 'dashboard', 'analytics'],

  // 工具與生產力
  '自建服務': ['self-hosted', 'homelab', 'docker-compose'],
  '自託管': ['self-hosted', 'selfhost'],
  '自動化': ['automation', 'workflow', 'bot'],
  '生產力': ['productivity', 'efficiency', 'workflow tool'],
  '終端機工具': ['cli', 'terminal', 'command-line', 'tui'],
  '命令列': ['cli', 'command line tool'],
  '爬蟲': ['scraper', 'web crawler', 'spider'],
  '資料庫': ['database', 'sqlite', 'embedded-db'],
  '備份': ['backup', 'synchronization'],
  '下載器': ['downloader', 'media-downloader'],
  '瀏覽器外掛': ['browser extension', 'chrome-extension'],
  '開源替代品': ['open source alternative', 'self-hosted alternative'],
  
  // 專案特質
  '冷門': ['niche', 'experimental', 'underrated'],
  '寶藏': ['awesome', 'curated', 'hidden-gem'],
  '新手友善': ['beginner friendly', 'good first issue', 'starter kit'],
  '初學者': ['learn to code', 'starter template', 'tutorial'],
  '輕量級': ['lightweight', 'minimal', 'tiny', 'zero-dependency'],
  '極簡': ['minimalist', 'clean-code'],
  '實驗性': ['experimental', 'proof-of-concept', 'prototype'],
  '有趣': ['fun', 'unusual', 'creative', 'cool']
};

// 支援的程式語言識別清單
const LANGUAGE_PATTERNS: Record<string, string> = {
  'python': 'Python',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'rust': 'Rust',
  'golang': 'Go',
  'go語言': 'Go',
  'go': 'Go',
  'c++': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'java': 'Java',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'php': 'PHP',
  'ruby': 'Ruby',
  'dart': 'Dart',
  'flutter': 'Dart',
  'vue': 'Vue',
  'react': 'React',
  'svelte': 'Svelte'
};

export function translateChineseQuery(input: string): TranslationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      original: '',
      mappedKeywords: [],
      finalQuery: '',
      explanation: '無搜尋字串',
      isTranslated: false
    };
  }

  // 檢查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(trimmed);
  if (!hasChinese) {
    // 英文輸入，直接採用原始輸入
    return {
      original: trimmed,
      mappedKeywords: [trimmed],
      finalQuery: trimmed,
      explanation: '已輸入英文或原生 GitHub 搜尋語法',
      isTranslated: false
    };
  }

  const lowerInput = trimmed.toLowerCase();
  const matchedKeywords: string[] = [];
  const explanationParts: string[] = [];
  let detectedLang: string | undefined;

  // 1. 偵測程式語言
  for (const [key, langName] of Object.entries(LANGUAGE_PATTERNS)) {
    const regex = new RegExp(`\\b${key}\\b|用\\s*${key}|以\\s*${key}|${key}\\s*寫`, 'i');
    if (regex.test(lowerInput)) {
      detectedLang = langName;
      explanationParts.push(`偵測到指定程式語言：${langName}`);
      break;
    }
  }

  // 2. 比對中文技術辭典
  for (const [zhTerm, enTerms] of Object.entries(KEYWORD_MAP)) {
    if (lowerInput.includes(zhTerm.toLowerCase())) {
      matchedKeywords.push(enTerms[0]);
      explanationParts.push(`「${zhTerm}」➔ 轉換為 "${enTerms[0]}"`);
    }
  }

  // 3. 特殊修飾詞偵測（例如「冷門」、「新手」）
  let recommendedStars: string | undefined;
  if (lowerInput.includes('冷門') || lowerInput.includes('隱藏') || lowerInput.includes('寶藏')) {
    recommendedStars = '10..1500';
    explanationParts.push('偵測到冷門寶藏偏好：建議 Star 範圍 10..1500 避免大眾主流');
  } else if (lowerInput.includes('新手') || lowerInput.includes('初學')) {
    recommendedStars = '100..*';
    explanationParts.push('偵測到新手學習需求：篩選基礎穩定的起步專案');
  }

  // 4. 若無命中字典，將非中文部分與中文去除贅字提取
  if (matchedKeywords.length === 0) {
    // 移除常見中文字詞「我想找」「有沒有」「推薦」「工具」「軟體」「的」「用」
    const cleaned = lowerInput
      .replace(/我想找|有沒有|請問|推薦|相關|的好用|好玩的|工具|軟體|專案|開源/g, ' ')
      .trim();

    if (cleaned.length > 0) {
      matchedKeywords.push(cleaned);
      explanationParts.push(`擷取核心詞彙：「${cleaned}」`);
    } else {
      matchedKeywords.push(trimmed);
      explanationParts.push(`直接保留關鍵字：「${trimmed}」`);
    }
  }

  // 組裝 final query
  const queryParts: string[] = [];
  if (matchedKeywords.length > 0) {
    queryParts.push(matchedKeywords.join(' '));
  }
  if (detectedLang) {
    queryParts.push(`language:${detectedLang}`);
  }

  const finalQuery = queryParts.join(' ');
  const explanation = explanationParts.length > 0
    ? `規則式智慧轉譯：${explanationParts.join('；')}`
    : '依輸入詞彙搜尋';

  return {
    original: trimmed,
    mappedKeywords: matchedKeywords,
    detectedLanguage: detectedLang,
    recommendedFilters: recommendedStars ? { stars: recommendedStars } : undefined,
    finalQuery,
    explanation,
    isTranslated: true
  };
}
