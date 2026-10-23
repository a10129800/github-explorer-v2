import React from 'react';
import { CostAnalysisInfo } from '@/lib/types';
import { ShieldCheck, AlertTriangle, Key, Cpu, Server, Laptop } from 'lucide-react';

interface Props {
  cost: CostAnalysisInfo;
  className?: string;
}

export const CostLicenseBadge: React.FC<Props> = ({ cost, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-[11px] ${className}`}>
      {/* 開源授權標籤 */}
      {cost.isOpenSourceApproved ? (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
          title={cost.licenseName}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>{cost.licenseSpdxId || 'OSI 開源'}</span>
        </span>
      ) : cost.licenseSpdxId ? (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
          title={cost.licenseName}
        >
          <span>{cost.licenseSpdxId}</span>
        </span>
      ) : (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-500/30"
          title="專案未標註開源授權 SPDX 碼，商業或改寫使用需手動查閱"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>未確認 License</span>
        </span>
      )}

      {/* 外部 API 依賴提醒 */}
      {cost.requiresExternalApi && (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/50 text-amber-300 border border-amber-500/30"
          title={`可能需自備 API 金鑰：${cost.requiredApiProviders.join(', ')}`}
        >
          <Key className="w-3 h-3 text-amber-400" />
          <span>需自備 API Key</span>
        </span>
      )}

      {/* GPU 需求 */}
      {cost.requiresGpu && (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-500/30"
          title="推論運算需要獨立顯卡 (CUDA / VRAM)"
        >
          <Cpu className="w-3 h-3 text-purple-400" />
          <span>需 GPU</span>
        </span>
      )}

      {/* 部署方式 */}
      {cost.deploymentType === 'self-hosted' && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
          <Server className="w-3 h-3 text-cyan-400" />
          <span>可自架</span>
        </span>
      )}
      {cost.deploymentType === 'browser-run' && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
          <Laptop className="w-3 h-3 text-blue-400" />
          <span>免安裝純前端</span>
        </span>
      )}
    </div>
  );
};
