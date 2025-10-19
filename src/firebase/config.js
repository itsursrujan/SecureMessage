// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCITZlWSSU-VH_KF4Y9EYr1peGkh8dBdVA",
  authDomain: "message-3151e.firebaseapp.com",
  projectId: "message-3151e",
  appId: "1:598488721761:web:feb928e5c0f24c0118fd20",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export auth object
export const auth = getAuth(app);
export default app;
