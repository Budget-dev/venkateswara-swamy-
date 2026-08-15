import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { I18nProvider } from './context/LanguageContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { LiveQueuesScreen } from './components/queues/LiveQueuesScreen';
import { LocationDetailScreen } from './components/queues/LocationDetailScreen';
import { QueueDetailScreen } from './components/queues/QueueDetailScreen';
import { AlertsScreen } from './components/alerts/AlertsScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { MapViewScreen } from './components/map/MapViewScreen';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPage } from './components/admin/AdminPage';

import { ReportFlowModal } from './components/report/ReportFlowModal';
import { ActiveQueueBanner } from './components/report/ActiveQueueBanner';
import { OutcomeModal } from './components/report/OutcomeModal';
import { FindBestQueueModal } from './components/recommend/FindBestQueueModal';
import { DisclaimerModal } from './components/common/DisclaimerCard';
import { motion, AnimatePresence } from 'motion/react';

const MainAppContent: React.FC = () => {
  const { currentView, setCurrentView } = useApp();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Separate Standalone Page for /admin
  if (pathname === '/admin' || currentView === 'admin') {
    return <AdminPage />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen />;
      case 'live-queues':
        return <LiveQueuesScreen />;
      case 'location-detail':
        return <LocationDetailScreen />;
      case 'queue-detail':
        return <QueueDetailScreen />;
      case 'alerts':
        return <AlertsScreen />;
      case 'profile':
      case 'history':
        return <ProfileScreen />;
      case 'map':
        return <MapViewScreen />;
      case 'landing':
        return <LandingPage />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-200 selection:text-blue-900">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-3 transition-all pb-24 overflow-x-hidden">
        {/* Active Queue Persistent Status Banner */}
        <ActiveQueueBanner />

        {/* Dynamic View Screen */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Global Modals & Drawers */}
      <ReportFlowModal />
      <FindBestQueueModal />
      <DisclaimerModal />
      <OutcomeModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <I18nProvider>
        <MainAppContent />
      </I18nProvider>
    </AppProvider>
  );
}
