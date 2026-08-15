import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Shield, Check, SlidersHorizontal, ArrowUpRight, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const AlertsScreen: React.FC = () => {
  const { alerts, markAlertRead, profile, setProfile, setCurrentView, setSelectedLocationId, setSelectedQueueId } = useApp();
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleToggleSetting = (key: keyof typeof profile.notificationSettings) => {
    const updated = {
      ...profile,
      notificationSettings: {
        ...profile.notificationSettings,
        [key]: !profile.notificationSettings[key]
      }
    };
    setProfile(updated);
  };

  const handleAlertClick = (alert: (typeof alerts)[0]) => {
    markAlertRead(alert.id);
    setSelectedLocationId(alert.locationId);
    setSelectedQueueId(alert.queueId);
    setCurrentView('queue-detail');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Queue Intelligence Alerts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time notifications when crowd levels or probabilities change.
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
            showSettings
              ? 'bg-blue-100 text-blue-900 border-blue-300'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Push Notification Settings Drawer */}
      {showSettings && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 animate-scale-up">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Push Notification Settings</span>
          </h3>
          <p className="text-xs text-slate-500">
            Customize when you want to receive live alerts about Tirupati queues.
          </p>

          <div className="space-y-2 pt-1">
            {[
              {
                key: 'queueChanges',
                label: 'Notify me when my queue changes significantly'
              },
              {
                key: 'lowChanceAlerts',
                label: 'Notify me if my queue probability drops'
              },
              {
                key: 'betterNearby',
                label: 'Notify me when a better queue appears nearby'
              },
              {
                key: 'statusChanges',
                label: 'Notify me on counter status changes'
              },
              {
                key: 'crowdSpikes',
                label: 'Alert me on major crowd increases'
              }
            ].map((setting) => {
              const isChecked = profile.notificationSettings[setting.key as keyof typeof profile.notificationSettings];

              return (
                <label
                  key={setting.key}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 cursor-pointer text-xs font-semibold text-slate-800 transition-colors"
                >
                  <span>{setting.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSetting(setting.key as any)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-2.5">
        {alerts.map((alert) => {
          let severityBadge = 'bg-blue-50 text-blue-800 border-blue-200';
          let icon = <Info className="w-4 h-4 text-blue-600 shrink-0" />;

          if (alert.severity === 'success') {
            severityBadge = 'bg-emerald-50 text-emerald-900 border-emerald-200';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
          } else if (alert.severity === 'warning') {
            severityBadge = 'bg-blue-50 text-blue-900 border-blue-200';
            icon = <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />;
          }

          return (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                alert.read
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50/80 opacity-90'
                  : 'bg-blue-50/40 border-blue-300 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 mt-0.5">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{alert.title}</span>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2 block">
                    {alert.timestamp} · {alert.locationName}
                  </span>
                </div>
              </div>

              <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
