import { describe, it, expect } from 'vitest';
import { analyzeCostAndLicense } from '@/lib/cost/analyzer';

describe('License & Cost Analysis', () => {
  it('MIT License 應被辨識為標準 OSI 開源', () => {
    const cost = analyzeCostAndLicense('mit');
    expect(cost.isOpenSourceApproved).toBe(true);
    expect(cost.licenseName).toContain('MIT');
    expect(cost.commercialRestriction).toBe(false);
  });

  it('未提供 License 時應標示未確認開源授權', () => {
    const cost = analyzeCostAndLicense(null);
    expect(cost.isOpenSourceApproved).toBe(false);
    expect(cost.licenseName).toBe('未宣告開源授權');
    expect(cost.notes.some((n) => n.includes('尚未確認官方開源授權'))).toBe(true);
  });

  it('應能正確偵測 OpenAI 與 GPU 依賴', () => {
    const readme = 'This project uses OpenAI GPT-4 api_key and requires NVIDIA CUDA for diffusion.';
    const cost = analyzeCostAndLicense('apache-2.0', readme);
    expect(cost.requiresExternalApi).toBe(true);
    expect(cost.requiredApiProviders.some((p) => p.includes('OpenAI'))).toBe(true);
    expect(cost.requiresGpu).toBe(true);
  });
});
