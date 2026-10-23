'use client';

import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Lock, 
  Mail, 
  Github, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthUser } from '@/lib/auth/service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'github'>('login');
  
  // 表單狀態
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '登入失敗');
        setSuccessMsg(data.isNewAccount ? '🎉 歡迎！已為您自動註冊帳號並成功登入！' : '登入成功！');
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 900);
      } else if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '註冊失敗');
        setSuccessMsg('註冊成功！已為您自動登入');
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 800);
      } else if (mode === 'github') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubToken }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'GitHub Token 驗證失敗');
        setSuccessMsg('GitHub Token 綁定成功！配額已提升至 5,000 次/小時');
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
          window.location.reload(); // 重新整理以刷新全站配額
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || '操作失敗，請檢查輸入內容');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題與 Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-radar-glow">
            <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              開源專案雷達會員帳號
            </h3>
            <p className="text-xs text-slate-400">
              登入即可儲存個人收藏、自訂硬體與解除 API 配額限制
            </p>
          </div>
        </div>

        {/* 智能提示 */}
        <div className="bg-[#131d31] border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能登入說明：</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            • 首次輸入帳號密碼，系統會<strong>自動為您建立本機會員並完成登入</strong>。<br />
            • 若您要連結 GitHub 官方帳號解鎖 5,000 次 API 配額，請點選「<strong>Token 登入</strong>」。
          </p>
        </div>

        {/* 模式切換按鈕群 */}
        <div className="grid grid-cols-3 gap-1 bg-[#131d31] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            帳號登入
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            註冊新帳號
          </button>
          <button
            type="button"
            onClick={() => { setMode('github'); setError(null); }}
            className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
              mode === 'github'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Token登入</span>
          </button>
        </div>

        {/* 錯誤與成功訊息 */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'github' ? (
            /* GitHub Token 快速登入 */
            <div className="space-y-3">
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 space-y-1.5 text-slate-300">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  貼上 GitHub Token 立即解鎖 5,000 次配額
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  系統會自動獲取您的 GitHub 暱稱與頭像建立帳號，無須手動記住密碼。
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showGithubToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#131d31] text-white pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1"
                    title={showGithubToken ? '隱藏 Token' : '顯示 Token'}
                  >
                    {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 一般帳號登入 / 註冊 */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">使用者名稱 / 帳號</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="請輸入使用者名稱"
                    className="w-full bg-[#131d31] text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">電子信箱 (選填)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-[#131d31] text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">密碼</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入密碼 (至少 6 個字元)"
                    className="w-full bg-[#131d31] text-white pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1"
                    title={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold shadow-lg transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'login'
                  ? '立即登入'
                  : mode === 'register'
                  ? '註冊並登入'
                  : '驗證 Token 並登入'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
