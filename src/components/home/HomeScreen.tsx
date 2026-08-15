import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import heroGopuramImg from '/src/assets/images/tirupati_gopuram_hero_1786616072376.jpg';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Navigation, MapPin, Sparkles, Clock, Users, ChevronLeft, ChevronRight, ArrowRight, Award } from 'lucide-react';
import { getQueueProbabilityDisplay } from '../../lib/queueUtils';

export const HomeScreen: React.FC = () => {
  const {
    setCurrentView,
    setSelectedLocationId,
    setSelectedQueueId,
    openReportModal,
    refreshData,
    setShowDisclaimerModal,
    locations
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [featuredLocationIndex, setFeaturedLocationIndex] = useState(0);
  const [selectedLineOverride, setSelectedLineOverride] = useState<string | null>(null);
  const lastUpdateTimeRef = useRef(new Date());

  // Swipe handling for Featured Counter
  const featuredTouchStartX = useRef(0);
  const featuredTouchEndX = useRef(0);

  const handleFeaturedTouchStart = (e: React.TouchEvent) => {
    featuredTouchStartX.current = e.touches[0].clientX;
    featuredTouchEndX.current = e.touches[0].clientX; // Reset end to start initially
  };

  const handleFeaturedTouchMove = (e: React.TouchEvent) => {
    featuredTouchEndX.current = e.touches[0].clientX;
  };

  const handleFeaturedTouchEnd = () => {
    if (!locations || locations.length <= 1) return;
    
    const diff = featuredTouchStartX.current - featuredTouchEndX.current;
    
    // threshold of 40px for a valid swipe
    if (Math.abs(diff) > 40) {
      setSelectedLineOverride(null);
      if (diff > 0) {
        // Swiped left -> next item
        setFeaturedLocationIndex(prev => (prev + 1) % locations.length);
      } else {
        // Swiped right -> prev item
        setFeaturedLocationIndex(prev => (prev - 1 + locations.length) % locations.length);
      }
    }
  };

  useEffect(() => {
    lastUpdateTimeRef.current = new Date();
    setCurrentTime(new Date());
  }, [locations]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const minutesAgo = Math.floor((currentTime.getTime() - lastUpdateTimeRef.current.getTime()) / 60000);
  const updatedText = minutesAgo === 0 ? 'just now' : `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;

  const handleOpenQueueDetail = (locId: string, queueId: string) => {
    setSelectedLocationId(locId);
    setSelectedQueueId(queueId);
    setCurrentView('queue-detail');
  };

  const handleOpenLocationDetail = (locId: string) => {
    setSelectedLocationId(locId);
    setCurrentView('location-detail');
  };

  return (
    <div className="space-y-3 animate-fade-in pb-12">
      {/* 1. HERO BANNER */}
      <Card className="relative overflow-hidden rounded-[24px] bg-background/60 backdrop-blur-xl border-white/40 shadow-sm min-h-[170px] flex flex-col justify-between">
        {/* Gopuram Tower Right Background Image with Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-[60%] overflow-hidden pointer-events-none">
          <img
            src={heroGopuramImg}
            alt="Tirumala Temple Gopuram"
            className="w-full h-full object-cover object-right opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <CardContent className="relative z-10 max-w-[220px] p-4 sm:p-5 space-y-1">
          <h1 className="text-xl font-black text-foreground leading-[1.25] tracking-tight">
            Know your best <br />
            chance of getting <br />
            <span className="text-blue-600">SSD token</span>
          </h1>

          <p className="text-[11px] text-muted-foreground font-medium leading-tight pt-1">
            Real-time queue updates from devotees like you
          </p>

          <div className="pt-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span>Live Updates</span>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground">
                {format(currentTime, 'h:mm a')} • Updated {updatedText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/40 hover:bg-white/60 text-foreground shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
                refreshData();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. FEATURED LIVE COUNTER CARD WITH MULTI-LINE SELECTION */}
      <section className="space-y-2">
        {(() => {
          if (!locations || locations.length === 0) {
            return (
              <Card className="bg-slate-50 border-slate-200 rounded-[24px] p-4 text-center text-slate-500 text-xs">
                Loading live counter data...
              </Card>
            );
          }

          const currentLoc = locations[featuredLocationIndex % locations.length] || locations[0];
          const queues = currentLoc.queues || [];
          
          // Find best line or use current override
          const bestQueue = queues.length > 0
            ? queues.reduce((best, curr) => (curr.estimatedProbability > best.estimatedProbability ? curr : best), queues[0])
            : null;
            
          const activeQueue = (selectedLineOverride && queues.find(q => q.id === selectedLineOverride)) 
            || bestQueue 
            || queues[0];

          if (!activeQueue) {
            return null;
          }

          const probInfo = getQueueProbabilityDisplay(activeQueue);

          const handlePrevLocation = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedLineOverride(null);
            setFeaturedLocationIndex(prev => (prev - 1 + locations.length) % locations.length);
          };

          const handleNextLocation = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedLineOverride(null);
            setFeaturedLocationIndex(prev => (prev + 1) % locations.length);
          };

          return (
            <div 
              className="space-y-2 touch-pan-y"
              onTouchStart={handleFeaturedTouchStart}
              onTouchMove={handleFeaturedTouchMove}
              onTouchEnd={handleFeaturedTouchEnd}
            >
              <Card 
                onClick={() => handleOpenQueueDetail(currentLoc.id, activeQueue.id)}
                className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border-emerald-200/60 rounded-[24px] shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer overflow-hidden relative group"
              >
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Minimal Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                          Featured Counter
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">
                        {currentLoc.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {currentLoc.shortAddress}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-emerald-100/50 border-emerald-200/70 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5">
                        {currentLoc.totalReportsCount || 0} Votes
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openReportModal(currentLoc.id, activeQueue.id);
                        }}
                        className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-emerald-100 shadow-xs hover:bg-emerald-50 hover:scale-105 transition-all text-emerald-600"
                        title="Update Status"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sleek Line Selector */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-emerald-100/50">
                    {queues.map((q) => {
                      const isSelected = q.id === activeQueue.id;
                      const isBest = bestQueue && q.id === bestQueue.id;
                      return (
                        <button
                          key={q.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLineOverride(q.id);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 relative ${
                            isSelected
                              ? 'text-emerald-900 bg-emerald-100/80 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>Line {q.lineNumber}</span>
                          {isBest && <span className="text-[10px] opacity-80">⭐</span>}
                          {isSelected && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-600 rounded-t-md" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Flat Stats Layout */}
                  <div className="pt-1">
                    <div className="flex flex-col mb-3">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                        {activeQueue.tokenSlotType}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {activeQueue.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Est. Wait</span>
                          </div>
                          <span className="font-extrabold text-sm text-slate-900">
                            {probInfo.hasVotes ? `~${activeQueue.estimatedWaitMinutes || 15}m` : '--'}
                          </span>
                        </div>
                        
                        <div className="w-px h-8 bg-emerald-200/50"></div>
                        
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Crowd</span>
                          </div>
                          <span className="font-extrabold text-sm text-slate-900 capitalize">
                            {probInfo.hasVotes ? activeQueue.crowdLevel : '--'}
                          </span>
                        </div>
                      </div>

                      <div className={`rounded-2xl py-1.5 px-3 text-center ${probInfo.pillBgClass} shadow-xs flex flex-col items-center justify-center min-w-[70px]`}>
                        {probInfo.hasVotes ? (
                          <>
                            <span className={`text-xl font-black font-sans leading-none ${probInfo.textClass}`}>
                              {probInfo.percentageText}
                            </span>
                            <span className={`text-[9px] font-bold mt-0.5 whitespace-nowrap ${probInfo.textClass}`}>
                              {probInfo.statusLabel}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-extrabold text-amber-800 whitespace-nowrap leading-tight">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Details Subtle Hint */}
                  <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    View full report <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Carousel Pagination Dots */}
              <div className="flex items-center justify-center gap-2 pt-1.5 pb-2">
                {locations.map((l, idx) => {
                  const isCurrent = idx === (featuredLocationIndex % locations.length);
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLineOverride(null);
                        setFeaturedLocationIndex(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        isCurrent 
                          ? 'w-6 bg-emerald-500' 
                          : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`Go to ${l.name}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* 3. ALL COUNTERS OVERVIEW */}
      <section className="space-y-2.5 pt-0.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-foreground tracking-tight">
            All Counters Overview
          </h2>
          <Button
            variant="link"
            size="sm"
            onClick={() => setCurrentView('live-queues')}
            className="text-xs font-bold text-indigo-600 h-auto p-0 hover:text-indigo-700"
          >
            <span>View all</span>
            <i className="fa-solid fa-chevron-right text-[10px] ml-1"></i>
          </Button>
        </div>

        {/* Dynamic Vertical Stack Cards from real Firestore data */}
        <div className="flex flex-col gap-2">
          {locations.map((loc) => {
            const queues = loc.queues || [];
            const votedQueues = queues.filter(q => (q.activeReportsCount || 0) > 0);
            const bestLine = votedQueues.length > 0
              ? votedQueues.reduce((best, q) => (!best || q.estimatedProbability > best.estimatedProbability ? q : best), votedQueues[0])
              : queues[0];

            const iconClass =
              loc.id === 'srinivasam'
                ? 'fa-bus'
                : loc.id === 'vishnu-nivasam'
                ? 'fa-train'
                : 'fa-shoe-prints';

            const probInfo = getQueueProbabilityDisplay(bestLine);

            return (
              <Card
                key={loc.id}
                onClick={() => handleOpenLocationDetail(loc.id)}
                className={`bg-white/80 backdrop-blur-sm rounded-[20px] border-slate-100 shadow-sm ${probInfo.bgClass} hover:shadow-md transition-all cursor-pointer`}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
                      <i className={`fa-solid ${iconClass} text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground text-sm">{loc.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Best:</span>
                        <span className="text-[11px] font-bold text-foreground">
                          {bestLine ? `Line ${bestLine.lineNumber}` : 'Line 1'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({loc.totalReportsCount || 0} vote{(loc.totalReportsCount || 0) !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {probInfo.hasVotes ? (
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-black ${probInfo.textClass} font-sans block leading-none`}>
                            {probInfo.percentageText}
                          </span>
                          <span className={`text-[10px] font-extrabold ${probInfo.textClass} block mt-0.5 whitespace-nowrap`}>
                            {probInfo.statusLabel}
                          </span>
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
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-chevron-right text-[10px] text-slate-600"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. "ALREADY IN A QUEUE?" CTA BANNER */}
      <Card className="bg-white/80 backdrop-blur-sm rounded-[20px] border-slate-100 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
              <i className="fa-solid fa-user-plus text-sm"></i>
            </div>
            <div>
              <h3 className="font-black text-foreground text-xs">Already in a queue?</h3>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
                Report your queue to help other devotees
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
              openReportModal();
            }}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] uppercase tracking-wide flex items-center gap-1 shadow-[0_4px_14px_0_rgba(147,51,234,0.39)] shrink-0 h-8 px-3"
          >
            <span>I'M IN A QUEUE</span>
            <i className="fa-solid fa-chevron-right text-[9px]"></i>
          </Button>
        </CardContent>
      </Card>

      {/* 5. "COMMUNITY-DRIVEN ESTIMATES ONLY" DISCLAIMER BANNER */}
      <Card className="bg-blue-50/80 backdrop-blur-sm rounded-[20px] border-blue-200/60 shadow-sm">
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <i className="fa-solid fa-shield-halved text-xs"></i>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-foreground text-xs">Community-driven estimates only</h4>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                Not affiliated with TTD. Estimates based on devotee reports and historical data.
              </p>
            </div>
          </div>

          <Button
            variant="link"
            size="sm"
            onClick={() => setShowDisclaimerModal(true)}
            className="text-[11px] font-bold text-blue-700 h-auto p-0 hover:text-blue-800 shrink-0 whitespace-nowrap"
          >
            <span>Learn more</span>
            <i className="fa-solid fa-chevron-right text-[9px] ml-0.5"></i>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

