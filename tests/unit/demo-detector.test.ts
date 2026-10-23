import { describe, it, expect } from 'vitest';
import { isSafePublicUrl, extractDemoFromReadme, detectRepoDemo } from '@/lib/demo/detector';

describe('Demo Detection & SSRF Prevention', () => {
  it('應該阻擋 localhost、私有 IP 與雲端 Metadata 網址 (防 SSRF)', () => {
    expect(isSafePublicUrl('http://localhost:3000')).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1:8080')).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.100')).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.1')).toBe(false);
    expect(isSafePublicUrl('ftp://example.com')).toBe(false);
  });

  it('合法的公開 HTTPS 網址應該通過驗證', () => {
    expect(isSafePublicUrl('https://my-cool-app.vercel.app')).toBe(true);
    expect(isSafePublicUrl('https://demo.example.com/play')).toBe(true);
  });

  it('應該能從 README 的 Markdown 連結中提取 Live Demo', () => {
    const readme = 'Welcome! You can try our [Live Demo](https://cool-threejs-game.io) right now.';
    const url = extractDemoFromReadme(readme, 'https://github.com/user/repo');
    expect(url).toBe('https://cool-threejs-game.io');
  });

  it('無任何展示時應回傳 verificationStatus 為 none', () => {
    const demo = detectRepoDemo(null, 'https://github.com/user/cli-tool');
    expect(demo.verificationStatus).toBe('none');
  });
});
