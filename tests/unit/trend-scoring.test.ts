import { describe, it, expect } from 'vitest';
import { calculateTrendScores } from '@/lib/scoring/engine';

describe('Trend Scoring Engine', () => {
  it('在缺少多個歷史快照時，成長分數應標註為 null 且理由標註資料不足', () => {
    const result = calculateTrendScores({
      stars: 500,
      forks: 50,
      openIssues: 10,
      createdAt: '2024-01-01T00:00:00Z',
      pushedAt: '2024-10-01T00:00:00Z',
      hasDemo: true,
      isDemoVerified: true,
      isOpenSourceApproved: true,
      hasLicense: true,
      snapshots: [
        { capturedAt: '2024-10-01T00:00:00Z', stars: 500, forks: 50, openIssues: 10 },
      ],
    });

    expect(result.scores.growthScore).toBeNull();
    expect(result.recentGrowth).toBeNull();
    expect(result.growthStr).toBe('尚無歷史快照資料');
    expect(result.reasons.some((r) => r.includes('資料不足'))).toBe(true);
  });

  it('在具備多個歷史快照時，應能精準計算 Star 增量與成長分數', () => {
    const result = calculateTrendScores({
      stars: 620,
      forks: 60,
      openIssues: 10,
      createdAt: '2024-01-01T00:00:00Z',
      pushedAt: new Date().toISOString(),
      hasDemo: true,
      isDemoVerified: true,
      isOpenSourceApproved: true,
      hasLicense: true,
      snapshots: [
        { capturedAt: '2024-10-01T00:00:00Z', stars: 500, forks: 50, openIssues: 10 },
        { capturedAt: '2024-10-02T00:00:00Z', stars: 620, forks: 60, openIssues: 10 },
      ],
    });

    expect(result.recentGrowth).toBe(120);
    expect(result.growthStr).toContain('+120');
    expect(result.scores.growthScore).toBeGreaterThan(0);
  });

  it('冷門但活躍且具備 Demo 的專案應享有較高的探索價值評分', () => {
    const result = calculateTrendScores({
      stars: 350, // 典型冷門寶藏範圍
      forks: 30,
      openIssues: 2,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      pushedAt: new Date().toISOString(),
      hasDemo: true,
      isDemoVerified: true,
      isOpenSourceApproved: true,
      hasLicense: true,
    });

    expect(result.scores.discoveryScore).toBeGreaterThanOrEqual(70);
    expect(result.reasons.some((r) => r.includes('冷門潛力加分'))).toBe(true);
  });
});
