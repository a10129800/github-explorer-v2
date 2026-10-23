import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800" />
            <div className="space-y-1.5 flex-1">
              <div className="w-20 h-3 bg-slate-800 rounded" />
              <div className="w-32 h-4 bg-slate-700 rounded" />
            </div>
            <div className="w-6 h-6 bg-slate-800 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/40 rounded-xl">
            <div className="h-4 bg-slate-800 rounded" />
            <div className="h-4 bg-slate-800 rounded" />
          </div>

          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-800 rounded" />
            <div className="w-4/5 h-3 bg-slate-800 rounded" />
          </div>

          <div className="flex gap-2">
            <div className="w-16 h-4 bg-slate-800 rounded-md" />
            <div className="w-16 h-4 bg-slate-800 rounded-md" />
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
            <div className="w-24 h-3 bg-slate-800 rounded" />
            <div className="flex gap-1.5">
              <div className="w-6 h-6 bg-slate-800 rounded-lg" />
              <div className="w-6 h-6 bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
