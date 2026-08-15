import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CounterLocation, QueueLine } from '../../types';
import {
  X,
  Compass,
  Navigation,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Haversine formula to compute distance in km
function calculateDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const FindBestQueueModal: React.FC = () => {
  const {
    showFindBestModal,
    setShowFindBestModal,
    locations,
    setSelectedLocationId,
    setSelectedQueueId,
    setCurrentView
  } = useApp();

  const [isLocating, setIsLocating] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    bestLocation: CounterLocation;
    bestQueue: QueueLine;
    alternatives: { location: CounterLocation; queue: QueueLine }[];
  } | null>(null);

  const findBestQueue = (
    userLat?: number,
    userLng?: number
  ): { bestLocation: CounterLocation; bestQueue: QueueLine; alternatives: { location: CounterLocation; queue: QueueLine }[] } => {
    let locs = [...locations];
    if (userLat !== undefined && userLng !== undefined) {
      locs = locs.map((loc) => ({
        ...loc,
        distanceKm: calculateDistanceKm(userLat, userLng, loc.latitude, loc.longitude)
      }));
    }

    const candidates: { location: CounterLocation; queue: QueueLine; score: number }[] = [];
    for (const loc of locs) {
      for (const q of (loc.queues || [])) {
        if (!q.isActive) continue;
        const distPenalty = (loc.distanceKm || 1) * 3;
        const score = q.estimatedProbability - distPenalty;
        candidates.push({ location: loc, queue: q, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0] || {
      location: locs[0],
      queue: (locs[0].queues || [])[0],
      score: 100
    };
    const alts = candidates.slice(1, 4).map((c) => ({
      location: c.location,
      queue: c.queue
    }));

    return {
      bestLocation: top.location,
      bestQueue: top.queue,
      alternatives: alts
    };
  };

  const handleStartSearch = () => {
    setIsLocating(true);
    setRecommendation(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const res = findBestQueue(pos.coords.latitude, pos.coords.longitude);
          setRecommendation(res);
          setIsLocating(false);
        },
        () => {
          const res = findBestQueue();
          setRecommendation(res);
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        const res = findBestQueue();
        setRecommendation(res);
        setIsLocating(false);
      }, 500);
    }
  };

  const handleViewQueue = (locId: string, queueId: string) => {
    setSelectedLocationId(locId);
    setSelectedQueueId(queueId);
    setShowFindBestModal(false);
    setCurrentView('queue-detail');
  };

  if (!showFindBestModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFindBestModal(false)}
            className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!isLocating && !recommendation ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
              <Compass className="w-10 h-10 text-indigo-600" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full animate-ping"></span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Find the Best SSD Token Queue</h2>
              <p className="text-sm text-slate-500 font-medium">
                We'll analyze live crowd data and your current location to find the fastest queue.
              </p>
            </div>
            <Button
              onClick={handleStartSearch}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 font-bold text-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start Scan
            </Button>
          </div>
        ) : isLocating ? (
          <div className="p-12 text-center space-y-6 flex flex-col items-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Scanning Queues...</h3>
              <p className="text-xs text-slate-500 font-medium">Analyzing real-time updates</p>
            </div>
          </div>
        ) : recommendation ? (
          <div className="bg-slate-50 flex flex-col max-h-[85vh]">
            <div className="p-5 pb-4 bg-white border-b border-slate-100 text-center relative z-10 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
                <CheckCircle2 className="w-3 h-3" />
                Optimal Queue Found
              </div>
              <h2 className="text-[22px] font-black text-slate-900 leading-tight">
                {recommendation.bestQueue.name}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {recommendation.bestLocation.name}
              </p>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <Card className="bg-indigo-600 border-none shadow-md overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <CardContent className="p-5 relative z-10 text-white space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider block">
                        Estimated Wait
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{recommendation.bestQueue.estimatedWaitMinutes}</span>
                        <span className="text-sm font-bold text-indigo-200">mins</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider block">
                        Ticket Probability
                      </span>
                      <span className="text-3xl font-black">{recommendation.bestQueue.estimatedProbability}%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-indigo-500/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-300" />
                      <span className="text-xs font-medium text-indigo-100">
                        Based on {recommendation.bestQueue.activeReportsCount} recent reports
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {recommendation.alternatives.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    Good Alternatives
                  </h3>
                  <div className="space-y-2">
                    {recommendation.alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleViewQueue(alt.location.id, alt.queue.id)}
                        className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <span className="text-xs font-black text-slate-700 group-hover:text-indigo-700">{alt.queue.estimatedProbability}%</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {alt.queue.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                              {alt.location.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Clock className="w-3 h-3" />
                            {alt.queue.estimatedWaitMinutes}m
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {alt.location.distanceKm ? `${alt.location.distanceKm}km` : 'Nearby'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <Button
                onClick={() => handleViewQueue(recommendation.bestLocation.id, recommendation.bestQueue.id)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 font-bold text-sm flex items-center justify-between px-6"
              >
                <span>Navigate to Best Queue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
