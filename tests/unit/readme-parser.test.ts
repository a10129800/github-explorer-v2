import { describe, it, expect } from 'vitest';
import { parseReadmeToZhExplanation } from '@/lib/enrichment/readmeParser';

describe('README Traditional Chinese Parser & Safety', () => {
  const sampleReadme = `
# Cool AI WebUI
A revolutionary tool to generate synthetic media on your workstation.

## Features
- Ultra-fast image generation
- Local model weights execution
- Windows batch script included
- Full offline capabilities

## Requirements
Requires NVIDIA CUDA GPU with minimum 8GB VRAM.

\`\`\`bash
git clone https://github.com/cool-ai/webui.git
cd webui
pip install -r requirements.txt
python run.py
\`\`\`
  `;

  it('extracts all 11 structured sections properly', () => {
    const explanation = parseReadmeToZhExplanation('cool-ai/webui', 'https://github.com/cool-ai/webui', sampleReadme, {
      description: 'Cool AI WebUI tool',
      language: 'Python',
      topics: ['ai', 'diffusion'],
      licenseSpdxId: 'Apache-2.0',
    });

    // 1. Purpose
    expect(explanation.purpose).toBeDefined();
    // 2. Fit scenarios
    expect(explanation.fitScenarios.length).toBeGreaterThan(0);
    // 3. Features
    expect(explanation.mainFeatures.length).toBeGreaterThan(0);
    // 4. Getting started
    expect(explanation.gettingStarted.length).toBeGreaterThan(0);
    // 5. Windows install
    expect(explanation.windowsInstall.steps.length).toBeGreaterThan(0);
    // 6. GPU
    expect(explanation.gpuRequirement.required).toBe(true);
    // 7. API key
    expect(explanation.apiKeyRequirement.required).toBe(false);
    // 8. License
    expect(explanation.licenseAndCost.commercialUseAllowed).toBe(true);
    // 9. Official demo
    expect(explanation.officialDemo).toBeDefined();
    // 10. Known limitations
    expect(explanation.knownLimitations.length).toBeGreaterThan(0);
    // 11. Raw readme url
    expect(explanation.rawReadmeUrl).toContain('README.md');
  });

  it('neutralizes malicious XSS script tags and javascript: links', () => {
    const malicious = '<script>alert("hack")</script>[Click](javascript:stealData())';
    const explanation = parseReadmeToZhExplanation('bad/actor', 'https://github.com/bad/actor', malicious);

    expect(explanation.purpose).not.toContain('<script>');
    expect(explanation.purpose).not.toContain('javascript:stealData');
  });
});
