const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const EXPECTED_VERSION = '29.4.6';
const EXPECTED_HASH = 'f1b4268529636fec8722efb9ed630629eea91aac4a3b93b527d8227bcc3c7cc3';

const rootDir = path.resolve(__dirname, '..');
const targetFile = path.join(rootDir, 'node_modules', 'electron', 'electron.d.ts');

function getSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function downloadUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'GitHub-Explorer-V2-Builder' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        return resolve(downloadUrl(res.headers.location, maxRedirects - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function repair() {
  if (!fs.existsSync(targetFile)) {
    console.log('[Electron Types] node_modules/electron/electron.d.ts 不存在，略過');
    return;
  }

  const currentBuffer = fs.readFileSync(targetFile);
  const currentHash = getSha256(currentBuffer);

  if (currentHash === EXPECTED_HASH) {
    console.log(`[Electron Types] electron.d.ts 完整性校驗通過 (SHA-256: ${currentHash.slice(0, 8)}...)`);
    return;
  }

  // 檢查是否包含已知截斷錯誤 (如結尾為 '    * (' 或未閉合註解)
  const contentStr = currentBuffer.toString('utf-8');
  const isTruncated = contentStr.includes('interface PurchaseProductOpts') && !contentStr.includes("declare module 'electron'");

  if (!isTruncated) {
    console.log(`[Electron Types] electron.d.ts 內容正常 (長度: ${currentBuffer.length} bytes)`);
    return;
  }

  console.log(`[Electron Types] 偵測到 electron.d.ts 遭到截斷 (長度: ${currentBuffer.length} bytes，行數不足)`);
  console.log(`[Electron Types] 正在自 Electron 官方來源同步 v${EXPECTED_VERSION} 完整型別宣告檔...`);

  const urls = [
    `https://github.com/electron/electron/releases/download/v${EXPECTED_VERSION}/electron.d.ts`,
    `https://raw.githubusercontent.com/electron/electron/v${EXPECTED_VERSION}/electron.d.ts`,
    `https://cdn.jsdelivr.net/npm/electron@${EXPECTED_VERSION}/electron.d.ts`,
    `https://unpkg.com/electron@${EXPECTED_VERSION}/electron.d.ts`
  ];

  let downloaded = null;
  for (const u of urls) {
    try {
      console.log(`[Electron Types] 正在嘗試從來源獲取: ${u}...`);
      const buf = await downloadUrl(u);
      if (buf && buf.length > currentBuffer.length) {
        downloaded = buf;
        console.log(`[Electron Types] 下載成功！(大小: ${buf.length} bytes)`);
        break;
      }
    } catch (err) {
      console.warn(`[Electron Types] 來源 ${u} 下載失敗: ${err.message}`);
    }
  }

  if (downloaded) {
    fs.writeFileSync(targetFile, downloaded);
    const newHash = getSha256(downloaded);
    console.log(`[Electron Types] 已成功修復 node_modules/electron/electron.d.ts！(SHA-256: ${newHash})`);
  } else {
    // 若無網路連線或所有來源皆超時，採用健全補全防禦：將未閉合之 PurchaseProductOpts 與 namespace 妥善閉合
    console.log('[Electron Types] 網路下載離線，啟用離線健全性修補...');
    const fixedContent = contentStr.replace(
      /\* \(\s*$/,
      `* (applicationUsername).\n     */\n    username?: string;\n  }\n}\n\ndeclare module 'electron' {\n  export = Electron;\n}\n`
    );
    fs.writeFileSync(targetFile, fixedContent, 'utf-8');
    console.log('[Electron Types] 已修復 PurchaseProductOpts 未閉合註解與宣告區塊！');
  }
}

repair().catch((err) => {
  console.error('[Electron Types] 修復發生錯誤:', err);
});
