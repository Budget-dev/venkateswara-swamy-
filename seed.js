import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const INITIAL_LOCATIONS = [
  {
    id: 'vishnu-nivasam',
    name: 'Vishnu Nivasam',
    landmark: 'Opp. Railway Station, Tirupati',
    shortAddress: 'Opp. Railway Station',
    latitude: 13.6322,
    longitude: 79.4158,
    bestLineId: 'vishnu-line-2',
    bestLineNumber: 2,
    bestLineChance: 0,
    totalReportsCount: 0,
    isOpen: true,
    operatingHours: '04:00 AM - 10:00 PM',
    distanceKm: 0.8,
    queues: [
      {
        id: 'vishnu-line-1',
        locationId: 'vishnu-nivasam',
        lineNumber: 1,
        name: 'Line 1',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'vishnu-line-2',
        locationId: 'vishnu-nivasam',
        lineNumber: 2,
        name: 'Line 2',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'vishnu-line-3',
        locationId: 'vishnu-nivasam',
        lineNumber: 3,
        name: 'Line 3',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'vishnu-line-4',
        locationId: 'vishnu-nivasam',
        lineNumber: 4,
        name: 'Line 4',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      }
    ]
  },
  {
    id: 'srinivasam',
    name: 'Srinivasam',
    landmark: 'Opp. RTC Bus Stand, Tirupati',
    shortAddress: 'Opp. RTC Bus Stand',
    latitude: 13.6288,
    longitude: 79.4192,
    bestLineId: 'srinivasam-line-1',
    bestLineNumber: 1,
    bestLineChance: 0,
    totalReportsCount: 0,
    isOpen: true,
    operatingHours: '03:30 AM - 11:00 PM',
    distanceKm: 1.2,
    queues: [
      {
        id: 'srinivasam-line-1',
        locationId: 'srinivasam',
        lineNumber: 1,
        name: 'Line 1',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'srinivasam-line-2',
        locationId: 'srinivasam',
        lineNumber: 2,
        name: 'Line 2',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'srinivasam-line-3',
        locationId: 'srinivasam',
        lineNumber: 3,
        name: 'Line 3',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'srinivasam-line-4',
        locationId: 'srinivasam',
        lineNumber: 4,
        name: 'Line 4',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      }
    ]
  },
  {
    id: 'bhudevi',
    name: 'Bhudevi Complex',
    landmark: 'Near Alipiri Footstep Entrance, Tirupati',
    shortAddress: 'Near Alipiri Steps',
    latitude: 13.6510,
    longitude: 79.4002,
    bestLineId: 'bhudevi-line-1',
    bestLineNumber: 1,
    bestLineChance: 0,
    totalReportsCount: 0,
    isOpen: true,
    operatingHours: '03:00 AM - 10:00 PM',
    distanceKm: 3.5,
    queues: [
      {
        id: 'bhudevi-line-1',
        locationId: 'bhudevi',
        lineNumber: 1,
        name: 'Line 1',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'bhudevi-line-2',
        locationId: 'bhudevi',
        lineNumber: 2,
        name: 'Line 2',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'bhudevi-line-3',
        locationId: 'bhudevi',
        lineNumber: 3,
        name: 'Line 3',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      },
      {
        id: 'bhudevi-line-4',
        locationId: 'bhudevi',
        lineNumber: 4,
        name: 'Line 4',
        estimatedProbability: 0,
        probabilityLevel: 'Medium',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 0,
        reportsLast15Min: 0,
        lastUpdatedMinutesAgo: 0,
        estimatedWaitMinutes: 0,
        tokenSlotType: 'SSD Token',
        isActive: true,
        notes: ''
      }
    ]
  }
];

async function seed() {
  try {
    const locationsRef = collection(db, 'locations');
    const alertsRef = collection(db, 'alerts');
    const reportsRef = collection(db, 'reports');

    console.log("Deleting alerts...");
    const a = await getDocs(alertsRef);
    for (const d of a.docs) await deleteDoc(doc(alertsRef, d.id));

    console.log("Deleting reports...");
    const r = await getDocs(reportsRef);
    for (const d of r.docs) await deleteDoc(doc(reportsRef, d.id));
    
    console.log("Setting locations...");
    for (const loc of INITIAL_LOCATIONS) {
      await setDoc(doc(locationsRef, loc.id), loc);
    }
    console.log("DB RESET DONE");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}
seed();
