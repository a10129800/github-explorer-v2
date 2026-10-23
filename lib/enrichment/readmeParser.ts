/**
 * README 繁體中文結構化解析器 (免費優先、規則驅動、零付費 API 依賴)
 * 提取 11 項結構化資訊並支援 3 種閱讀模式
 */

export interface StructuredExplanation {
  mode: 'quick' | 'install' | 'technical';
  analysisType: '規則式結構化整理' | '本機 AI 摘要' | '雲端 AI 分析';
  generatedAt: string;
  sourceRepo: {
    fullName: string;
    htmlUrl: string;
    readmeUrl: string;
    license: string;
  };
  // 11 項結構化維度
  purpose: string;              // 1. 這個專案是做什麼的
  fitScenarios: string[];       // 2. 適合哪些使用情境
  mainFeatures: string[];       // 3. 主要功能
  gettingStarted: string[];     // 4. 如何開始使用
  windowsInstall: {             // 5. Windows 安裝方式
    steps: string[];
    prerequisites: string[];
    isNative: boolean;
  };
  gpuRequirement: {             // 6. 是否需要 GPU
    required: boolean;
    details: string;
    recommendedVram: string | null;
  };
  apiKeyRequirement: {          // 7. 是否需要 API 金鑰
    required: boolean;
    providers: string[];
    details: string;
  };
  licenseAndCost: {             // 8. 免費與授權限制
    licenseName: string;
    commercialUseAllowed: boolean;
    notes: string[];
  };
  officialDemo: {               // 9. 官方 Demo
    hasDemo: boolean;
    url: string | null;
    statusNote: string;
  };
  knownLimitations: string[];   // 10. 已知限制
  rawReadmeUrl: string;         // 11. 原始 README 連結
}

/**
 * 簡易過濾危險字元與標籤以防禦 XSS
 */
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'blocked-javascript:')
    .replace(/onerror=/gi, 'blocked-onerror=')
    .replace(/onload=/gi, 'blocked-onload=');
}

/**
 * 擷取 README 中的安裝代碼區塊
 */
function extractCodeBlocks(markdown: string): string[] {
  const codeBlockRegex = /```(?:bash|sh|powershell|cmd|bat)?\s*([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const code = match[1].trim();
    if (code.includes('git clone') || code.includes('npm') || code.includes('pip') || code.includes('docker') || code.includes('cargo')) {
      blocks.push(code);
    }
  }
  return blocks.slice(0, 5);
}

/**
 * 依據專案資訊與原始 README 產生 11 項結構化繁體中文解說
 */
export function parseReadmeToZhExplanation(
  fullName: string,
  htmlUrl: string,
  rawReadme: string,
  meta: {
    description?: string;
    language?: string | null;
    topics?: string[];
    licenseSpdxId?: string | null;
    homepage?: string | null;
    stars?: number;
  } = {}
): StructuredExplanation {
  const safeReadme = sanitizeText(rawReadme || '');
  const lowerReadme = safeReadme.toLowerCase();
  const desc = meta.description || '（專案未填寫描述）';
  const topics = meta.topics || [];
  const licenseId = meta.licenseSpdxId || '未明確聲明';

  // 1. 專案用途 (Purpose)
  let purpose = desc;
  if (lowerReadme.includes('# ') || lowerReadme.includes('## about') || lowerReadme.includes('## overview')) {
    const lines = safeReadme.split('\n').filter((l) => l.trim().length > 10 && !l.startsWith('#') && !l.startsWith('!'));
    if (lines.length > 0 && desc.length < 30) {
      purpose = `${desc}。${lines[0].replace(/\[|\]|\(|\)/g, '').slice(0, 150)}...`;
    }
  }

  // 2. 適合情境 (Fit Scenarios)
  const fitScenarios: string[] = [];
  if (topics.some((t) => t.includes('ai') || t.includes('llm') || t.includes('diffusion'))) {
    fitScenarios.push('需要於本機或私有伺服器探索與整合 AI 生成能力的開發者');
  }
  if (topics.some((t) => t.includes('web') || t.includes('frontend') || t.includes('react') || t.includes('vue'))) {
    fitScenarios.push('現代化 Web 應用程式開發與互動介面構建');
  }
  if (topics.some((t) => t.includes('cli') || t.includes('tool') || t.includes('automation'))) {
    fitScenarios.push('提高日常工作流程自動化或命令列作業效率');
  }
  if (topics.some((t) => t.includes('3d') || t.includes('game') || t.includes('threejs'))) {
    fitScenarios.push('3D 互動、視覺展示或數位內容創作');
  }
  if (fitScenarios.length === 0) {
    fitScenarios.push(`適合使用 ${meta.language || '現代程式語言'} 的工程師進行技術學習、專案二開或架構參考`);
  }

  // 3. 主要功能 (Main Features)
  const mainFeatures: string[] = [];
  const bulletLines = safeReadme
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- ') || l.startsWith('* '))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/`|\*\*|\*/g, ''))
    .filter((l) => l.length > 5 && l.length < 120);

  if (bulletLines.length > 0) {
    mainFeatures.push(...bulletLines.slice(0, 6));
  } else {
    mainFeatures.push(
      '核心功能依據專案架構設計模組化運作',
      `以 ${meta.language || '開源語言'} 實作的高效能運作邏輯`,
      '提供標準化呼叫介面或 CLI 工具'
    );
  }

  // 4. 如何開始 (Getting Started)
  const codeBlocks = extractCodeBlocks(safeReadme);
  const gettingStarted: string[] = [];
  if (codeBlocks.length > 0) {
    gettingStarted.push(...codeBlocks.slice(0, 3));
  } else {
    gettingStarted.push(
      `git clone ${htmlUrl}.git`,
      meta.language === 'Python' ? 'pip install -r requirements.txt' : 'npm install\nnpm run dev'
    );
  }

  // 5. Windows 安裝方式 (Windows Installation)
  const isWindowsNative =
    lowerReadme.includes('windows') ||
    lowerReadme.includes('.bat') ||
    lowerReadme.includes('.exe') ||
    lowerReadme.includes('powershell');
  const windowsSteps: string[] = [];
  const prerequisites: string[] = [];

  if (isWindowsNative) {
    windowsSteps.push('1. 下載專案原始碼或 Release 中的 Windows 預編譯檔案');
    windowsSteps.push('2. 開啟 PowerShell 或 CMD 終端機進入專案資料夾');
    windowsSteps.push('3. 執行安裝指令或啟動批次檔 (如 start.bat 或 npm run dev)');
    prerequisites.push(`已安裝相應環境 (${meta.language || 'Node.js / Python'})`);
  } else {
    windowsSteps.push('1. Windows 建議透過 WSL2 (Ubuntu) 執行以避免環境相容性問題');
    windowsSteps.push('2. 於 WSL 終端機內複製 Repo 並依 Linux 步驟建置');
    prerequisites.push('Windows 10/11 需已啟用 WSL2 與 Linux 發行版');
  }

  // 6. 是否需要 GPU
  const requiresGpu =
    lowerReadme.includes('cuda') ||
    lowerReadme.includes('nvidia') ||
    lowerReadme.includes('vram') ||
    lowerReadme.includes('torch.cuda') ||
    lowerReadme.includes('gpu required');
  const gpuDetails = requiresGpu
    ? '專案包含深度學習運算或高強度圖形推理，建議配備支援 CUDA 之 NVIDIA 顯示卡。'
    : '一般情況下使用 CPU 即可順暢運作，無硬性獨立 GPU 門檻。';
  const recommendedVram = requiresGpu ? (lowerReadme.includes('16gb') ? '16GB+' : '8GB+') : null;

  // 7. 是否需要 API 金鑰
  const requiresApiKey =
    lowerReadme.includes('api_key') ||
    lowerReadme.includes('openai_key') ||
    lowerReadme.includes('anthropic_key') ||
    lowerReadme.includes('api token');
  const providers: string[] = [];
  if (lowerReadme.includes('openai')) providers.push('OpenAI');
  if (lowerReadme.includes('anthropic') || lowerReadme.includes('claude')) providers.push('Anthropic');
  if (lowerReadme.includes('groq')) providers.push('Groq');
  if (lowerReadme.includes('cohere')) providers.push('Cohere');

  // 8. 免費與授權限制
  const commercialAllowed = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'MPL-2.0'].includes(licenseId);
  const licenseNotes: string[] = [];
  if (licenseId === 'GPL-3.0' || licenseId === 'AGPL-3.0') {
    licenseNotes.push('採用 Copyleft 條款：若修改後散布或提供網路服務，衍生程式碼需以相同條款開源');
  } else if (commercialAllowed) {
    licenseNotes.push('採用寬鬆開源條款，允許個人、學術及商業自由使用');
  } else if (licenseId.includes('NC') || lowerReadme.includes('non-commercial')) {
    licenseNotes.push('明訂禁止商業使用 (Non-Commercial)，僅限非營利學術研究');
  } else {
    licenseNotes.push('授權未明確聲明，使用於正式商業產品前建議取得作者許可');
  }

  // 9. 官方 Demo
  let demoUrl: string | null = null;
  let statusNote = '未提供線上 Demo，需本機安裝測試';
  if (meta.homepage && meta.homepage.startsWith('http')) {
    demoUrl = meta.homepage;
    statusNote = '已於專案主頁找到官方網站或線上展示入口';
  } else if (lowerReadme.includes('huggingface.co/spaces/')) {
    const hfMatch = safeReadme.match(/https:\/\/huggingface\.co\/spaces\/[^\s)\]]+/);
    if (hfMatch) {
      demoUrl = hfMatch[0];
      statusNote = '找到 HuggingFace 官方 Spaces 線上試玩頁';
    }
  }

  // 10. 已知限制
  const knownLimitations: string[] = [];
  if (requiresGpu) knownLimitations.push('無獨立顯示卡或 VRAM 不足時，推理速度可能顯著變慢或發生 OOM (記憶體溢出)');
  if (requiresApiKey) knownLimitations.push('依賴第三方 API 服務，需自付 Token 呼叫成本並受外部服務可用性影響');
  if (!isWindowsNative) knownLimitations.push('未提供原生 Windows 一鍵執行包，Windows 使用者建議透過 WSL2 進行');
  if (knownLimitations.length === 0) {
    knownLimitations.push('開源專案版本迭代迅速，環境依賴版本變更可能影響相容性');
  }

  // 11. 原始 README 連結
  const rawReadmeUrl = `${htmlUrl}/blob/main/README.md`;

  return {
    mode: 'quick',
    analysisType: '規則式結構化整理',
    generatedAt: new Date().toISOString(),
    sourceRepo: {
      fullName,
      htmlUrl,
      readmeUrl: rawReadmeUrl,
      license: licenseId,
    },
    purpose,
    fitScenarios,
    mainFeatures,
    gettingStarted,
    windowsInstall: {
      steps: windowsSteps,
      prerequisites,
      isNative: isWindowsNative,
    },
    gpuRequirement: {
      required: requiresGpu,
      details: gpuDetails,
      recommendedVram,
    },
    apiKeyRequirement: {
      required: requiresApiKey,
      providers,
      details: requiresApiKey ? `需設定 API 金鑰 (${providers.join(', ') || '外部服務'}) 才能啟用核心功能` : '無需外部付費 API 金鑰即可本機離線執行',
    },
    licenseAndCost: {
      licenseName: licenseId,
      commercialUseAllowed: commercialAllowed,
      notes: licenseNotes,
    },
    officialDemo: {
      hasDemo: Boolean(demoUrl),
      url: demoUrl,
      statusNote,
    },
    knownLimitations,
    rawReadmeUrl,
  };
}
