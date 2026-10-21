import { useEffect, useRef } from 'react';
import {
  collection, doc, onSnapshot, writeBatch, setDoc, getDocs, query, where, orderBy, limit,
  type Query, type QueryConstraint, type WhereFilterOp,
} from 'firebase/firestore';
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

/** One Firestore filter: [field, operator, value]. */
export type ScopeFilter = [string, WhereFilterOp, unknown];
/**
 * What part of a collection this person may read. The security rules enforce the same thing on the
 * server; the app only asks for what it is allowed to see.
 *  - "all": the whole collection
 *  - "none": nothing (no listener)
 *  - a list of queries (each a list of filters); results are merged by id.
 */
export type Scope = 'all' | 'none' | ScopeFilter[][];

/** Only the newest `limit` rows by `orderBy` (for history-like collections that grow without end). */
export interface ReadWindow {
  orderBy: string;
  limit: number;
}

function scopeQueries(name: string, scope: Exclude<Scope, 'none'>, window?: ReadWindow): Query[] {
  const tail: QueryConstraint[] = window ? [orderBy(window.orderBy, 'desc'), limit(window.limit)] : [];
  const filterSets = scope === 'all' ? [[]] : scope;
  return filterSets.map((filters) =>
    query(collection(db, name), ...filters.map(([f, op, v]) => where(f, op, v)), ...tail)
  );
}

/** Narrows a scope to rows whose `field` is one of `values` (one query per value, so no extra index is needed). */
export function narrowScope(scope: Scope, field: string, values: string[]): Scope {
  if (scope === 'none' || !values.length) return 'none';
  const base = scope === 'all' ? [[]] : scope;
  return values.flatMap((v) => base.map((filters): ScopeFilter[] => [...filters, [field, '==', v]]));
}

/** One-off read of everything a scope covers (no listener). */
export async function fetchScoped<T extends { id: string }>(name: string, scope: Scope): Promise<T[]> {
  if (scope === 'none') return [];
  const snaps = await Promise.all(scopeQueries(name, scope).map((q) => getDocs(q)));
  const merged = new Map<string, T>();
  for (const snap of snaps) for (const d of snap.docs) merged.set(d.id, { ...d.data(), id: d.id } as T);
  return [...merged.values()];
}

/** Applies the same partial update to many documents, without reading them first. */
export async function patchDocs(name: string, ids: string[], patch: Record<string, unknown>) {
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + BATCH_SIZE)) batch.update(doc(db, name, id), patch);
    await batch.commit();
  }
}

/** Deletes documents by id (used when the rows are not loaded in the app). */
export function deleteDocs(name: string, ids: string[]) {
  return commitInBatches(name, ids.map((id) => ({ id })));
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
  options: {
    seedIfEmpty?: boolean;
    transform?: (item: T) => T;
    scope?: Scope;
    window?: ReadWindow;
    /** Called once every query of the current scope has answered. */
    onLoaded?: () => void;
  } = {}
) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const prevRef = useRef<Map<string, T>>(new Map());
  const readyRef = useRef(false);
  const scope = options.scope ?? 'all';
  const scopeKey = JSON.stringify([scope, options.window ?? null]);
  // Set while the state is being emptied for a "none" scope, so stale rows are neither re-written nor deleted.
  const clearingRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    prevRef.current = new Map();
    clearingRef.current = false;
    if (scope === 'none') {
      clearingRef.current = true;
      setItems([]);
      options.onLoaded?.();
      return;
    }
    const sources = scopeQueries(name, scope, options.window);
    // Each listener's latest rows; the state is their union.
    const parts: Map<string, T>[] = sources.map(() => new Map());
    const answered = sources.map(() => false);
    const publish = () => {
      const merged = new Map<string, T>();
      for (const part of parts) for (const [id, item] of part) merged.set(id, item);
      const data = sortNewestFirst([...merged.values()]);
      prevRef.current = new Map(data.map((i) => [i.id, i]));
      readyRef.current = answered.every(Boolean);
      setItems(data);
      if (readyRef.current) options.onLoaded?.();
    };
    const stops: (() => void)[] = [];
    const listen = (source: Query, index: number) =>
      onSnapshot(
        source,
        (snap) => {
          if (scope === 'all' && snap.empty && !readyRef.current) {
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
          parts[index] = new Map(
            snap.docs.map((d) => {
              const item = { ...d.data(), id: d.id } as T;
              return [d.id, options.transform ? options.transform(item) : item];
            })
          );
          answered[index] = true;
          publish();
        },
        (err) => {
          // A windowed query whose index is not deployed yet: fall back to the plain query rather than show nothing.
          if (options.window && (err as { code?: string }).code === 'failed-precondition') {
            console.warn(`Firestore index missing for ${name}; reading without a window. Deploy firestore.indexes.json.`, err.message);
            stops[index] = listen(scopeQueries(name, scope, undefined)[index], index);
            return;
          }
          // A query the rules refuse means "nothing here for you", not a broken app.
          answered[index] = true;
          publish();
          handleFirestoreError(err, OperationType.GET, name);
        }
      );
    sources.forEach((source, index) => stops.push(listen(source, index)));
    return () => stops.forEach((stop) => stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, scopeKey]);

  useEffect(() => {
    if (clearingRef.current) {
      if (items.length) return; // the emptied state has not landed yet
      clearingRef.current = false;
      readyRef.current = true;
      return;
    }
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
  setValue: (v: T) => void,
  options: { canWrite?: boolean } = {}
) {
  const canWrite = options.canWrite ?? true;
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
    if (!readyRef.current || !canWrite) return;
    const json = JSON.stringify(value);
    if (json === lastRef.current) return;
    lastRef.current = json;
    setDoc(doc(db, path[0], path[1]), value as Record<string, unknown>).catch((e) =>
      handleFirestoreError(e, OperationType.WRITE, path.join('/'))
    );
  }, [value, path]);
}
