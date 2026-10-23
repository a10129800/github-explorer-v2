'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radar, 
  Calendar, 
  Download, 
  RefreshCw, 
  Star, 
  Play, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { GeneratedDailyReport } from '@/lib/types';

export const DailyIntelView: React.FC = () => {
  const [report, setReport] = useState<GeneratedDailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-intel');
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || '載入每日情報失敗');
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-intel', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || '手動更新情報失敗');
      }
    } catch (err: any) {
      setError(err.message || '更新失敗');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-950/60 via-[#0f172a] to-cyan-950/60 border border-blue-500/30 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
              <Radar className="w-3.5 h-3.5" />
              <span>每日開源情報 (Asia/Taipei 排程鎖)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              每日開源情報雷達
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              每日自動彙整熱門趨勢、新興潛力星、開源 AI 工具與免安裝 Demo 專區。數據取自真實 GitHub API，並支援一鍵匯出 Markdown 與 JSON。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{refreshing ? '更新中...' : '手動重整'}</span>
            </button>

            {report && (
              <>
                <a
                  href="/api/daily-intel?export=md"
                  download
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </a>

                <a
                  href="/api/daily-intel?export=json"
                  download
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <span>JSON</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-xs">正在編譯當日開源專案情報報告...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                報告日期：{report.reportDate} (時區: {report.timezone})
              </span>
              <span>
                產生時間：{new Date(report.generatedAt).toLocaleTimeString('zh-TW')}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {report.summary}
            </p>
          </div>

          {report.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{section.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
                      {section.badge}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{section.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((repo) => (
                  <div
                    key={repo.fullName}
                    className="bg-[#0f172a] hover:bg-[#111d33] border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-md space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link
                          href={`/repository/${repo.fullName}`}
                          className="font-bold text-xs text-white hover:text-cyan-300 hover:underline line-clamp-1"
                        >
                          {repo.fullName}
                        </Link>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300">
                          {repo.language || '未知'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 mb-2">
                        {repo.zhSummary}
                      </p>

                      <div className="text-[10px] text-cyan-300 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 inline-block mb-1">
                        {repo.growthRateStr}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-300 font-semibold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-300" />
                          {repo.stars.toLocaleString()}
                        </span>
                        <span className="text-[11px]">🍴 {repo.forks.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {repo.demo.verificationStatus === 'verified' && repo.demo.url && (
                          <a
                            href={repo.demo.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                            title="開啟 Demo"
                          >
                            <Play className="w-3.5 h-3.5 fill-cyan-400" />
                          </a>
                        )}
                        <Link
                          href={`/repository/${repo.fullName}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
                        >
                          詳情
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
