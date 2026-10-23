'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GitCompare, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { ComparisonResult } from '@/lib/types';

export const CompareView: React.FC = () => {
  const [repoInputs, setRepoInputs] = useState<string[]>([
    'AUTOMATIC1111/stable-diffusion-webui',
    'Comfy-Org/ComfyUI',
  ]);
  const [newRepoInput, setNewRepoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const handleAddRepo = () => {
    const trimmed = newRepoInput.trim();
    if (!trimmed) return;
    if (repoInputs.length >= 4) {
      setError('最多只能同時比較 4 個專案');
      return;
    }
    if (repoInputs.includes(trimmed)) {
      setError('該專案已在比較清單中');
      return;
    }
    setRepoInputs([...repoInputs, trimmed]);
    setNewRepoInput('');
    setError(null);
  };

  const handleRemoveRepo = (index: number) => {
    const updated = repoInputs.filter((_, i) => i !== index);
    setRepoInputs(updated);
  };

  const handleRunComparison = async () => {
    if (repoInputs.length < 2) {
      setError('請至少保留 2 個專案進行比較');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos: repoInputs }),
      });
      const data = await res.json();
      if (data.success) {
        setComparisonResult(data.comparison);
      } else {
        setError(data.error || '專案比較失敗');
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  const loadPresetPair = (pair: string[]) => {
    setRepoInputs(pair);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-purple-950/60 via-[#0f172a] to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold">
            <GitCompare className="w-3.5 h-3.5" />
            <span>開源專案多維度決策比較</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            同類專案比較器
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            將 2～4 個 GitHub 專案放在同一畫面，對比 Stars、授權、Windows 相容性、GPU 門檻、安裝難度與免費自架條件。
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            目前比較的專案 ({repoInputs.length}/4)
          </span>

          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span>推薦範例：</span>
            <button
              onClick={() => loadPresetPair(['AUTOMATIC1111/stable-diffusion-webui', 'Comfy-Org/ComfyUI'])}
              className="text-cyan-400 hover:underline"
            >
              SD-WebUI vs ComfyUI
            </button>
            <span>•</span>
            <button
              onClick={() => loadPresetPair(['ollama/ollama', 'ggerganov/llama.cpp'])}
              className="text-cyan-400 hover:underline"
            >
              Ollama vs Llama.cpp
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {repoInputs.map((repo, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-[#131d31] px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-mono text-cyan-300"
            >
              <span>{repo}</span>
              <button
                onClick={() => handleRemoveRepo(idx)}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="移除"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {repoInputs.length < 4 && (
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newRepoInput}
              onChange={(e) => setNewRepoInput(e.target.value)}
              placeholder="輸入 GitHub 完整專案名 (例如: facebook/react)"
              className="flex-1 bg-[#131d31] text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-purple-500 font-mono"
            />
            <button
              onClick={handleAddRepo}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> 加入專案
            </button>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunComparison}
            disabled={loading || repoInputs.length < 2}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
            {loading ? '正在分析專案指標...' : '開始多維度比較'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {comparisonResult && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              情境推薦建議
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {comparisonResult.recommendations.map((rec, i) => (
                <div key={i} className="bg-[#131d31] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-300 block">{rec.useCase}</span>
                  <div className="text-xs font-mono font-bold text-cyan-300">{rec.recommendedRepoFullName}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#131d31] border-b border-slate-800 text-slate-300">
                    <th className="p-3.5 w-40 font-semibold">比較維度</th>
                    {comparisonResult.repos.map((r) => (
                      <th key={r.id} className="p-3.5 font-bold text-white min-w-[180px]">
                        <Link href={`/repository/${r.fullName}`} className="text-cyan-300 hover:underline">
                          {r.fullName}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {comparisonResult.dimensions.map((dim) => (
                    <tr key={dim.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3.5 font-medium text-slate-400 bg-slate-900/40">
                        {dim.name}
                      </td>
                      {comparisonResult.repos.map((r) => {
                        const val = dim.values[r.id];
                        const isBest = dim.highlightBestId === r.id;
                        return (
                          <td key={r.id} className={`p-3.5 text-slate-200 ${isBest ? 'font-bold text-amber-300' : ''}`}>
                            {typeof val === 'number' ? val.toLocaleString() : String(val ?? '未知')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
