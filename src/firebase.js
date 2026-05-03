import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app = null;
let analytics = null;
let db = null;

const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase initialization skipped:', e.message);
  }
}

/** Log an analytics event (no-op if Firebase is not configured) */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

/**
 * Save user progress to Firestore.
 * Uses a stable anonymous session ID stored in localStorage.
 * @param {object} progress  { country, completedPhases, quizScores, userLevel }
 */
export async function saveProgressToCloud(progress) {
  if (!db) return;
  try {
    const sessionId = getOrCreateSessionId();
    const ref = doc(db, 'progress', sessionId);
    await setDoc(ref, {
      ...progress,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore save failed:', e.message);
  }
}

/**
 * Load user progress from Firestore.
 * @returns {Promise<object|null>}
 */
export async function loadProgressFromCloud() {
  if (!db) return null;
  try {
    const sessionId = getOrCreateSessionId();
    const ref = doc(db, 'progress', sessionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      // Remove Firestore metadata before returning
      const { updatedAt, ...progress } = data;
      return progress;
    }
    return null;
  } catch (e) {
    console.warn('Firestore load failed:', e.message);
    return null;
  }
}

/** Get or create a stable anonymous session ID */
function getOrCreateSessionId() {
  const KEY = 'civicguide_session_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export { app, analytics, db };
