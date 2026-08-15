import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, MapPin, Users, CheckCircle2, LogOut } from 'lucide-react';

export const ActiveQueueBanner: React.FC = () => {
  const {
    activeReport,
    updatePresence,
    setShowOutcomeModal,
    locations
  } = useApp();

  if (!activeReport) return null;

  const loc = locations.find((l) => l.id === activeReport.locationId);
  const queue = (loc?.queues || []).find((q) => q.id === activeReport.queueId);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 shadow-lg border border-slate-700/80 space-y-3 my-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Active Queue Session
          </span>
          <h3 className="text-base font-extrabold text-white mt-1">
            {activeReport.locationName} · {activeReport.lineName}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Group size: {activeReport.peopleCount} devotees · Last checked: {activeReport.timestamp}
          </p>
        </div>

        {queue && (
          <div className="text-right shrink-0 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xl font-black text-blue-400 font-sans">
              {queue.estimatedProbability}%
            </span>
            <p className="text-[9px] font-bold text-slate-300 uppercase">
              {queue.probabilityLevel}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => {
            import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.light));
            updatePresence();
          }}
          className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>I'm Still Here</span>
        </button>

        <button
          onClick={() => {
            import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.light));
            setShowOutcomeModal(true);
          }}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 border border-slate-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>I Left Queue</span>
        </button>
      </div>
    </div>
  );
};
