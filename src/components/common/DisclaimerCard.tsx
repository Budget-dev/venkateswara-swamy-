import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Info, X, ExternalLink } from 'lucide-react';

export const DisclaimerCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { setShowDisclaimerModal } = useApp();

  if (compact) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-slate-800">Community-driven estimates</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Not affiliated with TTD. Probabilities are estimated from devotee reports and queue movement.
          </p>
        </div>
        <button
          onClick={() => setShowDisclaimerModal(true)}
          className="text-blue-700 font-bold hover:underline shrink-0 text-[11px] mt-0.5"
        >
          Learn more
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-slate-900 text-sm">Independent Community Platform</h4>
      </div>
      <p className="text-slate-600 leading-relaxed">
        <strong>Tirupati QLines</strong> is an independent community intelligence tool built for devotees.
        We are <strong>NOT affiliated with Tirumala Tirupati Devasthanams (TTD)</strong>. All queue percentages and crowd estimates are community-driven calculations based on real-time reports from devotees present at the counters and historical queue trends.
      </p>
      <div className="pt-1 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">Actual ticket issuance is controlled strictly by TTD authorities.</span>
        <button
          onClick={() => setShowDisclaimerModal(true)}
          className="text-blue-800 font-bold hover:underline text-xs"
        >
          Read Full Disclaimer
        </button>
      </div>
    </div>
  );
};

export const DisclaimerModal: React.FC = () => {
  const { showDisclaimerModal, setShowDisclaimerModal } = useApp();

  if (!showDisclaimerModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowDisclaimerModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Trust & Transparency</h3>
            <p className="text-xs text-slate-500 font-medium">Tirupati QLines Disclaimer</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-1">
              Important Notice
            </h4>
            <p className="text-xs font-semibold text-slate-800">
              Tirupati QLines is NOT an official TTD application and has no direct affiliation with Tirumala Tirupati Devasthanams.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">1. Estimated Probabilities</h4>
            <p className="text-xs text-slate-600 mt-1">
              All percentages (e.g. "76% High chance") represent community-based estimations calculated using live devotee updates, report velocity, queue movement rates, and historical data. They do not constitute a guarantee of ticket issuance.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">2. Community Powered</h4>
            <p className="text-xs text-slate-600 mt-1">
              Reports are submitted voluntarily by fellow devotees physically at Srinivasam, Vishnu Nivasam, and Bhudevi Complex. We use location verification algorithms to maintain accuracy, but conditions on ground can shift rapidly.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">3. Official Authority</h4>
            <p className="text-xs text-slate-600 mt-1">
              Counter openings, token quotas, and slot allocations are determined solely by TTD authorities. Always adhere to instructions from official staff at counter premises.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowDisclaimerModal(false)}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
