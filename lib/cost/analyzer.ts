import { CostAnalysisInfo } from '@/lib/types';

// 常見 OSI 認可的開放原始碼 License
const OSI_APPROVED_LICENSES: Record<string, string> = {
  'mit': 'MIT License (寬鬆、高度自由、允許商用)',
  'apache-2.0': 'Apache 2.0 (包含專利授權保護、允許商用)',
  'bsd-2-clause': 'BSD 2-Clause (極簡寬鬆開源授權)',
  'bsd-3-clause': 'BSD 3-Clause (寬鬆授權，含非背書條款)',
  'gpl-2.0': 'GNU GPL v2 (強傳染性開源授權，衍生修改須開源)',
  'gpl-3.0': 'GNU GPL v3 (防專利流氓、衍生軟體必須以同授權公開)',
  'agpl-3.0': 'GNU AGPL v3 (網路雲端服務傳染性開源授權)',
  'lgpl-3.0': 'GNU LGPL v3 (弱傳染性，允許動態連結商業軟體)',
  'mpl-2.0': 'Mozilla Public License 2.0 (檔案級弱傳染開源授權)',
  'isc': 'ISC License (類似 MIT，極度簡約)',
  'unlicense': 'The Unlicense (放棄所有版權，公有領域)',
  'cc0-1.0': 'CC0 1.0 (公有領域貢獻宣告)',
};

// 具有商業限制或非嚴格 OSI 的常見條款
const RESTRICTIVE_LICENSES: Record<string, string> = {
  'cc-by-nc-4.0': 'CC BY-NC 4.0 (非商業性授權，禁止未授權商業盈利)',
  'bsl-1.1': 'Business Source License (商業授權，期滿前非純自由開源)',
  'sspl-1.0': 'Server Side Public License (非 OSI 認證，雲端託管受限)',
};

/**
 * 分析專案開源授權與潛在費用/硬體風險
 */
export function analyzeCostAndLicense(
  licenseKey: string | null,
  readmeContent: string = '',
  description: string = '',
  topics: string[] = []
): CostAnalysisInfo {
  const notes: string[] = [];
  const normalizedKey = (licenseKey || '').toLowerCase().trim();

  // 1. 授權分析
  let isOpenSourceApproved = false;
  let licenseName = '未宣告開源授權';
  let commercialRestriction = false;

  if (normalizedKey && OSI_APPROVED_LICENSES[normalizedKey]) {
    isOpenSourceApproved = true;
    licenseName = OSI_APPROVED_LICENSES[normalizedKey];
    notes.push(`開源授權符合 OSI 標準規範 (${normalizedKey.toUpperCase()})`);
  } else if (normalizedKey && RESTRICTIVE_LICENSES[normalizedKey]) {
    licenseName = RESTRICTIVE_LICENSES[normalizedKey];
    commercialRestriction = true;
    notes.push('注意：此授權包含非商業或特許限制，商業用途需個別確認');
  } else if (normalizedKey) {
    licenseName = licenseKey || '自訂授權條款';
    notes.push('自訂或小眾授權：建議在部署前手動查閱 LICENSE 文件');
  } else {
    notes.push('尚未確認官方開源授權：專案未標註 SPDX 識別碼');
  }

  // 2. 外部 API 與付費模型依賴分析
  const content = (readmeContent + ' ' + description + ' ' + topics.join(' ')).toLowerCase();
  const requiredApiProviders: string[] = [];

  if (content.includes('openai') || content.includes('gpt-4') || content.includes('chatgpt')) {
    requiredApiProviders.push('OpenAI API (需自備 API Key，通常按量計費)');
  }
  if (content.includes('anthropic') || content.includes('claude-3')) {
    requiredApiProviders.push('Anthropic Claude API (需自備金鑰)');
  }
  if (content.includes('gemini') || content.includes('google ai studio')) {
    requiredApiProviders.push('Google Gemini API');
  }
  if (content.includes('replicate') || content.includes('fal.ai')) {
    requiredApiProviders.push('雲端推論平台 (Replicate / Fal.ai)');
  }

  const requiresExternalApi = requiredApiProviders.length > 0;
  if (requiresExternalApi) {
    notes.push('需搭配第三方外部 AI/雲端 API，使用時可能產生額外計費');
  }

  // 3. GPU / 特殊硬體需求分析
  let requiresGpu = false;
  if (
    content.includes('cuda') ||
    content.includes('nvidia') ||
    content.includes('vram') ||
    content.includes('tensorrt') ||
    content.includes('diffusion') ||
    content.includes('pytorch') && (content.includes('gpu') || content.includes('training'))
  ) {
    requiresGpu = true;
    notes.push('本機推論/運算可能需要 NVIDIA 獨立顯卡與充足顯存 (VRAM)');
  }

  // 4. 部署模式判斷
  let deploymentType: CostAnalysisInfo['deploymentType'] = 'unknown';
  if (content.includes('docker') || content.includes('docker-compose') || content.includes('self-hosted')) {
    deploymentType = 'self-hosted';
    notes.push('支援 Docker / 自行架設託管 (Self-hosted)');
  } else if (content.includes('npm install') || content.includes('pip install') || content.includes('cargo install')) {
    deploymentType = 'local-binary';
    notes.push('支援本地端安裝或終端機執行');
  } else if (content.includes('browser') || content.includes('html5') || content.includes('canvas')) {
    deploymentType = 'browser-run';
    notes.push('可在瀏覽器直接執行，零本地安裝門檻');
  }

  return {
    licenseSpdxId: licenseKey,
    licenseName,
    isOpenSourceApproved,
    deploymentType,
    requiresExternalApi,
    requiredApiProviders,
    requiresGpu,
    hasFreeDemo: false,
    commercialRestriction,
    notes,
  };
}
