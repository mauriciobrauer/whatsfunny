import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWsypFLgsY19TgRV-_4V0UrvpNFEcnG6U",
  authDomain: "diariodecomedia-bb577.firebaseapp.com",
  projectId: "diariodecomedia-bb577",
  storageBucket: "diariodecomedia-bb577.firebasestorage.app",
  messagingSenderId: "662558471789",
  appId: "1:662558471789:web:184261a60a1a1c963f7164"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };

