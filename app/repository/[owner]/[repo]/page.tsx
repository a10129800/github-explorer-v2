'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { DemoStatusBadge } from '@/components/DemoStatusBadge';
import { CostLicenseBadge } from '@/components/CostLicenseBadge';
import { TrendingChart } from '@/components/TrendingChart';
import { ReadmeExplainer } from '@/components/ReadmeExplainer';
import { SimilarReposSection } from '@/components/SimilarReposSection';
import { DemoModal } from '@/components/DemoModal';
import { RadarRepoItem } from '@/lib/types';
import { StructuredExplanation } from '@/lib/enrichment/readmeParser';
import { SimilarRepoRecommendation } from '@/lib/recommend/similarity';
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Bookmark, 
  Copy, 
  Check, 
  Star, 
  GitFork, 
  AlertCircle, 
  Terminal, 
  BookOpen, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Clock, 
  SearchCode,
  Tag,
  GitCompare,
  Laptop
} from 'lucide-react';

export default function RepositoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    repository: RadarRepoItem;
    readme: string;
    releases: any[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullReadme, setShowFullReadme] = useState(false);

  // V2 新增狀態
  const [explanation, setExplanation] = useState<StructuredExplanation | null>(null);
  const [similarRepos, setSimilarRepos] = useState<SimilarRepoRecommendation[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    if (!owner || !repo) return;
    setLoading(true);

    fetch(`/api/repositories/${owner}/${repo}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `無法取得 Repository [${res.status}]`);
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);

        // 非同步讀取 README 繁體中文結構化解說
        fetch(`/api/repositories/${owner}/${repo}/explain`)
          .then((r) => r.json())
          .then((expData) => {
            if (expData.success) {
              setExplanation(expData.explanation);
            }
          })
          .catch(() => {});

        // 非同步讀取相似專案推薦
        setLoadingSimilar(true);
        fetch(`/api/repositories/${owner}/${repo}/similar?limit=4`)
          .then((r) => r.json())
          .then((simData) => {
            if (simData.success) {
              setSimilarRepos(simData.similar || []);
            }
          })
          .catch(() => {})
          .finally(() => setLoadingSimilar(false));
      })
      .catch((err) => {
        setError(err.message || '載入失敗');
        setLoading(false);
      });
  }, [owner, repo]);

  const handleCopy = () => {
    if (!data?.repository) return;
    navigator.clipboard.writeText(data.repository.htmlUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (!data?.repository) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: data.repository.fullName }),
        });
      } else {
        await fetch(`/api/favorites/${encodeURIComponent(data.repository.id)}`, { method: 'DELETE' });
      }
    } catch {
      setIsFavorite(!next);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6 animate-pulse">
          <div className="w-32 h-6 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-900 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-slate-900 rounded-2xl" />
            <div className="h-40 bg-slate-900 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-bold text-white">無法載入專案詳情</h2>
          <p className="text-xs text-slate-400">{error || '專案不存在或已被移除'}</p>
          <Link href="/" className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-cyan-300">
            返回首頁雷達
          </Link>
        </div>
      </div>
    );
  }

  const { repository, readme, releases } = data;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8">
        
        {/* 返回導航與快捷動作 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回開源雷達首頁</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* 加入專案比較按鈕 */}
            <Link
              href={`/compare?repo=${encodeURIComponent(repository.fullName)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>加入專案比較</span>
            </Link>

            {/* 硬體相容性評估按鈕 */}
            <Link
              href={`/compatibility`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>相容性評估</span>
            </Link>

            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                isFavorite 
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFavorite ? '已在收藏清單' : '收藏專案'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="複製 GitHub 連結"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={repository.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-md transition-all"
            >
              <span>GitHub 原站</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 頂層資訊大卡片 */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block font-mono">{repository.ownerLogin} /</span>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{repository.name}</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DemoStatusBadge demo={repository.demo} />
              <CostLicenseBadge cost={repository.cost} />
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {repository.description || '該專案未在 GitHub 標頭填寫英文簡介。'}
          </p>

          {/* 線上 Demo 直達按鈕 (觸發安全 Demo 彈窗) */}
          <div className="pt-2">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>
                {repository.demo.url ? 'Demo 一鍵試玩體驗' : '檢視 Demo 狀態與安裝說明'}
              </span>
            </button>
          </div>

          {/* Topics */}
          {repository.topics && repository.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {repository.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs bg-slate-800/80 text-cyan-300 border border-slate-700/60 rounded-lg"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* V2 功能四：README 繁體中文結構化解說 */}
        {explanation && (
          <ReadmeExplainer
            explanation={explanation}
            rawReadmeSnippet={readme}
          />
        )}

        {/* 核心雙欄：趨勢快照折線圖 vs 指標評分細節 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 快照軌跡圖 */}
          <div className="space-y-4">
            <TrendingChart
              snapshots={repository.snapshots}
              currentStars={repository.stars}
            />

            {/* 規格表格 */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <span className="font-semibold text-slate-300 block mb-2">專案基本規格</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#131d31] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">主要程式語言</span>
                  <span className="text-cyan-300 font-semibold">{repository.language || '未標註'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131d31] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Fork 數量</span>
                  <span className="text-slate-200 font-mono font-semibold">{repository.forks.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131d31] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">最近推送代碼</span>
                  <span className="text-slate-200 font-mono">{new Date(repository.pushedAt).toLocaleDateString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131d31] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">專案創立時間</span>
                  <span className="text-slate-200 font-mono">{new Date(repository.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 推薦評分細部指標 */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>開源雷達 7 維度評分分析</span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                探索價值: {repository.scoreBreakdown.discoveryScore} / 100
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">🔥 受歡迎度 (Popularity)</span>
                  <span className="font-mono">{repository.scoreBreakdown.popularityScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${repository.scoreBreakdown.popularityScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">⚡ 維護活動 (Maintenance)</span>
                  <span className="font-mono">{repository.scoreBreakdown.maintenanceScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${repository.scoreBreakdown.maintenanceScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">🌱 專案新鮮度 (Freshness)</span>
                  <span className="font-mono">{repository.scoreBreakdown.freshnessScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${repository.scoreBreakdown.freshnessScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">🎮 體驗便利性 (Demo)</span>
                  <span className="font-mono">{repository.scoreBreakdown.demoScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${repository.scoreBreakdown.demoScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">📜 開源完整度 (Open Source)</span>
                  <span className="font-mono">{repository.scoreBreakdown.openSourceScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${repository.scoreBreakdown.openSourceScore}%` }} />
                </div>
              </div>
            </div>

            {/* 可解釋理由 */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium block">評分主要依據：</span>
              <ul className="text-xs text-slate-300 space-y-1">
                {repository.scoreReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-400">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* V2 功能七：相似專案推薦 */}
        <SimilarReposSection
          similarItems={similarRepos}
          loading={loadingSimilar}
        />

        {/* Demo 彈窗 */}
        <DemoModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          repoFullName={repository.fullName}
          demoInfo={repository.demo}
          htmlUrl={repository.htmlUrl}
        />
      </main>
    </div>
  );
}
