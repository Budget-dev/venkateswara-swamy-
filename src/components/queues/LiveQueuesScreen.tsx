import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ProbabilityBadge } from '../common/ProbabilityBadge';
import { CrowdIndicator } from '../common/CrowdIndicator';
import {
  Filter,
  Search,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  PlusCircle,
  ArrowUpDown,
  RefreshCw,
  Activity
} from 'lucide-react';
import { getQueueProbabilityDisplay } from '../../lib/queueUtils';

export const LiveQueuesScreen: React.FC = () => {
  const { locations, setCurrentView, setSelectedLocationId, setSelectedQueueId, openReportModal } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'chance' | 'reports' | 'wait'>('chance');

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      setPullProgress(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only track if pulling downwards
    if (diff > 0 && window.scrollY <= 0) {
      // Calculate progress (max visual pull distance ~100px)
      const progress = Math.min(diff / 100, 1);
      setPullProgress(progress);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    
    const diff = currentY.current - startY.current;
    if (diff > 80 && window.scrollY <= 0) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullProgress(1); // Lock at max progress visually while refreshing
      
      import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
      
      // Simulate network request/sync delay (Firebase is real-time, but this gives UX feedback)
      await new Promise(r => setTimeout(r, 1500));
      
      setIsRefreshing(false);
      setPullProgress(0);
      import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.light));
    } else {
      // Snap back if threshold not met
      setPullProgress(0);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (selectedFilter !== 'all' && loc.id !== selectedFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.shortAddress.toLowerCase().includes(q) ||
        (loc.queues || []).some((line) => line.name.toLowerCase().includes(q) || line.tokenSlotType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectQueue = (locId: string, queueId: string) => {
    setSelectedLocationId(locId);
    setSelectedQueueId(queueId);
    setCurrentView('queue-detail');
  };

  return (
    <div 
      className="space-y-4 pb-20 md:pb-8 animate-fade-in touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        style={{ 
          height: isRefreshing ? '60px' : `${pullProgress * 60}px`,
          opacity: isRefreshing ? 1 : pullProgress,
          overflow: 'hidden',
          transition: isRefreshing || !isPulling ? 'all 0.3s ease' : 'none'
        }}
        className="flex items-center justify-center w-full text-slate-500"
      >
        <div className="flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded-full w-10 h-10 transition-transform">
           <RefreshCw 
             className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} 
             style={{ transform: `rotate(${isRefreshing ? 0 : pullProgress * 360}deg)` }} 
           />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Live Queue Status
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time estimated probabilities across 3 counters and 12 queues.
          </p>
        </div>

        <button
          onClick={() => {
            import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
            openReportModal();
          }}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report My Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Locations
        </button>
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setSelectedFilter(loc.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === loc.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Search & Sort controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search line name or token type..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium text-slate-600 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="chance">Highest Ticket Chance</option>
            <option value="reports">Most Devotee Reports</option>
            <option value="wait">Shortest Wait Time</option>
          </select>
        </div>
      </div>

      {/* Counter Location Groups */}
      <div className="space-y-6">
        {filteredLocations.map((location) => {
          // Sort location queues based on user preference
          const sortedQueues = [...(location.queues || [])].sort((a, b) => {
            if (sortBy === 'chance') return b.estimatedProbability - a.estimatedProbability;
            if (sortBy === 'reports') return b.activeReportsCount - a.activeReportsCount;
            if (sortBy === 'wait') return a.estimatedWaitMinutes - b.estimatedWaitMinutes;
            return a.lineNumber - b.lineNumber;
          });

          return (
            <div key={location.id} className="space-y-3">
              {/* Location Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{location.name}</span>
                    <span className="text-xs font-semibold text-slate-500 font-normal">
                      ({location.shortAddress})
                    </span>
                  </h2>
                </div>

                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {location.totalReportsCount} total reports
                </span>
              </div>

              {/* Queues List */}
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                {sortedQueues.map((queue) => {
                  const probInfo = getQueueProbabilityDisplay(queue);
                  
                  // Map probability to specific header colors matching the reference
                  let headerBg = 'bg-slate-400';
                  let statusText = 'PENDING';
                  let pillClass = 'bg-slate-100 text-slate-700';
                  
                  if (probInfo.hasVotes) {
                    if (probInfo.statusLabel.includes('High')) {
                      headerBg = 'bg-[#43B97F]'; // Vibrant Green (Low Priority in ref image)
                      statusText = 'HIGH CHANCE';
                      pillClass = 'bg-[#EAF6F0] text-[#43B97F]';
                    } else if (probInfo.statusLabel.includes('Moderate')) {
                      headerBg = 'bg-[#F9923C]'; // Vibrant Orange (Moderate Priority in ref image)
                      statusText = 'MODERATE CHANCE';
                      pillClass = 'bg-[#FEF4EB] text-[#F9923C]';
                    } else if (probInfo.statusLabel.includes('Low')) {
                      headerBg = 'bg-[#EF4444]'; // Vibrant Red (Urgent in ref image)
                      statusText = 'LOW CHANCE';
                      pillClass = 'bg-[#FDECEC] text-[#EF4444]';
                    }
                  }

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      key={queue.id}
                      onClick={() => handleSelectQueue(location.id, queue.id)}
                      className="rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.15)] transition-all cursor-pointer overflow-hidden flex flex-col group bg-white border border-slate-100"
                    >
                      {/* Colored Top Header */}
                      <div className={`py-1.5 px-4 flex items-center justify-center ${headerBg}`}>
                        <span className="text-white text-[10px] font-bold uppercase tracking-[0.15em]">
                          {statusText}
                        </span>
                      </div>

                      {/* Inner White Body */}
                      <div className="p-2 bg-white">
                        {/* Inner Dashed Container */}
                        <div className="border border-dashed border-slate-200 rounded-[14px] p-4 flex flex-col gap-3">
                          
                          {/* Title and Pill Row */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 text-[15px] leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                                {queue.name}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                Current tracking for Line {queue.lineNumber} indicates a {probInfo.hasVotes ? probInfo.statusLabel.toLowerCase() : 'pending chance'} of securing {queue.tokenSlotType}.
                              </p>
                            </div>
                            
                            {/* Status Pill */}
                            <div className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold ${pillClass}`}>
                              {probInfo.hasVotes ? `${probInfo.percentageText} Chance` : 'Pending'}
                            </div>
                          </div>

                          {/* Footer Icons / Metrics */}
                          <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-slate-500 text-[11px] font-semibold">
                              {/* Wait Time */}
                              <div className="flex items-center gap-1.5" title="Estimated Wait">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{probInfo.hasVotes ? `~${queue.estimatedWaitMinutes || 10}m` : '--'}</span>
                              </div>
                              {/* Crowd */}
                              <div className="flex items-center gap-1.5" title="Crowd Level">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span className="capitalize">{probInfo.hasVotes ? queue.crowdLevel : 'No Data'}</span>
                              </div>
                              {/* Votes */}
                              <div className="flex items-center gap-1.5" title="Total Votes">
                                <div className="flex -space-x-1.5">
                                {/* Dummy overlapping avatars to mimic the reference image purely for visual flair */}
                                  <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0 overflow-hidden">
                                    <Users className="w-3 h-3 text-slate-400" />
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shrink-0 overflow-hidden">
                                    <Users className="w-3 h-3 text-slate-500" />
                                  </div>
                                </div>
                                <span className="ml-1">{queue.activeReportsCount || 0}</span>
                              </div>
                            </div>
                            
                            {/* Updated Time / Date equivalent */}
                            <div className="text-[11px] text-slate-400 font-medium tracking-wide">
                              {queue.lastUpdatedMinutesAgo === 0 ? 'Just now' : `${queue.lastUpdatedMinutesAgo}m ago`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
