'use client';

import React, { useState } from 'react';
import { 
  Play, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { DemoLinkInfo } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  repoFullName: string;
  demoInfo: DemoLinkInfo;
  htmlUrl: string;
}

export const DemoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  repoFullName,
  demoInfo,
  htmlUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hasDemo = Boolean(demoInfo.url) && (demoInfo.verificationStatus === 'verified' || demoInfo.verificationStatus === 'unverified' || demoInfo.verificationStatus === 'found_unverified');
  const isVerified = demoInfo.verificationStatus === 'verified';

  const handleCopy = () => {
    if (demoInfo.url) {
      navigator.clipboard.writeText(demoInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題 */}
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Play className="w-6 h-6 fill-cyan-400" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">Demo 一鍵試玩體驗</h3>
            <p className="text-xs text-slate-400 font-mono">{repoFullName}</p>
          </div>
        </div>

        {/* 狀態提示 */}
        {isVerified && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-emerald-300">已驗證官方展示頁</span>
              <p className="text-slate-300">
                此 Demo 連結來自作者官方網站或已確認之 GitHub Pages，可直接於瀏覽器進行線上體驗。
              </p>
            </div>
          </div>
        )}

        {!isVerified && hasDemo && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-300">未充分驗證之疑似展示連結</span>
              <p className="text-slate-300">
                此連結從專案描述或文件偵測取得，尚未經過官方完全認證。開啟外部網站時請注意瀏覽安全，勿隨意輸入個人機密帳密。
              </p>
            </div>
          </div>
        )}

        {!hasDemo && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200">此專案未提供線上免安裝 Demo</span>
              <p className="text-slate-400">
                作者未部署公開線上體驗網頁，通常需要透過本機安裝執行或參閱官方 README 教學進行建置。
              </p>
            </div>
          </div>
        )}

        {/* 網址資訊區 */}
        {hasDemo && demoInfo.url ? (
          <div className="bg-[#131d31] p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              展示網址 (URL)
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-300 truncate">{demoInfo.url}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="複製網址"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : null}

        {/* 動作按鈕 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            關閉
          </button>

          {hasDemo && demoInfo.url ? (
            <a
              href={demoInfo.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              開啟官方 Demo <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <a
              href={`${htmlUrl}#readme`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
            >
              查看官方安裝文件 <BookOpen className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
