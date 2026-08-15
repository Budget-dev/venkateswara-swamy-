import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testWrite() {
  await setDoc(doc(db, 'locations', 'test'), { name: 'test' });
  console.log("Write success");
  process.exit(0);
}
testWrite().catch(console.error);
