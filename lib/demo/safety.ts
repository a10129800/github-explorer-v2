import dns from 'dns';
import { promisify } from 'util';

const lookupAsync = promisify(dns.lookup);

export interface UrlCheckResult {
  isSafe: boolean;
  status: 'verified' | 'found_unverified' | 'check_failed' | 'unsafe';
  reason?: string;
  statusCode?: number;
  finalUrl?: string;
}

/**
 * 檢查是否為私有、迴路或雲端 Metadata IP (SSRF 防禦)
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:')) {
    return true;
  }

  // IPv4 檢查
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // 格式異常直接判定不安全
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 0.0.0.0/8
  if (a === 0) return true;

  // 10.0.0.0/8 (Private Network)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private Network)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private Network)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link Local / Cloud Metadata e.g. AWS 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

/**
 * 伺服器端安全探測 Demo 網址 (防範 SSRF、逾時、過大回應與危險協定)
 */
export async function verifyDemoUrlSafely(rawUrl: string): Promise<UrlCheckResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isSafe: false, status: 'unsafe', reason: '網址為空或無效' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isSafe: false, status: 'unsafe', reason: '無法解析的 URL 格式' };
  }

  // 1. 協定檢查：只允許 HTTP 與 HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isSafe: false,
      status: 'unsafe',
      reason: `不支援的通訊協定 (${parsed.protocol})，僅允許 http:// 或 https://`,
    };
  }

  // 2. 主機名稱檢查：阻擋 localhost 或明顯內網名
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { isSafe: false, status: 'unsafe', reason: '阻擋連線至本地端或內部網路主機' };
  }

  // 3. DNS 解析檢查防範 DNS Rebinding / 內網 IP
  try {
    const { address } = await lookupAsync(hostname);
    if (isPrivateOrReservedIp(address)) {
      return {
        isSafe: false,
        status: 'unsafe',
        reason: `目標主機解析為私有或保留 IP 位址 (${address})，已觸發安全攔截`,
      };
    }
  } catch (err) {
    // DNS 無法解析不代表 Demo 不存在，但無法完成伺服器驗證
    return {
      isSafe: true,
      status: 'found_unverified',
      reason: 'DNS 暫時無法解析目標主機，保留連結但標記未驗證',
    };
  }

  // 4. 伺服器端輕量探測 (HEAD 請求、5 秒逾時、不下載大檔)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(rawUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DemoVerifier/2.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (res.status >= 200 && res.status < 400) {
      return {
        isSafe: true,
        status: 'verified',
        statusCode: res.status,
        finalUrl: res.url,
      };
    }

    return {
      isSafe: true,
      status: 'found_unverified',
      statusCode: res.status,
      reason: `伺服器回應狀態碼 ${res.status}，可能需要授權或特定瀏覽器端載入`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      isSafe: true,
      status: 'check_failed',
      reason: err.name === 'AbortError' ? '連線逾時 (5s)' : '連線失敗或目標伺服器阻擋自動探測',
    };
  }
}
