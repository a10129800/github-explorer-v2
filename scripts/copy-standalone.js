const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[Build] 正在整理 Next.js Standalone 桌面打包產物...');

const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('[Build 錯誤] 找不到 .next/standalone 目錄，請先執行 npm run build');
  process.exit(1);
}

// 1. 複製 .next/static 到 .next/standalone/.next/static
const srcStatic = path.join(rootDir, '.next', 'static');
const destStatic = path.join(standaloneDir, '.next', 'static');
console.log('[Build] 複製靜態資產: .next/static -> .next/standalone/.next/static');
copyFolderSync(srcStatic, destStatic);

// 2. 複製 public 目錄 (若存在)
const srcPublic = path.join(rootDir, 'public');
const destPublic = path.join(standaloneDir, 'public');
if (fs.existsSync(srcPublic)) {
  console.log('[Build] 複製公開資產: public -> .next/standalone/public');
  copyFolderSync(srcPublic, destPublic);
}

// 3. 複製 prisma 結構檔案
const srcPrisma = path.join(rootDir, 'prisma');
const destPrisma = path.join(standaloneDir, 'prisma');
if (fs.existsSync(srcPrisma)) {
  console.log('[Build] 複製資料庫架構: prisma -> .next/standalone/prisma');
  copyFolderSync(srcPrisma, destPrisma);
}

// 4. 複製 build 圖標資源
const srcBuild = path.join(rootDir, 'build');
const destBuild = path.join(standaloneDir, 'build');
if (fs.existsSync(srcBuild)) {
  console.log('[Build] 複製圖標資源: build -> .next/standalone/build');
  copyFolderSync(srcBuild, destBuild);
}

// 5. 確保 Prisma Query Engine 原生模組在 standalone 中齊備
const srcEngine = path.join(rootDir, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node');
const destEngineDir = path.join(standaloneDir, 'node_modules', '.prisma', 'client');
const destEngine = path.join(destEngineDir, 'query_engine-windows.dll.node');

if (fs.existsSync(srcEngine)) {
  if (!fs.existsSync(destEngineDir)) {
    fs.mkdirSync(destEngineDir, { recursive: true });
  }
  if (!fs.existsSync(destEngine) || fs.statSync(srcEngine).size !== fs.statSync(destEngine).size) {
    console.log('[Build] 同步 Prisma 原生引擎: query_engine-windows.dll.node -> standalone');
    fs.copyFileSync(srcEngine, destEngine);
  }
}

// 6. 清理 server.js 中的本機開發絕對路徑 (避免 outputFileTracingRoot 硬編碼)
const standaloneServerJs = path.join(standaloneDir, 'server.js');
if (fs.existsSync(standaloneServerJs)) {
  let content = fs.readFileSync(standaloneServerJs, 'utf8');
  // 移除硬編碼的本機開發根目錄路徑，替換為動態 __dirname 或空字串
  const escapedRoot = rootDir.replace(/\\/g, '\\\\');
  const rootRegex = new RegExp(`"outputFileTracingRoot"\\s*:\\s*"${escapedRoot}"`, 'g');
  if (rootRegex.test(content)) {
    content = content.replace(rootRegex, `"outputFileTracingRoot":""`);
    fs.writeFileSync(standaloneServerJs, content, 'utf8');
    console.log('[Build] 已消除 server.js 中之本機開發硬編碼路徑 (outputFileTracingRoot)');
  }
}

// 7. 驗證 Standalone node_modules 依賴完整性
const standaloneModules = path.join(standaloneDir, 'node_modules');
if (fs.existsSync(standaloneModules)) {
  const count = fs.readdirSync(standaloneModules).length;
  console.log(`[Build] 驗證 Standalone 模組目錄就緒，包含 ${count} 個依賴套件。`);
} else {
  console.warn('[Build 警告] Standalone 目錄下缺少 node_modules！');
}

console.log('[Build] Standalone 桌面打包資源整理完成！');

