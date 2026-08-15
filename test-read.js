import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testRead() {
  const q = await getDocs(collection(db, 'locations'));
  console.log("Read success, docs:", q.docs.length);
  process.exit(0);
}
testRead().catch(console.error);
