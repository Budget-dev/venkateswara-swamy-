import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProbabilityBadge } from '../common/ProbabilityBadge';
import { CrowdIndicator } from '../common/CrowdIndicator';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  PlusCircle,
  Navigation,
  Info
} from 'lucide-react';
import { getQueueProbabilityDisplay } from '../../lib/queueUtils';

export const LocationDetailScreen: React.FC = () => {
  const {
    locations,
    selectedLocationId,
    setCurrentView,
    setSelectedQueueId,
    openReportModal
  } = useApp();

  const location = locations.find((l) => l.id === selectedLocationId) || locations[0];
  if (!location) return <div className="p-8 text-center text-slate-500">Loading location...</div>;

  const handleSelectQueue = (queueId: string) => {
    setSelectedQueueId(queueId);
    setCurrentView('queue-detail');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Status · Updated 2m ago</span>
        </span>
      </div>

      {/* Location Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{location.shortAddress}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {location.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Operating hours: <strong className="text-slate-800">{location.operatingHours}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
                openReportModal(location.id);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Queue Here</span>
            </button>
          </div>
        </div>

        {/* Quick Location Stats */}
        {(() => {
          const queues = location.queues || [];
          const votedQueues = queues.filter(q => (q.activeReportsCount || 0) > 0);
          const bestLine = votedQueues.length > 0
            ? votedQueues.reduce((best, q) => (!best || q.estimatedProbability > best.estimatedProbability ? q : best), votedQueues[0])
            : null;
          const bestProbInfo = getQueueProbabilityDisplay(bestLine);

          return (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Best Chance</span>
                <p className={`text-base font-black whitespace-nowrap ${bestProbInfo.hasVotes ? bestProbInfo.textClass : 'text-amber-700'}`}>
                  {bestProbInfo.hasVotes ? bestProbInfo.percentageText : 'Voting Pending'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Active Lines</span>
                <p className="text-base font-black text-slate-900 whitespace-nowrap">{queues.length} Lines</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Devotee Votes</span>
                <p className="text-base font-black text-slate-900 whitespace-nowrap">{location.totalReportsCount || 0}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Queues Breakdown */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Current Lines Status at {location.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(location.queues || []).map((queue) => {
            const probInfo = getQueueProbabilityDisplay(queue);
            return (
              <div
                key={queue.id}
                onClick={() => handleSelectQueue(queue.id)}
                className={`bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs ${probInfo.bgClass} hover:shadow-md transition-all cursor-pointer space-y-3 group`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-bold text-xs">
                        Line {queue.lineNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {queue.tokenSlotType}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1 group-hover:text-blue-800 transition-colors">
                      {queue.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    {probInfo.hasVotes ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-3xl font-black font-sans block leading-none ${probInfo.textClass}`}>
                          {probInfo.percentageText}
                        </span>
                        <p className={`text-[10px] font-bold uppercase mt-0.5 whitespace-nowrap ${probInfo.textClass}`}>
                          {probInfo.statusLabel}
                        </p>
                      </div>
                    ) : (
                      <div className="py-1 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-right flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="text-[11px] font-extrabold text-amber-800">
                          Voting Pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {queue.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 italic">
                    "{queue.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {queue.activeReportsCount || 0} votes · {probInfo.hasVotes ? `~${queue.estimatedWaitMinutes || 10}m wait` : 'Awaiting Devotee Reports'}
                  </span>

                  <CrowdIndicator
                    crowd={probInfo.hasVotes ? queue.crowdLevel : 'Low'}
                    trend={probInfo.hasVotes ? queue.trend : 'Stable'}
                    compact
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
