import React from 'react';

export const TabLoadingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading tab content..."
      className="space-y-6 animate-pulse select-none"
    >
      {/* Top Banner / Actions Skeleton */}
      <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-2 w-full sm:w-1/3">
          <div className="h-5 bg-slate-800 rounded-lg w-3/4"></div>
          <div className="h-3 bg-slate-800/60 rounded-md w-1/2"></div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="h-8 bg-slate-800 rounded-xl w-24"></div>
          <div className="h-8 bg-amber-500/20 rounded-xl w-32 border border-amber-500/30"></div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column / Summary Card */}
        <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 md:col-span-1 shadow-lg">
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-10 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-10 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-20 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
          </div>
        </div>

        {/* Center / Right Columns */}
        <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-4 bg-slate-800/60 rounded w-1/6"></div>
          </div>
          <div className="space-y-3 pt-1">
            <div className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
            <div className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/80"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
