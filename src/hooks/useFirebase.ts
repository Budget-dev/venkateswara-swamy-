import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, getDocs, updateDoc, increment, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messagingPromise } from '../lib/firebase';
import { CounterLocation, QueueAlert, UserQueueReport, DevoteeProfile } from '../types';
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
      hist.sort((a,b) => b.id.localeCompare(a.id)); // simple sort by id which has Date.now
      setReportHistory(hist);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [profile?.id]);

  // Periodic update every 5 minutes to refresh queue stats based on votes decaying
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const locationsRef = collection(db, 'locations');
        const locSnap = await getDocs(locationsRef);
        
        locSnap.forEach(async (docSnap) => {
          const loc = docSnap.data() as CounterLocation;
          let hasChanges = false;
          const newQueues = (loc.queues || []).map(q => {
             const decayedReports15M = Math.max(0, q.reportsLast15Min - Math.max(1, Math.floor(q.reportsLast15Min * 0.2)));
             const newActive = Math.max(0, q.activeReportsCount - Math.max(1, Math.floor(q.activeReportsCount * 0.1)));
             const newLastUpdated = q.lastUpdatedMinutesAgo + 5;
             
             const estimatedWait = Math.min(180, Math.floor(newActive * 2.5));
             const newProb = Math.max(5, Math.min(100, Math.floor(100 - (newActive * 1.5))));
             
             let crowd = 'Low';
             if (newActive > 20) crowd = 'Moderate';
             if (newActive > 50) crowd = 'High';
             if (newActive > 100) crowd = 'Very High';

             let probLevel = 'High';
             if (newProb < 80) probLevel = 'Good';
             if (newProb < 50) probLevel = 'Medium';
             if (newProb < 30) probLevel = 'Low';

             if (decayedReports15M !== q.reportsLast15Min || newLastUpdated !== q.lastUpdatedMinutesAgo) {
               hasChanges = true;
             }
             return {
               ...q,
               activeReportsCount: newActive,
               reportsLast15Min: decayedReports15M,
               lastUpdatedMinutesAgo: newLastUpdated,
               estimatedWaitMinutes: estimatedWait,
               estimatedProbability: newProb,
               crowdLevel: crowd as any,
               probabilityLevel: probLevel as any,
             }
          });
          if (hasChanges) {
             await updateDoc(docSnap.ref, { queues: newQueues });
          }
        });
      } catch (err) {
        console.error("Failed to refresh stats", err);
      }
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(refreshInterval);
  }, []);

  const updateProfile = async (updated: Partial<DevoteeProfile>) => {
    if (!profile) return;
    const profileRef = doc(db, 'profiles', profile.id);
    try {
      await updateDoc(profileRef, updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const submitReport = async (locationId: string, queueId: string, peopleCount: number, lat?: number, lng?: number) => {
    let currentProfile = profile;
    if (!currentProfile) {
      let localProfileId = localStorage.getItem('tq_profile_id') || ('usr_' + Math.random().toString(36).substring(2, 8));
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

    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;
    const q = (loc.queues || []).find(qu => qu.id === queueId);
    if (!q) return;

    let verified = false;
    let distMeter: number | undefined;
    if (lat && lng) {
      verified = true;
    }

    const reportId = 'rep_' + Date.now();
    const newReport: UserQueueReport = {
      id: reportId,
      userId: currentProfile.id,
      locationId,
      queueId,
      locationName: loc.name,
      lineName: q.name,
      peopleCount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationVerified: verified,
      status: 'active'
    };

    if (distMeter !== undefined) {
      newReport.distanceMeter = distMeter;
    }

    try {
      // Save Active Report & Global Report
      await setDoc(doc(db, 'active_reports', currentProfile.id), newReport);
      await setDoc(doc(db, 'reports', reportId), newReport);

      await updateDoc(doc(db, 'profiles', currentProfile.id), {
        karmaPoints: increment(verified ? 30 : 20),
        reportsSubmitted: increment(1),
        verifiedReportsCount: increment(verified ? 1 : 0)
      });

      const locRef = doc(db, 'locations', loc.id);
      const updatedQueues = (loc.queues || []).map(queue => {
        if (queue.id === queueId) {
          const newActiveReports = (queue.activeReportsCount || 0) + 1;
          const newLast15Min = (queue.reportsLast15Min || 0) + 1;
          
          // Realistic dynamic wait time & probability calculation based on vote crowd count:
          // Devotee group multiplier
          const crowdScale = newActiveReports + (peopleCount > 1 ? Math.floor(peopleCount * 0.4) : 0);
          const estimatedWait = Math.min(180, Math.max(5, Math.floor(crowdScale * 3.2)));
          
          // Probability decreases realistically as crowd queue reports rise (max 94%, min 8%)
          const newProb = Math.max(8, Math.min(94, Math.floor(95 - (crowdScale * 2.8) - (estimatedWait * 0.15))));
          
          let crowd: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
          if (crowdScale >= 20) crowd = 'Very High';
          else if (crowdScale >= 10) crowd = 'High';
          else if (crowdScale >= 4) crowd = 'Moderate';

          let probLevel: 'High' | 'Good' | 'Medium' | 'Low' = 'High';
          if (newProb < 35) probLevel = 'Low';
          else if (newProb < 60) probLevel = 'Medium';
          else if (newProb < 80) probLevel = 'Good';

          return {
            ...queue,
            activeReportsCount: newActiveReports,
            reportsLast15Min: newLast15Min,
            estimatedWaitMinutes: estimatedWait,
            estimatedProbability: newProb,
            crowdLevel: crowd,
            probabilityLevel: probLevel,
            lastUpdatedMinutesAgo: 0
          };
        }
        return queue;
      });
      await updateDoc(locRef, {
        totalReportsCount: increment(1),
        queues: updatedQueues
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reports/${reportId}`);
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
    
    // Check if Notification API is supported by the browser
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await messagingPromise;
        if (messaging) {
          const currentToken = await getToken(messaging, { 
            // We use default VAPID or let Firebase try if no key is provided.
            // If the user hasn't provided a vapidKey in config, this might fail, but we'll try.
          }).catch(e => {
            console.warn('FCM token fetch failed. VAPID key might be missing:', e);
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
        // You could trigger a local toast/notification here if desired.
        // For standard behavior, browser only shows push naturally in background,
        // but we can optionally show it if they are in the app.
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
    updatePresence,
    leaveQueue,
    markAlertRead,
    requestNotificationPermission
  };
}

