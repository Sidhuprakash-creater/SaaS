                                                                                                                                                       import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAP86dlczQfHh2pDRf6iQViXUayiT7ikNo",
  authDomain: "saas-model-822f0.firebaseapp.com",
  projectId: "saas-model-822f0",
  storageBucket: "saas-model-822f0.firebasestorage.app",
  messagingSenderId: "362953360377",
  appId: "1:362953360377:web:e8c9f2e12e6d910b877328",
  measurementId: "G-XC7XQ9GWF0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
