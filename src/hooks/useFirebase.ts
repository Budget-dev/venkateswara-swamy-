import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  updateDoc,
  increment,
  deleteDoc,
  getDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messagingPromise } from '../lib/firebase';
import { CounterLocation, QueueAlert, UserQueueReport, DevoteeProfile, QueueLine, CrowdLevel, ProbabilityLevel } from '../types';
import { DEFAULT_LOCATIONS, DEFAULT_ALERTS } from '../data/initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Calculates dynamic wait time, crowd level, and probability level based on active voting counts.
 */
export function calculateLineMetrics(votesCount: number, customProbability?: number) {
  const safeVotes = Math.max(0, votesCount);
  const estimatedWait = Math.min(180, Math.max(5, Math.floor(safeVotes * 3.2)));
  
  let prob: number;
  if (customProbability !== undefined && customProbability >= 0 && customProbability <= 100) {
    prob = customProbability;
  } else {
    // Dynamic calculation: probability scales realistically with vote count and wait time
    prob = Math.max(8, Math.min(94, Math.floor(95 - (safeVotes * 2.8) - (estimatedWait * 0.15))));
  }

  let crowd: CrowdLevel = 'Low';
  if (safeVotes >= 20) crowd = 'Very High';
  else if (safeVotes >= 10) crowd = 'High';
  else if (safeVotes >= 4) crowd = 'Moderate';

  let probLevel: ProbabilityLevel = 'High';
  if (prob < 35) probLevel = 'Low';
  else if (prob < 60) probLevel = 'Medium';
  else if (prob < 80) probLevel = 'Good';

  return {
    estimatedWaitMinutes: estimatedWait,
    estimatedProbability: prob,
    crowdLevel: crowd,
    probabilityLevel: probLevel
  };
}

export function useFirebase() {
  const [locations, setLocations] = useState<CounterLocation[]>(DEFAULT_LOCATIONS);
  const [alerts, setAlerts] = useState<QueueAlert[]>(DEFAULT_ALERTS);
  const [profile, setProfile] = useState<DevoteeProfile | null>(null);
  const [activeReport, setActiveReport] = useState<UserQueueReport | null>(null);
  const [reportHistory, setReportHistory] = useState<UserQueueReport[]>([]);

  // Initialize and sync Locations
  useEffect(() => {
    const checkAndRunDailyReset = async () => {
      try {
        const todayStr = new Date().toDateString();
        const configRef = doc(db, 'system_config', 'app_state');
        const configSnap = await getDoc(configRef);
        
        if (!configSnap.exists() || configSnap.data().lastResetDate !== todayStr) {
          await setDoc(configRef, { lastResetDate: todayStr }, { merge: true });
          
          for (const loc of DEFAULT_LOCATIONS) {
            await setDoc(doc(db, 'locations', loc.id), loc);
          }
          
          const activeSnap = await getDocs(collection(db, 'active_reports'));
          const deleteActivePromises = activeSnap.docs.map(d => deleteDoc(doc(db, 'active_reports', d.id)));
          
          const reportsSnap = await getDocs(collection(db, 'reports'));
          const deleteReportsPromises = reportsSnap.docs.map(d => deleteDoc(doc(db, 'reports', d.id)));
          
          await Promise.all([...deleteActivePromises, ...deleteReportsPromises]);
          console.log('Daily reset completed successfully.');
        }
      } catch (e) {
        console.warn('Daily reset failed', e);
      }
    };
    
    // Run the reset check asynchronously
    checkAndRunDailyReset();

    const locationsRef = collection(db, 'locations');

    const unsub = onSnapshot(locationsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default locations to Firestore
        try {
          for (const loc of DEFAULT_LOCATIONS) {
            await setDoc(doc(db, 'locations', loc.id), loc);
          }
        } catch (e) {
          console.warn('Seeding locations failed:', e);
        }
        setLocations(DEFAULT_LOCATIONS);
        return;
      }

      const locs: CounterLocation[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as CounterLocation;
        const id = data.id || docSnap.id;
        if (id === 'govindaraja') {
          deleteDoc(doc(db, 'locations', id)).catch(console.warn);
          return;
        }
        locs.push({ ...data, id });
      });
      setLocations(locs.length > 0 ? locs : DEFAULT_LOCATIONS);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'locations');
      setLocations(DEFAULT_LOCATIONS);
    });
    return () => unsub();
  }, []);

  // Initialize and sync Alerts
  useEffect(() => {
    const alertsRef = collection(db, 'alerts');

    const unsub = onSnapshot(alertsRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const alt of DEFAULT_ALERTS) {
            await setDoc(doc(db, 'alerts', alt.id), alt);
          }
        } catch (e) {
          console.warn('Seeding alerts failed:', e);
        }
        setAlerts(DEFAULT_ALERTS);
        return;
      }

      const arr: QueueAlert[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as QueueAlert;
        arr.push({ ...data, id: data.id || doc.id });
      });
      setAlerts(arr.length > 0 ? arr : DEFAULT_ALERTS);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'alerts');
      setAlerts(DEFAULT_ALERTS);
    });
    return () => unsub();
  }, []);

  // Profile setup
  useEffect(() => {
    let localProfileId = localStorage.getItem('tq_profile_id');
    if (!localProfileId) {
      localProfileId = 'usr_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('tq_profile_id', localProfileId);
    }
    
    const profileRef = doc(db, 'profiles', localProfileId);
    getDoc(profileRef).then(async (docSnap) => {
      if (!docSnap.exists()) {
        const defaultProfile: DevoteeProfile = {
          id: localProfileId!,
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
        try {
          await setDoc(profileRef, defaultProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `profiles/${localProfileId}`);
        }
        setProfile(defaultProfile);
      }
    }).catch(err => {
      handleFirestoreError(err, OperationType.GET, `profiles/${localProfileId}`);
    });

    const unsub = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as DevoteeProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${localProfileId}`);
    });

    return () => unsub();
  }, []);

  // Sync Active Report & History
  useEffect(() => {
    if (!profile?.id) return;
    const activeReportRef = doc(db, 'active_reports', profile.id);
    const unsubActive = onSnapshot(activeReportRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveReport(docSnap.data() as UserQueueReport);
      } else {
        setActiveReport(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `active_reports/${profile.id}`);
    });

    const q = query(collection(db, 'reports'), where('userId', '==', profile.id));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const hist: UserQueueReport[] = [];
      snapshot.forEach(d => {
        const data = d.data() as UserQueueReport;
        hist.push({ ...data, id: data.id || d.id });
      });
      hist.sort((a,b) => b.id.localeCompare(a.id));
      setReportHistory(hist);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [profile?.id]);

  const updateProfile = async (updated: Partial<DevoteeProfile>) => {
    if (!profile) return;
    const profileRef = doc(db, 'profiles', profile.id);
    try {
      await updateDoc(profileRef, updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  /**
   * DEVOTEE VOTING SUBMISSION:
   * Uses an atomic Firestore transaction so user votes strictly count from whatever
   * the current number is in Firestore (including any number just set by the admin).
   * User voting will NEVER overwrite or reset admin-edited values.
   */
  const submitReport = async (locationId: string, queueId: string, peopleCount: number = 1, lat?: number, lng?: number) => {
    let currentProfile = profile;
    if (!currentProfile) {
      const localProfileId = localStorage.getItem('tq_profile_id') || ('usr_' + Math.random().toString(36).substring(2, 8));
      localStorage.setItem('tq_profile_id', localProfileId);
      currentProfile = {
        id: localProfileId,
        name: 'Devotee Pilgrim',
        isAuthenticated: false,
        karmaPoints: 0,
        reportsSubmitted: 0,
        verifiedReportsCount: 0,
        language: 'en',
        notificationSettings: {
          queueChanges: true, lowChanceAlerts: true, betterNearby: true, statusChanges: true, crowdSpikes: true
        }
      };
      setProfile(currentProfile);
      try {
        await setDoc(doc(db, 'profiles', localProfileId), currentProfile);
      } catch {
        // Fallback gracefully
      }
    }

    const reportId = 'rep_' + Date.now();
    const locRef = doc(db, 'locations', locationId);

    try {
      // Execute Firestore Transaction to atomically increment the queue line votes
      await runTransaction(db, async (transaction) => {
        const locSnap = await transaction.get(locRef);
        if (!locSnap.exists()) {
          throw new Error(`Location ${locationId} does not exist`);
        }

        const locData = locSnap.data() as CounterLocation;
        const existingQueues = locData.queues || [];
        const targetQueue = existingQueues.find(q => q.id === queueId);

        const currentVotes = Number(targetQueue?.activeReportsCount) || 0;
        const newVotes = currentVotes + 1; // Devotee vote adds 1 directly onto the current/admin-edited base

        const newReport: UserQueueReport = {
          id: reportId,
          userId: currentProfile.id,
          locationId,
          queueId,
          locationName: locData.name,
          lineName: targetQueue?.name || 'Queue Line',
          peopleCount: Math.max(1, peopleCount),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationVerified: Boolean(lat && lng),
          status: 'active',
          ...(lat && lng ? { distanceMeter: 50 } : {})
        };

        const updatedQueues = existingQueues.map(queue => {
          if (queue.id === queueId) {
            const newLast15Min = (Number(queue.reportsLast15Min) || 0) + 1;
            const metrics = calculateLineMetrics(newVotes);

            return {
              ...queue,
              activeReportsCount: newVotes,
              reportsLast15Min: newLast15Min,
              lastUpdatedMinutesAgo: 0,
              ...metrics
            };
          }
          return queue;
        });

        const totalReports = updatedQueues.reduce((acc, q) => acc + (q.activeReportsCount || 0), 0);
        const best = updatedQueues.reduce(
          (b, curr) => (curr.estimatedProbability > (b?.estimatedProbability || 0) ? curr : b),
          updatedQueues[0]
        );

        // Update location document atomically
        transaction.update(locRef, {
          totalReportsCount: totalReports,
          queues: updatedQueues,
          bestLineId: best?.id || '',
          bestLineNumber: best?.lineNumber || 1,
          bestLineChance: best?.estimatedProbability || 0
        });

        // Save active and global reports
        transaction.set(doc(db, 'active_reports', currentProfile.id), newReport);
        transaction.set(doc(db, 'reports', reportId), newReport);
      });

      // Update user karma asynchronously
      updateDoc(doc(db, 'profiles', currentProfile.id), {
        karmaPoints: increment(lat && lng ? 30 : 20),
        reportsSubmitted: increment(1),
        verifiedReportsCount: increment(lat && lng ? 1 : 0)
      }).catch(console.warn);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `locations/${locationId}`);
      throw err;
    }
  };

  /**
   * ADMIN ACTION: Edit/Set Voting Number for a specific line.
   * Atomically updates the voting count in Firestore so any subsequent user votes
   * continue counting smoothly from this updated number.
   */
  const adminSetLineVotes = async (
    locationId: string,
    queueId: string,
    newVoteCount: number,
    customOptions?: {
      name?: string;
      tokenSlotType?: string;
      isActive?: boolean;
      estimatedProbability?: number;
      estimatedWaitMinutes?: number;
      crowdLevel?: CrowdLevel;
      trend?: any;
    }
  ) => {
    const locRef = doc(db, 'locations', locationId);
    try {
      await runTransaction(db, async (transaction) => {
        const locSnap = await transaction.get(locRef);
        if (!locSnap.exists()) {
          throw new Error(`Location ${locationId} not found`);
        }

        const locData = locSnap.data() as CounterLocation;
        const existingQueues = locData.queues || [];
        const safeVotes = Math.max(0, Math.round(Number(newVoteCount) || 0));

        const updatedQueues = existingQueues.map(queue => {
          if (queue.id === queueId) {
            const metrics = calculateLineMetrics(safeVotes, customOptions?.estimatedProbability);

            return {
              ...queue,
              activeReportsCount: safeVotes,
              lastUpdatedMinutesAgo: 0,
              ...metrics,
              ...(customOptions?.name ? { name: customOptions.name } : {}),
              ...(customOptions?.tokenSlotType ? { tokenSlotType: customOptions.tokenSlotType } : {}),
              ...(customOptions?.isActive !== undefined ? { isActive: customOptions.isActive } : {}),
              ...(customOptions?.estimatedWaitMinutes !== undefined ? { estimatedWaitMinutes: customOptions.estimatedWaitMinutes } : {}),
              ...(customOptions?.crowdLevel ? { crowdLevel: customOptions.crowdLevel } : {}),
              ...(customOptions?.trend ? { trend: customOptions.trend } : {})
            };
          }
          return queue;
        });

        const totalReports = updatedQueues.reduce((acc, q) => acc + (q.activeReportsCount || 0), 0);
        const best = updatedQueues.reduce(
          (b, curr) => (curr.estimatedProbability > (b?.estimatedProbability || 0) ? curr : b),
          updatedQueues[0]
        );

        transaction.update(locRef, {
          queues: updatedQueues,
          totalReportsCount: totalReports,
          bestLineId: best?.id || '',
          bestLineNumber: best?.lineNumber || 1,
          bestLineChance: best?.estimatedProbability || 0
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `locations/${locationId}`);
      throw err;
    }
  };

  /**
   * ADMIN ACTION: Quick +/- delta adjust votes for a line (e.g., +1, +5, -1, -5).
   */
  const adminAdjustLineVotes = async (locationId: string, queueId: string, delta: number) => {
    const locRef = doc(db, 'locations', locationId);
    try {
      await runTransaction(db, async (transaction) => {
        const locSnap = await transaction.get(locRef);
        if (!locSnap.exists()) return;

        const locData = locSnap.data() as CounterLocation;
        const existingQueues = locData.queues || [];
        const targetQueue = existingQueues.find(q => q.id === queueId);
        const currentVotes = Number(targetQueue?.activeReportsCount) || 0;
        const safeVotes = Math.max(0, currentVotes + delta);

        const updatedQueues = existingQueues.map(queue => {
          if (queue.id === queueId) {
            const metrics = calculateLineMetrics(safeVotes);
            return {
              ...queue,
              activeReportsCount: safeVotes,
              lastUpdatedMinutesAgo: 0,
              ...metrics
            };
          }
          return queue;
        });

        const totalReports = updatedQueues.reduce((acc, q) => acc + (q.activeReportsCount || 0), 0);
        const best = updatedQueues.reduce(
          (b, curr) => (curr.estimatedProbability > (b?.estimatedProbability || 0) ? curr : b),
          updatedQueues[0]
        );

        transaction.update(locRef, {
          queues: updatedQueues,
          totalReportsCount: totalReports,
          bestLineId: best?.id || '',
          bestLineNumber: best?.lineNumber || 1,
          bestLineChance: best?.estimatedProbability || 0
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `locations/${locationId}`);
      throw err;
    }
  };

  /**
   * ADMIN ACTION: Batch update multiple lines for a counter location.
   */
  const adminBatchUpdateLines = async (
    locationId: string,
    updates: { id: string; activeReportsCount: number; estimatedProbability?: number; isActive?: boolean; name?: string; tokenSlotType?: string }[]
  ) => {
    const locRef = doc(db, 'locations', locationId);
    try {
      await runTransaction(db, async (transaction) => {
        const locSnap = await transaction.get(locRef);
        if (!locSnap.exists()) return;

        const locData = locSnap.data() as CounterLocation;
        const existingQueues = locData.queues || [];
        const updateMap = new Map(updates.map(u => [u.id, u]));

        const updatedQueues = existingQueues.map(queue => {
          if (updateMap.has(queue.id)) {
            const u = updateMap.get(queue.id)!;
            const safeVotes = Math.max(0, Math.round(Number(u.activeReportsCount) || 0));
            const metrics = calculateLineMetrics(safeVotes, u.estimatedProbability);

            return {
              ...queue,
              name: u.name || queue.name,
              tokenSlotType: u.tokenSlotType || queue.tokenSlotType,
              isActive: u.isActive !== undefined ? u.isActive : queue.isActive,
              activeReportsCount: safeVotes,
              lastUpdatedMinutesAgo: 0,
              ...metrics
            };
          }
          return queue;
        });

        const totalReports = updatedQueues.reduce((acc, q) => acc + (q.activeReportsCount || 0), 0);
        const best = updatedQueues.reduce(
          (b, curr) => (curr.estimatedProbability > (b?.estimatedProbability || 0) ? curr : b),
          updatedQueues[0]
        );

        transaction.update(locRef, {
          queues: updatedQueues,
          totalReportsCount: totalReports,
          bestLineId: best?.id || '',
          bestLineNumber: best?.lineNumber || 1,
          bestLineChance: best?.estimatedProbability || 0
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `locations/${locationId}`);
      throw err;
    }
  };

  const updatePresence = async () => {
    if (!profile || !activeReport) return;
    try {
      await updateDoc(doc(db, 'active_reports', profile.id), {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `active_reports/${profile.id}`);
    }
  };

  const leaveQueue = async (outcome: 'received_ticket' | 'no_ticket' | 'left_early' | 'unsure', actualWaitMinutes?: number) => {
    if (!profile || !activeReport) return;
    
    try {
      const reportRef = doc(db, 'reports', activeReport.id);
      await updateDoc(reportRef, {
        status: 'completed',
        outcome,
        actualWaitMinutes: actualWaitMinutes || null
      });

      await deleteDoc(doc(db, 'active_reports', profile.id));
      
      await updateDoc(doc(db, 'profiles', profile.id), {
        karmaPoints: increment(15)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reports/${activeReport.id}`);
    }
  };

  const markAlertRead = async (alertId: string) => {
    const alertRef = doc(db, 'alerts', alertId);
    try {
      await updateDoc(alertRef, { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alerts/${alertId}`);
    }
  };

  const requestNotificationPermission = async () => {
    if (!profile) return false;
    
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await messagingPromise;
        if (messaging) {
          const currentToken = await getToken(messaging, {}).catch(e => {
            console.warn('FCM token fetch failed:', e);
            return null;
          });
          if (currentToken) {
            await updateProfile({ fcmToken: currentToken });
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission', error);
    }
    return false;
  };

  // Listen for foreground FCM messages
  useEffect(() => {
    messagingPromise.then(messaging => {
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        if (payload.notification) {
          if ('Notification' in window && Notification.permission === 'granted') {
             new Notification(payload.notification.title || 'Queue Alert', {
               body: payload.notification.body,
               icon: '/icon.png'
             });
          }
        }
      });
    });
  }, []);

  return {
    locations,
    alerts,
    profile,
    activeReport,
    reportHistory,
    updateProfile,
    submitReport,
    adminSetLineVotes,
    adminAdjustLineVotes,
    adminBatchUpdateLines,
    updatePresence,
    leaveQueue,
    markAlertRead,
    requestNotificationPermission
  };
}


