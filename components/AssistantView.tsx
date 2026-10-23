'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Send, 
  Star, 
  CheckCircle, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { ResearchReportData } from '@/lib/types';

export const AssistantView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ResearchReportData | null>(null);

  const presetQueries = [
    '幫我找不用付費 API 的 AI 影片生成專案',
    '找可以在 Windows 執行的 3D 模型工具',
    '有哪些開源的互動遊戲可以直接試玩？',
    '找可以本機執行的開源大型語言模型工具',
    '推薦開源免費自架的代碼助手專案',
  ];

  const handleSearch = async (userQuestion: string) => {
    if (!userQuestion.trim()) return;
    setLoading(true);
    setError(null);
    setQuery(userQuestion);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuestion }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || '研究運算失敗');
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-950/60 via-[#0f172a] to-cyan-950/60 border border-emerald-500/30 rounded-2xl p-6 shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" />
            <span>開源技術決策顧問 • 免費規則驅動</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            AI 專案研究助手
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            以繁體中文提出技術需求，助手自動轉換為精準 GitHub 檢索語法、篩選開源候選專案、分析硬體需求與授權限制，產出有憑有據的研究報告。
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="請以中文描述您的技術研究目標 (例如: 幫我找不用付費 API 的 AI 影片生成專案...)"
            className="flex-1 bg-[#131d31] text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>開始研究</span>
          </button>
        </form>

        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold block">常見研究提問範例：</span>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((pq, i) => (
              <button
                key={i}
                onClick={() => handleSearch(pq)}
                className="text-[11px] px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs">正在分析自然語言意圖、檢索 GitHub API 並進行多維度專案評估...</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl p-5 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-emerald-300">
                模式：{report.analysisMode === 'rule-based' ? '規則式研究模式 (零付費 API)' : 'AI 摘要模式'}
              </span>
              <span>{new Date(report.createdAt).toLocaleString('zh-TW')}</span>
            </div>
            <h3 className="text-sm font-bold text-white">研究總結與首選建議</h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              {report.summaryConclusion}
            </p>
            <p className="text-[11px] font-mono text-cyan-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              套用檢索條件：{report.searchFilterApplied}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              推薦候選專案深度分析 ({report.candidates.length})
            </h3>

            <div className="space-y-3">
              {report.candidates.map((cand, idx) => (
                <div
                  key={cand.repo.fullName}
                  className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <Link
                        href={`/repository/${cand.repo.fullName}`}
                        className="font-bold text-sm text-cyan-300 hover:underline"
                      >
                        {cand.repo.fullName}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-300" />
                        {cand.repo.stars.toLocaleString()}
                      </span>
                      <span>授權: {cand.license}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{cand.purpose}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 space-y-1">
                      <span className="font-bold text-emerald-300 block mb-1">主要優勢</span>
                      {cand.pros.map((p, i) => (
                        <div key={i} className="text-slate-300 flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 space-y-1">
                      <span className="font-bold text-amber-300 block mb-1">潛在限制 / 硬體需求</span>
                      {cand.cons.map((c, i) => (
                        <div key={i} className="text-slate-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Windows: {cand.windowsCompat} | 硬體: {cand.hardwareSummary}
                    </span>
                    <Link
                      href={`/repository/${cand.repo.fullName}`}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
                    >
                      查看專案雷達
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block">數據來源與客觀性說明：</span>
            {report.uncertainties.map((u, i) => (
              <p key={i}>• {u}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
