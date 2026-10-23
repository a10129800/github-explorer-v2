import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GithubRepo, 
  SearchFilters, 
  CategoryItem 
} from './types';
import { 
  searchRepositories, 
  getRandomTreasureProjects 
} from './services/githubApi';
import { translateChineseQuery } from './services/translator';
import { calculateTreasureMetrics } from './services/scorer';
import { EXPLORATION_CATEGORIES } from './constants/categories';
import { useStorage } from './hooks/useStorage';

// 元件導入
import { StatusBanner } from './components/StatusBanner';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { RepoCard } from './components/RepoCard';
import { RepoDetailModal } from './components/RepoDetailModal';
import { SimilarModal } from './components/SimilarModal';
import { TokenModal } from './components/TokenModal';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';

import { 
  Compass, 
  Sparkles, 
  Flame, 
  Gem, 
  Clock, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  RefreshCw,
  Info
} from 'lucide-react';

type HomeSection = 'all' | 'curated' | 'today' | 'trending' | 'recent' | 'hidden-gems';

export const App: React.FC = () => {
  // 狀態存儲 Hook
  const {
    favorites,
    toggleFavorite,
    isFavorite,
    seenRepoIds,
    markAsSeen,
    clearSeen,
    history,
    addHistory,
    clearHistory,
    customToken,
    saveToken,
    excludeSeen,
    toggleExcludeSeen
  } = useStorage();

  // 搜尋與篩選狀態
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<HomeSection>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    language: 'all',
    starRange: 'any',
    updateTime: 'any',
    createdTime: 'any',
    sort: 'treasure',
    order: 'desc',
    topic: '',
    page: 1,
    perPage: 24
  });

  // 資料狀態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [translationNotice, setTranslationNotice] = useState<string | undefined>();

  // Modal 狀態
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [similarSourceRepo, setSimilarSourceRepo] = useState<GithubRepo | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 執行 API 搜尋核心
  const executeSearch = useCallback(async (
    currentFilters: SearchFilters, 
    searchKeyword: string,
    categoryQuery?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      let finalSearchTerm = searchKeyword;
      let notice: string | undefined;

      // 檢查是否為中文並進行轉譯
      if (searchKeyword.trim()) {
        const tr = translateChineseQuery(searchKeyword);
        if (tr.isTranslated) {
          finalSearchTerm = tr.finalQuery;
          notice = tr.explanation;
        }
      }

      setTranslationNotice(notice);

      let effectiveQuery = finalSearchTerm;
      if (categoryQuery) {
        effectiveQuery = effectiveQuery 
          ? `${effectiveQuery} ${categoryQuery}` 
          : categoryQuery;
      }

      const res = await searchRepositories(currentFilters, effectiveQuery);
      setRepos(res.items || []);
      setTotalCount(res.total_count || 0);

      if (searchKeyword.trim()) {
        addHistory(searchKeyword.trim());
      }
    } catch (err: any) {
      setError(err.message || '搜尋失敗，請檢查網路連線或 GitHub API 限額');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [addHistory]);

  // 初次載入或篩選變更時觸發
  useEffect(() => {
    if (showFavoritesOnly) return;

    let catQuery: string | undefined;
    if (selectedCategory) {
      const found = EXPLORATION_CATEGORIES.find(c => c.id === selectedCategory);
      if (found) catQuery = found.query;
    }

    // 首頁專屬分區的預設查詢
    if (!selectedCategory && !activeQuery) {
      if (activeSection === 'today') {
        catQuery = 'topic:awesome pushed:>=2024-01-01 stars:100..4000';
      } else if (activeSection === 'curated') {
        catQuery = 'topic:creative-coding OR topic:generative-art stars:>150';
      } else if (activeSection === 'trending') {
        catQuery = 'stars:>10000 pushed:>=2024-01-01';
      } else if (activeSection === 'recent') {
        catQuery = 'pushed:>=2024-10-01 stars:>50';
      } else if (activeSection === 'hidden-gems') {
        catQuery = 'stars:50..2500 pushed:>=2024-01-01';
      }
    }

    executeSearch(filters, activeQuery, catQuery);
  }, [filters, activeQuery, selectedCategory, activeSection, showFavoritesOnly, executeSearch]);

  // 處理搜尋送出
  const handleSearchSubmit = (keyword: string) => {
    setActiveQuery(keyword);
    setSelectedCategory(null);
    setShowFavoritesOnly(false);
    setActiveSection('all');
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // 處理選擇分類
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowFavoritesOnly(false);
    setActiveSection('all');
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // 處理精選標籤點擊
  const handleSelectPresetTag = (tag: string) => {
    setSearchInput(tag);
    handleSearchSubmit(tag);
  };

  // 處理隨機挖寶
  const handleRandomExplore = async () => {
    setLoading(true);
    setError(null);
    setShowFavoritesOnly(false);
    setSelectedCategory(null);
    setActiveQuery('');
    setSearchInput('');
    setActiveSection('hidden-gems');

    try {
      const randomItems = await getRandomTreasureProjects();
      setRepos(randomItems);
      setTotalCount(randomItems.length);
      setTranslationNotice('已啟動隨機探索演算法：為您挖掘高探索價值冷門專案');
    } catch (err: any) {
      setError(err.message || '隨機探索載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 變更個別篩選器
  const handleFilterChange = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // 重設篩選器
  const handleResetFilters = () => {
    setFilters({
      query: '',
      language: 'all',
      starRange: 'any',
      updateTime: 'any',
      createdTime: 'any',
      sort: 'treasure',
      order: 'desc',
      topic: '',
      page: 1,
      perPage: 24
    });
    setSearchInput('');
    setActiveQuery('');
    setSelectedCategory(null);
    setActiveSection('all');
    setShowFavoritesOnly(false);
  };

  // 點擊專案卡片
  const handleOpenDetails = (repo: GithubRepo) => {
    markAsSeen(repo.id);
    setSelectedRepo(repo);
  };

  // 尋找類似專案
  const handleFindSimilar = (repo: GithubRepo) => {
    markAsSeen(repo.id);
    setSimilarSourceRepo(repo);
  };

  // 依條件排序與過濾（支援前端寶藏指數排序與已看過過濾）
  const displayedRepos = useMemo(() => {
    let list = showFavoritesOnly ? favorites : repos;

    // 排除已看過
    if (excludeSeen && !showFavoritesOnly) {
      list = list.filter(r => !seenRepoIds.includes(r.id));
    }

    // 自訂前端寶藏推薦指數排序
    if (filters.sort === 'treasure') {
      list = [...list].sort((a, b) => {
        const scoreA = calculateTreasureMetrics(a).treasureScore;
        const scoreB = calculateTreasureMetrics(b).treasureScore;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [repos, favorites, showFavoritesOnly, excludeSeen, seenRepoIds, filters.sort]);

  const totalPages = Math.min(34, Math.ceil(totalCount / filters.perPage)); // GitHub API 限制搜尋最多 1000 筆

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      
      {/* 頂部 GitHub API 配額監控條 */}
      <StatusBanner onOpenTokenModal={() => setIsTokenModalOpen(true)} />

      {/* 導覽列 */}
      <Navbar
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onRandomExplore={handleRandomExplore}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        showFavoritesOnly={showFavoritesOnly}
        favoritesCount={favorites.length}
        searchHistory={history}
        onSelectHistory={(term) => {
          setSearchInput(term);
          handleSearchSubmit(term);
        }}
        onClearHistory={clearHistory}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* 左側分類側邊欄 */}
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onSelectPresetTag={handleSelectPresetTag}
          excludeSeen={excludeSeen}
          onToggleExcludeSeen={toggleExcludeSeen}
          seenCount={seenRepoIds.length}
          onClearSeen={clearSeen}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 右側主要內容展區 (在桌機版留出 72 (18rem) 寬度給側邊欄) */}
        <main className="flex-1 lg:ml-72 min-w-0 space-y-6">
          
          {/* 首頁探索專區快捷 Tab (在未處於自訂關鍵字搜尋或收藏模式時顯示) */}
          {!showFavoritesOnly && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2.5 flex flex-wrap items-center gap-1.5 backdrop-blur-md">
              <button
                onClick={() => {
                  setActiveSection('all');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'all' && !selectedCategory && !activeQuery
                    ? 'bg-cyan-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>全域探索</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('today');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'today'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>今日發現</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('hidden-gems');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'hidden-gems'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Gem className="w-3.5 h-3.5 text-emerald-300" />
                <span>冷門寶藏專案</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('trending');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'trending'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-300" />
                <span>熱門排行榜</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('recent');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'recent'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-purple-300" />
                <span>最新更新專案</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('curated');
                  setSelectedCategory(null);
                  setActiveQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'curated'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>精選專案區</span>
              </button>
            </div>
          )}

          {/* 收藏清單視圖橫幅 */}
          {showFavoritesOnly && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <Bookmark className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">我的收藏清單</h2>
                  <p className="text-xs text-amber-200/80">已保存在本地瀏覽器中的開源專案 ({favorites.length} 個)</p>
                </div>
              </div>

              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              >
                返回搜尋結果
              </button>
            </div>
          )}

          {/* 篩選器組件 */}
          {!showFavoritesOnly && (
            <FilterBar
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalResults={totalCount}
              translationNotice={translationNotice}
            />
          )}

          {/* 專案卡片展示區 */}
          {loading ? (
            <LoadingSkeleton count={6} />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => executeSearch(filters, activeQuery)}
              onOpenTokenModal={() => setIsTokenModalOpen(true)}
            />
          ) : displayedRepos.length === 0 ? (
            <EmptyState
              title={showFavoritesOnly ? '您目前尚未收藏任何專案' : '沒有找到符合條件的 GitHub 專案'}
              message={
                showFavoritesOnly 
                  ? '瀏覽時點擊卡片右上角的書籤按鈕，即可將感興趣的開源項目收錄在此。' 
                  : (excludeSeen ? '可能是因為開啟了「排除已看過」過濾，或搜尋條件較為嚴格。' : undefined)
              }
              onReset={handleResetFilters}
              onSuggestKeyword={handleSearchSubmit}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isFavorite={isFavorite(repo.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpenDetails={handleOpenDetails}
                  onFindSimilar={handleFindSimilar}
                  onSelectTopic={(t) => handleSearchSubmit(t)}
                />
              ))}
            </div>
          )}

          {/* 分頁控制器 */}
          {!showFavoritesOnly && totalCount > filters.perPage && !loading && !error && (
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </button>

              <span className="text-xs text-slate-400 font-mono">
                第 <span className="text-cyan-400 font-bold">{filters.page}</span> / {totalPages} 頁
              </span>

              <button
                disabled={filters.page >= totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>
      </div>

      {/* 專案詳細抽屜 / 彈窗 */}
      <RepoDetailModal
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
        isFavorite={selectedRepo ? isFavorite(selectedRepo.id) : false}
        onToggleFavorite={toggleFavorite}
        onFindSimilar={handleFindSimilar}
      />

      {/* 再找十個類似專案彈窗 */}
      <SimilarModal
        sourceRepo={similarSourceRepo}
        onClose={() => setSimilarSourceRepo(null)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onOpenDetails={handleOpenDetails}
        onSelectTopic={handleSearchSubmit}
        onFindSimilar={handleFindSimilar}
      />

      {/* GitHub Token 設定彈窗 */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        savedToken={customToken}
        onSaveToken={saveToken}
      />

    </div>
  );
};
