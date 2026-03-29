import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, increment } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAvS4ekR50AhEPuXE2TOWcRrC96u8WGqi4",
  authDomain: "smart-cozy.firebaseapp.com",
  databaseURL: "https://smart-cozy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-cozy",
  storageBucket: "smart-cozy.firebasestorage.app",
  messagingSenderId: "1069475843065",
  appId: "1:1069475843065:web:50c8a0a38be5d0e7d4cb28"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

export function firebaseInit() {
  console.log('Firebase initialization started');
  console.log('Firebase project:', firebaseConfig.projectId);
  console.log('Firebase app initialized successfully');
}

export async function sendVoteResult(
  zone: string,
  mood: string,
  location: { bldg: string; floor: string; room: string },
  cycleNumber: number
) {
  try {
    await update(ref(database), {
      [`vote_summary/Zone_${zone}/${mood}`]: increment(1),
      [`vote_summary/Zone_${zone}/lastMood`]: mood,
      [`vote_summary/Zone_${zone}/lastLocation`]: `${location.bldg} ${location.floor} ${location.room}`,
      [`vote_summary/Zone_${zone}/lastCycle`]: cycleNumber,
      [`vote_summary/Zone_${zone}/lastUpdated`]: Date.now()
    });

    console.log('ส่งผลโหวตขึ้น Firebase เรียบร้อย', { zone, mood, location, cycleNumber });
    return true;
  } catch (error) {
    console.error('ส่งผลโหวตขึ้น Firebase ไม่สำเร็จ', error);
    return false;
  }
}
