import { describe, it, expect } from 'vitest';
import { compareRepositories } from '@/lib/compare/comparator';
import { RadarRepoItem } from '@/lib/types';

describe('Repository Comparator Engine', () => {
  const mockRepoA: RadarRepoItem = {
    id: '1',
    githubId: 101,
    fullName: 'test/repo-a',
    ownerLogin: 'test',
    name: 'repo-a',
    description: 'A frontend web app',
    zhSummary: '前端 Web 應用',
    homepage: 'https://demo.repo-a.org',
    htmlUrl: 'https://github.com/test/repo-a',
    language: 'TypeScript',
    stars: 12000,
    forks: 1500,
    openIssues: 50,
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    pushedAt: '2026-10-20T00:00:00Z',
    licenseSpdxId: 'MIT',
    topics: ['web', 'frontend'],
    archived: false,
    fetchedAt: '2026-10-22T00:00:00Z',
    recentStarGrowth: 50,
    growthRateStr: '+50 今日',
    trendProfile: 'playable-demo',
    scoreBreakdown: {
      popularityScore: 85,
      growthScore: 80,
      freshnessScore: 90,
      maintenanceScore: 95,
      demoScore: 100,
      openSourceScore: 100,
      discoveryScore: 92,
    },
    scoreReasons: ['具有已驗證 Demo', 'MIT 授權'],
    demo: {
      url: 'https://demo.repo-a.org',
      source: 'homepage',
      category: 'web-app',
      verificationStatus: 'verified',
    },
    cost: {
      licenseSpdxId: 'MIT',
      licenseName: 'MIT License',
      isOpenSourceApproved: true,
      deploymentType: 'self-hosted',
      requiresExternalApi: false,
      requiredApiProviders: [],
      requiresGpu: false,
      hasFreeDemo: true,
      commercialRestriction: false,
      notes: [],
    },
  };

  const mockRepoB: RadarRepoItem = {
    ...mockRepoA,
    id: '2',
    githubId: 102,
    fullName: 'test/repo-b',
    name: 'repo-b',
    stars: 3500,
    language: 'Python',
    licenseSpdxId: 'Apache-2.0',
    demo: {
      url: '',
      source: 'readme',
      category: 'unknown',
      verificationStatus: 'none',
    },
    cost: {
      ...mockRepoA.cost,
      requiresGpu: true,
    },
  };

  it('compares 2 repositories and produces structured dimensions', () => {
    const result = compareRepositories([mockRepoA, mockRepoB]);

    expect(result.repos.length).toBe(2);
    expect(result.dimensions.length).toBeGreaterThan(5);

    const starsDim = result.dimensions.find((d) => d.id === 'stars');
    expect(starsDim).toBeDefined();
    expect(starsDim?.highlightBestId).toBe('1'); // repoA has 12000 stars
  });

  it('rejects comparison with fewer than 2 repos', () => {
    expect(() => compareRepositories([mockRepoA])).toThrow('比較器至少需要 2 個專案');
  });

  it('generates tailored recommendation scenarios', () => {
    const result = compareRepositories([mockRepoA, mockRepoB]);
    expect(result.recommendations.length).toBeGreaterThan(0);
    // Verified demo candidate should be recommended for quick test
    const demoRec = result.recommendations.find((r) => r.useCase.includes('免安裝試玩'));
    expect(demoRec?.recommendedRepoFullName).toBe('test/repo-a');
  });
});
