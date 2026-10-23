const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const candidateSources = [
  'C:/Users/mice/.gemini/antigravity-ide/brain/b354a368-5e1d-4d90-8b2f-999dd58908c9/.user_uploaded/media_1792674509848.jpg',
  path.join(buildDir, 'icon-original.jpg'),
  path.join(rootDir, 'public', 'icon.png')
];

for (const src of candidateSources) {
  if (fs.existsSync(src)) {
    try {
      const dest = path.join(buildDir, 'icon-original.jpg');
      fs.copyFileSync(src, dest);
      console.log('[Icon] 成功整理原始圖檔素材至:', dest);
      break;
    } catch (e) {
      console.warn('[Icon] 複製圖檔略過:', e.message);
    }
  }
}
