import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProbabilityBadge } from '../common/ProbabilityBadge';
import { CrowdIndicator } from '../common/CrowdIndicator';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  PlusCircle,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  Share2
} from 'lucide-react';
import { getQueueProbabilityDisplay } from '../../lib/queueUtils';

export const QueueDetailScreen: React.FC = () => {
  const {
    locations,
    selectedLocationId,
    selectedQueueId,
    setCurrentView,
    openReportModal
  } = useApp();

  const location = locations.find((l) => l.id === selectedLocationId) || locations[0];
  if (!location) return <div className="p-8 text-center text-slate-500">Loading queue...</div>;
  const queue = (location.queues || []).find((q) => q.id === selectedQueueId) || (location.queues || [])[0];
  if (!queue) return <div className="p-8 text-center text-slate-500">Loading queue...</div>;

  const probInfo = getQueueProbabilityDisplay(queue);

  const handleShare = async () => {
    import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.light));
    const waitText = probInfo.hasVotes ? `~${queue.estimatedWaitMinutes || 10} mins` : 'Pending';
    const crowdText = probInfo.hasVotes ? queue.crowdLevel : 'Unknown';
    const text = `Tirupati Q-Lines Live Status 🛕\n\n📍 ${location.name}\n🚶‍♂️ Line ${queue.lineNumber}: ${queue.name}\n🎟️ ${queue.tokenSlotType}\n\n⏱️ Est. Wait: ${waitText}\n👥 Crowd: ${crowdText}\n\nCheck live updates on the Tirupati Q-Lines App.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tirupati Q-Lines: ${queue.name}`,
          text: text,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Queue status copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  return (
    <div className="space-y-5 pb-28 md:pb-8 animate-fade-in relative">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('location-detail')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{location.name}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex text-xs font-semibold text-slate-500 items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {probInfo.hasVotes ? `Updated ${queue.lastUpdatedMinutesAgo || 1} min ago` : 'Awaiting Devotee Votes'}
          </span>
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm border border-slate-200/60"
            title="Share Queue Status"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Probability Highlight Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-md space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{location.name} · {location.shortAddress}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Line {queue.lineNumber}: {queue.name}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">{queue.tokenSlotType}</p>
        </div>

        {/* Large Probability Display / Voting Pending Display */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Ticket Availability Probability
            </span>
            <div className="flex items-baseline gap-3 mt-1.5">
              {probInfo.hasVotes ? (
                <>
                  <span className="text-5xl font-black tracking-tight text-white font-sans">
                    {probInfo.percentageText}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (probInfo.percentageValue || 0) >= 65
                        ? 'bg-emerald-500 text-slate-950'
                        : (probInfo.percentageValue || 0) >= 40
                        ? 'bg-blue-400 text-slate-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {probInfo.statusLabel}
                  </span>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black tracking-tight text-amber-300 font-sans">
                      Voting Pending
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      0 Votes
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    No crowd reports yet today. Be the first devotee to vote!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <span className="text-xs text-slate-400">Est. Waiting Time</span>
            <p className="text-2xl font-black text-blue-400">
              {probInfo.hasVotes ? `~${queue.estimatedWaitMinutes || 10} mins` : 'Pending Reports'}
            </p>
          </div>
        </div>

        {/* Queue Activity Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Devotee Votes</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{queue.activeReportsCount || 0}</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Recent Activity</span>
            <p className="text-xl font-extrabold text-blue-700 mt-0.5">+{queue.reportsLast15Min || 0}</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Crowd Density</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1 whitespace-nowrap">
              {probInfo.hasVotes ? queue.crowdLevel : 'No Data'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Queue Speed</span>
            <p className="text-sm font-extrabold text-slate-900 mt-1 whitespace-nowrap">
              {probInfo.hasVotes ? queue.trend : 'Stable'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Activity Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Queue Activity & Trend</h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time devotee reports and probability estimations
            </p>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
            Live Status
          </span>
        </div>

        {queue.activeReportsCount === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No devotee reports submitted yet today</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Be the first to report from this line! Real-time community reports help thousands of pilgrims plan their SSD darshan.
            </p>
          </div>
        ) : (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { time: 'Initial', chance: 100 },
                { time: 'Current', chance: queue.estimatedProbability }
              ]}>
                <defs>
                  <linearGradient id="chanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}% Chance`, 'Est. Probability']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="chance"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#chanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Ground Devotee Notes */}
      {queue.notes && (
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
          <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700">
            Devotee Ground Note
          </span>
          <p className="font-medium leading-relaxed text-blue-950">
            "{queue.notes}"
          </p>
        </div>
      )}

      {/* STICKY BOTTOM ACTION CTA */}
      <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-30 px-4 max-w-lg mx-auto">
        <button
          onClick={() => {
            import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
            openReportModal(location.id, queue.id);
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 border-2 border-blue-400/40"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.2]" />
          <span>I'm in this queue (Report Status)</span>
        </button>
      </div>
    </div>
  );
};
