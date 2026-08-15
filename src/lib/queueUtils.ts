import { QueueLine } from '../types';

export interface QueueProbabilityDisplay {
  hasVotes: boolean;
  percentageText: string;
  percentageValue: number | null;
  statusLabel: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  pillBgClass: string;
  indicatorColor: string;
  description: string;
}

/**
 * Calculates and formats queue line availability probability and voting status.
 * If a line has no active reports/votes, it returns "Voting Pending" instead of a misleading 100%.
 */
export function getQueueProbabilityDisplay(q?: QueueLine | null): QueueProbabilityDisplay {
  if (!q) {
    return {
      hasVotes: false,
      percentageText: 'Voting Pending',
      percentageValue: null,
      statusLabel: 'Voting Pending',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      textClass: 'text-amber-700',
      bgClass: 'hover:border-amber-200',
      pillBgClass: 'bg-amber-100/90 border-amber-200/80',
      indicatorColor: 'bg-amber-500',
      description: 'Awaiting first devotee report',
    };
  }

  const reportsCount = q.activeReportsCount || 0;

  // If no devotee has reported/voted on this line yet
  if (reportsCount === 0) {
    return {
      hasVotes: false,
      percentageText: 'Voting Pending',
      percentageValue: null,
      statusLabel: 'Voting Pending',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      textClass: 'text-amber-700',
      bgClass: 'hover:border-amber-200',
      pillBgClass: 'bg-amber-100/90 border-amber-200/80',
      indicatorColor: 'bg-amber-500',
      description: 'Awaiting devotee votes',
    };
  }

  // Calculate dynamic percentage based on real active crowd reports and wait time
  // Rather than hardcoded 100%, line percentage scales with devotee headcount and wait velocity
  const baseProb = q.estimatedProbability !== undefined && q.estimatedProbability > 0 && q.estimatedProbability <= 100
    ? q.estimatedProbability
    : Math.max(10, Math.min(94, Math.round(96 - (reportsCount * 2.8) - ((q.estimatedWaitMinutes || 0) * 0.35))));

  // Clamp realistic percentage (avoid 100% since crowds fluctuate)
  const realisticProb = Math.max(8, Math.min(95, baseProb));

  if (realisticProb >= 75) {
    return {
      hasVotes: true,
      percentageText: `${realisticProb}%`,
      percentageValue: realisticProb,
      statusLabel: 'High Chance',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      textClass: 'text-emerald-700',
      bgClass: 'hover:border-emerald-300',
      pillBgClass: 'bg-emerald-100/90 border-emerald-200/60',
      indicatorColor: 'bg-emerald-500',
      description: `${reportsCount} devotee vote${reportsCount > 1 ? 's' : ''}`,
    };
  }

  if (realisticProb >= 45) {
    return {
      hasVotes: true,
      percentageText: `${realisticProb}%`,
      percentageValue: realisticProb,
      statusLabel: 'Moderate Chance',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
      textClass: 'text-blue-700',
      bgClass: 'hover:border-blue-300',
      pillBgClass: 'bg-blue-100/90 border-blue-200/60',
      indicatorColor: 'bg-blue-500',
      description: `${reportsCount} devotee vote${reportsCount > 1 ? 's' : ''}`,
    };
  }

  return {
    hasVotes: true,
    percentageText: `${realisticProb}%`,
    percentageValue: realisticProb,
    statusLabel: 'Low Chance',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    textClass: 'text-rose-700',
    bgClass: 'hover:border-rose-300',
    pillBgClass: 'bg-rose-100/90 border-rose-200/60',
    indicatorColor: 'bg-rose-500',
    description: `${reportsCount} devotee vote${reportsCount > 1 ? 's' : ''}`,
  };
}
