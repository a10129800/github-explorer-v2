'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Terminal, 
  Cpu, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import { StructuredExplanation } from '@/lib/enrichment/readmeParser';

interface Props {
  explanation: StructuredExplanation;
  rawReadmeSnippet?: string;
}

export const ReadmeExplainer: React.FC<Props> = ({ explanation, rawReadmeSnippet }) => {
  const [activeMode, setActiveMode] = useState<'quick' | 'install' | 'technical'>('quick');
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopyExplanation = () => {
    const text = `
【專案】：${explanation.sourceRepo.fullName}
【核心用途】：${explanation.purpose}
【適合情境】：${explanation.fitScenarios.join('、')}
【主要功能】：${explanation.mainFeatures.join('；')}
【Windows 安裝】：${explanation.windowsInstall.steps.join(' ')}
【硬體與 GPU】：${explanation.gpuRequirement.details}
【API 需求】：${explanation.apiKeyRequirement.details}
【授權條款】：${explanation.licenseAndCost.licenseName} (${explanation.licenseAndCost.commercialUseAllowed ? '允許商用' : '注意商用限制'})
【原始 README】：${explanation.rawReadmeUrl}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* 標題與模式切換列 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                README 繁體中文結構化解說
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {explanation.analysisType}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                自動抽取 11 項關鍵技術資訊，無需逐段閱讀冗長英文文件
              </p>
            </div>
          </div>
        </div>

        {/* 模式切換按鈕群 */}
        <div className="flex items-center gap-2 bg-[#131d31] p-1.5 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveMode('quick')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'quick'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            快速理解
          </button>
          <button
            onClick={() => setActiveMode('install')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'install'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            安裝教學
          </button>
          <button
            onClick={() => setActiveMode('technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'technical'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            技術細節
          </button>
        </div>
      </div>

      {/* 模式一：快速理解 */}
      {activeMode === 'quick' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1. 專案用途 */}
          <div className="bg-[#131d31]/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
              1. 這個專案是做什麼的
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">
              {explanation.purpose}
            </p>
          </div>

          {/* 2. 適合情境 */}
          <div className="bg-[#131d31]/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-2">
              2. 適合哪些使用情境
            </span>
            <ul className="space-y-1.5">
              {explanation.fitScenarios.map((s, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. 主要功能 */}
          <div className="bg-[#131d31]/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2">
              3. 主要核心功能亮點
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {explanation.mainFeatures.map((f, idx) => (
                <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 關鍵硬體與授權速覽 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">GPU / 算力門檻</span>
              <p className="text-xs font-bold text-slate-200">
                {explanation.gpuRequirement.required ? '需要獨立 GPU' : '一般 CPU 即可'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {explanation.gpuRequirement.details}
              </p>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">API 金鑰需求</span>
              <p className="text-xs font-bold text-slate-200">
                {explanation.apiKeyRequirement.required ? '需自備 API Key' : '無需外部 API (可自架)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {explanation.apiKeyRequirement.details}
              </p>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">開源授權與商用</span>
              <p className="text-xs font-bold text-slate-200">
                {explanation.licenseAndCost.licenseName}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {explanation.licenseAndCost.commercialUseAllowed ? '允許商業使用' : '請留意條款規範'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 模式二：安裝教學 */}
      {activeMode === 'install' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-[#131d31]/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Windows 安裝步驟指引
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {explanation.windowsInstall.isNative ? '原生支援' : '建議 WSL2'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {explanation.windowsInstall.steps.map((st, i) => (
                <div key={i} className="text-xs text-slate-200 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                  {st}
                </div>
              ))}
            </div>

            {explanation.windowsInstall.prerequisites.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">環境先決條件：</span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                  {explanation.windowsInstall.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 常用起步代碼 */}
          {explanation.gettingStarted.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-2">快速開始指令碼</span>
              {explanation.gettingStarted.map((cmd, i) => (
                <pre key={i} className="p-3 bg-black/60 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto mb-2 border border-slate-800/80">
                  <code>{cmd}</code>
                </pre>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 模式三：技術細節 */}
      {activeMode === 'technical' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#131d31]/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              已知限制與相容性注意事項
            </h4>
            <ul className="space-y-1.5">
              {explanation.knownLimitations.map((lim, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#131d31]/70 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">官方 Demo 資訊</h4>
            <p className="text-xs text-slate-300 mb-2">{explanation.officialDemo.statusNote}</p>
            {explanation.officialDemo.url && (
              <a
                href={explanation.officialDemo.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors"
              >
                開啟官方 Demo <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 底部工具列：複製解說、查看原始 README、外部連結 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyExplanation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已複製解說' : '複製解說內容'}
          </button>

          {rawReadmeSnippet && (
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
            >
              {showRaw ? '隱藏原始 README 片段' : '展開原始 README 片段'}
            </button>
          )}
        </div>

        <a
          href={explanation.rawReadmeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium"
        >
          查看 GitHub 原始 README
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 展開原始 README 片段 */}
      {showRaw && rawReadmeSnippet && (
        <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl max-h-96 overflow-y-auto">
          <p className="text-[11px] text-slate-500 mb-2 font-mono">
            // 以下為 GitHub 原始 README (純文字渲染，已過濾不安全腳本)
          </p>
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {rawReadmeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
