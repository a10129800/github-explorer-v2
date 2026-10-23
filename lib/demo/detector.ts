import { DemoLinkInfo, DemoVerificationStatus, DemoCategory } from '@/lib/types';

// 常見危險私有 IP 與雲端 Metadata 網段
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.169\.254$/, // 雲端 Metadata
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
];

// 排除常見的非 Demo 網址（例如單純的社群連結、贊助、發行版平台等）
const NON_DEMO_DOMAINS = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'discord.gg',
  'discord.com',
  'patreon.com',
  'buymeacoffee.com',
  'opencollective.com',
  'npmjs.com',
  'pypi.org',
  'crates.io',
  'packagist.org',
  'hub.docker.com',
];

/**
 * 安全檢驗 URL：防範 SSRF、私有網路探測與雲端 Metadata 攻擊
 */
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // 1. 僅允許 http 與 https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    // 2. 檢查 Host 是否符合私有網路模式
    const hostname = url.hostname.toLowerCase();
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // 3. 排除預設端口外的異常連接埠（例如防止探測 22, 3306, 6379 等）
    if (url.port && url.port !== '80' && url.port !== '443') {
      const portNum = parseInt(url.port, 10);
      if (portNum < 80 || (portNum > 443 && portNum < 3000) || portNum > 9000) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 檢查是否為文件型網址而非互動 Demo
 */
export function isDocsUrl(urlStr: string): boolean {
  const lower = urlStr.toLowerCase();
  return (
    lower.includes('/docs') ||
    lower.includes('/documentation') ||
    lower.includes('docs.') ||
    lower.includes('gitbook.io') ||
    lower.includes('readthedocs.io') ||
    lower.includes('docusaurus') ||
    lower.includes('wiki')
  );
}

/**
 * 自 README 文字中解析出潛在的 Live Demo 或展示網址
 */
export function extractDemoFromReadme(readmeContent: string, repoFullName: string): string | null {
  if (!readmeContent) return null;

  // 常見 Demo 標籤模式：[Live Demo](https://...) 或 [Try it online](https://...)
  const markdownLinkRegex = /\[([^\]]*?(?:demo|live|try\s+it|online|preview|playground|experience|試玩|在線)[^\]]*?)\]\((https?:\/\/[^\s\)]+)\)/gi;
  let match;
  while ((match = markdownLinkRegex.exec(readmeContent)) !== null) {
    const targetUrl = match[2];
    if (isSafePublicUrl(targetUrl)) {
      const domain = new URL(targetUrl).hostname.toLowerCase();
      // 確保不是指向此 repo 自身的 github.com 網址
      if (!NON_DEMO_DOMAINS.includes(domain) || targetUrl.includes('.github.io')) {
        return targetUrl;
      }
    }
  }

  return null;
}

/**
 * 完整分析並判斷專案的 Demo 狀態與優先連結
 */
export function detectRepoDemo(
  homepage: string | null,
  htmlUrl: string,
  hasPages?: boolean,
  readmeContent?: string
): DemoLinkInfo {
  // 1. 優先檢查 Homepage
  if (homepage && homepage.trim()) {
    const trimmed = homepage.trim();
    if (isSafePublicUrl(trimmed)) {
      try {
        const domain = new URL(trimmed).hostname.toLowerCase();
        if (!NON_DEMO_DOMAINS.includes(domain)) {
          const isDoc = isDocsUrl(trimmed);
          return {
            url: trimmed,
            source: 'homepage',
            category: isDoc ? 'docs' : 'web-app',
            verificationStatus: isDoc ? 'docs-only' : 'unverified',
            title: isDoc ? '官方文件 / 說明網站' : '官方線上展示 / Demo',
          };
        }
      } catch {}
    }
  }

  // 2. 檢查 GitHub Pages (https://<owner>.github.io/<repo>)
  if (hasPages && htmlUrl) {
    try {
      const parts = htmlUrl.replace('https://github.com/', '').split('/');
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1];
        const pagesUrl = `https://${owner.toLowerCase()}.github.io/${repo.toLowerCase()}`;
        if (isSafePublicUrl(pagesUrl)) {
          return {
            url: pagesUrl,
            source: 'github-pages',
            category: 'interactive',
            verificationStatus: 'unverified',
            title: 'GitHub Pages 線上展示',
          };
        }
      }
    } catch {}
  }

  // 3. 檢查 README 中的展示連結
  if (readmeContent) {
    const extracted = extractDemoFromReadme(readmeContent, htmlUrl);
    if (extracted && isSafePublicUrl(extracted)) {
      const isDoc = isDocsUrl(extracted);
      return {
        url: extracted,
        source: 'readme',
        category: isDoc ? 'docs' : 'interactive',
        verificationStatus: isDoc ? 'docs-only' : 'unverified',
        title: isDoc ? '文件說明連結' : 'README 提煉之線上體驗連結',
      };
    }
  }

  // 4. 無找到 Demo
  return {
    url: '',
    source: 'homepage',
    category: 'unknown',
    verificationStatus: 'none',
    title: '暫無線上可操作 Demo',
  };
}
