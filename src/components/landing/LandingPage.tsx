import React from 'react';
import { useApp } from '../../context/AppContext';
import { FAQ_ITEMS } from '../../data/initialData';
import { DisclaimerCard } from '../common/DisclaimerCard';
import {
  Sparkles,
  Compass,
  PlusCircle,
  ShieldCheck,
  MapPin,
  Clock,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Users,
  CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView, openReportModal, locations } = useApp();

  return (
    <div className="space-y-10 pb-20 md:pb-8 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center max-w-2xl mx-auto space-y-4 pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Independent Devotee Queue Intelligence</span>
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Don't waste hours finding the right queue.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
          See live community queue updates and estimated ticket availability probabilities across Srinivasam, Vishnu Nivasam, and Bhudevi Complex.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentView('home')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span>Check Live Queues</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openReportModal()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-sm flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>I'm in a Queue</span>
          </button>
        </div>
      </section>

      {/* Problem & Solution Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            The Problem
          </span>
          <h3 className="text-lg font-bold text-slate-900">Endless Guesswork Between Counters</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Devotees arrive in Tirupati and travel blindly between Srinivasam, Vishnu Nivasam, and Bhudevi Complex without knowing where tickets are currently being issued.
          </p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            The Solution
          </span>
          <h3 className="text-lg font-bold text-slate-900">Live Devotee Intelligence</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tirupati QLines collects location-verified updates from devotees waiting at lines and calculates real-time ticket availability probabilities.
          </p>
        </div>
      </section>

      {/* Three Counter Locations Overview */}
      <section className="space-y-4">
        <div className="text-center max-w-md mx-auto space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Supported Tirupati Counters</h2>
          <p className="text-xs text-slate-500">Live tracking across the 3 major ticket complex hubs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => setCurrentView('home')}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-base">{loc.name}</h3>
              </div>
              <p className="text-xs text-slate-500">{loc.landmark}</p>
              <div className="p-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 flex justify-between">
                <span>Best Ticket Chance</span>
                <span className="text-emerald-700 font-bold">{loc.bestLineChance}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <DisclaimerCard />
    </div>
  );
};
