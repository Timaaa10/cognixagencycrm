
import { initializeApp } from 'firebase/app';
// Fix: Import from @firebase/auth to resolve "no exported member" error in modular SDK
import { getAuth } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (YOUR REAL PROJECT)
export const firebaseConfig = {
  apiKey: "AIzaSyA9b1MJTgEO-in7ucEsLvwQzOKCcCwGCIw",
  authDomain: "cognix-crm.firebaseapp.com",
  projectId: "cognix-crm",
  storageBucket: "cognix-crm.firebasestorage.app",
  messagingSenderId: "472981412516",
  appId: "1:472981412516:web:9487782bf58ae521f5a431"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services using modular SDK pattern
// Initializing auth instance with the app reference
export const auth = getAuth(app);
export const db = getFirestore(app);
