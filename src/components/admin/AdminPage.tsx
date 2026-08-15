import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CounterLocation, QueueLine, QueueAlert, UserQueueReport } from '../../types';
import {
  ShieldAlert,
  Sliders,
  Users,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Eye,
  Settings,
  Flame,
  Check,
  X,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { setCurrentView } = useApp();
  const [locations, setLocations] = useState<CounterLocation[]>([]);
  const [alerts, setAlerts] = useState<QueueAlert[]>([]);
  const [allReports, setAllReports] = useState<UserQueueReport[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'counters' | 'queues' | 'broadcasts' | 'reports' | 'system'>('overview');
  
  const [selectedLocId, setSelectedLocId] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state for admin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('tq_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // New location modal state
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLandmark, setNewLocLandmark] = useState('');
  const [newLocHours, setNewLocHours] = useState('05:00 AM - 08:00 PM');
  const [newLocLat, setNewLocLat] = useState('13.6288');
  const [newLocLng, setNewLocLng] = useState('79.4192');

  // Broadcast modal state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'info' | 'success' | 'warning' | 'alert'>('warning');
  const [broadcastLocId, setBroadcastLocId] = useState('all');

  // Live Firestore listeners
  useEffect(() => {
    // 1. Locations listener
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs: CounterLocation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CounterLocation;
        locs.push({ ...data, id: data.id || d.id });
      });
      setLocations(locs);
      if (!selectedLocId && locs.length > 0) {
        setSelectedLocId(locs[0].id);
      }
    });

    // 2. Alerts listener
    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const arr: QueueAlert[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as QueueAlert;
        arr.push({ ...data, id: data.id || d.id });
      });
      arr.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setAlerts(arr);
    });

    // 3. Live community reports listener (latest 50)
    const reportsQuery = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
    const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
      const list: UserQueueReport[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserQueueReport;
        list.push({ ...data, id: data.id || d.id });
      });
      setAllReports(list);
    }, (err) => {
      // Fallback if index on timestamp is generating
      const unsubFallback = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const list: UserQueueReport[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserQueueReport;
          list.push({ ...data, id: data.id || d.id });
        });
        setAllReports(list);
      });
      return () => unsubFallback();
    });

    return () => {
      unsubLocs();
      unsubAlerts();
      unsubReports();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin PIN is 1210 or admin (or any PIN >= 4 chars for test/demo ease)
    if (pinInput === '1210' || pinInput === 'admin' || pinInput === '8888') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('tq_admin_auth', 'true');
      setPinError(false);
      showToast('Admin access granted', 'success');
    } else {
      setPinError(true);
    }
  };

  const activeLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  // Admin Actions
  const handleToggleCounterStatus = async (loc: CounterLocation) => {
    try {
      await updateDoc(doc(db, 'locations', loc.id), {
        isOpen: !loc.isOpen
      });
      showToast(`${loc.name} marked as ${!loc.isOpen ? 'OPEN' : 'CLOSED'}`);
    } catch (err: any) {
      showToast(`Error updating counter: ${err.message}`, 'error');
    }
  };

  const handleToggleQueue = async (queueId: string) => {
    if (!activeLoc) return;
    try {
      const updatedQueues = (activeLoc.queues || []).map((q) =>
        q.id === queueId ? { ...q, isActive: !q.isActive } : q
      );
      await updateDoc(doc(db, 'locations', activeLoc.id), { queues: updatedQueues });
      showToast(`Queue line status updated`);
    } catch (err: any) {
      showToast(`Error updating queue: ${err.message}`, 'error');
    }
  };

  const handleUpdateQueueField = async (queueId: string, updates: Partial<QueueLine>) => {
    if (!activeLoc) return;
    try {
      const updatedQueues = (activeLoc.queues || []).map((q) => {
        if (q.id === queueId) {
          const updated = { ...q, ...updates };
          // Auto recalculate probabilityLevel if probability was changed
          if (updates.estimatedProbability !== undefined) {
            const p = updates.estimatedProbability;
            updated.probabilityLevel = p >= 70 ? 'High' : p >= 40 ? 'Medium' : 'Low';
          }
          return updated;
        }
        return q;
      });

      // Also recalculate location best line
      const best = updatedQueues.reduce((b, curr) => 
        (curr.estimatedProbability > (b?.estimatedProbability || 0) ? curr : b),
        updatedQueues[0]
      );

      await updateDoc(doc(db, 'locations', activeLoc.id), {
        queues: updatedQueues,
        bestLineId: best?.id || '',
        bestLineNumber: best?.lineNumber || 1,
        bestLineChance: best?.estimatedProbability || 0
      });

      showToast(`Queue updated successfully`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleAddNewQueueLine = async () => {
    if (!activeLoc) return;
    try {
      const existingQueues = activeLoc.queues || [];
      const nextLineNum = existingQueues.length + 1;
      const newQueue: QueueLine = {
        id: `${activeLoc.id}-line-${nextLineNum}-${Date.now().toString(36)}`,
        locationId: activeLoc.id,
        lineNumber: nextLineNum,
        name: `Line ${nextLineNum} (SSD Free Slot)`,
        estimatedProbability: 75,
        probabilityLevel: 'High',
        crowdLevel: 'Moderate',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 30,
        tokenSlotType: 'SSD General Token',
        isActive: true
      };

      const updated = [...existingQueues, newQueue];
      await updateDoc(doc(db, 'locations', activeLoc.id), { queues: updated });
      showToast(`Added Line ${nextLineNum} to ${activeLoc.name}`);
    } catch (err: any) {
      showToast(`Error adding line: ${err.message}`, 'error');
    }
  };

  const handleDeleteQueueLine = async (queueId: string) => {
    if (!activeLoc) return;
    if (!confirm('Are you sure you want to remove this queue line?')) return;
    try {
      const updated = (activeLoc.queues || []).filter((q) => q.id !== queueId);
      await updateDoc(doc(db, 'locations', activeLoc.id), { queues: updated });
      showToast(`Queue line removed`);
    } catch (err: any) {
      showToast(`Error removing queue: ${err.message}`, 'error');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    try {
      const slug = newLocName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const docId = slug || `loc-${Date.now()}`;

      const defaultQueues: QueueLine[] = [1, 2, 3, 4].map((num) => ({
        id: `${docId}-line-${num}`,
        locationId: docId,
        lineNumber: num,
        name: `Line ${num} (General SSD)`,
        estimatedProbability: 70,
        probabilityLevel: 'High',
        crowdLevel: 'Moderate',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 25,
        tokenSlotType: 'SSD Free Token',
        isActive: true
      }));

      const newLoc: CounterLocation = {
        id: docId,
        name: newLocName.trim(),
        landmark: newLocLandmark.trim() || newLocAddress.trim(),
        shortAddress: newLocAddress.trim() || newLocName.trim(),
        latitude: parseFloat(newLocLat) || 13.6288,
        longitude: parseFloat(newLocLng) || 79.4192,
        bestLineId: `${docId}-line-1`,
        bestLineNumber: 1,
        bestLineChance: 70,
        totalReportsCount: 0,
        isOpen: true,
        operatingHours: newLocHours.trim() || '05:00 AM - 08:00 PM',
        queues: defaultQueues
      };

      await setDoc(doc(db, 'locations', docId), newLoc);
      setShowAddLocationModal(false);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocLandmark('');
      setSelectedLocId(docId);
      showToast(`Counter location "${newLoc.name}" created successfully`);
    } catch (err: any) {
      showToast(`Error creating location: ${err.message}`, 'error');
    }
  };

  const handleDeleteLocation = async (locId: string, locName: string) => {
    if (!confirm(`Are you sure you want to completely delete "${locName}" and all its lines?`)) return;
    try {
      await deleteDoc(doc(db, 'locations', locId));
      showToast(`Location "${locName}" deleted`);
      const remaining = locations.filter((l) => l.id !== locId);
      if (remaining.length > 0) setSelectedLocId(remaining[0].id);
    } catch (err: any) {
      showToast(`Error deleting location: ${err.message}`, 'error');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      const alertId = `alert-${Date.now()}`;
      const targetLoc = locations.find((l) => l.id === broadcastLocId);

      const newAlert: QueueAlert = {
        id: alertId,
        locationId: broadcastLocId,
        queueId: targetLoc?.queues[0]?.id || 'general',
        locationName: targetLoc ? targetLoc.name : 'All Tirupati Counters',
        lineName: targetLoc ? 'Counter Advisory' : 'General SSD Notice',
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity: broadcastSeverity,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      await setDoc(doc(db, 'alerts', alertId), newAlert);
      setBroadcastTitle('');
      setBroadcastMessage('');
      showToast(`Broadcast alert published live to all pilgrim apps`);
    } catch (err: any) {
      showToast(`Error publishing alert: ${err.message}`, 'error');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
      showToast(`Alert removed`);
    } catch (err: any) {
      showToast(`Error removing alert: ${err.message}`, 'error');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      showToast(`Report deleted`);
    } catch (err: any) {
      showToast(`Error deleting report: ${err.message}`, 'error');
    }
  };

  const handleResetAllReportsToday = async () => {
    if (!confirm('This will reset all active crowd report counts for all locations and queues to 0. Continue?')) return;
    try {
      for (const loc of locations) {
        const resetQueues = (loc.queues || []).map((q) => ({
          ...q,
          activeReportsCount: 0,
          reportsLast15Min: 0,
          lastUpdatedMinutesAgo: 0
        }));
        await updateDoc(doc(db, 'locations', loc.id), {
          totalReportsCount: 0,
          queues: resetQueues
        });
      }
      showToast(`All crowd reports reset successfully`);
    } catch (err: any) {
      showToast(`Error resetting reports: ${err.message}`, 'error');
    }
  };

  const handleApplyPreset = async (preset: 'rush' | 'normal' | 'closed') => {
    if (!confirm(`Apply "${preset.toUpperCase()}" status preset to all queues?`)) return;
    try {
      for (const loc of locations) {
        const presetQueues = (loc.queues || []).map((q) => {
          if (preset === 'rush') {
            return { ...q, estimatedProbability: 35, probabilityLevel: 'Low' as const, crowdLevel: 'High' as const, trend: 'Rapidly Increasing' as const, estimatedWaitMinutes: 90 };
          } else if (preset === 'closed') {
            return { ...q, estimatedProbability: 0, probabilityLevel: 'Low' as const, crowdLevel: 'High' as const, isActive: false };
          } else {
            return { ...q, estimatedProbability: 75, probabilityLevel: 'High' as const, crowdLevel: 'Moderate' as const, trend: 'Stable' as const, estimatedWaitMinutes: 30, isActive: true };
          }
        });
        await updateDoc(doc(db, 'locations', loc.id), {
          isOpen: preset !== 'closed',
          queues: presetQueues
        });
      }
      showToast(`Preset "${preset}" applied to all counters`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // If not authenticated, show secure Admin PIN Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Tirupati QLines</h1>
            <p className="text-sm text-slate-400">Official SSD Tokens Admin & Control Room</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Access PIN / Passcode
              </label>
              <input
                type="password"
                placeholder="Enter PIN (e.g. 1210)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full bg-slate-950 border ${
                  pinError ? 'border-red-500' : 'border-slate-800'
                } rounded-xl px-4 py-3 text-white text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                autoFocus
              />
              {pinError ? (
                <p className="text-xs text-red-400 font-medium mt-1.5 text-center">
                  Invalid PIN. Default passcode is <strong className="text-white">1210</strong>.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Default supervisor PIN: <span className="text-slate-300 font-mono">1210</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={() => {
                window.history.pushState(null, '', '/');
                setCurrentView('home');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Devotee Pilgrim View
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalReportsCount = locations.reduce((acc, l) => acc + (l.totalReportsCount || 0), 0);
  const totalQueuesCount = locations.reduce((acc, l) => acc + (l.queues?.length || 0), 0);
  const activeQueuesCount = locations.reduce(
    (acc, l) => acc + (l.queues?.filter((q) => q.isActive).length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
            notification.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : notification.type === 'info'
              ? 'bg-blue-950/90 border-blue-800 text-blue-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-base lg:text-lg leading-none">
                  Tirupati SSD Admin
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                SSD Counters Control Room · Route: <span className="font-mono text-blue-400">/admin</span>
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => handleApplyPreset('normal')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Normal Preset</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState(null, '', '/');
                setCurrentView('home');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Pilgrim App</span>
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('tq_admin_auth');
                setIsAdminAuthenticated(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 text-xs font-bold border border-slate-700 transition-colors"
              title="Lock Admin Portal"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Activity },
            { id: 'counters', label: 'Counter Locations', icon: Building2 },
            { id: 'queues', label: 'Algorithm & Line Overrides', icon: Sliders },
            { id: 'broadcasts', label: 'Live Broadcasts', icon: Radio },
            { id: 'reports', label: 'Devotee Reports Feed', icon: Users },
            { id: 'system', label: 'System Maintenance', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Counters</span>
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{locations.length}</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {locations.filter((l) => l.isOpen).length} Open
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Tirupati SSD Counter Centers</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Queue Lines</span>
                  <Sliders className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{totalQueuesCount}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{activeQueuesCount} Active</span>
                </div>
                <p className="text-[11px] text-slate-500">Individual Slotted Token Lines</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Devotee Reports</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{allReports.length}</span>
                  <span className="text-xs text-purple-400 font-semibold">Live Feed</span>
                </div>
                <p className="text-[11px] text-slate-500">Total Crowd Submissions</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Broadcasts</span>
                  <Radio className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{alerts.length}</span>
                  <span className="text-xs text-amber-400 font-semibold">Live Advisories</span>
                </div>
                <p className="text-[11px] text-slate-500">Pilgrim Notification Tickers</p>
              </div>
            </div>

            {/* Live Counters Overview Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-white">Live Counter Status</h2>
                  <p className="text-xs text-slate-400">Current status of all SSD ticket distribution centers</p>
                </div>
                <button
                  onClick={() => setShowAddLocationModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Counter</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {locations.map((loc) => {
                  const best = (loc.queues || []).reduce(
                    (b, q) => (q.estimatedProbability > (b?.estimatedProbability || 0) ? q : b),
                    (loc.queues || [])[0]
                  );

                  return (
                    <div
                      key={loc.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              loc.isOpen
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {loc.isOpen ? 'Open Now' : 'Closed'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {loc.queues?.length || 0} Lines
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-base">{loc.name}</h3>
                          <p className="text-xs text-slate-400">{loc.landmark || loc.shortAddress}</p>
                        </div>

                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Best Chance Line</span>
                          <span className="font-bold text-emerald-400">
                            Line {best?.lineNumber || 1} ({best?.estimatedProbability || 0}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setSelectedLocId(loc.id);
                            setActiveTab('queues');
                          }}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manage Lines</span>
                        </button>
                        <button
                          onClick={() => handleToggleCounterStatus(loc)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold ${
                            loc.isOpen
                              ? 'bg-red-950/40 text-red-400 hover:bg-red-950/60 border border-red-900/50'
                              : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60 border border-emerald-900/50'
                          }`}
                        >
                          {loc.isOpen ? 'Close' : 'Open'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COUNTER LOCATIONS */}
        {activeTab === 'counters' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Counter Locations Management</h2>
                <p className="text-xs text-slate-400">Create, edit, or configure SSD token distribution centers</p>
              </div>
              <button
                onClick={() => setShowAddLocationModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Center</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-700">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{loc.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              loc.isOpen
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {loc.isOpen ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {loc.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCounterStatus(loc)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                          loc.isOpen
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
                        }`}
                      >
                        {loc.isOpen ? 'Set as Closed' : 'Set as Open'}
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                        className="p-2 rounded-xl bg-slate-800 text-red-400 hover:bg-red-950/50 border border-slate-700 hover:border-red-800"
                        title="Delete Center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 font-medium">Landmark / Address</span>
                      <p className="text-slate-200 font-semibold mt-0.5">{loc.landmark || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Operating Hours</span>
                      <p className="text-slate-200 font-semibold mt-0.5">{loc.operatingHours || '05:00 AM - 08:00 PM'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">GPS Coordinates</span>
                      <p className="text-slate-200 font-mono mt-0.5">
                        {loc.latitude}, {loc.longitude}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUEUE OVERRIDES & PROBABILITIES */}
        {activeTab === 'queues' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Algorithm & Line Overrides</h2>
                  <p className="text-xs text-slate-400">
                    Real-time manual overrides for token availability, crowd velocity, and wait times
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedLocId}
                    onChange={(e) => setSelectedLocId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddNewQueueLine}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Line</span>
                  </button>
                </div>
              </div>

              {activeLoc && (
                <div className="space-y-3 pt-2">
                  {(activeLoc.queues || []).map((q) => (
                    <div
                      key={q.id}
                      className={`bg-slate-950 border rounded-2xl p-4 space-y-4 transition-all ${
                        q.isActive ? 'border-slate-800' : 'border-red-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-sm flex items-center justify-center font-mono">
                            L{q.lineNumber}
                          </span>
                          <div>
                            <input
                              type="text"
                              defaultValue={q.name}
                              onBlur={(e) => handleUpdateQueueField(q.id, { name: e.target.value })}
                              className="bg-transparent text-white font-bold text-sm border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">ID: {q.id}</span>
                              <span className="text-[11px] text-slate-500">·</span>
                              <input
                                type="text"
                                defaultValue={q.tokenSlotType}
                                onBlur={(e) => handleUpdateQueueField(q.id, { tokenSlotType: e.target.value })}
                                className="bg-transparent text-[11px] text-slate-400 hover:text-white border-b border-transparent hover:border-slate-700 focus:outline-none px-1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleQueue(q.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                              q.isActive
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/60'
                                : 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-950/60'
                            }`}
                          >
                            {q.isActive ? 'Active Line' : 'Closed Line'}
                          </button>
                          <button
                            onClick={() => handleDeleteQueueLine(q.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-900"
                            title="Delete Line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Controls Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-900">
                        {/* Probability Override */}
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Est. Chance (%)</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={q.estimatedProbability}
                              onBlur={(e) =>
                                handleUpdateQueueField(q.id, {
                                  estimatedProbability: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                })
                              }
                              className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-sm font-black text-blue-400 font-sans">%</span>
                          </div>
                        </div>

                        {/* Crowd Level */}
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Crowd Density</label>
                          <select
                            defaultValue={q.crowdLevel}
                            onChange={(e) => handleUpdateQueueField(q.id, { crowdLevel: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                            <option value="Very High">Very High</option>
                          </select>
                        </div>

                        {/* Trend Velocity */}
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Velocity Trend</label>
                          <select
                            defaultValue={q.trend}
                            onChange={(e) => handleUpdateQueueField(q.id, { trend: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="Stable">Stable</option>
                            <option value="Increasing">Increasing</option>
                            <option value="Rapidly Increasing">Rapidly Increasing</option>
                            <option value="Decreasing">Decreasing</option>
                          </select>
                        </div>

                        {/* Estimated Wait */}
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Est. Wait (Mins)</label>
                          <input
                            type="number"
                            min="5"
                            max="300"
                            defaultValue={q.estimatedWaitMinutes || 30}
                            onBlur={(e) =>
                              handleUpdateQueueField(q.id, {
                                estimatedWaitMinutes: parseInt(e.target.value) || 30
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium text-center focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE BROADCASTS */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-6 animate-fade-in">
            {/* Create Broadcast */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                Publish Live Pilgrim Broadcast
              </h2>
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Alert Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Srinivasam SSD Quota Approaching Full"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Target Counter
                      </label>
                      <select
                        value={broadcastLocId}
                        onChange={(e) => setBroadcastLocId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="all">All Counters (Global)</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Severity Level
                      </label>
                      <select
                        value={broadcastSeverity}
                        onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="warning">Warning (Orange)</option>
                        <option value="alert">High Alert (Red)</option>
                        <option value="info">Info Advisory (Blue)</option>
                        <option value="success">Success / Slot Open (Green)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Message Body
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Line 2 moving very smoothly with <25 min wait time. Devotees arriving after 11 AM please proceed to Vishnu Nivasam."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Alert Live</span>
                </button>
              </form>
            </div>

            {/* Active Broadcasts List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4">
              <h2 className="text-base font-bold text-white">Active Live Alerts ({alerts.length})</h2>
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No active broadcast alerts. New alerts created above will appear immediately in pilgrim apps.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              a.severity === 'alert'
                                ? 'bg-red-500/20 text-red-400'
                                : a.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{a.locationName}</span>
                          <span className="text-xs text-slate-600">· {a.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{a.title}</h4>
                        <p className="text-xs text-slate-300">{a.message}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(a.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DEVOTEE REPORTS FEED */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Live Devotee Reports Feed</h2>
                  <p className="text-xs text-slate-400">Crowd submissions by pilgrims waiting at counters</p>
                </div>
                <button
                  onClick={handleResetAllReportsToday}
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-900/60 hover:bg-red-900/50 text-red-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Active Counts</span>
                </button>
              </div>

              {allReports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No pilgrim queue reports recorded yet today.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{rep.locationName || 'Tirupati Counter'}</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-900/40 text-blue-300 font-semibold text-[10px]">
                            {rep.lineName}
                          </span>
                          <span className="text-[11px] text-slate-500">{rep.timestamp}</span>
                        </div>
                        <p className="text-slate-400">
                          Group Size: <strong className="text-slate-200">{rep.peopleCount} pilgrims</strong> · Status:{' '}
                          <span className="text-emerald-400 font-semibold">{rep.status}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SYSTEM MAINTENANCE */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">System Maintenance & Daily Procedures</h2>
                <p className="text-xs text-slate-400">Routine operations for supervisor staff at Tirupati counters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Morning Reset */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Morning Opening Preset</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sets all 3 counters as OPEN with standard 75% morning token allocation.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyPreset('normal')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Apply Opening Preset
                  </button>
                </div>

                {/* Heavy Rush Preset */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-900/30 text-amber-400 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Heavy Rush Advisory</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Marks queues as High Crowd with increased wait times and low chance warning.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyPreset('rush')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Apply Rush Mode
                  </button>
                </div>

                {/* Quota Exhausted / Evening Close */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-900/30 text-red-400 flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Close Quotas & Counters</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Marks all lines as closed and resets probabilities to 0% after quota completes.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyPreset('closed')}
                    className="w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 font-bold text-xs"
                  >
                    Close Counters for Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add New Counter Location */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Add New SSD Counter Center</h3>
              <button
                onClick={() => setShowAddLocationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Center Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alipiri Bhudevi Extension"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Alipiri Checkpost, Foot of Hills"
                  value={newLocLandmark}
                  onChange={(e) => setNewLocLandmark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Operating Hours</label>
                <input
                  type="text"
                  placeholder="05:00 AM - 08:00 PM"
                  value={newLocHours}
                  onChange={(e) => setNewLocHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Latitude</label>
                  <input
                    type="text"
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Longitude</label>
                  <input
                    type="text"
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  Create Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
