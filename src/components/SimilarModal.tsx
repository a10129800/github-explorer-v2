import React, { useState, useEffect } from 'react';
import { GithubRepo } from '../types';
import { getSimilarRepos } from '../services/githubApi';
import { RepoCard } from './RepoCard';
import { X, SearchCode, Loader2, Sparkles } from 'lucide-react';

interface Props {
  sourceRepo: GithubRepo | null;
  onClose: () => void;
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (repo: GithubRepo) => void;
  onOpenDetails: (repo: GithubRepo) => void;
  onSelectTopic: (topic: string) => void;
  onFindSimilar: (repo: GithubRepo) => void;
}

export const SimilarModal: React.FC<Props> = ({
  sourceRepo,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onSelectTopic,
  onFindSimilar
}) => {
  const [loading, setLoading] = useState(false);
  const [similarRepos, setSimilarRepos] = useState<GithubRepo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceRepo) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    getSimilarRepos(sourceRepo, 10)
      .then((items) => {
        if (!isMounted) return;
        setSimilarRepos(items);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || '搜尋類似專案時發生錯誤');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sourceRepo]);

  if (!sourceRepo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-cyan-400">
              <SearchCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">類似專案推薦</h3>
                <span className="text-xs text-slate-400">（種子：{sourceRepo.full_name}）</span>
              </div>
              <p className="text-xs text-slate-400">
                依據主要語言「{sourceRepo.language || '通用'}」與核心標籤自動比對出 10 個相似開源替代品或關聯項目
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區塊 */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm">正在深度比對 GitHub 尋找相似專案...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-sm bg-rose-950/20 border border-rose-900/40 rounded-xl p-4">
              {error}
            </div>
          ) : similarRepos.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              暫無找到足夠相似的開源專案，建議嘗試更換 Topics 或放寬條件。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isFavorite={isFavorite(repo.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={(r) => {
                    onClose();
                    onOpenDetails(r);
                  }}
                  onFindSimilar={(r) => {
                    onFindSimilar(r);
                  }}
                  onSelectTopic={(t) => {
                    onClose();
                    onSelectTopic(t);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
