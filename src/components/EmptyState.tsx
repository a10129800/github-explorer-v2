import React from 'react';
import { SearchX, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onReset?: () => void;
  onSuggestKeyword?: (kw: string) => void;
}

export const EmptyState: React.FC<Props> = ({
  title = '找不到相符的 GitHub 專案',
  message = '嘗試放寬篩選條件（例如調寬 Star 範圍、將程式語言設為全部），或嘗試不同的關鍵字。',
  onReset,
  onSuggestKeyword
}) => {
  const suggestions = [
    'AI video generation',
    'creative coding',
    'browser games',
    'self hosted tools',
    'text to 3D'
  ];

  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
        <SearchX className="w-8 h-8 text-slate-500" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重設所有搜尋條件</span>
        </button>
      )}

      {onSuggestKeyword && (
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="text-[11px] text-slate-500 block">試試熱門靈感關鍵字：</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestKeyword(s)}
                className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-850 hover:border-cyan-500/40 rounded-lg transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
