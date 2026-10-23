import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  title = '暫無符合條件的開源專案',
  message = '嘗試調整篩選條件，或在上方搜尋欄輸入更廣泛的關鍵字。',
  onReset,
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        <SearchX className="w-7 h-7" />
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
          <span>重設所有條件</span>
        </button>
      )}
    </div>
  );
};
