import React from 'react';
import { ProbabilityLevel } from '../../types';

interface ProbabilityBadgeProps {
  percent: number;
  level: ProbabilityLevel;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showPercentOnly?: boolean;
}

export const ProbabilityBadge: React.FC<ProbabilityBadgeProps> = ({
  percent,
  level,
  size = 'md',
  showPercentOnly = false
}) => {
  // Determine color styling strictly according to probabilities
  // Green for High/Good (>= 60%), Amber for Medium (40-59%), Red for Low (< 40%)
  let bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let badgeColor = 'bg-emerald-600 text-white';
  let dotColor = 'bg-emerald-500';

  if (percent >= 70) {
    bgColor = 'bg-emerald-50 border-emerald-200/80 text-emerald-900';
    badgeColor = 'bg-emerald-600 text-white';
    dotColor = 'bg-emerald-500';
  } else if (percent >= 55) {
    bgColor = 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800';
    badgeColor = 'bg-emerald-500 text-white';
    dotColor = 'bg-emerald-400';
  } else if (percent >= 35) {
    bgColor = 'bg-blue-50 border-blue-200/80 text-blue-900';
    badgeColor = 'bg-blue-500 text-white';
    dotColor = 'bg-blue-500';
  } else {
    bgColor = 'bg-rose-50 border-rose-200/80 text-rose-900';
    badgeColor = 'bg-rose-600 text-white';
    dotColor = 'bg-rose-500';
  }

  if (size === 'hero') {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tracking-tight text-slate-900 font-sans">
          {percent}%
        </span>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${bgColor} flex items-center gap-1.5 shadow-xs`}>
          <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
          <span>{level} estimated chance</span>
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
          {percent}%
        </span>
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${bgColor} flex items-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          <span>{level} chance</span>
        </span>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${bgColor} inline-flex items-center gap-1`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        <span>{percent}% {level}</span>
      </span>
    );
  }

  // Default 'md'
  return (
    <div className={`px-2.5 py-1 rounded-lg border ${bgColor} flex items-center gap-1.5 shadow-2xs`}>
      <span className="text-sm font-extrabold">{percent}%</span>
      {!showPercentOnly && (
        <span className="text-xs font-semibold tracking-tight">· {level} chance</span>
      )}
    </div>
  );
};
