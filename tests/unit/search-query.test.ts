import { describe, it, expect } from 'vitest';
import { compileSearchQuery } from '@/lib/search/strategy';

describe('Search Query Compilation & Chinese Processing', () => {
  it('應該能正確處理原生英文查詢條件與語言過濾', () => {
    const result = compileSearchQuery({
      query: 'webgl shader',
      language: 'Rust',
      sortBy: 'stars',
      timeRange: 'any',
      createdRange: 'any',
    });

    expect(result.githubQuery).toContain('webgl shader');
    expect(result.githubQuery).toContain('language:Rust');
    expect(result.githubQuery).toContain('archived:false');
  });

  it('應該能將繁體中文意圖轉譯為技術關鍵字', () => {
    const result = compileSearchQuery({
      query: '我想找可以用 Python 寫的小遊戲',
      timeRange: 'any',
      createdRange: 'any',
    });

    expect(result.isChineseConverted).toBe(true);
    expect(result.githubQuery).toContain('language:Python');
    expect(result.githubQuery).toContain('browser game');
    expect(result.explanation).toContain('規則式轉譯解析');
  });

  it('在無任何輸入時，應能產生預設活躍搜尋條件', () => {
    const result = compileSearchQuery({
      timeRange: 'any',
      createdRange: 'any',
    });

    expect(result.githubQuery).toContain('stars:>100');
    expect(result.githubQuery).toContain('archived:false');
  });
});
