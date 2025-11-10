// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfIRhKysVrADppCHZsG46FB2lBKzs7RkI",
  authDomain: "institution-platform-2b2c0.firebaseapp.com",
  projectId: "institution-platform-2b2c0",
  storageBucket: "institution-platform-2b2c0.firebasestorage.app",
  messagingSenderId: "867427966185",
  appId: "1:867427966185:web:58b845ed0f13c4f1592478",
  measurementId: "G-S2XJ5S8YN4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
