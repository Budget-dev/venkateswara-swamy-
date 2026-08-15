import React from 'react';
import { useApp } from '../../context/AppContext';
import { ContributionHistoryCard } from './ContributionHistoryCard';
import {
  User,
  Globe,
  Award,
  History,
  Bell,
  Shield,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Lock,
  LayoutDashboard
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    profile, reportHistory,
    language,
    setLanguage,
    setCurrentView,
    setShowDisclaimerModal,
    setShowAdminLoginModal,
    requestNotificationPermission,
    updateProfile
  } = useApp();

  const history = reportHistory;

  return (
    <div className="space-y-5 pb-20 md:pb-8 animate-fade-in">
      {/* Devotee Profile Header */}
      <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-xl flex items-center justify-center border border-blue-100 shadow-2xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{profile.name}</h1>
              <p className="text-xs text-slate-500 font-medium">Devotee Community Contributor</p>
            </div>
          </div>
          <div className="bg-blue-50/80 px-3.5 py-1.5 rounded-2xl border border-blue-200/70 text-right">
            <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider block">
              Karma Points
            </span>
            <span className="text-xl font-black text-blue-900 font-sans">{profile.karmaPoints}</span>
          </div>
        </div>

        {/* Contribution Stats */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-center text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-slate-500 font-medium">Total Reports</span>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">{profile.reportsSubmitted}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-slate-500 font-medium">GPS Verified</span>
            <p className="text-base font-extrabold text-emerald-700 mt-0.5">
              {profile.verifiedReportsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Contribution History Chart */}
      <ContributionHistoryCard />

      {/* Language Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>App Language / భాష</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
              language === 'en'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('te')}
            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
              language === 'te'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Push Notifications</span>
          </h3>
          <div className="relative inline-block w-10 h-5 align-middle select-none">
            <input
              type="checkbox"
              id="toggle-fcm"
              checked={!!profile.fcmToken}
              onChange={async (e) => {
                if (e.target.checked) {
                  const success = await requestNotificationPermission();
                  if (!success) {
                    alert('Could not enable notifications. Please check your browser settings.');
                  }
                } else {
                  updateProfile({ fcmToken: '' });
                }
              }}
              className="checked:bg-blue-600 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-5 h-5 rounded-full bg-white border-4 border-slate-200 checked:border-blue-600 appearance-none cursor-pointer"
            />
            <label htmlFor="toggle-fcm" className="block overflow-hidden h-5 rounded-full bg-slate-200 cursor-pointer"></label>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Get live alerts when queue conditions change significantly in your preferred location.
        </p>
      </div>

      {/* My Queue History Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>My Queue History</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">{history.length} reports</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center italic">
            You haven't reported any queue yet. Tap "I'm in a queue" to submit your first report.
          </p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">{item.locationName}</span>
                  <p className="text-[11px] text-slate-500">{item.lineName} · {item.timestamp}</p>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {item.status === 'completed' ? 'Completed' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links & Terms */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2 text-xs">
        <button
          onClick={() => setShowDisclaimerModal(true)}
          className="w-full flex items-center justify-between py-2 px-1 text-slate-700 font-semibold hover:text-blue-800"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            TTD Non-Affiliation Disclaimer
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentView('landing')}
          className="w-full flex items-center justify-between py-2 px-1 text-slate-700 font-semibold hover:text-blue-800 border-t border-slate-100"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Public Landing Page & FAQs
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => {
            window.history.pushState(null, '', '/admin');
            setCurrentView('admin');
          }}
          className="w-full flex items-center justify-between py-2 px-1 text-slate-900 font-bold hover:text-blue-800 border-t border-slate-100"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-slate-900" />
            Admin Portal (/admin)
          </span>
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
