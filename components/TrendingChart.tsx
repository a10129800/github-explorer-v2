import React from 'react';
import { RepositorySnapshotData } from '@/lib/types';

interface Props {
  snapshots?: RepositorySnapshotData[];
  currentStars: number;
  className?: string;
}

export const TrendingChart: React.FC<Props> = ({
  snapshots = [],
  currentStars,
  className = '',
}) => {
  // 若快照少於 2 個點，繪製代表現況的單點或微幅活動提示，不捏造歷史
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className={`p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center ${className}`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>歷史趨勢快照</span>
          <span className="font-mono text-cyan-400 font-semibold">{currentStars.toLocaleString()} Stars</span>
        </div>
        <div className="h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-[11px] text-slate-500">
          系統正在積累歷史快照中（目前僅有 1 個觀測時間點）
        </div>
      </div>
    );
  }

  // 整理快照座標
  const points = [...snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );

  const starValues = points.map((p) => p.stars);
  const minStar = Math.min(...starValues);
  const maxStar = Math.max(...starValues);
  const range = maxStar - minStar || 1;

  const width = 360;
  const height = 90;
  const padding = 15;

  const svgPoints = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.stars - minStar) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polylineStr = svgPoints.join(' ');
  const firstPoint = svgPoints[0].split(',');
  const lastPoint = svgPoints[svgPoints.length - 1].split(',');
  const areaPolygonStr = `${firstPoint[0]},${height - padding} ${polylineStr} ${lastPoint[0]},${height - padding}`;

  const isGrowth = maxStar > minStar;

  return (
    <div className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Star 增長軌跡快照 ({points.length} 個採樣點)</span>
        <span className="font-mono text-xs font-bold text-slate-200">
          {isGrowth ? (
            <span className="text-emerald-400">+{maxStar - minStar} Stars</span>
          ) : (
            <span className="text-slate-400">穩定</span>
          )}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-black/40 p-2 border border-slate-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 填充漸變區域 */}
          <polygon points={areaPolygonStr} fill="url(#chartGradient)" />

          {/* 折線 */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* 採樣圓點 */}
          {points.map((p, idx) => {
            const [x, y] = svgPoints[idx].split(',');
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                className="fill-cyan-400 stroke-slate-900 stroke-2 hover:r-4 transition-all"
              >
                <title>{`${new Date(p.capturedAt).toLocaleString()}: ${p.stars.toLocaleString()} Stars`}</title>
              </circle>
            );
          })}
        </svg>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
          <span>{new Date(points[0].capturedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
          <span>{new Date(points[points.length - 1].capturedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};
