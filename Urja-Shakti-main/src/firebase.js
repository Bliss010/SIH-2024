// Import necessary modules from Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (replace with your project config)
const firebaseConfig = {
    apiKey: "AIzaSyDwkGDjyTsNfMgtxOLpq0feF-_mSdNt9lM",
    authDomain: "urjashakti-35d72.firebaseapp.com",
    projectId: "urjashakti-35d72",
    storageBucket: "urjashakti-35d72.firebasestorage.app",
    messagingSenderId: "292800642874",
    appId: "1:292800642874:web:0d3ebfc4da89a2833dda03",
    measurementId: "G-D7C55FC6FV"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);