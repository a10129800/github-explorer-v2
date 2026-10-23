'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { FavoriteItem, FavoriteStatus } from '@/lib/types';
import { 
  Bookmark, 
  Trash2, 
  Download, 
  ExternalLink, 
  Play, 
  Edit3, 
  Check, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const STATUS_LABELS: Record<FavoriteStatus, { label: string; color: string }> = {
  'want-to-try': { label: '想試玩', color: 'bg-blue-950/60 border-blue-500/40 text-blue-300' },
  'want-to-install': { label: '想安裝', color: 'bg-purple-950/60 border-purple-500/40 text-purple-300' },
  'want-to-study': { label: '想研究源碼', color: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' },
  'making-similar': { label: '想做類似專案', color: 'bg-amber-950/60 border-amber-500/40 text-amber-300' },
  'tried': { label: '已經試過', color: 'bg-slate-800 border-slate-700 text-slate-300' },
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadFavorites = () => {
    setLoading(true);
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((data) => {
        setFavorites(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleDelete = async (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    await fetch(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' });
  };

  const handleUpdateStatus = async (id: string, status: FavoriteStatus) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
    await fetch(`/api/favorites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const handleSaveNote = async (id: string) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === id ? { ...f, note: noteText } : f))
    );
    setEditingId(null);
    await fetch(`/api/favorites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    });
  };

  // 匯出 JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `radar-favorites-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 匯出 CSV
  const handleExportCSV = () => {
    const headers = ['Repository', 'Stars', 'Language', 'Status', 'Note', 'URL'];
    const rows = favorites.map((f) => [
      f.repository.fullName,
      f.repository.stars,
      f.repository.language || '',
      f.status,
      `"${(f.note || '').replace(/"/g, '""')}"`,
      f.repository.htmlUrl,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `radar-favorites-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const displayedFavorites = filterStatus === 'all' 
    ? favorites 
    : favorites.filter((f) => f.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* 頂部標題與匯出工具 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>個人開源專案雷達庫</span>
              </h1>
              <p className="text-xs text-slate-400">
                共收藏 {favorites.length} 個開源項目 • 支援狀態標籤與個人研究筆記
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={favorites.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={favorites.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 CSV</span>
            </button>
          </div>
        </div>

        {/* 狀態過濾選項 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-xl font-medium border transition-colors ${
              filterStatus === 'all'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            全部 ({favorites.length})
          </button>
          {Object.entries(STATUS_LABELS).map(([key, config]) => {
            const count = favorites.filter((f) => f.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1 rounded-xl font-medium border transition-colors ${
                  filterStatus === key
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 收藏清單卡片 */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">正在讀取收藏清單...</div>
        ) : displayedFavorites.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#0f172a]/60 rounded-2xl border border-slate-800 p-8">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">此狀態下尚無收藏專案</h3>
            <p className="text-xs text-slate-400">瀏覽雷達專案時，點擊卡片上的書籤即可收錄至此。</p>
            <Link href="/" className="inline-block mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold">
              前往探索專案
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedFavorites.map((fav) => {
              const currentStatus = STATUS_LABELS[fav.status] || STATUS_LABELS['want-to-try'];
              const isEditing = editingId === fav.id;

              return (
                <div
                  key={fav.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/repository/${fav.repository.fullName}`}
                        className="text-base font-bold text-white hover:text-cyan-300 transition-colors"
                      >
                        {fav.repository.fullName}
                      </Link>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {fav.repository.description || '（無專案說明）'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 狀態切換下拉選單 */}
                      <select
                        value={fav.status}
                        onChange={(e) => handleUpdateStatus(fav.id, e.target.value as FavoriteStatus)}
                        className={`text-xs px-2.5 py-1 rounded-xl border bg-slate-900 focus:outline-none ${currentStatus.color}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([sKey, sConf]) => (
                          <option key={sKey} value={sKey}>
                            {sConf.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleDelete(fav.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="自收藏移除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 筆記區塊 */}
                  <div className="bg-black/40 border border-slate-850 rounded-xl p-3 text-xs">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="寫下你的研究筆記、架構想法或評測心得..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none h-16"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-slate-800 rounded text-slate-400"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleSaveNote(fav.id)}
                            className="px-2.5 py-1 bg-cyan-600 text-white rounded font-medium"
                          >
                            儲存筆記
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-slate-300 italic">
                          {fav.note ? `筆記：${fav.note}` : '點擊右側按鈕新增個人備註...'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingId(fav.id);
                            setNoteText(fav.note || '');
                          }}
                          className="p-1 rounded text-slate-500 hover:text-cyan-300"
                          title="編輯筆記"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 底部數據與外連 */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-3">
                      <span>⭐ {fav.repository.stars.toLocaleString()}</span>
                      {fav.repository.language && <span>{fav.repository.language}</span>}
                      <span className="text-[11px] text-slate-500">
                        收藏於 {new Date(fav.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a
                      href={fav.repository.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>在 GitHub 開啟</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
