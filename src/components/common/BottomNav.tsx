import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Home, Activity, Sparkles, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, openReportModal } = useApp();
  const { t } = useLanguage();

  const items: { view: AppView | 'report'; label: string; icon: React.FC<any>; isAction?: boolean }[] = [
    {
      view: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      view: 'live-queues',
      label: 'Live',
      icon: Activity,
    },
    {
      view: 'report',
      label: 'Vote',
      icon: Sparkles,
      isAction: true,
    },
    {
      view: 'alerts',
      label: 'Alerts',
      icon: Bell,
    },
    {
      view: 'profile',
      label: 'Profile',
      icon: User,
    }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-full p-1.5 flex items-center gap-1 pointer-events-auto">
        {items.map((item) => {
          const isActive = !item.isAction && currentView === item.view;
          const Icon = item.icon;
          
          return (
            <motion.button
              layout
              key={item.view}
              onClick={() => {
                if (item.isAction) {
                  import('../../lib/haptics').then(m => m.triggerVibration(m.hapticPatterns.medium));
                  openReportModal();
                } else {
                  setCurrentView(item.view as AppView);
                }
              }}
              className={`relative flex items-center justify-center rounded-full transition-colors h-11 ${
                isActive 
                  ? 'bg-emerald-100 text-emerald-800 px-4 shadow-inner' 
                  : item.isAction 
                    ? 'bg-emerald-600 text-white px-3 shadow-sm hover:bg-emerald-700'
                    : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 px-3'
              }`}
            >
              <div className="relative flex items-center gap-2">
                <Icon className={`w-5 h-5 ${isActive || item.isAction ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span 
                      layout="position"
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: 'auto', marginLeft: 4 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="text-sm font-bold whitespace-nowrap overflow-hidden"
                    >
                      {t(item.label)}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {item.view === 'alerts' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </div>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};
