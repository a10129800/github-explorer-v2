import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<Props> = ({ error, onRetry }) => {
  const isRateLimit = error.includes('API 請求次數已達上限') || error.includes('403');

  return (
    <div className="py-14 px-4 text-center max-w-lg mx-auto space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white">
          {isRateLimit ? 'GitHub API 配額受限' : '無法載入資料'}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
          {error}
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新載入</span>
        </button>
      </div>
    </div>
  );
};
