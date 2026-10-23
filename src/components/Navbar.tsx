import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Bookmark, 
  Dices, 
  History, 
  KeyRound, 
  Menu, 
  X,
  Compass,
  ArrowRight,
  Languages
} from 'lucide-react';
import { translateChineseQuery } from '../services/translator';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onRandomExplore: () => void;
  onToggleFavorites: () => void;
  showFavoritesOnly: boolean;
  favoritesCount: number;
  searchHistory: string[];
  onSelectHistory: (term: string) => void;
  onClearHistory: () => void;
  onOpenTokenModal: () => void;
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export const Navbar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onRandomExplore,
  onToggleFavorites,
  showFavoritesOnly,
  favoritesCount,
  searchHistory,
  onSelectHistory,
  onClearHistory,
  onOpenTokenModal,
  onToggleMobileSidebar,
  isMobileSidebarOpen
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 中文即時分析預覽
  const translation = translateChineseQuery(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistoryDropdown(false);
    onSearchSubmit(searchQuery);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* 左側：漢堡選單 (手機) + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="開啟分類清單"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href="#" onClick={(e) => { e.preventDefault(); onSearchSubmit(''); }} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-glow-sm">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  GitHub Explorer
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">開源專案與冷門寶藏探索器</p>
            </div>
          </a>
        </div>

        {/* 中間：智慧搜尋框 */}
        <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setShowHistoryDropdown(true)}
                placeholder="以繁體中文或英文搜尋（例如：文字轉語音、網頁遊戲、creative coding...）"
                className="w-full pl-10 pr-24 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
              >
                <span>探索</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* 中文轉譯即時預覽條 */}
          {translation.isTranslated && translation.finalQuery && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 p-2 bg-slate-900 border border-cyan-500/30 rounded-lg shadow-xl text-xs flex items-center justify-between gap-2 z-50">
              <div className="flex items-center gap-1.5 text-cyan-300 truncate">
                <Languages className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-slate-400">已轉換為 GitHub 語法：</span>
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-200 truncate">
                  {translation.finalQuery}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0 hidden md:inline">
                {translation.explanation}
              </span>
            </div>
          )}

          {/* 搜尋歷史下拉選單 */}
          {showHistoryDropdown && searchHistory.length > 0 && !searchQuery && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400 border-b border-slate-800 mb-1">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> 最近搜尋記錄
                </span>
                <button
                  onClick={onClearHistory}
                  className="text-slate-500 hover:text-rose-400 text-[11px] transition-colors"
                >
                  清除記錄
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchHistory.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectHistory(item);
                      setShowHistoryDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-300 flex items-center justify-between group transition-colors"
                  >
                    <span className="truncate">{item}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">搜尋</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右側操作按鈕 */}
        <div className="flex items-center gap-2">
          {/* 隨機探索 (Surprise Me) */}
          <button
            onClick={onRandomExplore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 text-purple-200 hover:border-purple-400/60 hover:text-white text-xs font-medium transition-all group shadow-sm"
            title="隨機挖寶：探索未被發掘的冷門有趣開源專案"
          >
            <Dices className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">隨機挖寶</span>
          </button>

          {/* 收藏清單入口 */}
          <button
            onClick={onToggleFavorites}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showFavoritesOnly
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title="查看已收藏的專案"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">我的收藏</span>
            {favoritesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Token 設定按鈕 */}
          <button
            onClick={onOpenTokenModal}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
            title="設定 GitHub Token (解鎖 API 次數)"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
