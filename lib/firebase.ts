
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * 🍓 Firebase 配置 🍓
 * 已移除 Storage 模組，確保使用免費的 Spark 方案。
 */
const firebaseConfig = {
  apiKey: "AIzaSyApdW3VyiDJc9kJhvl6KC2IB4Q7HX6jBGM",
  authDomain: "notion-35f2a.firebaseapp.com",
  projectId: "notion-35f2a",
  storageBucket: "notion-35f2a.firebasestorage.app",
  messagingSenderId: "83841265274",
  appId: "1:83841265274:web:40300f10e24f9f25add5c3",
  measurementId: "G-4D3LMLMZ0Q"
};

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
