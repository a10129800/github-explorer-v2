import React from 'react';
import { 
  PROGRAMMING_LANGUAGES, 
  STAR_RANGES, 
  UPDATE_TIMES, 
  CREATED_TIMES, 
  SORT_OPTIONS 
} from '../constants/categories';
import { SearchFilters } from '../types';
import { SlidersHorizontal, RotateCcw, Filter, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  filters: SearchFilters;
  onChangeFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  onResetFilters: () => void;
  totalResults?: number;
  translationNotice?: string;
}

export const FilterBar: React.FC<Props> = ({
  filters,
  onChangeFilter,
  onResetFilters,
  totalResults,
  translationNotice
}) => {
  const isFiltered = 
    filters.language !== 'all' || 
    filters.starRange !== 'any' || 
    filters.updateTime !== 'any' || 
    filters.createdTime !== 'any' ||
    filters.sort !== 'treasure';

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-md">
      {/* 頂層狀態：篩選狀態與重設 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">進階搜尋篩選器</span>
          {typeof totalResults === 'number' && (
            <span className="text-slate-500 text-[11px] ml-1">
              （找到約 <span className="font-mono text-cyan-400 font-semibold">{totalResults.toLocaleString()}</span> 個真實 GitHub 專案）
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重設篩選條件</span>
          </button>
        )}
      </div>

      {/* 控制器群組 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* 1. 程式語言 */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">程式語言</label>
          <select
            value={filters.language}
            onChange={(e) => onChangeFilter('language', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {PROGRAMMING_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* 2. Star 數量區間 */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Star 範圍</label>
          <select
            value={filters.starRange}
            onChange={(e) => onChangeFilter('starRange', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {STAR_RANGES.map((star) => (
              <option key={star.id} value={star.id}>{star.name}</option>
            ))}
          </select>
        </div>

        {/* 3. 最近更新時間 */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">活躍度 (最後代碼更新)</label>
          <select
            value={filters.updateTime}
            onChange={(e) => onChangeFilter('updateTime', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {UPDATE_TIMES.map((time) => (
              <option key={time.id} value={time.id}>{time.name}</option>
            ))}
          </select>
        </div>

        {/* 4. 建立時間 (挖掘新生專案) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">建立時間 (挖掘新星)</label>
          <select
            value={filters.createdTime}
            onChange={(e) => onChangeFilter('createdTime', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {CREATED_TIMES.map((time) => (
              <option key={time.id} value={time.id}>{time.name}</option>
            ))}
          </select>
        </div>

        {/* 5. 排序依據 */}
        <div className="space-y-1 col-span-2 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-slate-400">排序優先級</label>
            <span title="寶藏指數結合活躍度、可玩性、文件完整度與冷門潛力多維評分" className="cursor-help text-slate-500 hover:text-cyan-400">
              <HelpCircle className="w-3 h-3" />
            </span>
          </div>
          <select
            value={filters.sort}
            onChange={(e) => onChangeFilter('sort', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* 轉譯說明條 (若有) */}
      {translationNotice && (
        <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>{translationNotice}</span>
        </div>
      )}
    </div>
  );
};
