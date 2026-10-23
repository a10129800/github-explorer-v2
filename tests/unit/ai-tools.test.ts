import { describe, it, expect } from 'vitest';
import {
  classifyAICategory,
  determineFreeType,
  estimateWindowsCompat,
  estimateInstallDifficulty,
} from '@/lib/enrichment/aiTools';

describe('AI Tools Classification & Free Nature Engine', () => {
  it('correctly classifies text-to-video category', () => {
    const category = classifyAICategory(['text-to-video', 't2v'], 'A state of the art video generation model', 'CogVideoX');
    expect(category).toBe('text-to-video');
  });

  it('correctly classifies local-llm category', () => {
    const category = classifyAICategory(['llm', 'ollama'], 'Run large language models locally', 'ollama');
    expect(category).toBe('local-llm');
  });

  it('distinguishes free-selfhost with MIT license and no external API required', () => {
    const result = determineFreeType('MIT', 'Completely open source offline diffusion webui');
    expect(result.freeType).toBe('free-selfhost');
    expect(result.label).toContain('開源且可免費自架');
  });

  it('identifies open-source-costly when external API key or heavy GPU is required', () => {
    const result = determineFreeType(null, 'Requires OPENAI_API_KEY to run and NVIDIA CUDA GPU with 16GB VRAM');
    expect(result.freeType).toBe('open-source-costly');
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it('identifies native Windows compatibility from batch/powershell/windows keywords', () => {
    const result = estimateWindowsCompat(['windows'], 'Includes run.bat for Windows 10/11');
    expect(result.compat).toBe('native');
  });

  it('recommends WSL2 when linux only or WSL is mentioned', () => {
    const result = estimateWindowsCompat([], 'Tested on Ubuntu; on Windows use WSL2');
    expect(result.compat).toBe('wsl2-recommended');
  });

  it('evaluates install difficulty correctly', () => {
    const easy = estimateInstallDifficulty('npm install and npm run dev', 'TypeScript');
    expect(easy.difficulty).toBe('easy');

    const hard = estimateInstallDifficulty('Requires compile from source with cmake and CUDA toolkit', 'C++');
    expect(hard.difficulty).toBe('hard');
  });
});
