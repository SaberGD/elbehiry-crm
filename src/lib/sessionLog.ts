import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { deviceLabel, type SessionEventType, type Who } from "./sessionPresence";

export * from "./sessionPresence";

const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/** Best-effort: logging must never get in the way of signing in or out. */
export async function logSessionEvent(who: Who, type: SessionEventType): Promise<void> {
  try {
    await addDoc(collection(db, "sessionEvents"), clean({ ...who, type, at: Date.now(), device: deviceLabel() }));
  } catch {
    /* ignore */
  }
}

export async function writePresence(who: Who, online: boolean, since: number): Promise<void> {
  try {
    await setDoc(doc(db, "presence", who.uid), clean({ ...who, online, lastSeen: Date.now(), since, device: deviceLabel() }));
  } catch {
    /* ignore */
  }
}
