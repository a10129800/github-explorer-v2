import React, { useState } from 'react';
import { GithubRepo } from '../types';
import { calculateTreasureMetrics } from '../services/scorer';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Bookmark, 
  Copy, 
  Check, 
  Sparkles, 
  Flame, 
  Clock, 
  SearchCode,
  Globe,
  Crown,
  Rocket,
  Play,
  Wrench
} from 'lucide-react';

interface Props {
  repo: GithubRepo;
  isFavorite: boolean;
  onToggleFavorite: (repo: GithubRepo) => void;
  onOpenDetails: (repo: GithubRepo) => void;
  onFindSimilar: (repo: GithubRepo) => void;
  onSelectTopic: (topic: string) => void;
}

// 常用語言色彩點
const LANG_COLORS: Record<string, string> = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python: 'bg-emerald-400',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-400',
  'C++': 'bg-pink-500',
  C: 'bg-slate-400',
  'C#': 'bg-purple-500',
  Java: 'bg-amber-600',
  PHP: 'bg-indigo-400',
  Ruby: 'bg-red-500',
  Swift: 'bg-rose-400',
  Kotlin: 'bg-violet-400',
  Dart: 'bg-teal-400',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-600',
  Shell: 'bg-lime-500'
};

export const RepoCard: React.FC<Props> = ({
  repo,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onFindSimilar,
  onSelectTopic
}) => {
  const [copied, setCopied] = useState(false);
  const metrics = calculateTreasureMetrics(repo);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(repo.html_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    const days = Math.floor(diff / 86400);
    if (days === 0) return '今天更新';
    if (days === 1) return '昨天更新';
    if (days < 30) return `${days} 天前更新`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 個月前更新`;
    return `${Math.floor(months / 12)} 年前更新`;
  };

  return (
    <div 
      onClick={() => onOpenDetails(repo)}
      className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative group transition-all"
    >
      <div>
        {/* 頂部：作者頭像 + 專案名稱 + 徽章 + 收藏按鈕 */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={repo.owner.avatar_url} 
              alt={repo.owner.login} 
              className="w-8 h-8 rounded-full border border-slate-700/80 bg-slate-800 flex-shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block truncate hover:underline" onClick={(e) => {
                e.stopPropagation();
                window.open(repo.owner.html_url, '_blank');
              }}>
                {repo.owner.login}
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                {repo.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(repo);
              }}
              title={isFavorite ? '取消收藏' : '加入收藏'}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-amber-400 bg-amber-950/50 hover:bg-amber-900/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 雙軌評分指標條：熱門度 vs 探索價值 */}
        <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px]">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>熱門度</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{metrics.popularityScore}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.popularityScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>探索價值</span>
              </span>
              <span className="font-mono font-bold text-cyan-300">{metrics.treasureScore}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.treasureScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* 徽章與狀態標籤 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${metrics.badge.color}`}>
            {metrics.badge.label}
          </span>

          {metrics.hasDemo && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-950/50 border border-blue-500/30 px-2 py-0.5 rounded-full">
              <Globe className="w-2.5 h-2.5" />
              Demo
            </span>
          )}

          {repo.license && (
            <span className="text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 rounded">
              {repo.license.spdx_id || repo.license.name}
            </span>
          )}
        </div>

        {/* 專案簡介 */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
          {repo.description || '（此專案作者未填寫公開簡述）'}
        </p>

        {/* Topics 標籤 (最多顯示 4 個) */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {repo.topics.slice(0, 4).map((topic, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTopic(topic);
                }}
                className="text-[10px] px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 rounded-md border border-slate-700/50 transition-colors"
              >
                #{topic}
              </button>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] text-slate-500 px-1 py-0.5">
                +{repo.topics.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部數據與操作按鈕 */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
        <div className="flex items-center gap-3">
          {/* 語言 */}
          {repo.language && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${LANG_COLORS[repo.language] || 'bg-slate-500'}`} />
              <span className="text-[11px]">{repo.language}</span>
            </div>
          )}

          {/* Star 數 */}
          <div className="flex items-center gap-1 text-amber-300 font-mono font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{formatNumber(repo.stargazers_count)}</span>
          </div>

          {/* Fork 數 */}
          <div className="flex items-center gap-1 text-slate-400 font-mono hidden sm:flex">
            <GitFork className="w-3.5 h-3.5" />
            <span>{formatNumber(repo.forks_count)}</span>
          </div>
        </div>

        {/* 操作按鈕群 */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* 再找 10 個類似專案 */}
          <button
            onClick={() => onFindSimilar(repo)}
            title="再找 10 個類似專案"
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <SearchCode className="w-3.5 h-3.5" />
          </button>

          {/* 複製連結 */}
          <button
            onClick={handleCopyLink}
            title={copied ? '已複製！' : '複製 GitHub 網址'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* 開啟 GitHub 原站 */}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title="在 GitHub 開啟"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
