import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../data/translations';

export const GopuramIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    {/* Kalasam finials */}
    <path d="M16 2v2M13.5 3.5v1.5M18.5 3.5v1.5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
    {/* Top tier */}
    <path d="M13 5.5h6l1 3h-8l1-3z" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.2" />
    {/* Tier 2 */}
    <path d="M11 8.5h10l1 3.5h-12l1-3.5z" fill="#FDE68A" stroke="#B45309" strokeWidth="1.2" />
    <path d="M14 9.5v2.5M18 9.5v2.5" stroke="#B45309" strokeWidth="1" />
    {/* Tier 3 */}
    <path d="M9 12h14l1.2 4.5h-16.4l1.2-4.5z" fill="#FCD34D" stroke="#B45309" strokeWidth="1.2" />
    <path d="M12 13v3.5M16 13v3.5M20 13v3.5" stroke="#B45309" strokeWidth="1" />
    {/* Tier 4 Base */}
    <path d="M6.5 16.5h19l1.5 5.5h-22l1.5-5.5z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" />
    <path d="M10 18v4M22 18v4" stroke="#B45309" strokeWidth="1" />
    {/* Main Entrance Archway */}
    <path d="M13 22v7h6v-7c0-1.65-1.35-3-3-3s-3 1.35-3 3z" fill="#B45309" />
    <path d="M4.5 22h23v7h-23z" fill="none" stroke="#B45309" strokeWidth="1.2" />
  </svg>
);

export const Header: React.FC = () => {
  const { setCurrentView, alerts } = useApp();
  const { t, language, setLanguage } = useLanguage();
  
  const unreadAlertsCount = alerts.filter((a) => !a.read).length || 3;

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-4 pt-1.5 pb-2">
      <div className="max-w-md mx-auto space-y-1">
        {/* Brand Header */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <GopuramIcon className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="font-black text-[#1E1B4B] text-[20px] leading-none tracking-tight">
                {t('Tirupati Q-Lines')}
              </h1>
              <p className="text-[11px] font-extrabold text-[#B45309] tracking-tight mt-0.5">
                {t('SSD Token Predictor')}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-slate-100 text-[#1E1B4B] font-bold text-xs py-1 px-2 rounded-lg border border-slate-200 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
            >
              <option value="en">EN</option>
              <option value="te">TE</option>
              <option value="hi">HI</option>
              <option value="kn">KN</option>
              <option value="ta">TA</option>
              <option value="ur">UR</option>
            </select>

            {/* Right Bell Icon */}
            <button
              onClick={() => setCurrentView('alerts')}
              className="relative p-2 text-[#1E1B4B] hover:bg-slate-100 rounded-full transition-colors"
              title="Notifications"
            >
              <i className="fa-regular fa-bell text-xl"></i>
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

