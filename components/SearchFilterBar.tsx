'use client';

import React from 'react';
import { SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';
import { SearchFilters } from '@/lib/types';

interface Props {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onReset: () => void;
  queryExplained?: string;
}

const LANGUAGES = [
  { id: 'all', name: '全部語言' },
  { id: 'TypeScript', name: 'TypeScript' },
  { id: 'JavaScript', name: 'JavaScript' },
  { id: 'Python', name: 'Python' },
  { id: 'Rust', name: 'Rust' },
  { id: 'Go', name: 'Go' },
  { id: 'C++', name: 'C++' },
  { id: 'C', name: 'C' },
  { id: 'C#', name: 'C#' },
  { id: 'Java', name: 'Java' },
  { id: 'Dart', name: 'Dart' },
  { id: 'Swift', name: 'Swift' },
];

export const SearchFilterBar: React.FC<Props> = ({
  filters,
  onFilterChange,
  onReset,
  queryExplained,
}) => {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-200">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wide">開源多維篩選與排序</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重設條件</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* 程式語言 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 block">程式語言</label>
          <select
            value={filters.language || 'all'}
            onChange={(e) => onFilterChange({ ...filters, language: e.target.value, page: 1 })}
            className="w-full bg-[#131d31] border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id} className="bg-[#0f172a] text-slate-100 py-1.5">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* 排序模式 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 block">排序優先權</label>
          <select
            value={filters.sortBy || 'stars'}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any, page: 1 })}
            className="w-full bg-[#131d31] border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value="discovery" className="bg-[#0f172a] text-cyan-300 py-1.5">🔮 探索推薦指數 (高探索價值)</option>
            <option value="stars" className="bg-[#0f172a] text-amber-300 py-1.5">⭐ Star 總數 (由高至低)</option>
            <option value="updated" className="bg-[#0f172a] text-purple-300 py-1.5">⚡ 最近更新活躍</option>
            <option value="forks" className="bg-[#0f172a] text-blue-300 py-1.5">🍴 Fork 復刻熱度</option>
          </select>
        </div>

        {/* 最近活躍時間 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 block">最後推送時間</label>
          <select
            value={filters.timeRange || 'any'}
            onChange={(e) => onFilterChange({ ...filters, timeRange: e.target.value as any, page: 1 })}
            className="w-full bg-[#131d31] border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value="any" className="bg-[#0f172a] text-slate-100 py-1.5">不限活躍時間</option>
            <option value="today" className="bg-[#0f172a] text-slate-100 py-1.5">近 24 小時內</option>
            <option value="week" className="bg-[#0f172a] text-slate-100 py-1.5">近 7 天內</option>
            <option value="month" className="bg-[#0f172a] text-slate-100 py-1.5">近 30 天內</option>
            <option value="year" className="bg-[#0f172a] text-slate-100 py-1.5">近 1 年內</option>
          </select>
        </div>

        {/* 偏好勾選 */}
        <div className="space-y-1.5 flex flex-col justify-end pb-2">
          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none bg-[#131d31] border border-slate-700 rounded-xl px-3 py-2 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={Boolean(filters.demoOnly)}
              onChange={(e) => onFilterChange({ ...filters, demoOnly: e.target.checked, page: 1 })}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
            />
            <span className="font-medium text-slate-200">僅限有 Demo 專案</span>
          </label>
        </div>
      </div>

      {queryExplained && (
        <div className="text-xs text-slate-300 bg-black/40 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{queryExplained}</span>
        </div>
      )}
    </div>
  );
};
