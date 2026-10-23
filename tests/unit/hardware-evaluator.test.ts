import { describe, it, expect } from 'vitest';
import { evaluateHardwareCompatibility, UserHardwareInput } from '@/lib/hardware/evaluator';
import { RadarRepoItem } from '@/lib/types';

describe('Hardware Compatibility Evaluator', () => {
  const gpuHeavyRepo: RadarRepoItem = {
    id: 'test-gpu',
    githubId: 999,
    fullName: 'ai/heavy-diffusion',
    ownerLogin: 'ai',
    name: 'heavy-diffusion',
    description: 'Requires CUDA with 16GB VRAM',
    zhSummary: '需要高階顯卡之圖像生成模型',
    homepage: null,
    htmlUrl: 'https://github.com/ai/heavy-diffusion',
    language: 'Python',
    stars: 20000,
    forks: 3000,
    openIssues: 100,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2026-10-22T00:00:00Z',
    pushedAt: '2026-10-22T00:00:00Z',
    licenseSpdxId: 'Apache-2.0',
    topics: ['ai', 'cuda', 'diffusion'],
    archived: false,
    fetchedAt: '2026-10-22T00:00:00Z',
    recentStarGrowth: null,
    growthRateStr: '正在累積歷史資料',
    trendProfile: 'fast-rising',
    scoreBreakdown: {
      popularityScore: 90,
      growthScore: null,
      freshnessScore: 85,
      maintenanceScore: 90,
      demoScore: 0,
      openSourceScore: 100,
      discoveryScore: 88,
    },
    scoreReasons: ['熱門專案'],
    demo: {
      url: '',
      source: 'readme',
      category: 'unknown',
      verificationStatus: 'none',
    },
    cost: {
      licenseSpdxId: 'Apache-2.0',
      licenseName: 'Apache License 2.0',
      isOpenSourceApproved: true,
      deploymentType: 'self-hosted',
      requiresExternalApi: false,
      requiredApiProviders: [],
      requiresGpu: true,
      hasFreeDemo: false,
      commercialRestriction: false,
      notes: [],
    },
  };

  it('marks ready when user has sufficient NVIDIA GPU and WSL2', () => {
    const hw: UserHardwareInput = {
      os: 'Windows 11',
      cpuArch: 'x64',
      ramGb: 32,
      gpuType: 'NVIDIA',
      vramGb: 16,
      hasWsl2: true,
      hasDocker: true,
      hasPython: true,
      hasNode: true,
      freeDiskGb: 100,
      targetIntent: 'image-gen',
    };

    const result = evaluateHardwareCompatibility(gpuHeavyRepo, hw);
    expect(result.rating).toBe('ready');
    expect(result.windowsInstallGuide.recommendedPath).toBe('WSL2 (Ubuntu 容器)');
  });

  it('flags extra-hardware needed when user lacks NVIDIA GPU for CUDA repo', () => {
    const hwNoGpu: UserHardwareInput = {
      os: 'Windows 11',
      cpuArch: 'x64',
      ramGb: 16,
      gpuType: 'integrated',
      vramGb: 0,
      hasWsl2: false,
      hasDocker: false,
      hasPython: true,
      hasNode: true,
      freeDiskGb: 50,
      targetIntent: 'image-gen',
    };

    const result = evaluateHardwareCompatibility(gpuHeavyRepo, hwNoGpu);
    expect(result.rating).toBe('extra-hardware');
    expect(result.hasCpuAlternative).toBe(true);
    expect(result.cpuAlternativeAdvice).toBeDefined();
  });
});
