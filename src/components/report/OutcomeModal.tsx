import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Ticket, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';

export const OutcomeModal: React.FC = () => {
  const { showOutcomeModal, setShowOutcomeModal, leaveQueue, activeReport } = useApp();
  const [outcome, setOutcome] = useState<'received_ticket' | 'no_ticket' | 'left_early' | 'unsure' | null>(null);
  const [waitMinutes, setWaitMinutes] = useState<number>(45);

  if (!showOutcomeModal || !activeReport) return null;

  const handleSubmitOutcome = () => {
    if (!outcome) return;
    import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.success));
    leaveQueue(outcome, waitMinutes);
    setShowOutcomeModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
        <button
          onClick={() => setShowOutcomeModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">What happened in the queue?</h3>
          <p className="text-xs text-slate-500 font-medium">
            {activeReport.locationName} · {activeReport.lineName}
          </p>
        </div>

        <div className="space-y-2">
          {[
            {
              id: 'received_ticket',
              label: 'I received my SSD token',
              icon: <Ticket className="w-4 h-4 text-emerald-600" />,
              style: 'hover:border-emerald-500 hover:bg-emerald-50'
            },
            {
              id: 'no_ticket',
              label: 'Tickets quota finished / No ticket',
              icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
              style: 'hover:border-rose-500 hover:bg-rose-50'
            },
            {
              id: 'left_early',
              label: 'I left the queue due to long wait',
              icon: <LogOut className="w-4 h-4 text-blue-600" />,
              style: 'hover:border-blue-500 hover:bg-blue-50'
            },
            {
              id: 'unsure',
              label: 'Not sure / Shifted to another line',
              icon: <CheckCircle2 className="w-4 h-4 text-slate-600" />,
              style: 'hover:border-slate-400 hover:bg-slate-50'
            }
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setOutcome(item.id as any)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                outcome === item.id
                  ? 'border-blue-600 bg-blue-50 shadow-xs'
                  : `border-slate-200/80 ${item.style}`
              }`}
            >
              {item.icon}
              <span className="text-xs font-bold text-slate-900">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Wait time input */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Approximate waiting time (minutes)
          </label>
          <input
            type="number"
            value={waitMinutes}
            onChange={(e) => setWaitMinutes(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSubmitOutcome}
          disabled={!outcome}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors"
        >
          Submit Outcome (+15 Devotee Karma)
        </button>
      </div>
    </div>
  );
};
