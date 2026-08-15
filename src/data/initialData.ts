export const FAQ_ITEMS = [
  {
    q: 'How accurate are the wait times?',
    a: 'Wait times are based on real-time reports from devotees currently in the queue, combined with historical data. They are usually accurate within 15-30 minutes.'
  },
  {
    q: 'How do I know which queue to join?',
    a: 'The app automatically recommends the best queue based on your selected location, current crowd levels, and token availability. Look for the "Best Chance" badge.'
  },
  {
    q: 'Can I report queue status without an account?',
    a: 'Yes! You can report crowd levels anonymously. However, creating an account helps us prevent spam and provides more reliable updates.'
  },
  {
    q: 'How often is the data refreshed?',
    a: 'Live queue data is updated every minute. You will see a small pulse indicator when fresh data arrives.'
  }
];

export const DEFAULT_LOCATIONS = [
  {
    id: 'srinivasam',
    name: 'Srinivasam Complex',
    landmark: 'Opp. RTC Central Bus Stand, Tirupati',
    shortAddress: 'Opp. RTC Bus Stand',
    latitude: 13.6276,
    longitude: 79.4244,
    isOpen: true,
    operatingHours: '05:00 AM - 10:00 PM (Daily)',
    totalReportsCount: 48,
    bestLineId: 'srinivasam-line-2',
    bestLineNumber: 2,
    bestLineChance: 86,
    distanceKm: 0.4,
    queues: [
      {
        id: 'srinivasam-line-1',
        locationId: 'srinivasam',
        lineNumber: 1,
        name: 'Counter 1 · Morning SSD Slots (06:00 AM - 12:00 PM)',
        tokenSlotType: 'Morning SSD Slot',
        estimatedProbability: 78,
        probabilityLevel: 'Good',
        crowdLevel: 'Moderate',
        trend: 'Stable',
        activeReportsCount: 14,
        reportsLast15Min: 4,
        lastUpdatedMinutesAgo: 2,
        estimatedWaitMinutes: 25,
        isActive: true
      },
      {
        id: 'srinivasam-line-2',
        locationId: 'srinivasam',
        lineNumber: 2,
        name: 'Counter 2 · Fast-Track SSD Quota Window',
        tokenSlotType: 'Sarva Darshan SSD',
        estimatedProbability: 86,
        probabilityLevel: 'High',
        crowdLevel: 'Low',
        trend: 'Decreasing',
        activeReportsCount: 18,
        reportsLast15Min: 6,
        lastUpdatedMinutesAgo: 1,
        estimatedWaitMinutes: 15,
        isActive: true
      },
      {
        id: 'srinivasam-line-3',
        locationId: 'srinivasam',
        lineNumber: 3,
        name: 'Counter 3 · Afternoon SSD Slots (12:00 PM - 06:00 PM)',
        tokenSlotType: 'Afternoon SSD Slot',
        estimatedProbability: 64,
        probabilityLevel: 'Medium',
        crowdLevel: 'Moderate',
        trend: 'Increasing',
        activeReportsCount: 9,
        reportsLast15Min: 2,
        lastUpdatedMinutesAgo: 4,
        estimatedWaitMinutes: 35,
        isActive: true
      },
      {
        id: 'srinivasam-line-4',
        locationId: 'srinivasam',
        lineNumber: 4,
        name: 'Counter 4 · Evening & Next Day Token Counter',
        tokenSlotType: 'Next Day SSD Token',
        estimatedProbability: 52,
        probabilityLevel: 'Medium',
        crowdLevel: 'High',
        trend: 'Increasing',
        activeReportsCount: 7,
        reportsLast15Min: 1,
        lastUpdatedMinutesAgo: 5,
        estimatedWaitMinutes: 45,
        isActive: true
      }
    ]
  },
  {
    id: 'vishnu-nivasam',
    name: 'Vishnu Nivasam',
    landmark: 'Opp. Tirupati Main Railway Station',
    shortAddress: 'Opp. Railway Station',
    latitude: 13.6335,
    longitude: 79.4188,
    isOpen: true,
    operatingHours: '05:00 AM - 10:00 PM (Daily)',
    totalReportsCount: 62,
    bestLineId: 'vishnu-line-1',
    bestLineNumber: 1,
    bestLineChance: 89,
    distanceKm: 0.8,
    queues: [
      {
        id: 'vishnu-line-1',
        locationId: 'vishnu-nivasam',
        lineNumber: 1,
        name: 'Counter 1 · Railway Pilgrim Main Counter',
        tokenSlotType: 'Morning SSD Slot',
        estimatedProbability: 89,
        probabilityLevel: 'High',
        crowdLevel: 'Low',
        trend: 'Stable',
        activeReportsCount: 22,
        reportsLast15Min: 8,
        lastUpdatedMinutesAgo: 1,
        estimatedWaitMinutes: 12,
        isActive: true
      },
      {
        id: 'vishnu-line-2',
        locationId: 'vishnu-nivasam',
        lineNumber: 2,
        name: 'Counter 2 · Sarva Darshan SSD Window',
        tokenSlotType: 'Free SSD Token',
        estimatedProbability: 74,
        probabilityLevel: 'Good',
        crowdLevel: 'Moderate',
        trend: 'Stable',
        activeReportsCount: 16,
        reportsLast15Min: 5,
        lastUpdatedMinutesAgo: 3,
        estimatedWaitMinutes: 28,
        isActive: true
      },
      {
        id: 'vishnu-line-3',
        locationId: 'vishnu-nivasam',
        lineNumber: 3,
        name: 'Counter 3 · Afternoon & Evening Token Line',
        tokenSlotType: 'Slotted Token',
        estimatedProbability: 58,
        probabilityLevel: 'Medium',
        crowdLevel: 'High',
        trend: 'Increasing',
        activeReportsCount: 12,
        reportsLast15Min: 3,
        lastUpdatedMinutesAgo: 4,
        estimatedWaitMinutes: 40,
        isActive: true
      },
      {
        id: 'vishnu-line-4',
        locationId: 'vishnu-nivasam',
        lineNumber: 4,
        name: 'Counter 4 · Senior Citizen & Divyangjan Counter',
        tokenSlotType: 'Priority SSD Token',
        estimatedProbability: 92,
        probabilityLevel: 'High',
        crowdLevel: 'Low',
        trend: 'Decreasing',
        activeReportsCount: 12,
        reportsLast15Min: 4,
        lastUpdatedMinutesAgo: 2,
        estimatedWaitMinutes: 8,
        isActive: true
      }
    ]
  },
  {
    id: 'bhudevi',
    name: 'Bhudevi Complex',
    landmark: 'Alipiri Footpath Entry / Toll Gate, Tirupati',
    shortAddress: 'Alipiri Footpath Gate',
    latitude: 13.6612,
    longitude: 79.3951,
    isOpen: true,
    operatingHours: '04:30 AM - 09:30 PM (Daily)',
    totalReportsCount: 39,
    bestLineId: 'bhudevi-line-2',
    bestLineNumber: 2,
    bestLineChance: 82,
    distanceKm: 3.2,
    queues: [
      {
        id: 'bhudevi-line-1',
        locationId: 'bhudevi',
        lineNumber: 1,
        name: 'Counter 1 · Footpath Trekker SSD Counter',
        tokenSlotType: 'Footpath Divya Darshan',
        estimatedProbability: 71,
        probabilityLevel: 'Good',
        crowdLevel: 'Moderate',
        trend: 'Stable',
        activeReportsCount: 15,
        reportsLast15Min: 5,
        lastUpdatedMinutesAgo: 2,
        estimatedWaitMinutes: 22,
        isActive: true
      },
      {
        id: 'bhudevi-line-2',
        locationId: 'bhudevi',
        lineNumber: 2,
        name: 'Counter 2 · Alipiri General SSD Window',
        tokenSlotType: 'Free SSD Token',
        estimatedProbability: 82,
        probabilityLevel: 'High',
        crowdLevel: 'Low',
        trend: 'Decreasing',
        activeReportsCount: 14,
        reportsLast15Min: 6,
        lastUpdatedMinutesAgo: 1,
        estimatedWaitMinutes: 14,
        isActive: true
      },
      {
        id: 'bhudevi-line-3',
        locationId: 'bhudevi',
        lineNumber: 3,
        name: 'Counter 3 · Srivari Mettu & Alipiri Counter',
        tokenSlotType: 'Slotted Token',
        estimatedProbability: 60,
        probabilityLevel: 'Medium',
        crowdLevel: 'Moderate',
        trend: 'Increasing',
        activeReportsCount: 10,
        reportsLast15Min: 2,
        lastUpdatedMinutesAgo: 6,
        estimatedWaitMinutes: 32,
        isActive: true
      }
    ]
  }
];

export const DEFAULT_ALERTS = [
  {
    id: 'alt-1',
    locationId: 'vishnu-nivasam',
    queueId: 'vishnu-line-1',
    locationName: 'Vishnu Nivasam',
    lineName: 'Counter 1',
    title: 'Fast Moving Queue at Vishnu Nivasam',
    message: 'Counter 1 has low wait time (~12 mins) with fresh morning quota availability.',
    severity: 'success' as const,
    timestamp: '10 mins ago',
    read: false
  },
  {
    id: 'alt-2',
    locationId: 'srinivasam',
    queueId: 'srinivasam-line-2',
    locationName: 'Srinivasam Complex',
    lineName: 'Counter 2',
    title: 'Token Availability High',
    message: 'High probability of securing today’s Sarva Darshan SSD tokens at Srinivasam.',
    severity: 'info' as const,
    timestamp: '25 mins ago',
    read: false
  }
];

export const TELUGU_TRANSLATIONS: Record<string, string> = {
  'Tirupati Q-Lines': 'తిరుపతి క్యూ-లైన్స్',
  'Live wait times and predictions': 'లైవ్ వెయిట్ టైమ్స్ & అంచనాలు',
  'Live Updates': 'ప్రత్యక్ష నవీకరణలు',
  'Best Chance': 'ఉత్తమ అవకాశం',
  'Find Best Queue': 'ఉత్తమ క్యూ కనుగొనండి',
  'Report Queue': 'క్యూ రిపోర్ట్ చేయండి',
  'Home': 'హోమ్',
  'Alerts': 'అలర్ట్స్',
  'Profile': 'ప్రొఫైల్',
  'Map': 'మ్యాప్',
  'Language': 'భాష',
  'English': 'ఆంగ్ల',
  'Telugu': 'తెలుగు',
  'High': 'ఎక్కువ',
  'Medium': 'మధ్యస్థం',
  'Low': 'తక్కువ',
  'Stable': 'స్థిరమైన',
  'Increasing': 'పెరుగుతున్న',
  'Decreasing': 'తగ్గుతున్న',
};

