export type AICategory =
  | 'text-to-video'
  | 'image-gen'
  | 'image-to-video'
  | 'voice-tts'
  | 'lip-sync'
  | '3d-gen'
  | '3d-viewer'
  | 'code-assistant'
  | 'local-llm'
  | 'workflow'
  | 'other';

export type FreeType =
  | 'free-selfhost'       // 開源且可免費自架
  | 'open-source-costly'  // 開源但可能需要昂貴硬體/GPU/付費 API
  | 'free-tier'           // 商業產品提供免費方案
  | 'free-trial'          // 免費試用但有限制
  | 'unknown';            // 費用或授權尚未確認

export type WindowsCompat =
  | 'native'            // 原生支援 Windows
  | 'wsl2-recommended'  // 建議使用 WSL2
  | 'docker-required'   // 需要 Docker
  | 'unsupported'       // 不支援 Windows
  | 'unknown';          // 尚未確認

export interface AIToolItem {
  id: string;
  fullName: string;
  name: string;
  ownerLogin: string;
  description: string;
  zhPurpose: string;
  category: AICategory;
  categoryLabel: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  licenseName: string;
  licenseSpdxId: string | null;
  freeType: FreeType;
  freeTypeLabel: string;
  freeTypeDescription: string;
  requiresApiKey: boolean;
  requiredApiProviders: string[];
  requiresGpu: boolean;
  canRunLocal: boolean;
  hasDemo: boolean;
  demoUrl: string | null;
  demoVerificationStatus: string;
  windowsCompat: WindowsCompat;
  windowsCompatLabel: string;
  installDifficulty: 'easy' | 'medium' | 'hard' | 'unknown';
  installDifficultyLabel: string;
  maintenanceStatus: 'active' | 'normal' | 'stale';
  limitations: string[];
  htmlUrl: string;
  homepage: string | null;
  evidenceSource: string;
}

export const AI_CATEGORY_DEFINITIONS: Record<AICategory, { label: string; keywords: string[]; query: string }> = {
  'text-to-video': {
    label: 'AI 文字轉影片',
    keywords: ['text-to-video', 't2v', 'video-generation', 'sora', 'animate', 'motion-model', 'cogvideox', 'animatediff'],
    query: 'text-to-video OR video-generation OR "video generation"',
  },
  'image-gen': {
    label: 'AI 圖片生成',
    keywords: ['text-to-image', 'diffusion', 'stable-diffusion', 'flux', 'midjourney-alternative', 'image-gen', 'sdxl'],
    query: 'text-to-image OR "stable diffusion" OR flux diffusion',
  },
  'image-to-video': {
    label: 'AI 圖片轉影片',
    keywords: ['image-to-video', 'i2v', 'image2video', 'svd', 'stable-video-diffusion', 'liveportrait'],
    query: 'image-to-video OR image2video OR "stable video diffusion"',
  },
  'voice-tts': {
    label: 'AI 語音與配音',
    keywords: ['tts', 'text-to-speech', 'voice-clone', 'vits', 'rvc', 'chatter', 'sovits', 'bark', 'f5-tts', 'cosyvoice'],
    query: 'text-to-speech OR voice-clone OR tts',
  },
  'lip-sync': {
    label: 'AI 口型同步',
    keywords: ['lip-sync', 'talking-head', 'wav2lip', 'echomimic', 'sadtalker', 'liveportrait', 'hallotalker', 'musetalk'],
    query: 'lip-sync OR wav2lip OR "talking head" OR liveportrait',
  },
  '3d-gen': {
    label: 'AI 3D 模型生成',
    keywords: ['text-to-3d', 'image-to-3d', 'nerf', 'gaussian-splatting', 'mesh-generation', 'trellis', 'triposr', 'shap-e'],
    query: 'text-to-3d OR image-to-3d OR "gaussian splatting" OR trellis',
  },
  '3d-viewer': {
    label: '3D 模型檢視與轉換',
    keywords: ['3d-viewer', 'glb-viewer', 'gltf', 'obj-converter', 'threejs', 'webgl-3d', 'splat-viewer'],
    query: 'glb viewer OR gltf viewer OR "3d viewer" webgl',
  },
  'code-assistant': {
    label: 'AI 程式開發助手',
    keywords: ['code-assistant', 'copilot', 'coding-assistant', 'codegen', 'aider', 'continue', 'tabby', 'cursor-alternative'],
    query: 'code assistant OR copilot alternative OR aider coding',
  },
  'local-llm': {
    label: '本機大型語言模型',
    keywords: ['local-llm', 'ollama', 'llama.cpp', 'vllm', 'text-generation-webui', 'lmstudio', 'jan', 'localai'],
    query: 'ollama OR llama.cpp OR "local llm" OR vllm',
  },
  'workflow': {
    label: '自動化工作流與 Agent',
    keywords: ['agent', 'workflow', 'langchain', 'langgraph', 'crewai', 'dify', 'autogen', 'n8n'],
    query: 'ai agent OR "ai workflow" OR dify OR langchain',
  },
  'other': {
    label: '其他開源 AI 專案',
    keywords: ['ai', 'artificial-intelligence', 'machine-learning', 'deep-learning', 'model'],
    query: 'artificial intelligence OR deep learning',
  },
};

/**
 * 依專案 Topics、描述及語言分類 AI 工具領域
 */
export function classifyAICategory(topics: string[], desc: string, name: string): AICategory {
  const text = `${name} ${desc} ${topics.join(' ')}`.toLowerCase();

  for (const [cat, def] of Object.entries(AI_CATEGORY_DEFINITIONS)) {
    if (cat === 'other') continue;
    if (def.keywords.some((kw) => text.includes(kw))) {
      return cat as AICategory;
    }
  }
  return 'other';
}

/**
 * 依據專案特性與授權判斷免費性質
 */
export function determineFreeType(
  licenseSpdxId: string | null,
  desc: string,
  readmeText: string = ''
): { freeType: FreeType; label: string; description: string; limitations: string[] } {
  const lower = `${desc} ${readmeText}`.toLowerCase();
  const limitations: string[] = [];

  const isCommercialFreeLicense = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'GPL-3.0', 'AGPL-3.0', 'MPL-2.0'].includes(
    licenseSpdxId || ''
  );

  const hasApiKeyRequirement = lower.includes('openai_api_key') || lower.includes('anthropic_api_key') || lower.includes('requires api key') || lower.includes('bring your own key');
  const hasGpuMention = lower.includes('cuda') || lower.includes('vram') || lower.includes('nvidia') || lower.includes('rtx');
  const hasFreeTrialMention = lower.includes('free trial') || lower.includes('trial version') || lower.includes('credit limit');
  const hasCommercialRestriction = lower.includes('non-commercial') || lower.includes('research only') || lower.includes('cc-by-nc');

  if (hasCommercialRestriction) {
    limitations.push('限制僅供非商業研究用途使用 (Non-Commercial)');
  }
  if (hasApiKeyRequirement) {
    limitations.push('需自行準備付費或具有額度限制之外部 AI API 金鑰');
  }
  if (hasGpuMention) {
    limitations.push('需具備相容獨立顯卡 (建議 8GB+ VRAM) 或雲端 GPU 算力');
  }

  if (hasFreeTrialMention) {
    return {
      freeType: 'free-trial',
      label: '免費試用 (有額度或時間限制)',
      description: '提供短期或固定額度免費體驗，耗盡後需付費。',
      limitations,
    };
  }

  if (hasApiKeyRequirement || (hasGpuMention && !isCommercialFreeLicense)) {
    return {
      freeType: 'open-source-costly',
      label: '開源，但需負擔硬體/API 成本',
      description: '程式碼開源，但執行需依賴獨立 GPU 算力或付費外部 API。',
      limitations,
    };
  }

  if (isCommercialFreeLicense && !hasApiKeyRequirement) {
    return {
      freeType: 'free-selfhost',
      label: '開源且可免費自架',
      description: '採寬鬆或 Copyleft 開源授權，本機或自架伺服器完全免費執行。',
      limitations,
    };
  }

  if (lower.includes('free tier') || lower.includes('freemium')) {
    return {
      freeType: 'free-tier',
      label: '提供免費方案 (Free Tier)',
      description: '服務提供基礎免費使用配額，高階功能需升級訂閱。',
      limitations,
    };
  }

  return {
    freeType: 'unknown',
    label: '費用或授權尚未確認',
    description: '尚未從官方專案中偵測到明確免費條款，建議查閱官方 Repository。',
    limitations,
  };
}

/**
 * 依據專案特徵評估 Windows 相容性
 */
export function estimateWindowsCompat(
  topics: string[],
  desc: string,
  readme: string = ''
): { compat: WindowsCompat; label: string } {
  const text = `${desc} ${topics.join(' ')} ${readme}`.toLowerCase();

  if (text.includes('windows support') || text.includes('windows 10') || text.includes('windows 11') || text.includes('.exe') || text.includes('.bat') || text.includes('powershell')) {
    return { compat: 'native', label: '原生支援 Windows' };
  }
  if (text.includes('wsl') || text.includes('wsl2') || text.includes('ubuntu on windows')) {
    return { compat: 'wsl2-recommended', label: '建議搭配 WSL2 執行' };
  }
  if (text.includes('docker-compose') || text.includes('dockerfile') || text.includes('docker run')) {
    return { compat: 'docker-required', label: '建議使用 Docker 容器執行' };
  }
  if (text.includes('linux only') || text.includes('macos only')) {
    return { compat: 'unsupported', label: '官方僅支援 Linux/macOS' };
  }
  return { compat: 'unknown', label: '尚未確認 Windows 支援' };
}

/**
 * 評估安裝難度
 */
export function estimateInstallDifficulty(
  readme: string,
  language: string | null
): { difficulty: 'easy' | 'medium' | 'hard' | 'unknown'; label: string } {
  const text = readme.toLowerCase();

  if (text.includes('npm install') || text.includes('pip install') || text.includes('docker run') || text.includes('one-click installer')) {
    if (text.includes('compile from source') || text.includes('cuda toolkit') || text.includes('cmake') || text.includes('c++ compiler')) {
      return { difficulty: 'hard', label: '高 (需編譯環境或 CUDA)' };
    }
    return { difficulty: 'easy', label: '低 (一行指令或安裝套件即可)' };
  }

  if (language === 'C++' || language === 'Rust' || text.includes('cmake') || text.includes('ninja')) {
    return { difficulty: 'hard', label: '高 (需原生編譯環境)' };
  }

  if (language === 'Python' || language === 'JavaScript' || language === 'TypeScript') {
    return { difficulty: 'medium', label: '中等 (需設定 Python/Node 環境)' };
  }

  return { difficulty: 'unknown', label: '未知 (需參閱官方安裝手冊)' };
}
