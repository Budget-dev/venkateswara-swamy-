import { SupportedLanguage } from './data/translations';

export type CrowdLevel = 'Low' | 'Moderate' | 'High' | 'Very High';
export type TrendDirection = 'Increasing' | 'Stable' | 'Decreasing' | 'Rapidly Increasing';
export type ProbabilityLevel = 'High' | 'Good' | 'Medium' | 'Low';

export interface QueueLine {
  id: string; // e.g. 'srinivasam-line-1'
  locationId: string; // e.g. 'srinivasam'
  lineNumber: number; // 1, 2, 3, 4
  name: string; // 'Line 1 (SSD Tokens - Slot A)'
  estimatedProbability: number; // e.g. 82 (% chance)
  probabilityLevel: ProbabilityLevel;
  crowdLevel: CrowdLevel;
  trend: TrendDirection;
  activeReportsCount: number;
  reportsLast15Min: number;
  lastUpdatedMinutesAgo: number;
  estimatedWaitMinutes: number;
  tokenSlotType: string; // e.g., 'SSD Token (Free)', 'Slotted Token', 'Sarva SSD'
  isActive: boolean;
  notes?: string;
}

export interface CounterLocation {
  id: string; // 'srinivasam' | 'vishnu-nivasam' | 'bhudevi'
  name: string; // 'Srinivasam'
  landmark: string; // 'Opp. RTC Bus Stand, Tirupati'
  shortAddress: string; // 'Opp. RTC Bus Stand'
  latitude: number;
  longitude: number;
  bestLineId: string;
  bestLineNumber: number;
  bestLineChance: number;
  totalReportsCount: number;
  isOpen: boolean;
  operatingHours: string;
  distanceKm?: number;
  queues: QueueLine[];
}

export interface UserQueueReport {
  id: string;
  userId: string;
  locationId: string;
  queueId: string;
  locationName: string;
  lineName: string;
  peopleCount: number;
  timestamp: string;
  locationVerified: boolean;
  distanceMeter?: number;
  status: 'active' | 'left' | 'completed';
  outcome?: 'received_ticket' | 'no_ticket' | 'left_early' | 'unsure';
  actualWaitMinutes?: number;
}

export interface QueueAlert {
  id: string;
  locationId: string;
  queueId: string;
  locationName: string;
  lineName: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read?: boolean;
}

export interface DevoteeProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  fcmToken?: string;
  isAuthenticated: boolean;
  karmaPoints: number;
  reportsSubmitted: number;
  verifiedReportsCount: number;
  language: SupportedLanguage;
  notificationSettings: {
    queueChanges: boolean;
    lowChanceAlerts: boolean;
    betterNearby: boolean;
    statusChanges: boolean;
    crowdSpikes: boolean;
  };
}

export interface HistoricalDataPoint {
  time: string; // e.g., '06:00', '08:00', '10:00'
  chance: number;
  reports: number;
  crowdIndex: number;
}

export interface AdminStats {
  activeUsersOnline: number;
  totalReportsToday: number;
  activeCounters: number;
  predictionAccuracyPercent: number;
  flaggedReportsCount: number;
  alertsSentToday: number;
}
