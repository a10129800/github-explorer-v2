'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { RepoCard } from '@/components/RepoCard';
import { TrendingChart } from '@/components/TrendingChart';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { RadarRepoItem, SearchFilters, TrendingTimeframe } from '@/lib/types';
import { 
  Radar, 
  Sparkles, 
  Flame, 
  Rocket, 
  Play, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react';
import { AIToolsView } from '@/components/AIToolsView';
import { CompareView } from '@/components/CompareView';
import { DailyIntelView } from '@/components/DailyIntelView';
import { AssistantView } from '@/components/AssistantView';
import { CompatibilityView } from '@/components/CompatibilityView';

function sendDesktopLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.logToHost) {
    try {
      (window as any).electronAPI.logToHost(level, message, data);
    } catch {}
  }
}

function RadarHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get('tab') || 'today';
  const currentCategory = searchParams.get('category');
  const initialQuery = searchParams.get('q') || '';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<RadarRepoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [queryExplained, setQueryExplained] = useState<string | undefined>();
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    language: 'all',
    timeRange: 'any',
    sortBy: 'stars',
    page: 1,
    perPage: 18,
  });

  // 同步收藏列表
  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          const map: Record<string, boolean> = {};
          data.items.forEach((item: any) => {
            map[item.repository.fullName] = true;
          });
          setFavoritesMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // 抓取資料主函數
  const fetchData = useCallback(async () => {
    sendDesktopLog('INFO', '前端開始載入雷達資料', { tab: currentTab, category: currentCategory, query: initialQuery || filters.query });

    if (['ai-tools', 'compare', 'daily-intel', 'assistant', 'compatibility'].includes(currentTab) && !initialQuery && !filters.query) {
      setLoading(false);
      sendDesktopLog('INFO', '前端切換至靜態或專屬面板，結束載入狀態', { tab: currentTab });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (initialQuery || filters.query) {
        // 處於關鍵字 / 語意搜尋模式
        const params = new URLSearchParams();
        if (filters.query || initialQuery) params.set('q', (filters.query || initialQuery).trim());
        if (filters.language && filters.language !== 'all') params.set('language', filters.language);
        if (filters.timeRange && filters.timeRange !== 'any') params.set('timeRange', filters.timeRange);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        params.set('page', String(filters.page || 1));
        params.set('perPage', String(filters.perPage || 18));

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `搜尋失敗 [${res.status}]`);
        }
        const data = await res.json();
        setRepos(data.items || []);
        setTotalCount(data.totalCount || 0);
        setQueryExplained(data.queryExplained);
      } else if (currentCategory) {
        // 主題分類模式
        let catQuery = '';
        if (currentCategory === 'ai-gen') catQuery = 'topic:generative-ai OR topic:llm';
        else if (currentCategory === '3d-motion') catQuery = 'topic:threejs OR topic:webgl';
        else if (currentCategory === 'games') catQuery = 'topic:game OR topic:browser-game';
        else if (currentCategory === 'devtools') catQuery = 'topic:cli OR topic:developer-tools';
        else if (currentCategory === 'hidden-gems') catQuery = 'stars:50..2500';

        const res = await fetch(`/api/search?q=${encodeURIComponent(catQuery)}&sortBy=${filters.sortBy || 'stars'}&page=${filters.page || 1}`);
        if (!res.ok) throw new Error('分類載入失敗');
        const data = await res.json();
        setRepos(data.items || []);
        setTotalCount(data.totalCount || 0);
        setQueryExplained(`主題頻道：${currentCategory}`);
      } else if (currentTab === 'demos') {
        // Demo 尋寶模式
        const res = await fetch('/api/discover?mode=demos');
        if (!res.ok) throw new Error('無法載入 Demo 專案');
        const data = await res.json();
        setRepos(data.demos || []);
        setTotalCount((data.demos || []).length);
        setQueryExplained('聚焦可直接線上操作試玩的優質開源作品');
      } else if (currentTab === 'emerging') {
        // 新興專案
        const res = await fetch('/api/discover?mode=emerging');
        if (!res.ok) throw new Error('無法載入新興專案');
        const data = await res.json();
        setRepos(data.emerging || []);
        setTotalCount((data.emerging || []).length);
        setQueryExplained('聚焦近期創立且迅速受到社群關注的前鋒專案');
      } else if (currentTab === 'free-oss') {
        // 免費開源自架專區
        const res = await fetch('/api/discover?mode=self-hosted');
        if (!res.ok) throw new Error('無法載入免費開源專區');
        const data = await res.json();
        setRepos(data.selfHosted || []);
        setTotalCount((data.selfHosted || []).length);
        setQueryExplained('聚焦標準 OSI 認證、可自行安裝且無強制付費 API 之工具');
      } else {
        // 趨勢雷達模式 (today, this_week, this_month)
        const timeframe: TrendingTimeframe = (currentTab === 'this_week' || currentTab === 'this_month') ? currentTab : 'today';
        const res = await fetch(`/api/trending?timeframe=${timeframe}`);
        if (!res.ok) throw new Error('無法取得趨勢雷達資料');
        const data = await res.json();
        setRepos(data.items || []);
        setTotalCount((data.items || []).length);
        setQueryExplained(`資料來源：${data.sourceLabel}（依真實活躍度與快照比對）`);
      }
    } catch (err: any) {
      setError(err.message || '連線錯誤，請檢查網路或稍後重試');
      setRepos([]);
      sendDesktopLog('ERROR', '前端資料載入失敗', { error: err.message });
    } finally {
      setLoading(false);
      sendDesktopLog('INFO', '前端資料載入流程結束');
    }
  }, [initialQuery, filters, currentCategory, currentTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 收藏切換
  const handleToggleFavorite = async (repo: RadarRepoItem) => {
    const isFav = Boolean(favoritesMap[repo.fullName]);
    setFavoritesMap((prev) => ({ ...prev, [repo.fullName]: !isFav }));

    try {
      if (isFav) {
        await fetch(`/api/favorites/${encodeURIComponent(repo.id)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: repo.fullName }),
        });
      }
    } catch {
      // 復原
      setFavoritesMap((prev) => ({ ...prev, [repo.fullName]: isFav }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      language: 'all',
      timeRange: 'any',
      sortBy: 'stars',
      page: 1,
      perPage: 18,
    });
    router.push('/');
  };

  // 獲取前段專案用於趨勢摘要
  const topStarredRepo = repos.length > 0 ? repos[0] : null;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex w-full px-4 sm:px-6 py-6 gap-6">
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-64 min-w-0 space-y-6">
          {currentTab === 'ai-tools' && <AIToolsView />}
          {currentTab === 'compare' && <CompareView />}
          {currentTab === 'daily-intel' && <DailyIntelView />}
          {currentTab === 'assistant' && <AssistantView />}
          {currentTab === 'compatibility' && <CompatibilityView />}

          {!['ai-tools', 'compare', 'daily-intel', 'assistant', 'compatibility'].includes(currentTab) && (
            <>
              {/* 頻道標題與摘要橫幅 */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#10192e] border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Radar className="w-4 h-4 animate-spin-slow" />
                  </span>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    {initialQuery ? `關鍵字搜尋：${initialQuery}` : 
                     currentCategory ? `主題領域：${currentCategory}` :
                     currentTab === 'today' ? '今日開源雷達' :
                     currentTab === 'this_week' ? '本週崛起專案' :
                     currentTab === 'this_month' ? '本月熱門榜' :
                     currentTab === 'demos' ? '可直接體驗的 Demo 尋寶' :
                     currentTab === 'free-oss' ? '免費開源自架專區' : '開源專案探索'}
                  </h1>
                </div>
                <p className="text-xs text-slate-400">
                  {queryExplained || '真實 GitHub 資料 • 歷史快照成長追蹤 • 嚴格防範假數據'}
                </p>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium rounded-xl text-slate-300 transition-colors"
                title="重新整理雷達資料"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>手動刷新</span>
              </button>
            </div>
          </div>

          {/* 趨勢快照折線圖 (展示首位代表性專案的真實採樣變化) */}
          {topStarredRepo && topStarredRepo.snapshots && topStarredRepo.snapshots.length >= 2 && (
            <TrendingChart
              snapshots={topStarredRepo.snapshots}
              currentStars={topStarredRepo.stars}
            />
          )}

          {/* 篩選控制器 */}
          <SearchFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            queryExplained={queryExplained}
          />

          {/* 專案卡片網格 */}
          {loading ? (
            <LoadingSkeleton count={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchData} />
          ) : repos.length === 0 ? (
            <EmptyState onReset={handleResetFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isFavorite={Boolean(favoritesMap[repo.fullName])}
                  onToggleFavorite={handleToggleFavorite}
                  onFindSimilar={(r) => {
                    router.push(`/?q=${encodeURIComponent(r.language ? `language:${r.language} ${r.topics[0] || ''}` : r.topics[0] || r.name)}`);
                  }}
                />
              ))}
            </div>
          )}

          {/* 分頁器 */}
          {totalCount > (filters.perPage || 18) && !loading && !error && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </button>
              <span className="text-slate-400 font-mono">
                第 <strong className="text-cyan-400">{filters.page || 1}</strong> 頁
              </span>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          </>
        )}

        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] flex items-center justify-center text-xs text-slate-500">載入開源雷達中...</div>}>
      <RadarHomeContent />
    </Suspense>
  );
}
