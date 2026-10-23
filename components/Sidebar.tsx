'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Radar, 
  Rocket, 
  Flame, 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Brain, 
  Box, 
  Gamepad2, 
  Wrench, 
  Gem, 
  Bookmark, 
  History, 
  Compass,
  GitCompare,
  Bot,
  Laptop
} from 'lucide-react';

export interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const RADAR_ITEMS = [
  { id: 'today', label: '今日雷達', icon: <Radar className="w-4 h-4" />, href: '/?tab=today' },
  { id: 'this_week', label: '本週崛起', icon: <Rocket className="w-4 h-4" />, href: '/?tab=this_week' },
  { id: 'this_month', label: '本月熱門', icon: <Flame className="w-4 h-4" />, href: '/?tab=this_month' },
  { id: 'emerging', label: '新興專案', icon: <Sparkles className="w-4 h-4" />, href: '/?tab=emerging' },
  { id: 'demos', label: 'Demo 尋寶', icon: <Play className="w-4 h-4" />, href: '/?tab=demos' },
  { id: 'free-oss', label: '免費開源', icon: <ShieldCheck className="w-4 h-4" />, href: '/?tab=free-oss' },
];

export const V2_FEATURE_ITEMS = [
  { id: 'ai-tools', label: 'AI 工具尋寶', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, href: '/?tab=ai-tools' },
  { id: 'compare', label: '專案比較器', icon: <GitCompare className="w-4 h-4 text-purple-400" />, href: '/?tab=compare' },
  { id: 'daily-intel', label: '每日開源情報', icon: <Radar className="w-4 h-4 text-blue-400" />, href: '/?tab=daily-intel' },
  { id: 'assistant', label: 'AI 研究助手', icon: <Bot className="w-4 h-4 text-emerald-400" />, href: '/?tab=assistant' },
  { id: 'compatibility', label: '硬體相容評估', icon: <Laptop className="w-4 h-4 text-teal-400" />, href: '/?tab=compatibility' },
];

export const CATEGORY_ITEMS = [
  { id: 'ai-gen', label: 'AI 與生成工具', icon: <Brain className="w-4 h-4" />, href: '/?category=ai-gen' },
  { id: '3d-motion', label: '3D 與動畫', icon: <Box className="w-4 h-4" />, href: '/?category=3d-motion' },
  { id: 'games', label: '遊戲與互動', icon: <Gamepad2 className="w-4 h-4" />, href: '/?category=games' },
  { id: 'devtools', label: '開發者工具', icon: <Wrench className="w-4 h-4" />, href: '/?category=devtools' },
  { id: 'hidden-gems', label: '冷門寶藏', icon: <Gem className="w-4 h-4" />, href: '/?category=hidden-gems' },
];

export const PERSONAL_ITEMS = [
  { id: 'favorites', label: '收藏清單', icon: <Bookmark className="w-4 h-4" />, href: '/favorites' },
  { id: 'history', label: '搜尋歷史', icon: <History className="w-4 h-4" />, href: '/history' },
];

function SidebarNav({
  isOpenMobile = false,
  onCloseMobile
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? (searchParams.get('tab') || (pathname === '/' && !searchParams.get('category') ? 'today' : '')) : '';
  const currentCategory = searchParams ? searchParams.get('category') : null;

  return renderSidebarBody({ isOpenMobile, onCloseMobile, pathname, currentTab, currentCategory });
}

function SidebarStaticFallback({
  isOpenMobile = false,
  onCloseMobile
}: Props) {
  const pathname = usePathname();
  const currentTab = pathname === '/' ? 'today' : '';
  const currentCategory = null;

  return renderSidebarBody({ isOpenMobile, onCloseMobile, pathname, currentTab, currentCategory });
}

interface RenderProps extends Props {
  pathname: string;
  currentTab: string;
  currentCategory: string | null;
}

export const Sidebar: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={<SidebarStaticFallback {...props} />}>
      <SidebarNav {...props} />
    </Suspense>
  );
};

function renderSidebarBody({
  isOpenMobile,
  onCloseMobile,
  pathname,
  currentTab,
  currentCategory
}: RenderProps) {

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
        fixed top-16 bottom-0 left-0 w-64 bg-[#0a0f1d] border-r border-slate-800/80 z-30
        overflow-y-auto p-4 flex flex-col justify-between transition-transform duration-300
        lg:translate-x-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          
          {/* V2 八大功能核心專區 */}
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>V2 升級功能</span>
            </div>

            <nav className="space-y-1">
              {V2_FEATURE_ITEMS.map((item) => {
                const isActive = (pathname === '/' && currentTab === item.id) || pathname === `/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 趨勢與探索模式 */}
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>趨勢雷達頻道</span>
            </div>

            <nav className="space-y-1">
              {RADAR_ITEMS.map((item) => {
                const isActive = pathname === '/' && currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 領域主題 */}
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              <span>主題領域</span>
            </div>

            <nav className="space-y-1">
              {CATEGORY_ITEMS.map((item) => {
                const isActive = currentCategory === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-purple-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 個人化中心 */}
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>個人雷達庫</span>
            </div>

            <nav className="space-y-1">
              {PERSONAL_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

        </div>

        {/* 底部說明 */}
        <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500">
          <p>真實數據驅動 • 零偽造成長</p>
          <p className="mt-0.5">GitHub Explorer V2</p>
        </div>
      </aside>
    </>
  );
}
