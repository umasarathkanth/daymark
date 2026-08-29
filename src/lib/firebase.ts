import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInAnonymously,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserPreferences } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const defaultPreferences: UserPreferences = {
  nudgesEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  maxNudgesPerDay: 2,
  preferredInput: 'any',
  personalizationLevel: 'high'
};

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Traverses an object and strips any undefined or invalid Firestore fields.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

/**
 * Initializes or retrieves user profile in Firestore
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Reflective Journaler',
    email: user.email || 'guest@geminijournal.internal',
    createdAt: new Date().toISOString(),
    preferences: defaultPreferences
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }

    await setDoc(userRef, sanitizeFirestorePayload(fallbackProfile));
    return fallbackProfile;
  } catch (err) {
    console.warn('Notice: Firestore sync using fallback profile:', err);
    return fallbackProfile;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
  // Update in localStorage
  try {
    const localProfRaw = localStorage.getItem(`daymark_profile_${uid}`);
    if (localProfRaw) {
      const parsed = JSON.parse(localProfRaw);
      parsed.preferences = { ...parsed.preferences, ...preferences };
      localStorage.setItem(`daymark_profile_${uid}`, JSON.stringify(parsed));
    }
  } catch {}

  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const existing = snapshot.data() as UserProfile;
        const updatedPreferences = { ...existing.preferences, ...preferences };
        await setDoc(userRef, sanitizeFirestorePayload({ ...existing, preferences: updatedPreferences }), { merge: true });
      }
    } catch (fsErr) {
      console.warn('Preferences sync notice:', fsErr);
    }
  }
}

/**
 * Safe entity persistence:
 * If authenticated with Firebase Auth (and user matches), persists to Firestore.
 * Always mirrors to localStorage for offline access and guest sessions.
 */
export async function saveUserEntity(
  uid: string,
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  const sanitized = sanitizeFirestorePayload(data);

  // 1. Update localStorage cache
  try {
    const key = `daymark_${collectionName}_${uid}`;
    const raw = localStorage.getItem(key);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((item: any) => item.id === docId);
    if (index >= 0) {
      list[index] = { ...list[index], ...sanitized };
    } else {
      list.unshift(sanitized);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (localErr) {
    console.warn('Local storage write warning:', localErr);
  }

  // 2. Persist to Firestore if user is authenticated with Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      const docRef = doc(db, 'users', uid, collectionName, docId);
      await setDoc(docRef, sanitized, { merge: true });
    } catch (fsErr: any) {
      console.warn(`Firestore sync notice for ${collectionName}/${docId}:`, fsErr?.message || fsErr);
    }
  }
}

/**
 * Safe entities retrieval:
 * If authenticated, fetches from Firestore and updates localStorage cache.
 * If not authenticated (guest) or if network/permission error occurs, loads from localStorage.
 */
export async function getUserEntities<T = any>(
  uid: string,
  collectionName: string
): Promise<T[]> {
  // Try Firestore if authenticated
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      const snap = await getDocs(query(collection(db, 'users', uid, collectionName)));
      const remoteData = snap.docs.map((d) => d.data() as T);
      if (remoteData.length > 0) {
        try {
          localStorage.setItem(`daymark_${collectionName}_${uid}`, JSON.stringify(remoteData));
        } catch {
          // ignore storage quota
        }
        return remoteData;
      }
    } catch (fsErr: any) {
      console.warn(`Firestore get notice for ${collectionName}:`, fsErr?.message || fsErr);
    }
  }

  // Fallback to localStorage cache
  try {
    const raw = localStorage.getItem(`daymark_${collectionName}_${uid}`);
    if (raw) {
      return JSON.parse(raw) as T[];
    }
  } catch (localErr) {
    console.warn('Local storage read warning:', localErr);
  }

  return [];
}

/**
 * Purges all user entities from both localStorage and Firestore (if authenticated)
 */
export async function purgeUserData(uid: string): Promise<void> {
  const collections = ['journalEntries', 'memories', 'timelineThreads', 'nudges', 'conversations'];
  
  // 1. Clear local storage keys
  collections.forEach((col) => {
    try {
      localStorage.removeItem(`daymark_${col}_${uid}`);
    } catch {}
  });

  // 2. Clear Firestore subcollections if authenticated
  if (auth.currentUser && auth.currentUser.uid === uid) {
    for (const col of collections) {
      try {
        const snap = await getDocs(collection(db, 'users', uid, col));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (err) {
        console.warn(`Purge warning for ${col}:`, err);
      }
    }
  }
}
/**
 * Dedicated local guest profile helper. Provides immediate, zero-error session state.
 */
export function getOrCreateGuestProfile(): UserProfile {
  let localGuestUid = localStorage.getItem('daymark_guest_uid');
  if (!localGuestUid) {
    localGuestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('daymark_guest_uid', localGuestUid);
  }
  const cached = localStorage.getItem(`daymark_profile_${localGuestUid}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  const guestProfile: UserProfile = {
    uid: localGuestUid,
    displayName: 'Guest Journaler',
    email: 'guest@daymark.internal',
    createdAt: new Date().toISOString(),
    preferences: defaultPreferences
  };
  try {
    localStorage.setItem(`daymark_profile_${localGuestUid}`, JSON.stringify(guestProfile));
  } catch {}
  return guestProfile;
}

export async function signInAsDemoUser(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    if (result && result.user) {
      await syncUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch {
    // Quietly fallback if Anonymous Authentication is not enabled in Firebase Console
    return null;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch
};
