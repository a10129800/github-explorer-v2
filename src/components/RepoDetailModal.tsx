import React, { useState, useEffect } from 'react';
import { GithubRepo, RepoAnalysis } from '../types';
import { getRepoReadme, getRepoReleases, analyzeRepoUsage } from '../services/githubApi';
import { calculateTreasureMetrics } from '../services/scorer';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  Copy, 
  Check, 
  Star, 
  GitFork, 
  Calendar, 
  FileText, 
  Sparkles, 
  Flame, 
  ShieldAlert, 
  Terminal, 
  Globe, 
  Tag, 
  Scale, 
  HelpCircle,
  SearchCode,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

interface Props {
  repo: GithubRepo | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (repo: GithubRepo) => void;
  onFindSimilar: (repo: GithubRepo) => void;
}

export const RepoDetailModal: React.FC<Props> = ({
  repo,
  onClose,
  isFavorite,
  onToggleFavorite,
  onFindSimilar
}) => {
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState<string>('');
  const [releases, setReleases] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFullReadme, setShowFullReadme] = useState(false);

  useEffect(() => {
    if (!repo) {
      setReadme('');
      setReleases([]);
      setAnalysis(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      getRepoReadme(repo.owner.login, repo.name),
      getRepoReleases(repo.owner.login, repo.name)
    ]).then(([readmeContent, releaseList]) => {
      if (!isMounted) return;
      setReadme(readmeContent);
      setReleases(releaseList);
      const parsedAnalysis = analyzeRepoUsage(repo, readmeContent);
      setAnalysis(parsedAnalysis);
      setLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [repo]);

  if (!repo) return null;

  const metrics = calculateTreasureMetrics(repo);

  const handleCopy = () => {
    navigator.clipboard.writeText(repo.html_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* 點擊背景關閉 */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={repo.owner.avatar_url} 
              alt={repo.owner.login} 
              className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">
                {repo.owner.login} /
              </span>
              <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">
                <span>{repo.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${metrics.badge.color}`}>
                  {metrics.badge.label}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(repo)}
              className={`p-2 rounded-xl transition-colors ${
                isFavorite 
                  ? 'bg-amber-950/60 border border-amber-500/50 text-amber-400' 
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isFavorite ? '取消收藏' : '加入收藏'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
              title="複製 GitHub 連結"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              title="在 GitHub 開啟"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal 內部捲動區域 */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 1. 專案用途與繁體中文摘要 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>專案用途與中文解讀</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              {repo.description || '該專案未在 GitHub 標頭填寫描述。'}
            </p>
            {analysis?.isAiRelated && (
              <div className="text-xs text-purple-300 bg-purple-950/40 border border-purple-500/30 rounded-lg p-2.5 mt-2">
                🤖 經分析此專案與人工智慧 / 機器學習領域緊密相關。
              </div>
            )}
          </div>

          {/* 2. 核心指標與雙軌評分解讀 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 熱門度 vs 探索價值雙軌 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>雙軌推薦評分系統</span>
                <span className="text-[10px] text-slate-500">透明規則 • 拒絕假數據</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> 熱門主流指數
                    </span>
                    <span className="font-mono font-bold text-rose-300">{metrics.popularityScore} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-full" style={{ width: `${metrics.popularityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 寶藏探索價值
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{metrics.treasureScore} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full" style={{ width: `${metrics.treasureScore}%` }} />
                  </div>
                </div>
              </div>

              {/* 可解釋評分依據 */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">系統評估依據：</span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {metrics.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-400">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 專案關鍵屬性 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-semibold text-slate-300 block mb-2">專案規格與現狀</span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">Star 數量</span>
                  <span className="text-amber-300 font-mono font-bold text-sm">
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">Fork 復刻</span>
                  <span className="text-slate-200 font-mono font-bold text-sm">
                    {repo.forks_count.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">主要程式語言</span>
                  <span className="text-cyan-300 font-semibold text-sm">
                    {repo.language || '尚未標示'}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">開源授權 License</span>
                  <span className="text-slate-200 font-semibold text-sm truncate block" title={repo.license?.name || '無'}>
                    {repo.license?.spdx_id || repo.license?.name || '未宣告授權'}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">最後更新日期</span>
                  <span className="text-slate-200 font-mono text-xs">
                    {new Date(repo.pushed_at || repo.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">建立日期</span>
                  <span className="text-slate-200 font-mono text-xs">
                    {new Date(repo.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Demo 連結 */}
              {repo.homepage && repo.homepage.startsWith('http') && (
                <div className="pt-2">
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 border border-blue-500/30 rounded-xl transition-colors font-medium text-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>前往線上 Demo / 官網體驗</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 3. 使用難度評估與額外需求警示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 難度評估 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>使用難度評估</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  analysis?.difficultyEstimate === '入門友善' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
                  analysis?.difficultyEstimate === '進階專業' ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' :
                  'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                }`}>
                  {analysis?.difficultyEstimate || '評估中...'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {analysis?.difficultyEstimate === '入門友善' && '文件清晰，適合初學者直接開箱試玩'}
                  {analysis?.difficultyEstimate === '進階專業' && '需要較複雜的底層環境（如 CUDA / 編譯鏈）'}
                  {analysis?.difficultyEstimate === '中等難度' && '標準開發者專案，具備基本指令即可安裝'}
                  {analysis?.difficultyEstimate === '尚未確認' && '缺乏詳細說明或 README 資訊不足'}
                </span>
              </div>
            </div>

            {/* 額外 Key / 資源需求提示 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>可能需要的額外 API Key 或硬體</span>
              </div>
              {analysis?.requiresExtraKeys || (analysis?.possibleRequirements && analysis.possibleRequirements.length > 0) ? (
                <ul className="text-xs text-amber-200/90 space-y-1">
                  {analysis.possibleRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-amber-400">⚠️</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  初步未偵測到需要額外第三方收費 API Key 或特殊 GPU 環境（依官方最新 README 為準）。
                </p>
              )}
            </div>
          </div>

          {/* 4. 安裝指引程式碼片段 (若從 README 萃取出) */}
          {analysis && analysis.installSteps.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>快速安裝 / 執行範例（自 README 提取）</span>
              </div>
              <div className="space-y-2">
                {analysis.installSteps.map((step, idx) => (
                  <pre key={idx} className="bg-black/60 border border-slate-800 p-3 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                    <code>{step}</code>
                  </pre>
                ))}
              </div>
            </div>
          )}

          {/* 5. Topics 標籤清單 */}
          {repo.topics && repo.topics.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-2">專案標籤 (Topics)：</span>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs bg-slate-800/80 text-cyan-300 border border-slate-700/60 rounded-lg">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6. README 預覽檢視器 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>原始 README.md 內容預覽</span>
              </div>
              <a
                href={`${repo.html_url}#readme`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>在 GitHub 查看完整原始檔</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">正在讀取 README...</div>
            ) : (
              <div className="relative">
                <div className={`text-xs text-slate-300 font-mono whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-slate-800/80 overflow-x-auto ${showFullReadme ? '' : 'max-h-60 overflow-hidden'}`}>
                  {readme || '此專案未提供 README 檔案。'}
                </div>

                {readme && readme.length > 300 && (
                  <div className={`pt-2 flex justify-center ${showFullReadme ? '' : 'absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-slate-900 to-transparent flex items-end'}`}>
                    <button
                      onClick={() => setShowFullReadme(!showFullReadme)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 rounded-xl shadow-md transition-colors"
                    >
                      {showFullReadme ? '收合 README' : '展開完整 README'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部操作：再找十個類似專案 */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                onClose();
                onFindSimilar(repo);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
            >
              <SearchCode className="w-4 h-4" />
              <span>以本專案為種子，再找 10 個類似開源專案</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
