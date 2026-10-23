import { useState, useEffect, useCallback } from 'react';
import { GithubRepo } from '../types';

const FAVORITES_KEY = 'gh_explorer_favorites';
const SEEN_REPOS_KEY = 'gh_explorer_seen_repos';
const HISTORY_KEY = 'gh_explorer_search_history';
const TOKEN_KEY = 'gh_explorer_token';
const EXCLUDE_SEEN_KEY = 'gh_explorer_exclude_seen';

export function useStorage() {
  // 1. 收藏專案
  const [favorites, setFavorites] = useState<GithubRepo[]>(() => {
    try {
      const item = localStorage.getItem(FAVORITES_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  // 2. 已看過的專案 ID 清單
  const [seenRepoIds, setSeenRepoIds] = useState<number[]>(() => {
    try {
      const item = localStorage.getItem(SEEN_REPOS_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  // 3. 搜尋歷史
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const item = localStorage.getItem(HISTORY_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  // 4. 自訂 GitHub Token
  const [customToken, setCustomToken] = useState<string>(() => {
    return localStorage.getItem(TOKEN_KEY) || '';
  });

  // 5. 排除已看過開關
  const [excludeSeen, setExcludeSeen] = useState<boolean>(() => {
    return localStorage.getItem(EXCLUDE_SEEN_KEY) === 'true';
  });

  // 監聽收藏變動並寫入 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  // 監聽已看過清單
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_REPOS_KEY, JSON.stringify(seenRepoIds));
    } catch (e) {
      console.error('Failed to save seen repo ids', e);
    }
  }, [seenRepoIds]);

  // 監聽搜尋歷史
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  }, [history]);

  const toggleFavorite = useCallback((repo: GithubRepo) => {
    setFavorites(prev => {
      const exists = prev.some(r => r.id === repo.id);
      if (exists) {
        return prev.filter(r => r.id !== repo.id);
      } else {
        return [repo, ...prev];
      }
    });
  }, []);

  const isFavorite = useCallback((repoId: number) => {
    return favorites.some(r => r.id === repoId);
  }, [favorites]);

  const markAsSeen = useCallback((repoId: number) => {
    setSeenRepoIds(prev => {
      if (prev.includes(repoId)) return prev;
      return [repoId, ...prev.slice(0, 499)]; // 最多保留 500 筆已看過
    });
  }, []);

  const clearSeen = useCallback(() => {
    setSeenRepoIds([]);
    localStorage.removeItem(SEEN_REPOS_KEY);
  }, []);

  const addHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 15);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const saveToken = useCallback((token: string) => {
    const cleanToken = token.trim();
    setCustomToken(cleanToken);
    if (cleanToken) {
      localStorage.setItem(TOKEN_KEY, cleanToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    window.location.reload(); // 重新載入以生效新 Header 與 Rate Limit 統計
  }, []);

  const toggleExcludeSeen = useCallback(() => {
    setExcludeSeen(prev => {
      const next = !prev;
      localStorage.setItem(EXCLUDE_SEEN_KEY, String(next));
      return next;
    });
  }, []);

  return {
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
  };
}
