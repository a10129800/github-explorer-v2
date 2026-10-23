import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Check, 
  Trash2,
  Lock
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedToken: string;
  onSaveToken: (token: string) => void;
}

export const TokenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  savedToken,
  onSaveToken
}) => {
  const [tokenInput, setTokenInput] = useState(savedToken);
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveToken(tokenInput.trim());
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setTokenInput('');
    onSaveToken('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GitHub Token 設定</h3>
              <p className="text-xs text-slate-400">解鎖每小時 5,000 次 API 請求限額</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 說明與表單 */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* 配額說明對比卡片 */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
              <span className="text-slate-400 block font-medium">未設定 Token</span>
              <span className="text-rose-400 font-mono font-bold text-sm block">60 次 / 小時</span>
              <span className="text-[10px] text-slate-500 block leading-tight">依據客戶端 IP 共用，快速翻頁容易遇到 403 限額。</span>
            </div>

            <div className="bg-cyan-950/30 border border-cyan-500/30 p-3 rounded-xl space-y-1">
              <span className="text-cyan-400 block font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 設定 Token 後
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm block">5,000 次 / 小時</span>
              <span className="text-[10px] text-cyan-200/80 block leading-tight">足夠頻繁探索、搜尋與即時分析專案內容。</span>
            </div>
          </div>

          {/* 安全保證 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">100% 本地安全：</strong>Token 僅保存在您的瀏覽器 <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">localStorage</code>，在向 GitHub API 請求時直接帶入，絕對不會傳送至任何第三方伺服器。
            </p>
          </div>

          {/* 輸入框 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>GitHub Personal Access Token (classic 或 fine-grained)</span>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>前往 GitHub 申請</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500">
              * 申請時無需勾選任何私有權限（預設 public read 即可滿足搜尋與公開 repo 需求）。亦可透過 <code className="text-slate-400">.env</code> 檔案設定 <code className="text-cyan-400 font-mono">GITHUB_TOKEN</code>。
            </p>
          </div>

          {/* 按鈕組 */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {savedToken ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-xl text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除儲存的 Token</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-glow-sm transition-all"
              >
                {showSavedToast ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                <span>{showSavedToast ? '已儲存！' : '儲存並生效'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
