'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Radar, 
  Bookmark, 
  ArrowRight, 
  Languages, 
  Menu, 
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  LogOut,
  Key
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AuthModal } from './AuthModal';
import { AuthUser } from '@/lib/auth/service';

interface Props {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Navbar: React.FC<Props> = ({
  onToggleMobileSidebar,
  isMobileSidebarOpen
}) => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [rateLimit, setRateLimit] = useState<{
    remaining: number;
    limit: number;
    hasToken: boolean;
  }>({ remaining: 60, limit: 60, hasToken: false });

  // 帳號認證狀態
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 取得健康狀態與 API 配額
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.rateLimit) {
          setRateLimit(data.rateLimit);
        }
      })
      .catch(() => {});

    // 檢查使用者登入狀態
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' });
      setUser(null);
      setIsUserMenuOpen(false);
      window.location.reload();
    } catch {}
  };

  const isLow = rateLimit.remaining <= 10;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080c14]/95 backdrop-blur-xl border-b border-slate-800 w-full">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* 左側：漢堡按鈕 + Logo (與下方 w-64 側邊欄完美對齊) */}
          <div className="w-64 shrink-0 flex items-center gap-3">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="切換分類導覽"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-radar-glow shrink-0">
                <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
                  <Radar className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                    開源專案雷達
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold shrink-0">
                    V2
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate hidden sm:block">Discover What&apos;s Rising in Open Source</p>
              </div>
            </Link>
          </div>

          {/* 中間：全域搜尋框 */}
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋專案、技術語法或自然語言（如：可直接玩的 AI 遊戲、3D 動畫...）"
                className="w-full bg-[#101726] text-white placeholder-slate-400 text-xs pl-10 pr-24 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>雷達</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* 右側：API 配額狀態 + 主題切換 + 收藏清單 + 會員帳號膠囊 */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Rate Limit 徽章 */}
            <div 
              className="hidden md:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm"
              title={rateLimit.hasToken ? '已配置伺服器端 GitHub Token (每小時 5,000 次)' : '未配置 Token (每小時 60 次公開限額)'}
            >
              {rateLimit.hasToken ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldAlert className={`w-3.5 h-3.5 ${isLow ? 'text-rose-400' : 'text-amber-400'}`} />
              )}
              <span className="text-slate-400 font-mono">
                API 配額: <strong className={isLow ? 'text-rose-400' : 'text-cyan-300'}>{rateLimit.remaining}</strong>/{rateLimit.limit}
              </span>
            </div>

            <ThemeToggle />

            <Link
              href="/favorites"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm"
              title="我的收藏清單"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">收藏清單</span>
            </Link>

            {/* 帳號登入 / 會員膠囊選單 */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-xs text-white transition-all shadow-md"
                  title="會員中心"
                >
                  <span className="font-bold text-cyan-300">{user.username}</span>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-6 h-6 rounded-full bg-slate-800 object-cover border border-cyan-400/60 shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* 登入後下拉選單 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-2 space-y-1 text-xs z-50 animate-in fade-in duration-150">
                    <div className="px-3 py-2 border-b border-slate-800/80">
                      <span className="font-bold text-white block truncate">{user.username}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        {user.hasGithubToken ? '已解鎖 5,000 配額' : '一般登入會員'}
                      </span>
                    </div>

                    <Link
                      href="/favorites"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>我的收藏庫</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>綁定/更新 Token</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>登出帳號</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 未登入狀態按鈕 */
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>登入 / 註冊</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* 登入 / 註冊彈窗 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </>
  );
};
