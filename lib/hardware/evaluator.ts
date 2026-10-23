import { RadarRepoItem } from '@/lib/types';

export interface UserHardwareInput {
  os: 'Windows 10' | 'Windows 11' | 'Linux' | 'macOS' | 'other';
  cpuArch: 'x64' | 'ARM64' | 'unknown';
  ramGb: number;
  gpuType: 'NVIDIA' | 'AMD' | 'Intel' | 'integrated' | 'none' | 'unknown';
  vramGb: number;
  hasWsl2: boolean;
  hasDocker: boolean;
  hasPython: boolean;
  hasNode: boolean;
  freeDiskGb: number;
  targetIntent: 'play' | 'develop' | 'video-gen' | 'image-gen' | '3d' | 'games';
}

export type CompatibilityRating =
  | 'ready'              // 可直接使用
  | 'compatible-tweaks'  // 大致相容，但可能需要設定
  | 'extra-hardware'     // 需要額外環境或硬體
  | 'unsupported'        // 可能無法執行
  | 'insufficient-data'; // 資料不足，無法判定

export interface CompatibilityEvaluationResult {
  rating: CompatibilityRating;
  ratingLabel: string;
  ratingColor: string; // Tailwind class
  summary: string;
  reasons: string[];
  potentialPitfalls: string[];
  minRequirements: {
    os: string;
    ram: string;
    gpu: string;
    vram: string;
    disk: string;
  };
  recommendedRequirements: {
    os: string;
    ram: string;
    gpu: string;
    vram: string;
    disk: string;
  };
  windowsInstallGuide: {
    recommendedPath: 'Windows 原生執行' | 'WSL2 (Ubuntu 容器)' | 'Docker 容器' | '雲端 / Demo 免安裝';
    steps: string[];
    needsCuda: boolean;
    needsWsl2: boolean;
    needsDocker: boolean;
  };
  hasCpuAlternative: boolean;
  cpuAlternativeAdvice?: string;
  estimatedDifficulty: '低 (容易)' | '中等' | '偏高' | '極高';
  officialDocUrl: string;
}

/**
 * 依據專案特徵與使用者硬體輸入進行精準相容性評估
 */
export function evaluateHardwareCompatibility(
  repo: RadarRepoItem,
  hw: UserHardwareInput
): CompatibilityEvaluationResult {
  const isGpuNeeded = repo.cost.requiresGpu;
  const isWindows = hw.os === 'Windows 10' || hw.os === 'Windows 11';
  const hasNvidia = hw.gpuType === 'NVIDIA';

  const reasons: string[] = [];
  const pitfalls: string[] = [];

  // 1. 判斷評估層級 (Rating)
  let rating: CompatibilityRating = 'ready';
  let ratingLabel = '可直接使用';
  let ratingColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';

  if (isGpuNeeded) {
    if (!hasNvidia || hw.vramGb < 4) {
      rating = 'extra-hardware';
      ratingLabel = '需要額外環境或硬體';
      ratingColor = 'text-amber-400 bg-amber-950/40 border-amber-500/40';
      reasons.push('專案包含高強度神經網路或深度學習運算，官方生態強烈建議具備 NVIDIA CUDA 顯卡與至少 6GB~8GB VRAM。');
      pitfalls.push('無獨立 NVIDIA 顯卡時，純 CPU 推理速度將大幅下降（可能慢 10~50 倍）或因記憶體不足報錯 (Out of Memory)。');
    } else {
      reasons.push(`您具備 NVIDIA 獨立顯卡 (${hw.vramGb}GB VRAM)，符合基礎推理運算需求。`);
    }
  } else {
    reasons.push('此專案不強制要求獨立 GPU，一般現代 CPU 與整合顯示晶片即可運行。');
  }

  // 記憶體檢查
  if (hw.ramGb < 8) {
    if (rating === 'ready') rating = 'compatible-tweaks';
    reasons.push(`目前系統記憶體為 ${hw.ramGb}GB，低於許多大型專案預設的 16GB 建議量。`);
    pitfalls.push('編譯或載入較大模型時，系統可能遭遇虛擬記憶體劇烈置換導致卡頓。');
  } else {
    reasons.push(`系統記憶體為 ${hw.ramGb}GB，符合標準運作需求。`);
  }

  // Windows 生態與執行路徑
  let recommendedPath: 'Windows 原生執行' | 'WSL2 (Ubuntu 容器)' | 'Docker 容器' | '雲端 / Demo 免安裝' = 'Windows 原生執行';
  let needsWsl2 = false;
  let needsDocker = false;

  if (repo.language === 'Python' && isGpuNeeded) {
    if (hw.hasWsl2) {
      recommendedPath = 'WSL2 (Ubuntu 容器)';
      needsWsl2 = true;
      reasons.push('已啟用 WSL2，建議於 WSL Linux 環境內執行 Python 與 PyTorch，可避免 Windows 下編譯依賴或 C++ runtime 缺失之問題。');
    } else {
      recommendedPath = 'Windows 原生執行';
      pitfalls.push('未安裝 WSL2，若在 Windows 原生安裝 Python 需特別留意 Visual Studio C++ Build Tools 與 CUDA Toolkit 安裝。');
    }
  } else if (repo.language === 'TypeScript' || repo.language === 'JavaScript') {
    recommendedPath = 'Windows 原生執行';
    reasons.push('Node.js / Web 生態在 Windows 10/11 上享有極佳原生支援，無須複雜虛擬化設定。');
  }

  // 整理步驟
  const steps: string[] = [];
  if (recommendedPath === 'WSL2 (Ubuntu 容器)') {
    steps.push('1. 開啟 Windows 終端機 (PowerShell)，輸入 `wsl` 進入 Ubuntu 環境');
    steps.push(`2. 複製專案原始碼：\`git clone ${repo.htmlUrl}.git\``);
    steps.push('3. 建立並啟用 Python 虛擬環境：`python3 -m venv venv && source venv/bin/activate`');
    steps.push('4. 安裝依賴：`pip install -r requirements.txt` (若有 CUDA 建議安裝 torch+cu121)');
    steps.push('5. 依照官方文件指令啟動服務');
  } else {
    steps.push(`1. 複製專案：\`git clone ${repo.htmlUrl}.git\``);
    steps.push('2. 開啟 PowerShell 進入專案根目錄');
    if (repo.language === 'TypeScript' || repo.language === 'JavaScript') {
      steps.push('3. 安裝依賴套件：`npm install`');
      steps.push('4. 啟動本機伺服器：`npm run dev`');
    } else if (repo.language === 'Python') {
      steps.push('3. 建立虛擬環境：`python -m venv venv` 並執行 `.\\venv\\Scripts\\activate`');
      steps.push('4. 安裝依賴：`pip install -r requirements.txt`');
      steps.push('5. 執行主程式：`python main.py` 或參閱 README 啟動指令');
    } else {
      steps.push('3. 參閱官方 Release 下載適用於 Windows 之二進位執行檔 (.exe)');
    }
  }

  // 規格推估 (誠實標註)
  const minRequirements = {
    os: 'Windows 10 64-bit / Linux',
    ram: isGpuNeeded ? '12 GB' : '4 GB',
    gpu: isGpuNeeded ? 'NVIDIA 支援 CUDA 顯示卡' : '整合式顯示晶片即可',
    vram: isGpuNeeded ? '4 GB (部分模型需 6GB+)' : '無硬性要求',
    disk: '5 GB 可用空間',
  };

  const recommendedRequirements = {
    os: 'Windows 11 64-bit (啟用 WSL2)',
    ram: isGpuNeeded ? '32 GB' : '16 GB',
    gpu: isGpuNeeded ? 'NVIDIA RTX 3060 / 4060 以上' : '主流 CPU 內顯或獨立顯卡',
    vram: isGpuNeeded ? '12 GB ~ 16 GB' : '不拘',
    disk: '30 GB SSD 高速固態硬碟',
  };

  let estimatedDifficulty: '低 (容易)' | '中等' | '偏高' | '極高' = '中等';
  if (repo.demo.verificationStatus === 'verified') estimatedDifficulty = '低 (容易)';
  else if (isGpuNeeded && !hasNvidia) estimatedDifficulty = '極高';
  else if (isGpuNeeded) estimatedDifficulty = '偏高';

  return {
    rating,
    ratingLabel,
    ratingColor,
    summary: `針對您目前的硬體配置 (${hw.os}, ${hw.gpuType} ${hw.vramGb}GB VRAM, ${hw.ramGb}GB RAM)：${ratingLabel}。${reasons[0]}`,
    reasons,
    potentialPitfalls: pitfalls.length > 0 ? pitfalls : ['無顯著硬體相容性瓶頸，可依照標準指引進行安裝'],
    minRequirements,
    recommendedRequirements,
    windowsInstallGuide: {
      recommendedPath,
      steps,
      needsCuda: isGpuNeeded,
      needsWsl2,
      needsDocker,
    },
    hasCpuAlternative: isGpuNeeded,
    cpuAlternativeAdvice: isGpuNeeded
      ? '若無獨立 NVIDIA 顯卡，可嘗試透過 llama.cpp / GGUF 量化版本以 CPU+RAM 運行，或直接體驗免安裝線上官方 Demo。'
      : undefined,
    estimatedDifficulty,
    officialDocUrl: `${repo.htmlUrl}#readme`,
  };
}
