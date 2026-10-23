import React from 'react';
import { DemoLinkInfo } from '@/lib/types';
import { Play, Globe, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  demo: DemoLinkInfo;
  className?: string;
}

export const DemoStatusBadge: React.FC<Props> = ({ demo, className = '' }) => {
  if (demo.verificationStatus === 'none' || !demo.url) {
    return null;
  }

  if (demo.verificationStatus === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-sm ${className}`}
        title={`已驗證官方 Demo 網址：${demo.url}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>可直接線上體驗</span>
      </span>
    );
  }

  if (demo.verificationStatus === 'unverified' || demo.verificationStatus === 'found_unverified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-500/30 ${className}`}
        title={`官方 Demo 連結 (未經全量自動探測)：${demo.url}`}
      >
        <Play className="w-3 h-3 text-blue-400" />
        <span>官方展示連結</span>
      </span>
    );
  }

  if (demo.verificationStatus === 'docs-only') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 ${className}`}
        title={`文件說明網站：${demo.url}`}
      >
        <FileText className="w-3 h-3 text-slate-400" />
        <span>文件站</span>
      </span>
    );
  }

  return null;
};
