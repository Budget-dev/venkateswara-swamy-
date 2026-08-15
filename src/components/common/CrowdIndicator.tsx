import React from 'react';
import { CrowdLevel, TrendDirection } from '../../types';
import { Users, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

interface CrowdIndicatorProps {
  crowd: CrowdLevel;
  trend: TrendDirection;
  compact?: boolean;
}

export const CrowdIndicator: React.FC<CrowdIndicatorProps> = ({ crowd, trend, compact = false }) => {
  let crowdBadge = 'bg-slate-100 text-slate-700 border-slate-200';
  if (crowd === 'Low') crowdBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (crowd === 'Moderate') crowdBadge = 'bg-blue-50 text-blue-800 border-blue-200';
  if (crowd === 'High') crowdBadge = 'bg-blue-50 text-blue-800 border-blue-200';
  if (crowd === 'Very High') crowdBadge = 'bg-rose-50 text-rose-800 border-rose-200';

  const renderTrendIcon = () => {
    if (trend === 'Rapidly Increasing') return <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />;
    if (trend === 'Increasing') return <TrendingUp className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />;
    if (trend === 'Decreasing') return <TrendingDown className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${crowdBadge}`}>
          Crowd: {crowd}
        </span>
        <span className="flex items-center gap-0.5 text-slate-500">
          {renderTrendIcon()}
          <span>{trend}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 ${crowdBadge}`}>
        <Users className="w-3.5 h-3.5" />
        <span>Crowd: <strong className="font-semibold">{crowd}</strong></span>
      </div>
      <div className="flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md font-medium">
        {renderTrendIcon()}
        <span>Trend: <strong className="font-semibold">{trend}</strong></span>
      </div>
    </div>
  );
};
