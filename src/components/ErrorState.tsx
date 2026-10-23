import React from 'react';
import { AlertCircle, RotateCcw, KeyRound } from 'lucide-react';

interface Props {
  error: string;
  onRetry: () => void;
  onOpenTokenModal: () => void;
}

export const ErrorState: React.FC<Props> = ({ error, onRetry, onOpenTokenModal }) => {
  const isRateLimit = error.includes('API 請求次數已達上限') || error.includes('403');

  return (
    <div className="py-14 px-4 text-center max-w-lg mx-auto space-y-4">
      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border shadow-inner ${
        isRateLimit ? 'bg-amber-950/40 border-amber-500/40 text-amber-400' : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
      }`}>
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white">
          {isRateLimit ? 'GitHub API 配額限制' : '無法載入 GitHub 專案'}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          {error}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新嘗試</span>
        </button>

        {isRateLimit && (
          <button
            onClick={onOpenTokenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>立即設定 Token (解鎖 5,000 次)</span>
          </button>
        )}
      </div>
    </div>
  );
};
