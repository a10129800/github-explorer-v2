'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Star, GitFork, ExternalLink, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { SimilarRepoRecommendation } from '@/lib/recommend/similarity';

interface Props {
  similarItems: SimilarRepoRecommendation[];
  loading?: boolean;
}

export const SimilarReposSection: React.FC<Props> = ({ similarItems, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-800/60 rounded-xl animate-pulse" />
          <div className="h-32 bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (similarItems.length === 0) {
    return (
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm">目前資料庫與搜尋結果中，尚未找到高重疊之同類專案。</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              相似專案推薦與替代方案
            </h3>
            <p className="text-xs text-slate-400">
              依據 Topics 標籤、功能用途、技術生態多維度比對，發掘同領域的值得關注之開源專案
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarItems.map((item) => {
          const repo = item.repo;
          return (
            <div
              key={repo.fullName}
              className="bg-[#131d31]/80 hover:bg-[#152238] border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    href={`/repository/${repo.fullName}`}
                    className="font-bold text-sm text-cyan-300 hover:text-cyan-200 hover:underline line-clamp-1"
                  >
                    {repo.fullName}
                  </Link>

                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                    {item.similarityLevel} ({item.similarityScore}%)
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                  {repo.zhSummary || repo.description || '（專案未提供說明）'}
                </p>

                {/* 相似原因 */}
                <div className="space-y-1 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 block">相似原因：</span>
                  {item.similarityReasons.slice(0, 2).map((r, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="text-purple-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* 主要差異 */}
                {item.keyDifferences.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 block">主要差異：</span>
                    {item.keyDifferences.slice(0, 1).map((d, i) => (
                      <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部數據與進入按鈕 */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    {repo.stars.toLocaleString()}
                  </span>
                  <span>{repo.language || '未知'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/repository/${repo.fullName}`}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    查看詳情 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
