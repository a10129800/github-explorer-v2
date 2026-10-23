import React, { useState, useEffect } from 'react';
import { subscribeRateLimit } from '../services/githubApi';
import { ApiRateLimit } from '../types';
import { ShieldCheck, ShieldAlert, KeyRound, Clock, Zap } from 'lucide-react';

interface Props {
  onOpenTokenModal: () => void;
}

export const StatusBanner: React.FC<Props> = ({ onOpenTokenModal }) => {
  const [rateLimit, setRateLimit] = useState<ApiRateLimit>({
    limit: 60,
    remaining: 60,
    resetTime: null,
    hasCustomToken: false,
    tokenSource: 'none'
  });

  useEffect(() => {
    const unsubscribe = subscribeRateLimit(setRateLimit);
    return () => unsubscribe();
  }, []);

  const percentage = Math.round((rateLimit.remaining / (rateLimit.limit || 60)) * 100);
  const isLow = rateLimit.remaining <= 10;
  const isExhausted = rateLimit.remaining === 0;

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLow ? 'bg-red-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="text-slate-400 font-medium">GitHub REST API 狀態：</span>
          <span className={`font-mono font-semibold ${isLow ? 'text-rose-400' : 'text-cyan-300'}`}>
            剩餘 {rateLimit.remaining} / {rateLimit.limit} 次
          </span>
          <div className="hidden sm:inline-block w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
            <div 
              className={`h-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-cyan-400'}`}
              style={{ width: `${Math.max(4, percentage)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rateLimit.resetTime && (
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              配額重置：{rateLimit.resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {rateLimit.hasCustomToken ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Token 已啟用 (5,000次/hr)</span>
            </div>
          ) : (
            <button
              onClick={onOpenTokenModal}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-colors border ${
                isLow 
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 hover:bg-rose-900/80 animate-pulse' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
              }`}
            >
              {isLow ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <KeyRound className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isExhausted ? '配額用盡！設定 Token 解除限制' : '未驗證模式 (60次/hr) • 設定 Token'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
