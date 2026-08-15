import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 w-2/3">
          <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
          <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
        </div>
        <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
      </div>
      <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 bg-slate-100 rounded-md w-24"></div>
        <div className="h-3 bg-slate-100 rounded-md w-16"></div>
      </div>
    </div>
  );
};
