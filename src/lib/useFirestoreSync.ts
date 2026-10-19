import { useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, writeBatch, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const BATCH_SIZE = 400;
const SORT_KEYS = ['createdAt', 'timestamp', 'date'] as const;

async function commitInBatches(
  name: string,
  writes: { id: string; item?: unknown }[]
) {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const w of writes.slice(i, i + BATCH_SIZE)) {
      const ref = doc(db, name, w.id);
      if (w.item === undefined) batch.delete(ref);
      else batch.set(ref, w.item as Record<string, unknown>);
    }
    await batch.commit();
  }
}

function sortNewestFirst<T>(items: T[]): T[] {
  const key = SORT_KEYS.find((k) => items.some((i) => (i as any)[k]));
  if (!key) return items;
  return [...items].sort((a, b) =>
    String((b as any)[key] ?? '').localeCompare(String((a as any)[key] ?? ''))
  );
}

/**
 * Keeps a React state array and a Firestore collection in sync.
 * Firestore is the source of truth: incoming snapshots replace local state,
 * and local state changes are diffed (by id / reference) and written back.
 * With `seedIfEmpty`, a confirmed-empty collection is bootstrapped from the
 * current local state (used for structural data such as branches and users).
 */
export function useFirestoreCollection<T extends { id: string }>(
  name: string,
  items: T[],
  setItems: (items: T[]) => void,
  options: { seedIfEmpty?: boolean } = {}
) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const prevRef = useRef<Map<string, T>>(new Map());
  const readyRef = useRef(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, name),
      (snap) => {
        if (snap.empty && !readyRef.current) {
          if (snap.metadata.fromCache) return; // wait for the server's answer
          if (options.seedIfEmpty) {
            const seed = itemsRef.current;
            prevRef.current = new Map(seed.map((i) => [i.id, i]));
            readyRef.current = true;
            commitInBatches(name, seed.map((item) => ({ id: item.id, item }))).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, name)
            );
            return;
          }
        }
        const data = sortNewestFirst(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T)
        );
        prevRef.current = new Map(data.map((i) => [i.id, i]));
        readyRef.current = true;
        setItems(data);
      },
      (err) => handleFirestoreError(err, OperationType.GET, name)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (!readyRef.current) return;
    const prev = prevRef.current;
    const next = new Map(items.map((i) => [i.id, i]));
    const writes: { id: string; item?: T }[] = [];
    for (const [id, item] of next) if (prev.get(id) !== item) writes.push({ id, item });
    for (const id of prev.keys()) if (!next.has(id)) writes.push({ id });
    if (!writes.length) return;
    prevRef.current = next;
    commitInBatches(name, writes).catch((e) =>
      handleFirestoreError(e, OperationType.WRITE, name)
    );
  }, [items, name]);
}

/** Sync a single settings document (e.g. settings/distribution). */
export function useFirestoreDocument<T extends object>(
  path: [string, string],
  value: T,
  setValue: (v: T) => void
) {
  const lastRef = useRef<string>('');
  const readyRef = useRef(false);

  useEffect(() => {
    return onSnapshot(
      doc(db, path[0], path[1]),
      (snap) => {
        if (snap.metadata.fromCache && !snap.exists()) return;
        readyRef.current = true;
        if (snap.exists()) {
          const data = snap.data() as T;
          lastRef.current = JSON.stringify(data);
          setValue(data);
        } else {
          lastRef.current = '';
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, path.join('/'))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path[0], path[1]]);

  useEffect(() => {
    if (!readyRef.current) return;
    const json = JSON.stringify(value);
    if (json === lastRef.current) return;
    lastRef.current = json;
    setDoc(doc(db, path[0], path[1]), value as Record<string, unknown>).catch((e) =>
      handleFirestoreError(e, OperationType.WRITE, path.join('/'))
    );
  }, [value, path]);
}
