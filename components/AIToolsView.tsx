'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  Cpu, 
  Play, 
  Star, 
  GitFork, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AIToolItem, AICategory } from '@/lib/types';
import { AI_CATEGORY_DEFINITIONS } from '@/lib/enrichment/aiTools';

export const AIToolsView: React.FC = () => {
  const [items, setItems] = useState<AIToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 篩選狀態
  const [selectedCategory, setSelectedCategory] = useState<AICategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [noGpu, setNoGpu] = useState(false);
  const [demoOnly, setDemoOnly] = useState(false);

  const fetchAITools = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (freeOnly) params.set('freeOnly', 'true');
      if (noGpu) params.set('noGpu', 'true');
      if (demoOnly) params.set('demoOnly', 'true');

      const res = await fetch(`/api/ai-tools?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || '載入 AI 工具尋寶清單失敗');
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAITools();
  }, [selectedCategory, freeOnly, noGpu, demoOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAITools();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 標題橫幅 */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-[#0f172a] to-blue-950/60 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>開源與免費 AI 探索中心</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            免費 AI 工具尋寶
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            快速篩選文字轉影片、圖片生成、口型同步、本機 LLM 與 3D 生成等熱門開源 AI 工具。清楚標註自架免費、商業免費方案或硬體 GPU 需求。
          </p>
        </div>
      </div>

      {/* 篩選與搜尋工具列 */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        {/* 搜尋列 */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋 AI 工具名稱、關鍵字 (例如: video, flux, ollama, tts...)"
              className="w-full bg-[#131d31] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md"
          >
            搜尋
          </button>
        </form>

        {/* 分類標籤切換 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            全部類別
          </button>
          {Object.entries(AI_CATEGORY_DEFINITIONS).map(([catKey, catDef]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey as AICategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === catKey
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              {catDef.label}
            </button>
          ))}
        </div>

        {/* 快捷屬性勾選列 */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>僅顯示完全免費自架 / Free Tier</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noGpu}
              onChange={(e) => setNoGpu(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>無需獨立 GPU (一般 CPU 可跑)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={demoOnly}
              onChange={(e) => setDemoOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>具備線上免安裝 Demo</span>
          </label>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 載入狀態 */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs">正在分析 GitHub 開源 AI 專案與費用性質...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <p className="text-sm font-semibold text-slate-300">未找到符合條件的 AI 工具</p>
          <p className="text-xs">試著放寬篩選條件，或使用其他關鍵字重新搜尋</p>
        </div>
      ) : (
        /* 工具卡片列表 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((tool) => (
            <div
              key={tool.fullName}
              className="bg-[#0f172a] hover:bg-[#111c33] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {tool.categoryLabel}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      tool.freeType === 'free-selfhost'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : tool.freeType === 'free-tier'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {tool.freeTypeLabel}
                  </span>
                </div>

                <div>
                  <Link
                    href={`/repository/${tool.fullName}`}
                    className="font-bold text-sm text-white hover:text-cyan-300 hover:underline line-clamp-1"
                  >
                    {tool.fullName}
                  </Link>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                    {tool.zhPurpose}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-[#131d31] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">硬體門檻</span>
                    <span className="font-semibold text-slate-200">
                      {tool.requiresGpu ? '需獨立 GPU' : '一般 CPU 可執行'}
                    </span>
                  </div>

                  <div className="bg-[#131d31] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Windows 相容</span>
                    <span className="font-semibold text-slate-200">
                      {tool.windowsCompatLabel}
                    </span>
                  </div>
                </div>

                {tool.limitations.length > 0 && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20 line-clamp-2">
                    ⚠ {tool.limitations[0]}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    {tool.stars.toLocaleString()}
                  </span>
                  <span>{tool.licenseName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {tool.hasDemo && tool.demoUrl && (
                    <a
                      href={tool.demoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                      title="開啟 Demo"
                    >
                      <Play className="w-3.5 h-3.5 fill-cyan-400" />
                    </a>
                  )}
                  <Link
                    href={`/repository/${tool.fullName}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
                  >
                    查看詳情
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
