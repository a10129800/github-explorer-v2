'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { History, Search, ArrowLeft, Trash2, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; query: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 優先自資料庫 API 或 localStorage 讀取
    const local = localStorage.getItem('gh_explorer_search_history');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setHistoryItems(
          parsed.map((q: string, idx: number) => ({
            id: String(idx),
            query: q,
            createdAt: new Date().toISOString(),
          }))
        );
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleClear = () => {
    setHistoryItems([]);
    localStorage.removeItem('gh_explorer_search_history');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>開源搜尋足跡與歷史</span>
              </h1>
              <p className="text-xs text-slate-400">保留最近輸入的自然語言與 GitHub 檢索語法</p>
            </div>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/50 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空搜尋歷史</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">讀取中...</div>
        ) : historyItems.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#0f172a]/60 rounded-2xl border border-slate-800 p-8">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">尚無搜尋歷史紀錄</h3>
            <p className="text-xs text-slate-400">在頂部搜尋框輸入想要探索的專案主題，系統將自動記錄。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/?q=${encodeURIComponent(item.query)}`)}
                className="flex items-center justify-between p-4 bg-[#0f172a] hover:bg-[#131d31] border border-slate-800 rounded-xl cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                    {item.query}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 group-hover:text-cyan-400 text-xs">
                  <span>再次執行雷達</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
