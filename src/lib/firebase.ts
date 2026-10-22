import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager,
  memoryLocalCache, terminate, clearIndexedDbPersistence,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);

// Local end-to-end tests run the real app against the Firebase emulators (never set in production builds).
const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === '1';

// Rows are kept on the device (IndexedDB, shared by all open tabs). Re-opening the app within ~30 minutes resumes
// each listener from where it stopped, so only rows that changed meanwhile are read (and billed) again, and the
// screens show the cached rows immediately instead of waiting for the network.
const canPersist = typeof indexedDB !== 'undefined';
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    localCache: canPersist ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : memoryLocalCache(),
  },
  firebaseConfig.firestoreDatabaseId
);

/** Removes this device's cached rows (on sign-out, so the next person on a shared device starts clean). Reload after. */
export async function clearLocalCache() {
  if (!canPersist) return;
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    /* another tab still has the cache open; it is cleared the next time it can be */
  }
}
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8181);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

if (firebaseConfig.measurementId && !useEmulators) {
  isSupported().then((ok) => ok && getAnalytics(app)).catch(() => {});
}

/**
 * Local end-to-end runs count the documents the database sends, so a change in how much is read shows up in the
 * tests (`window.__fsReads`). It does nothing in the built site.
 */
export function countRead(docs: number, source: string) {
  if (!useEmulators || typeof window === 'undefined') return;
  const w = window as unknown as { __fsReads?: { total: number; by: Record<string, number> } };
  const r = (w.__fsReads ??= { total: 0, by: {} });
  r.total += docs;
  r.by[source] = (r.by[source] || 0) + docs;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Tell the person when something they did was not saved (reads outside one's scope are expected and stay silent).
  if (operationType !== OperationType.GET && operationType !== OperationType.LIST && typeof window !== 'undefined') {
    const code = (error as { code?: string })?.code || '';
    window.dispatchEvent(new CustomEvent('crm-save-failed', { detail: { code, path } }));
  }
  return errInfo;
}
