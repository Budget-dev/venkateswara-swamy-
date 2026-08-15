import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  CheckCircle2,
  Navigation,
  Users,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Award,
  TrendingUp,
  Clock,
  Heart,
  Check
} from 'lucide-react';
import { getQueueProbabilityDisplay } from '../../lib/queueUtils';

export const ReportFlowModal: React.FC = () => {
  const {
    showReportModal,
    setShowReportModal,
    reportPreselectedLocationId,
    reportPreselectedQueueId,
    locations,
    submitReport,
    setCurrentView
  } = useApp();

  // Wizard step state
  const [step, setStep] = useState<number>(1);
  const [selectedLocId, setSelectedLocId] = useState<string>('vishnu-nivasam');
  const [selectedQueueId, setSelectedQueueId] = useState<string>('vishnu-line-2');
  const [peopleCount, setPeopleCount] = useState<number>(2);

  const [submitted, setSubmitted] = useState<boolean>(false);

  // Initialize selected values from props/defaults
  useEffect(() => {
    if (showReportModal) {
      setStep(1);
      setSubmitted(false);
      if (reportPreselectedLocationId) {
        setSelectedLocId(reportPreselectedLocationId);
        const loc = locations.find((l) => l.id === reportPreselectedLocationId);
        if (loc) {
          if (reportPreselectedQueueId) {
            setSelectedQueueId(reportPreselectedQueueId);
          } else if (loc.queues && loc.queues.length > 0) {
            setSelectedQueueId(loc.queues[0].id);
          }
        }
      }
    }
  }, [showReportModal, reportPreselectedLocationId, reportPreselectedQueueId, locations]);

  if (!showReportModal) return null;

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || locations[0];
  if (!selectedLoc) return null;
  const selectedQueue = (selectedLoc.queues || []).find((q) => q.id === selectedQueueId) || (selectedLoc.queues || [])[0];

  const handleLocSelect = (locId: string) => {
    setSelectedLocId(locId);
    const loc = locations.find((l) => l.id === locId);
    if (loc && loc.queues && loc.queues.length > 0) setSelectedQueueId(loc.queues[0].id);
  };

  const handleSubmitReport = () => {
    import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.success));
    submitReport(selectedLocId, selectedQueueId, peopleCount, undefined, undefined);
    setSubmitted(true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      });
    } catch (e) {
      console.warn('Confetti error', e);
    }
  };

  const handleClose = () => {
    setShowReportModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <>
            {/* Step Progress indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Step {step} of 3 · Devotee Voting (No Sign In Needed)
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {step === 1 && 'Select Counter Location'}
                  {step === 2 && 'Which Line are you in?'}
                  {step === 3 && 'How many people with you?'}
                </h3>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-5 h-1.5 rounded-full transition-all ${
                      i <= step ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* STEP 1: SELECT LOCATION */}
            {step === 1 && (
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-500 font-medium">
                  Which counter are you currently at?
                </p>

                <div className="space-y-2">
                  {locations.map((loc, idx) => (
                    <div
                      key={loc.id || `loc-${idx}`}
                      onClick={() => handleLocSelect(loc.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedLocId === loc.id
                          ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{loc.name}</span>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {loc.shortAddress} · {loc.totalReportsCount || 0} votes
                        </p>
                      </div>

                      {selectedLocId === loc.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Next: Select Line</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SELECT LINE */}
            {step === 2 && (
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-500 font-medium">
                  Selected counter: <strong className="text-slate-900">{selectedLoc.name}</strong>
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(selectedLoc.queues || []).map((queue, idx) => {
                    const probInfo = getQueueProbabilityDisplay(queue);
                    return (
                      <div
                        key={queue.id || `q-${idx}`}
                        onClick={() => setSelectedQueueId(queue.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedQueueId === queue.id
                            ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                            : 'border-slate-200/80 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-bold text-[11px]">
                              Line {queue.lineNumber}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {queue.tokenSlotType}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{queue.name}</h4>
                        </div>

                        <div className="text-right">
                          {probInfo.hasVotes ? (
                            <>
                              <span className={`text-xl font-black font-sans ${probInfo.textClass}`}>
                                {probInfo.percentageText}
                              </span>
                              <p className={`text-[9px] font-bold uppercase ${probInfo.textClass}`}>
                                {probInfo.statusLabel}
                              </p>
                            </>
                          ) : (
                            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Voting Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Next: Group Size</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GROUP SIZE & SUBMIT */}
            {step === 3 && (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {selectedLoc.name} · Line {selectedQueue.lineNumber}
                </p>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 max-w-xs mx-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Devotees in your group
                  </span>

                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                      className="w-12 h-12 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-xl flex items-center justify-center shadow-xs active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <span className="text-4xl font-black text-slate-900 font-sans w-16 text-center">
                      {peopleCount}
                    </span>

                    <button
                      onClick={() => setPeopleCount(Math.min(20, peopleCount + 1))}
                      className="w-12 h-12 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-xl flex items-center justify-center shadow-xs active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs font-medium text-slate-600">
                    {peopleCount === 1 ? 'Just yourself' : `${peopleCount} people including you`}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 text-left flex items-start gap-2.5 max-w-xs mx-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-900 leading-tight">
                    Guest voting is live. No account required. Your vote updates the line's real probability instantly.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>Submit Devotee Vote</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* POLISHED POST-VOTING CONFIRMATION CARD */
          <div className="py-2 text-center space-y-4 animate-scale-up">
            {/* Top Blessed Icon & Badge */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full inline-block">
                ✨ Govinda! Vote Recorded ✨
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                Thank You for Helping Pilgrims!
              </h3>
              <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
                Your live queue report has successfully updated the real-time algorithm for all Tirumala devotees.
              </p>
            </div>

            {/* Premium Details Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 rounded-2xl p-4.5 text-white shadow-xl border border-slate-800 text-left space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{selectedLoc.name}</h4>
                    <p className="text-[10px] text-slate-400">{selectedLoc.shortAddress}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Report
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Line Selected</span>
                  <span className="font-extrabold text-sm text-white block mt-0.5">
                    Line {selectedQueue.lineNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">{selectedQueue.tokenSlotType}</span>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Devotees Reported</span>
                  <span className="font-extrabold text-sm text-amber-300 block mt-0.5">
                    {peopleCount} Devotee{peopleCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Saved as Guest</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-600/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-300">Live Probability Recalculated</span>
                </div>
                <span className="font-black text-emerald-400">
                  Updated Live
                </span>
              </div>
            </div>

            {/* Karma / Contribution Badge */}
            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-extrabold text-xs text-blue-900 block">
                  Seva Karma +10 Points Earned
                </span>
                <p className="text-[11px] text-blue-700 leading-tight mt-0.5">
                  Your report helps over 15,000+ daily Tirumala pilgrims make informed darshan plans.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowReportModal(false);
                setCurrentView('home');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-98"
            >
              View Updated Live Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
