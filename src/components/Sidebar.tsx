import React from 'react';
import { EXPLORATION_CATEGORIES, PRESET_SEARCH_QUERIES } from '../constants/categories';
import { 
  Brain, 
  Sparkles, 
  Box, 
  Gamepad2, 
  Palette, 
  Cpu, 
  Zap, 
  BarChart3, 
  Smartphone, 
  Gem, 
  Flame, 
  GraduationCap,
  EyeOff,
  Compass,
  Tag,
  Trash2
} from 'lucide-react';

interface Props {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectPresetTag: (tag: string) => void;
  excludeSeen: boolean;
  onToggleExcludeSeen: () => void;
  seenCount: number;
  onClearSeen: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

// 動態圖示映射
const ICON_MAP: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Box: <Box className="w-4 h-4" />,
  Gamepad2: <Gamepad2 className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Gem: <Gem className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />
};

export const Sidebar: React.FC<Props> = ({
  selectedCategory,
  onSelectCategory,
  onSelectPresetTag,
  excludeSeen,
  onToggleExcludeSeen,
  seenCount,
  onClearSeen,
  isOpenMobile,
  onCloseMobile
}) => {
  return (
    <>
      {/* 手機版遮罩 */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 w-72 bg-[#0d1322] border-r border-slate-800/80 z-30
        overflow-y-auto p-4 flex flex-col justify-between transition-transform duration-300
        lg:translate-x-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          {/* 分類清單標題 */}
          <div>
            <div className="flex items-center gap-2 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>探索分類</span>
            </div>

            <nav className="space-y-1">
              {EXPLORATION_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : cat.highlight 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400'
                    }`}>
                      {ICON_MAP[cat.icon] || <Compass className="w-4 h-4" />}
                    </span>
                    <div className="truncate">
                      <div className="truncate flex items-center gap-1.5">
                        <span className="font-semibold">{cat.name}</span>
                        {cat.highlight && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 font-bold">
                            推薦
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{cat.enName}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 預設熱門搜尋主題 */}
          <div>
            <div className="flex items-center gap-2 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>精選主題標籤</span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {PRESET_SEARCH_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectPresetTag(preset);
                    onCloseMobile();
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-all text-left"
                >
                  #{preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部：已看過篩選管理 */}
        <div className="pt-4 mt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeSeen}
                  onChange={onToggleExcludeSeen}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  排除已看過專案
                </span>
              </label>

              {seenCount > 0 && (
                <button
                  onClick={onClearSeen}
                  title="清除已看過紀錄"
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              已記錄 <span className="text-slate-300 font-mono">{seenCount}</span> 個看過的專案
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
