import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CounterLocation,
  QueueLine,
  UserQueueReport,
  QueueAlert,
  DevoteeProfile,
  AdminStats
} from '../types';
import { useFirebase } from '../hooks/useFirebase';

export type AppView =
  | 'home'
  | 'live-queues'
  | 'location-detail'
  | 'queue-detail'
  | 'alerts'
  | 'profile'
  | 'history'
  | 'map'
  | 'landing'
  | 'admin';

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  selectedQueueId: string | null;
  setSelectedQueueId: (id: string | null) => void;
  
  locations: CounterLocation[];
  alerts: QueueAlert[];
  activeReport: UserQueueReport | null;
  reportHistory: UserQueueReport[];
  profile: DevoteeProfile;
  
  isOnline: boolean;
  
  // Modals
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  reportPreselectedLocationId: string | null;
  reportPreselectedQueueId: string | null;
  openReportModal: (locId?: string, queueId?: string) => void;
  
  showFindBestModal: boolean;
  setShowFindBestModal: (show: boolean) => void;
  
  showDisclaimerModal: boolean;
  setShowDisclaimerModal: (show: boolean) => void;
  
  showOutcomeModal: boolean;
  setShowOutcomeModal: (show: boolean) => void;

  showAdminLoginModal: boolean;
  setShowAdminLoginModal: (show: boolean) => void;
  
  // Actions
  submitReport: (locationId: string, queueId: string, peopleCount: number, lat?: number, lng?: number) => void;
  updatePresence: () => void;
  leaveQueue: (outcome: 'received_ticket' | 'no_ticket' | 'left_early' | 'unsure', waitMins?: number) => void;
  markAlertRead: (alertId: string) => void;
  refreshData: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  updateProfile: (updates: Partial<DevoteeProfile>) => void;
  adminSetLineVotes: (locationId: string, queueId: string, newVoteCount: number, customOptions?: any) => Promise<void>;
  adminAdjustLineVotes: (locationId: string, queueId: string, delta: number) => Promise<void>;
  adminBatchUpdateLines: (locationId: string, updates: any[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultProfile: DevoteeProfile = {
  id: '',
  name: 'Devotee',
  isAuthenticated: false,
  karmaPoints: 0,
  reportsSubmitted: 0,
  verifiedReportsCount: 0,
  language: 'en',
  notificationSettings: {
    queueChanges: true, lowChanceAlerts: true, betterNearby: true, statusChanges: true, crowdSpikes: true
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('vishnu-nivasam');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>('vishnu-line-2');
  
  const firebase = useFirebase();
  const profile = firebase.profile || defaultProfile;

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportPreselectedLocationId, setReportPreselectedLocationId] = useState<string | null>(null);
  const [reportPreselectedQueueId, setReportPreselectedQueueId] = useState<string | null>(null);
  
  const [showFindBestModal, setShowFindBestModal] = useState<boolean>(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openReportModal = (locId?: string, queueId?: string) => {
    if (locId) setReportPreselectedLocationId(locId);
    if (queueId) setReportPreselectedQueueId(queueId);
    setShowReportModal(true);
  };

  const submitReport = (locationId: string, queueId: string, peopleCount: number, lat?: number, lng?: number) => {
    firebase.submitReport(locationId, queueId, peopleCount, lat, lng);
  };

  const updatePresence = () => {
    firebase.updatePresence();
  };

  const leaveQueue = (outcome: 'received_ticket' | 'no_ticket' | 'left_early' | 'unsure', waitMins?: number) => {
    firebase.leaveQueue(outcome, waitMins);
  };

  const markAlertRead = (alertId: string) => {
    firebase.markAlertRead(alertId);
  };

  const refreshData = () => {
    // Handled automatically via Firebase onSnapshot
  };

  return (
    <AppContext.Provider
      value={{
        currentView, setCurrentView,
        selectedLocationId, setSelectedLocationId,
        selectedQueueId, setSelectedQueueId,
        locations: firebase.locations,
        alerts: firebase.alerts,
        activeReport: firebase.activeReport,
        reportHistory: firebase.reportHistory,
        profile,
        isOnline,
        showReportModal, setShowReportModal,
        reportPreselectedLocationId, reportPreselectedQueueId,
        openReportModal,
        showFindBestModal, setShowFindBestModal,
        showDisclaimerModal, setShowDisclaimerModal,
        showOutcomeModal, setShowOutcomeModal,
        showAdminLoginModal, setShowAdminLoginModal,
        submitReport, updatePresence, leaveQueue, markAlertRead, refreshData,
        requestNotificationPermission: firebase.requestNotificationPermission,
        updateProfile: firebase.updateProfile,
        adminSetLineVotes: firebase.adminSetLineVotes,
        adminAdjustLineVotes: firebase.adminAdjustLineVotes,
        adminBatchUpdateLines: firebase.adminBatchUpdateLines
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
