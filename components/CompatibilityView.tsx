'use client';

import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Loader2,
  Terminal
} from 'lucide-react';
import { UserHardwareInput, CompatibilityEvaluationResult } from '@/lib/types';

export const CompatibilityView: React.FC = () => {
  const [targetRepo, setTargetRepo] = useState('AUTOMATIC1111/stable-diffusion-webui');
  const [hardware, setHardware] = useState<UserHardwareInput>({
    os: 'Windows 11',
    cpuArch: 'x64',
    ramGb: 16,
    gpuType: 'NVIDIA',
    vramGb: 8,
    hasWsl2: true,
    hasDocker: true,
    hasPython: true,
    hasNode: true,
    freeDiskGb: 50,
    targetIntent: 'play',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityEvaluationResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_hardware_profile');
      if (saved) {
        setHardware(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleEvaluate = async () => {
    if (!targetRepo.trim()) {
      setError('請輸入欲評估的 GitHub 專案完整名稱');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      localStorage.setItem('user_hardware_profile', JSON.stringify(hardware));

      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoFullName: targetRepo.trim(),
          hardware,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.evaluation);
      } else {
        setError(data.error || '評估失敗');
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-teal-950/60 via-[#0f172a] to-blue-950/60 border border-teal-500/30 rounded-2xl p-6 shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold">
            <Laptop className="w-3.5 h-3.5" />
            <span>硬體門檻與安裝難度預先評估</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Windows／硬體相容性評估
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            在花費數小時下載與編譯前，先為您的電腦進行環境評估。確認是否有足夠 VRAM、是否需要 WSL2、CUDA 或 Docker。
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          填寫您的電腦硬體設定 (自動儲存於瀏覽器)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">作業系統 (OS)</label>
            <select
              value={hardware.os}
              onChange={(e) => setHardware({ ...hardware, os: e.target.value as any })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value="Windows 11">Windows 11</option>
              <option value="Windows 10">Windows 10</option>
              <option value="Linux">Linux (Ubuntu / Debian)</option>
              <option value="macOS">macOS</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">顯示卡類型 (GPU)</label>
            <select
              value={hardware.gpuType}
              onChange={(e) => setHardware({ ...hardware, gpuType: e.target.value as any })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value="NVIDIA">NVIDIA (支援 CUDA)</option>
              <option value="AMD">AMD Radeon</option>
              <option value="Intel">Intel Arc / 獨立顯卡</option>
              <option value="integrated">CPU 整合內顯</option>
              <option value="none">無獨立顯示卡</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">顯示記憶體 (VRAM)</label>
            <select
              value={hardware.vramGb}
              onChange={(e) => setHardware({ ...hardware, vramGb: parseInt(e.target.value, 10) })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value={0}>0 GB (內顯/無顯卡)</option>
              <option value={4}>4 GB</option>
              <option value={6}>6 GB</option>
              <option value={8}>8 GB (主流門檻)</option>
              <option value={12}>12 GB</option>
              <option value={16}>16 GB (生成模型推薦)</option>
              <option value={24}>24 GB (RTX 3090/4090)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">系統主記憶體 (RAM)</label>
            <select
              value={hardware.ramGb}
              onChange={(e) => setHardware({ ...hardware, ramGb: parseInt(e.target.value, 10) })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value={8}>8 GB</option>
              <option value={16}>16 GB (標準)</option>
              <option value={32}>32 GB (推薦)</option>
              <option value={64}>64 GB 以上</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">可用硬碟空間</label>
            <select
              value={hardware.freeDiskGb}
              onChange={(e) => setHardware({ ...hardware, freeDiskGb: parseInt(e.target.value, 10) })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value={10}>10 GB</option>
              <option value={30}>30 GB</option>
              <option value={50}>50 GB</option>
              <option value={100}>100 GB 以上</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">主要使用目的</label>
            <select
              value={hardware.targetIntent}
              onChange={(e) => setHardware({ ...hardware, targetIntent: e.target.value as any })}
              className="w-full bg-[#131d31] text-white p-2.5 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value="play">快速試玩與體驗</option>
              <option value="develop">二開與程式開發</option>
              <option value="video-gen">AI 影片生成</option>
              <option value="image-gen">AI 圖片生成</option>
              <option value="3d">3D 模型與渲染</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hardware.hasWsl2}
              onChange={(e) => setHardware({ ...hardware, hasWsl2: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>已啟用 WSL2</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hardware.hasDocker}
              onChange={(e) => setHardware({ ...hardware, hasDocker: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>已安裝 Docker</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hardware.hasPython}
              onChange={(e) => setHardware({ ...hardware, hasPython: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>已安裝 Python 3.10+</span>
          </label>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            請輸入欲評估的 GitHub 專案名稱 (owner/repo)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetRepo}
              onChange={(e) => setTargetRepo(e.target.value)}
              placeholder="例如: AUTOMATIC1111/stable-diffusion-webui 或 ollama/ollama"
              className="flex-1 bg-[#131d31] text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700/80 font-mono focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Laptop className="w-4 h-4" />}
              <span>進行相容性分析</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${result.ratingColor}`}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  相容性綜合判定
                </span>
                <h3 className="text-base font-extrabold">{result.ratingLabel}</h3>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-black/40">
                預估難度：{result.estimatedDifficulty}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {result.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#131d31] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-300 block">判斷依據</span>
                {result.reasons.map((r, i) => (
                  <div key={i} className="text-slate-300 flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#131d31] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-300 block">可能遇到的問題與瓶頸</span>
                {result.potentialPitfalls.map((p, i) => (
                  <div key={i} className="text-slate-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  最佳安裝方式：{result.windowsInstallGuide.recommendedPath}
                </span>
                <a
                  href={result.officialDocUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  官方安裝文件 <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                {result.windowsInstallGuide.steps.map((st, i) => (
                  <div key={i} className="text-xs text-slate-300 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    {st}
                  </div>
                ))}
              </div>
            </div>

            {result.hasCpuAlternative && result.cpuAlternativeAdvice && (
              <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs text-blue-300 space-y-0.5">
                <span className="font-bold block">💡 無獨立 GPU 時的替代方案：</span>
                <p>{result.cpuAlternativeAdvice}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
