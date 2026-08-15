import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
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
  limit,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CounterLocation, QueueLine, QueueAlert, UserQueueReport, CrowdLevel, ProbabilityLevel } from '../../types';
import { calculateLineMetrics } from '../../hooks/useFirebase';

export const AdminPage: React.FC = () => {
  const { setCurrentView, submitReport, adminSetLineVotes, adminAdjustLineVotes, adminBatchUpdateLines } = useApp();
  
  const [locations, setLocations] = useState<CounterLocation[]>([]);
  const [alerts, setAlerts] = useState<QueueAlert[]>([]);
  const [allReports, setAllReports] = useState<UserQueueReport[]>([]);
  const [activeTab, setActiveTab] = useState<'voting' | 'locations' | 'reports' | 'broadcasts'>('voting');
  
  const [selectedLocId, setSelectedLocId] = useState<string>('vishnu-nivasam');
  const [toastMessage, setToastMessage] = useState<{ text: string; variant: 'success' | 'info' | 'danger' | 'warning' } | null>(null);
  
  // Local state for inline vote edits (maps queueId -> current input value)
  const [editingVotes, setEditingVotes] = useState<Record<string, number>>({});
  const [savingQueueId, setSavingQueueId] = useState<string | null>(null);
  const [isSimulatingVote, setIsSimulatingVote] = useState<string | null>(null);

  // Admin Auth PIN
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('tq_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Modal: Edit Full Line
  const [editLineModalQueue, setEditLineModalQueue] = useState<{ locId: string; queue: QueueLine } | null>(null);
  const [modalLineName, setModalLineName] = useState('');
  const [modalLineToken, setModalLineToken] = useState('');
  const [modalLineVotes, setModalLineVotes] = useState<number>(0);
  const [modalLineProb, setModalLineProb] = useState<number>(85);
  const [modalLineWait, setModalLineWait] = useState<number>(20);
  const [modalLineActive, setModalLineActive] = useState<boolean>(true);
  const [modalLineCrowd, setModalLineCrowd] = useState<CrowdLevel>('Low');

  // Modal: Add New Line
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [newLineName, setNewLineName] = useState('');
  const [newLineToken, setNewLineToken] = useState('General SSD Token');
  const [newLineInitialVotes, setNewLineInitialVotes] = useState(0);

  // Modal: Add Location
  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLandmark, setNewLocLandmark] = useState('');
  const [newLocHours, setNewLocHours] = useState('05:00 AM - 08:00 PM');

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'info' | 'success' | 'warning' | 'alert'>('warning');
  const [broadcastTargetLoc, setBroadcastTargetLoc] = useState('all');

  // Live Firestore Listeners
  useEffect(() => {
    // 1. Locations
    const unsubLocs = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs: CounterLocation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CounterLocation;
        locs.push({ ...data, id: data.id || d.id });
      });
      setLocations(locs);
      
      // Keep selectedLocId valid
      if (locs.length > 0 && (!selectedLocId || !locs.some(l => l.id === selectedLocId))) {
        setSelectedLocId(locs[0].id);
      }
    });

    // 2. Alerts
    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const arr: QueueAlert[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as QueueAlert;
        arr.push({ ...data, id: data.id || d.id });
      });
      arr.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setAlerts(arr);
    });

    // 3. Devotee Reports
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const list: UserQueueReport[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserQueueReport;
        list.push({ ...data, id: data.id || d.id });
      });
      setAllReports(list);
    }, () => {
      // Fallback
      const unsubFallback = onSnapshot(collection(db, 'reports'), (snap) => {
        const list: UserQueueReport[] = [];
        snap.forEach((d) => {
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
  }, [selectedLocId]);

  const showToast = (text: string, variant: 'success' | 'info' | 'danger' | 'warning' = 'success') => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1210' || pinInput === 'admin' || pinInput === '8888') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('tq_admin_auth', 'true');
      setPinError(false);
      showToast('Admin access granted successfully', 'success');
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('tq_admin_auth');
    setPinInput('');
  };

  const currentLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  // Sync editingVotes state with Firestore values whenever currentLoc changes
  useEffect(() => {
    if (currentLoc && currentLoc.queues) {
      const initialMap: Record<string, number> = {};
      currentLoc.queues.forEach((q) => {
        initialMap[q.id] = q.activeReportsCount || 0;
      });
      setEditingVotes(initialMap);
    }
  }, [currentLoc?.id, currentLoc?.queues]);

  // Handle inline vote number change
  const handleVoteInputChange = (queueId: string, value: string) => {
    const num = parseInt(value, 10);
    setEditingVotes((prev) => ({
      ...prev,
      [queueId]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Handle Save specific line voting number
  const handleSaveLineVotes = async (queueId: string) => {
    if (!currentLoc) return;
    const newVotes = editingVotes[queueId] !== undefined ? editingVotes[queueId] : 0;
    setSavingQueueId(queueId);
    try {
      await adminSetLineVotes(currentLoc.id, queueId, newVotes);
      showToast(`Line vote count updated to ${newVotes}. New devotee votes will count continuously from this number!`, 'success');
    } catch (err: any) {
      showToast(`Failed to update vote number: ${err?.message || 'Unknown error'}`, 'danger');
    } finally {
      setSavingQueueId(null);
    }
  };

  // Handle Quick +/- Delta adjustment
  const handleQuickAdjustVotes = async (queueId: string, delta: number) => {
    if (!currentLoc) return;
    setSavingQueueId(queueId);
    try {
      await adminAdjustLineVotes(currentLoc.id, queueId, delta);
      const queue = currentLoc.queues?.find(q => q.id === queueId);
      const currentVal = queue?.activeReportsCount || 0;
      const targetVal = Math.max(0, currentVal + delta);
      setEditingVotes(prev => ({ ...prev, [queueId]: targetVal }));
      showToast(`Adjusted votes by ${delta > 0 ? `+${delta}` : delta} (New count: ${targetVal})`, 'info');
    } catch (err: any) {
      showToast(`Failed to adjust votes: ${err?.message || 'Unknown error'}`, 'danger');
    } finally {
      setSavingQueueId(null);
    }
  };

  // Handle Batch Save All Lines for current location
  const handleBatchSaveAllLines = async () => {
    if (!currentLoc || !currentLoc.queues) return;
    try {
      const updates = currentLoc.queues.map((q) => ({
        id: q.id,
        activeReportsCount: editingVotes[q.id] !== undefined ? editingVotes[q.id] : (q.activeReportsCount || 0)
      }));
      await adminBatchUpdateLines(currentLoc.id, updates);
      showToast(`Successfully updated all voting numbers for ${currentLoc.name}`, 'success');
    } catch (err: any) {
      showToast(`Failed to batch update lines: ${err?.message || 'Unknown error'}`, 'danger');
    }
  };

  // Simulate Devotee Vote (+1) to verify live increment
  const handleSimulateDevoteeVote = async (queueId: string) => {
    if (!currentLoc) return;
    setIsSimulatingVote(queueId);
    try {
      await submitReport(currentLoc.id, queueId, 1);
      showToast(`Simulated 1 user vote on line! Count incremented live from baseline.`, 'success');
    } catch (err: any) {
      showToast(`Simulation failed: ${err?.message || 'Error'}`, 'danger');
    } finally {
      setIsSimulatingVote(null);
    }
  };

  // Toggle Line Active status
  const handleToggleLineActive = async (queue: QueueLine) => {
    if (!currentLoc) return;
    try {
      await adminSetLineVotes(currentLoc.id, queue.id, queue.activeReportsCount || 0, {
        isActive: !queue.isActive
      });
      showToast(`Line ${queue.name} marked as ${!queue.isActive ? 'Active' : 'Closed'}`, 'info');
    } catch (err: any) {
      showToast(`Error toggling status: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Open Full Line Edit Modal
  const handleOpenEditLineModal = (queue: QueueLine) => {
    if (!currentLoc) return;
    setEditLineModalQueue({ locId: currentLoc.id, queue });
    setModalLineName(queue.name);
    setModalLineToken(queue.tokenSlotType || 'General SSD Token');
    setModalLineVotes(queue.activeReportsCount || 0);
    setModalLineProb(queue.estimatedProbability || 80);
    setModalLineWait(queue.estimatedWaitMinutes || 20);
    setModalLineActive(queue.isActive);
    setModalLineCrowd(queue.crowdLevel || 'Low');
  };

  // Save Full Line Modal
  const handleSaveModalLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLineModalQueue) return;
    try {
      await adminSetLineVotes(editLineModalQueue.locId, editLineModalQueue.queue.id, modalLineVotes, {
        name: modalLineName,
        tokenSlotType: modalLineToken,
        isActive: modalLineActive,
        estimatedProbability: modalLineProb,
        estimatedWaitMinutes: modalLineWait,
        crowdLevel: modalLineCrowd
      });
      showToast(`Line "${modalLineName}" updated successfully`, 'success');
      setEditLineModalQueue(null);
    } catch (err: any) {
      showToast(`Failed to save line: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Delete Line
  const handleDeleteLine = async (queueId: string) => {
    if (!currentLoc || !confirm('Are you sure you want to delete this queue line?')) return;
    try {
      const locRef = doc(db, 'locations', currentLoc.id);
      const remainingQueues = (currentLoc.queues || []).filter(q => q.id !== queueId);
      await updateDoc(locRef, { queues: remainingQueues });
      showToast('Queue line deleted', 'warning');
    } catch (err: any) {
      showToast(`Failed to delete line: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Add New Line
  const handleAddNewLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoc || !newLineName.trim()) return;
    try {
      const locRef = doc(db, 'locations', currentLoc.id);
      const existingQueues = currentLoc.queues || [];
      const newNumber = existingQueues.length + 1;
      const newLineId = `${currentLoc.id}-line-${Date.now()}`;
      
      const metrics = calculateLineMetrics(newLineInitialVotes);
      const newQueue: QueueLine = {
        id: newLineId,
        locationId: currentLoc.id,
        lineNumber: newNumber,
        name: newLineName.trim(),
        tokenSlotType: newLineToken,
        activeReportsCount: newLineInitialVotes,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        isActive: true,
        trend: 'Stable',
        ...metrics
      };

      const updatedQueues = [...existingQueues, newQueue];
      await updateDoc(locRef, {
        queues: updatedQueues,
        totalReportsCount: (currentLoc.totalReportsCount || 0) + newLineInitialVotes
      });

      showToast(`New line "${newLineName}" added with starting votes: ${newLineInitialVotes}`, 'success');
      setShowAddLineModal(false);
      setNewLineName('');
      setNewLineInitialVotes(0);
    } catch (err: any) {
      showToast(`Failed to add line: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Toggle Counter Location Open/Closed
  const handleToggleCounterStatus = async (loc: CounterLocation) => {
    try {
      await updateDoc(doc(db, 'locations', loc.id), {
        isOpen: !loc.isOpen
      });
      showToast(`${loc.name} marked as ${!loc.isOpen ? 'OPEN' : 'CLOSED'}`, 'info');
    } catch (err: any) {
      showToast(`Failed to update counter status: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Add New Counter Location
  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    try {
      const locId = 'loc_' + Date.now();
      const newLocation: CounterLocation = {
        id: locId,
        name: newLocName.trim(),
        shortAddress: newLocAddress.trim() || 'Tirupati, AP',
        landmark: newLocLandmark.trim() || 'Near Temple Area',
        operatingHours: newLocHours.trim() || '05:00 AM - 08:00 PM',
        isOpen: true,
        latitude: 13.6288,
        longitude: 79.4192,
        bestLineId: `${locId}-line-1`,
        bestLineNumber: 1,
        bestLineChance: 85,
        totalReportsCount: 0,
        queues: [
          {
            id: `${locId}-line-1`,
            locationId: locId,
            lineNumber: 1,
            name: 'Line 1 (General)',
            tokenSlotType: 'General SSD Token',
            estimatedWaitMinutes: 15,
            estimatedProbability: 85,
            crowdLevel: 'Low',
            probabilityLevel: 'High',
            lastUpdatedMinutesAgo: 0,
            activeReportsCount: 0,
            reportsLast15Min: 0,
            isActive: true,
            trend: 'Stable'
          }
        ]
      };

      await setDoc(doc(db, 'locations', locId), newLocation);
      showToast(`Created counter location "${newLocName}"`, 'success');
      setShowAddLocModal(false);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocLandmark('');
    } catch (err: any) {
      showToast(`Failed to create location: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Delete Location
  const handleDeleteLocation = async (locId: string, locName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${locName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'locations', locId));
      showToast(`Deleted ${locName}`, 'warning');
    } catch (err: any) {
      showToast(`Failed to delete location: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Publish Broadcast Alert
  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    try {
      const alertId = 'alert_' + Date.now();
      const targetLocation = locations.find(l => l.id === broadcastTargetLoc);
      const newAlert: QueueAlert = {
        id: alertId,
        locationId: broadcastTargetLoc === 'all' ? 'all' : broadcastTargetLoc,
        queueId: 'general',
        locationName: targetLocation ? targetLocation.name : 'All Counters',
        lineName: 'All Lines',
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity: broadcastSeverity,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      await setDoc(doc(db, 'alerts', alertId), newAlert);
      showToast('Official Broadcast alert published to all devotee screens', 'success');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      showToast(`Failed to publish alert: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
      showToast('Broadcast removed', 'info');
    } catch (err: any) {
      showToast(`Failed to delete alert: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Delete Devotee Report
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      showToast('Report deleted', 'info');
    } catch (err: any) {
      showToast(`Failed to delete report: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Clear all reports
  const handleClearAllReports = async () => {
    if (!confirm('Clear all historical devotee reports?')) return;
    try {
      const promises = allReports.map(r => deleteDoc(doc(db, 'reports', r.id)));
      await Promise.all(promises);
      showToast('All historical reports cleared', 'warning');
    } catch (err: any) {
      showToast(`Failed to clear reports: ${err?.message || 'Error'}`, 'danger');
    }
  };

  // Stats Calculations
  const totalVotesAcrossAllCounters = locations.reduce((sum, l) => {
    return sum + (l.queues || []).reduce((qSum, q) => qSum + (q.activeReportsCount || 0), 0);
  }, 0);
  const openCountersCount = locations.filter(l => l.isOpen).length;
  const totalLinesCount = locations.reduce((sum, l) => sum + (l.queues?.length || 0), 0);

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION SCREEN (Bootstrap Only)
  // --------------------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-dark text-white text-center py-3">
                <h4 className="mb-0 fw-bold">Admin Panel Authentication</h4>
                <small className="text-secondary">Tirupati QLines Queue Control</small>
              </div>
              <div className="card-body p-4">
                {pinError && (
                  <div className="alert alert-danger py-2" role="alert">
                    Invalid PIN code. Please enter the authorized administrator PIN.
                  </div>
                )}
                <form onSubmit={handlePinSubmit}>
                  <div className="mb-3">
                    <label htmlFor="adminPin" className="form-label fw-bold">Enter Administrator PIN</label>
                    <input
                      id="adminPin"
                      type="password"
                      className="form-control form-control-lg text-center"
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="form-text text-center mt-2">
                      Authorized staff credentials (Default PIN: <code>1210</code>)
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold">
                    Unlock Admin Panel
                  </button>
                </form>
                <hr className="my-3" />
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => setCurrentView('live-queues')}
                >
                  Return to Devotee View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN ADMIN DASHBOARD (Bootstrap Only)
  // --------------------------------------------------------------------------
  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-2 shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-white mb-0">
            Tirupati QLines — Admin Panel
          </span>
          
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success py-2 px-3">
              ● Live Sync Connected
            </span>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => setCurrentView('live-queues')}
            >
              Devotee View
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container-fluid px-3 px-md-4 py-3">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className={`alert alert-${toastMessage.variant} alert-dismissible fade show shadow-sm mb-3`} role="alert">
            <strong>Notice:</strong> {toastMessage.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setToastMessage(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase fw-bold">Total Active Votes</div>
                <h3 className="fw-bold text-primary mb-0">{totalVotesAcrossAllCounters}</h3>
                <small className="text-muted">Live across all lines</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase fw-bold">Open Counters</div>
                <h3 className="fw-bold text-success mb-0">{openCountersCount} / {locations.length}</h3>
                <small className="text-muted">Active ticket centers</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase fw-bold">Active Queue Lines</div>
                <h3 className="fw-bold text-dark mb-0">{totalLinesCount}</h3>
                <small className="text-muted">Managed lines</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase fw-bold">Devotee Reports Today</div>
                <h3 className="fw-bold text-info mb-0">{allReports.length}</h3>
                <small className="text-muted">Live report stream</small>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <ul className="nav nav-tabs mb-4 bg-white px-3 pt-2 rounded shadow-sm border-0">
          <li className="nav-item">
            <button
              className={`nav-link fw-bold ${activeTab === 'voting' ? 'active text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('voting')}
            >
              Voting Numbers Management
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-bold ${activeTab === 'locations' ? 'active text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('locations')}
            >
              Counter Locations ({locations.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-bold ${activeTab === 'reports' ? 'active text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('reports')}
            >
              Live Reports ({allReports.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-bold ${activeTab === 'broadcasts' ? 'active text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('broadcasts')}
            >
              Broadcast Notices ({alerts.length})
            </button>
          </li>
        </ul>

        {/* TAB 1: VOTING NUMBERS MANAGEMENT */}
        {activeTab === 'voting' && (
          <div>
            {/* Location Selector Bar */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body py-3">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">SELECT COUNTER LOCATION</label>
                    <select
                      className="form-select form-select-lg fw-bold"
                      value={selectedLocId}
                      onChange={(e) => setSelectedLocId(e.target.value)}
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.isOpen ? '(Open)' : '(Closed)'} — {(loc.queues || []).length} Lines
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentLoc && (
                    <div className="col-12 col-md-8 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
                      <button
                        className={`btn ${currentLoc.isOpen ? 'btn-outline-danger' : 'btn-success'}`}
                        onClick={() => handleToggleCounterStatus(currentLoc)}
                      >
                        {currentLoc.isOpen ? 'Close Counter Center' : 'Open Counter Center'}
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => setShowAddLineModal(true)}
                      >
                        + Add Queue Line
                      </button>

                      <button
                        className="btn btn-outline-dark"
                        onClick={handleBatchSaveAllLines}
                      >
                        Save All Line Numbers
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation / Guidance Banner */}
            <div className="alert alert-info border-0 shadow-sm d-flex align-items-center justify-content-between mb-3 py-2">
              <div className="small">
                <strong>Active Voting Management Mode:</strong> You can edit any voting number in real time while devotee voting is ongoing. When you update a number, it immediately becomes the new starting baseline. Any new votes from devotees will continue counting upwards from the updated number without resetting or overwriting your edits.
              </div>
            </div>

            {/* Main Live Voting Numbers Table */}
            {currentLoc && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0 fw-bold">{currentLoc.name} — Live Queue Lines</h5>
                    <small className="text-muted">{currentLoc.shortAddress} • Total Lines: {(currentLoc.queues || []).length}</small>
                  </div>
                  <div>
                    <span className={`badge ${currentLoc.isOpen ? 'bg-success' : 'bg-danger'} fs-6`}>
                      {currentLoc.isOpen ? 'Counter Open' : 'Counter Closed'}
                    </span>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '60px' }} className="text-center">Line #</th>
                        <th>Line Name & Slot</th>
                        <th style={{ width: '100px' }} className="text-center">Status</th>
                        <th style={{ width: '120px' }} className="text-center bg-primary-subtle text-primary">
                          Current Votes
                        </th>
                        <th style={{ width: '280px' }} className="bg-light">
                          Edit Voting Number
                        </th>
                        <th style={{ width: '150px' }} className="text-center">Probability (%)</th>
                        <th style={{ width: '110px' }} className="text-center">Est. Wait</th>
                        <th style={{ width: '110px' }} className="text-center">Crowd</th>
                        <th style={{ width: '160px' }} className="text-center">Simulate / Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!currentLoc.queues || currentLoc.queues.length === 0) ? (
                        <tr>
                          <td colSpan={9} className="text-center py-4 text-muted">
                            No queue lines created for this counter yet. Click "+ Add Queue Line" to add one.
                          </td>
                        </tr>
                      ) : (
                        currentLoc.queues.map((q) => {
                          const currentInputValue = editingVotes[q.id] !== undefined ? editingVotes[q.id] : (q.activeReportsCount || 0);
                          const isSaving = savingQueueId === q.id;
                          const isSimulating = isSimulatingVote === q.id;

                          return (
                            <tr key={q.id}>
                              {/* Line # */}
                              <td className="text-center fw-bold fs-6">
                                Line {q.lineNumber}
                              </td>

                              {/* Line Name & Slot */}
                              <td>
                                <div className="fw-bold">{q.name}</div>
                                <div className="text-muted small">{q.tokenSlotType || 'General SSD Token'}</div>
                              </td>

                              {/* Status Toggle */}
                              <td className="text-center">
                                <button
                                  className={`btn btn-sm w-100 ${q.isActive ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                  onClick={() => handleToggleLineActive(q)}
                                  title="Click to toggle status"
                                >
                                  {q.isActive ? 'Active' : 'Closed'}
                                </button>
                              </td>

                              {/* Prominent Current Voting Number Display */}
                              <td className="text-center bg-primary-subtle">
                                <span className="badge bg-primary fs-5 px-3 py-2">
                                  {q.activeReportsCount || 0}
                                </span>
                                <div className="small text-primary fw-semibold mt-1">
                                  live votes
                                </div>
                              </td>

                              {/* Edit Voting Number Controls */}
                              <td className="bg-light">
                                <div className="d-flex align-items-center gap-1">
                                  {/* Quick -5 button */}
                                  <button
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleQuickAdjustVotes(q.id, -5)}
                                    disabled={isSaving}
                                    title="Subtract 5 votes"
                                  >
                                    -5
                                  </button>

                                  {/* Quick -1 button */}
                                  <button
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleQuickAdjustVotes(q.id, -1)}
                                    disabled={isSaving}
                                    title="Subtract 1 vote"
                                  >
                                    -1
                                  </button>

                                  {/* Direct Number Input */}
                                  <input
                                    type="number"
                                    min="0"
                                    className="form-control form-control-sm text-center fw-bold"
                                    style={{ width: '70px' }}
                                    value={currentInputValue}
                                    onChange={(e) => handleVoteInputChange(q.id, e.target.value)}
                                  />

                                  {/* Quick +1 button */}
                                  <button
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleQuickAdjustVotes(q.id, 1)}
                                    disabled={isSaving}
                                    title="Add 1 vote"
                                  >
                                    +1
                                  </button>

                                  {/* Quick +5 button */}
                                  <button
                                    className="btn btn-outline-secondary btn-sm px-2"
                                    onClick={() => handleQuickAdjustVotes(q.id, 5)}
                                    disabled={isSaving}
                                    title="Add 5 votes"
                                  >
                                    +5
                                  </button>

                                  {/* Save Button */}
                                  <button
                                    className="btn btn-primary btn-sm px-2 fw-bold ms-1"
                                    onClick={() => handleSaveLineVotes(q.id)}
                                    disabled={isSaving}
                                    title="Save this number directly to live database"
                                  >
                                    {isSaving ? '...' : 'Save'}
                                  </button>
                                </div>
                              </td>

                              {/* Probability (%) */}
                              <td className="text-center">
                                <span className={`badge ${
                                  q.estimatedProbability >= 70 ? 'bg-success' :
                                  q.estimatedProbability >= 45 ? 'bg-warning text-dark' : 'bg-danger'
                                } fs-6`}>
                                  {q.estimatedProbability}%
                                </span>
                                <div className="small text-muted">{q.probabilityLevel || 'Normal'}</div>
                              </td>

                              {/* Wait Time */}
                              <td className="text-center fw-semibold">
                                {q.estimatedWaitMinutes}m
                              </td>

                              {/* Crowd Level */}
                              <td className="text-center">
                                <span className="badge bg-secondary">
                                  {q.crowdLevel || 'Low'}
                                </span>
                              </td>

                              {/* Simulate User Vote / More Actions */}
                              <td className="text-center">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleSimulateDevoteeVote(q.id)}
                                    disabled={isSimulating}
                                    title="Simulate 1 user vote to test counting from updated number"
                                  >
                                    {isSimulating ? '...' : '+1 User Vote'}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleOpenEditLineModal(q)}
                                    title="Edit Full Line Parameters"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteLine(q.id)}
                                    title="Delete line"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Save All */}
                <div className="card-footer bg-white py-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    Changes made with "Save" or "+/-" are immediately active in the live devotee app.
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={handleBatchSaveAllLines}
                  >
                    Save All Voting Numbers for {currentLoc.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COUNTER LOCATIONS MANAGEMENT */}
        {activeTab === 'locations' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">All Counter Centers in Tirupati</h5>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddLocModal(true)}
              >
                + Add Counter Center
              </button>
            </div>

            <div className="row g-3">
              {locations.map((loc) => {
                const totalLocVotes = (loc.queues || []).reduce((s, q) => s + (q.activeReportsCount || 0), 0);
                return (
                  <div key={loc.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                        <h6 className="mb-0 fw-bold">{loc.name}</h6>
                        <span className={`badge ${loc.isOpen ? 'bg-success' : 'bg-danger'}`}>
                          {loc.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <div className="card-body">
                        <p className="small text-muted mb-2">{loc.landmark} • {loc.shortAddress}</p>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small text-muted">Operating Hours:</span>
                          <span className="small fw-semibold">{loc.operatingHours || '05:00 AM - 08:00 PM'}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small text-muted">Total Lines:</span>
                          <span className="small fw-bold">{(loc.queues || []).length} lines</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                          <span className="small text-muted">Active Votes:</span>
                          <span className="small fw-bold text-primary">{totalLocVotes} votes</span>
                        </div>

                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              setSelectedLocId(loc.id);
                              setActiveTab('voting');
                            }}
                          >
                            Manage Line Votes ({loc.queues?.length || 0})
                          </button>
                          <div className="d-flex gap-2">
                            <button
                              className={`btn btn-sm flex-fill ${loc.isOpen ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => handleToggleCounterStatus(loc)}
                            >
                              {loc.isOpen ? 'Close' : 'Open'}
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteLocation(loc.id, loc.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE REPORTS STREAM */}
        {activeTab === 'reports' && (
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h5 className="mb-0 fw-bold">Live Devotee Queue Reports & Votes Stream</h5>
                <small className="text-muted">Real-time incoming submissions from pilgrims</small>
              </div>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleClearAllReports}
                disabled={allReports.length === 0}
              >
                Clear History
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Time</th>
                    <th>Devotee User</th>
                    <th>Location</th>
                    <th>Line Name</th>
                    <th className="text-center">Group Size</th>
                    <th className="text-center">GPS Verified</th>
                    <th className="text-center">Status</th>
                    <th style={{ width: '80px' }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No community reports logged yet.
                      </td>
                    </tr>
                  ) : (
                    allReports.map((rep) => (
                      <tr key={rep.id}>
                        <td className="fw-semibold">{rep.timestamp || 'Just now'}</td>
                        <td>
                          <code>{rep.userId?.substring(0, 10)}...</code>
                        </td>
                        <td className="fw-semibold">{rep.locationName}</td>
                        <td>{rep.lineName}</td>
                        <td className="text-center">
                          <span className="badge bg-secondary">{rep.peopleCount || 1} people</span>
                        </td>
                        <td className="text-center">
                          {rep.locationVerified ? (
                            <span className="badge bg-success">GPS Verified</span>
                          ) : (
                            <span className="badge bg-light text-muted border">Unverified</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${rep.status === 'active' ? 'bg-info text-dark' : 'bg-light text-muted border'}`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteReport(rep.id)}
                            title="Delete report"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BROADCAST NOTICES */}
        {activeTab === 'broadcasts' && (
          <div className="row g-4">
            <div className="col-12 col-md-5">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold">Publish Official Broadcast</h5>
                  <small className="text-muted">Pushes emergency alert / advisory to devotee devices</small>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePublishBroadcast}>
                    <div className="mb-3">
                      <label className="form-label fw-bold small">Alert Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Vishnu Nivasam Tokens Exhausted"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small">Alert Message</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="e.g. All SSD tokens for today are distributed. Next quota opens at 5:00 AM tomorrow."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        required
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold small">Severity</label>
                        <select
                          className="form-select"
                          value={broadcastSeverity}
                          onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                        >
                          <option value="info">Info (Blue)</option>
                          <option value="success">Success (Green)</option>
                          <option value="warning">Warning (Yellow)</option>
                          <option value="alert">Critical Alert (Red)</option>
                        </select>
                      </div>

                      <div className="col-6">
                        <label className="form-label fw-bold small">Target Location</label>
                        <select
                          className="form-select"
                          value={broadcastTargetLoc}
                          onChange={(e) => setBroadcastTargetLoc(e.target.value)}
                        >
                          <option value="all">All Locations</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 fw-bold">
                      Publish Alert Now
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-7">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold">Active Broadcast Notices ({alerts.length})</h5>
                </div>
                <div className="card-body p-0">
                  {alerts.length === 0 ? (
                    <div className="text-center py-4 text-muted">No active broadcasts.</div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {alerts.map((al) => (
                        <div key={al.id} className="list-group-item d-flex justify-content-between align-items-start py-3">
                          <div className="me-auto">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className={`badge ${
                                al.severity === 'alert' ? 'bg-danger' :
                                al.severity === 'warning' ? 'bg-warning text-dark' :
                                al.severity === 'success' ? 'bg-success' : 'bg-info text-dark'
                              }`}>
                                {al.severity?.toUpperCase()}
                              </span>
                              <span className="fw-bold">{al.title}</span>
                              <small className="text-muted">({al.timestamp})</small>
                            </div>
                            <div className="text-muted small">{al.message}</div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={() => handleDeleteAlert(al.id)}
                            title="Remove broadcast"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: EDIT LINE DETAILS */}
      {/* ---------------------------------------------------------------------- */}
      {editLineModalQueue && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Edit Line Parameters</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditLineModalQueue(null)}
                ></button>
              </div>
              <form onSubmit={handleSaveModalLine}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Line Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={modalLineName}
                      onChange={(e) => setModalLineName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Token Slot Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={modalLineToken}
                      onChange={(e) => setModalLineToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small">Active Voting Number</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control fw-bold text-primary"
                        value={modalLineVotes}
                        onChange={(e) => setModalLineVotes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        required
                      />
                      <small className="text-muted">Current base votes</small>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-bold small">Estimated Chance (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="99"
                        className="form-control fw-bold"
                        value={modalLineProb}
                        onChange={(e) => setModalLineProb(parseInt(e.target.value, 10) || 80)}
                        required
                      />
                      <small className="text-muted">Probability</small>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small">Estimated Wait (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        className="form-control"
                        value={modalLineWait}
                        onChange={(e) => setModalLineWait(parseInt(e.target.value, 10) || 15)}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-bold small">Crowd Level</label>
                      <select
                        className="form-select"
                        value={modalLineCrowd}
                        onChange={(e) => setModalLineCrowd(e.target.value as CrowdLevel)}
                      >
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                        <option value="Very High">Very High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="lineActiveCheck"
                      checked={modalLineActive}
                      onChange={(e) => setModalLineActive(e.target.checked)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="lineActiveCheck">
                      Line is Open and Accepting Devotees
                    </label>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditLineModalQueue(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ADD NEW LINE */}
      {/* ---------------------------------------------------------------------- */}
      {showAddLineModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Add New Queue Line</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddLineModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddNewLine}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Line Name / Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Line 3 (Elderly & Divyangjan)"
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Token Slot Category</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. General SSD Token"
                      value={newLineToken}
                      onChange={(e) => setNewLineToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Initial Starting Voting Number</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control fw-bold"
                      value={newLineInitialVotes}
                      onChange={(e) => setNewLineInitialVotes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    <small className="text-muted">Subsequent votes from users will count upwards from this starting number.</small>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddLineModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Create Line
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ADD NEW LOCATION */}
      {/* ---------------------------------------------------------------------- */}
      {showAddLocModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Add New Counter Center</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddLocModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddLocationSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Center Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Govindaraja Swamy Choultries"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Landmark / Proximity</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Near Tirupati Railway Station"
                      value={newLocLandmark}
                      onChange={(e) => setNewLocLandmark(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Short Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Opposite Bus Stand, Tirupati"
                      value={newLocAddress}
                      onChange={(e) => setNewLocAddress(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Operating Hours</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="05:00 AM - 08:00 PM"
                      value={newLocHours}
                      onChange={(e) => setNewLocHours(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddLocModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Create Center
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
