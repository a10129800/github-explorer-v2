'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RadarRepoItem, TrendProfile } from '@/lib/types';
import { DemoStatusBadge } from './DemoStatusBadge';
import { CostLicenseBadge } from './CostLicenseBadge';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Bookmark, 
  Copy, 
  Check, 
  Play, 
  Flame, 
  Sparkles, 
  Rocket, 
  Gem, 
  Clock, 
  SearchCode,
  ShieldAlert,
  HelpCircle,
  GitCompare
} from 'lucide-react';

interface Props {
  repo: RadarRepoItem;
  isFavorite?: boolean;
  onToggleFavorite?: (repo: RadarRepoItem) => void;
  onFindSimilar?: (repo: RadarRepoItem) => void;
}

const PROFILE_CONFIG: Record<TrendProfile, { label: string; color: string; icon: React.ReactNode }> = {
  'fast-rising': {
    label: '快速崛起',
    color: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
    icon: <Rocket className="w-3 h-3 text-emerald-400" />
  },
  'emerging-potential': {
    label: '新興潛力',
    color: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300',
    icon: <Sparkles className="w-3 h-3 text-cyan-400" />
  },
  'playable-demo': {
    label: '在線可玩',
    color: 'bg-blue-950/70 border-blue-500/50 text-blue-300',
    icon: <Play className="w-3 h-3 text-blue-400" />
  },
  'hidden-gem': {
    label: '冷門寶藏',
    color: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
    icon: <Gem className="w-3 h-3 text-amber-400" />
  },
  'active-maintenance': {
    label: '維護活躍',
    color: 'bg-purple-950/70 border-purple-500/50 text-purple-300',
    icon: <Clock className="w-3 h-3 text-purple-400" />
  },
  'hot-stable': {
    label: '熱門主流',
    color: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
    icon: <Flame className="w-3 h-3 text-rose-400" />
  }
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-400',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-emerald-400',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-400',
  'C++': 'bg-pink-500',
  Java: 'bg-amber-600',
  Shell: 'bg-lime-400',
  Dart: 'bg-teal-400'
};

export const RepoCard: React.FC<Props> = ({
  repo,
  isFavorite = false,
  onToggleFavorite,
  onFindSimilar
}) => {
  const [copied, setCopied] = useState(false);
  const profileInfo = PROFILE_CONFIG[repo.trendProfile] || PROFILE_CONFIG['hot-stable'];

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(repo.htmlUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRelativeTime = (dateStr: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今天更新';
    if (diffDays === 1) return '昨天更新';
    if (diffDays < 30) return `${diffDays} 天前更新`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前更新`;
    return `${Math.floor(diffDays / 365)} 年前更新`;
  };

  return (
    <div className="bg-[#0f172a]/90 hover:bg-[#131d31] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-radar-glow group relative">
      <div>
        {/* 頂部第一行：作者/組織 + 趨勢徽章 + 收藏按鈕 */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <span className="truncate hover:underline" title={repo.ownerLogin}>{repo.ownerLogin}</span>
            <span className="text-slate-600">/</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 趨勢型別徽章 */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${profileInfo.color}`}>
              {profileInfo.icon}
              <span>{profileInfo.label}</span>
            </span>

            {/* 收藏按鈕 */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite(repo);
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isFavorite 
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
                title={isFavorite ? '取消收藏' : '加入收藏'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* 頂部第二行：專案名稱（獨佔整行寬度，支援換行，完整顯示不被截斷） */}
        <div className="mb-2.5 min-h-[44px] flex items-center">
          <Link 
            href={`/repository/${repo.fullName}`}
            className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug break-words line-clamp-2"
            title={repo.name}
          >
            {repo.name}
          </Link>
        </div>

        {/* 實測數據條：Star、增量狀態、探索價值 */}
        <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Star 總數</span>
              </span>
              <span className="font-mono font-bold text-amber-300">{repo.stars.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={repo.growthRateStr}>
              {repo.recentStarGrowth !== null ? (
                <span className="text-emerald-400 font-semibold">{repo.growthRateStr}</span>
              ) : (
                <span className="text-slate-500 italic">無歷史快照</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>探索價值</span>
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {repo.scoreBreakdown.discoveryScore} / 100
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full"
                style={{ width: `${repo.scoreBreakdown.discoveryScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* 專案原始描述 */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2.5">
          {repo.description || '（此專案作者未填寫英文簡述）'}
        </p>

        {/* Demo 狀態與費用授權標籤 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <DemoStatusBadge demo={repo.demo} />
          <CostLicenseBadge cost={repo.cost} />
        </div>

        {/* Topics 標籤 */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {repo.topics.slice(0, 3).map((topic, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-md border border-slate-700/50"
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 3 && (
              <span className="text-[10px] text-slate-500 px-1 py-0.5">+{repo.topics.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* 底部數據與操作按鈕 */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          {repo.language && (
            <div className="flex items-center gap-1 text-slate-300 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${LANG_COLORS[repo.language] || 'bg-slate-500'}`} />
              <span>{repo.language}</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400">{getRelativeTime(repo.pushedAt)}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* 線上 Demo 試玩按鈕 (若存在且非 none) */}
          {repo.demo.verificationStatus !== 'none' && repo.demo.url && (
            <a
              href={repo.demo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 transition-colors"
              title={`開啟線上體驗：${repo.demo.url}`}
            >
              <Play className="w-3.5 h-3.5 fill-blue-400" />
            </a>
          )}

          {/* 尋找類似專案 */}
          {onFindSimilar && (
            <button
              onClick={() => onFindSimilar(repo)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              title="尋找類似開源專案"
            >
              <SearchCode className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 加入專案比較 */}
          <Link
            href={`/compare?repo=${encodeURIComponent(repo.fullName)}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
            title="加入專案比較器"
          >
            <GitCompare className="w-3.5 h-3.5" />
          </Link>

          {/* 複製連結 */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title={copied ? '已複製！' : '複製 GitHub 網址'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* 開啟 GitHub 官方網頁 */}
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="在 GitHub 原站開啟"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
