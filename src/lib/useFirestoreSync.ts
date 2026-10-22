import { useCallback, useEffect, useRef } from 'react';
import {
  collection, deleteField, doc, onSnapshot, writeBatch, setDoc, getDocs, query, where, orderBy, limit,
  type Query, type QueryConstraint, type WhereFilterOp,
} from 'firebase/firestore';
import { countRead, db, handleFirestoreError, OperationType } from './firebase';
import { changedFields } from './rowDiff';

const BATCH_SIZE = 400;
const SORT_KEYS = ['createdAt', 'timestamp', 'date'] as const;

/**
 * A write is a whole row for something new, nothing for a row that did not change, and only the changed
 * fields for an edit: a row on screen may be older than the stored one, and an edit must not undo what
 * somebody else saved in the meantime.
 */
async function commitInBatches(
  name: string,
  writes: { id: string; item?: unknown; prev?: unknown }[]
) {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    let count = 0;
    for (const w of writes.slice(i, i + BATCH_SIZE)) {
      const ref = doc(db, name, w.id);
      if (w.item === undefined) batch.delete(ref);
      else if (w.prev === undefined) batch.set(ref, w.item as Record<string, unknown>);
      else {
        const { set, remove } = changedFields(w.prev as Record<string, unknown>, w.item as Record<string, unknown>);
        if (!remove.length && !Object.keys(set).length) continue;
        batch.set(ref, { ...set, ...Object.fromEntries(remove.map((k) => [k, deleteField()])) }, { merge: true });
      }
      count++;
    }
    if (count) await batch.commit();
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
  snaps.forEach((snap) => countRead(snap.size, `${name}/fetch`));
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
  setItems: (items: T[] | ((prev: T[]) => T[])) => void,
  options: {
    seedIfEmpty?: boolean;
    transform?: (item: T) => T;
    scope?: Scope;
    window?: ReadWindow;
    /** Called once every query of the current scope has answered. */
    onLoaded?: () => void;
    /**
     * Rows arrive on demand (`inject`, `watchDoc`) and are kept when the scope is "none", instead of
     * the collection being read in full. Edits to them are saved as usual.
     */
    lazy?: boolean;
    /** Applied to a row just before it is saved (for fields derived from the row, such as search keys). */
    beforeWrite?: (item: T) => T;
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
  // Rows handed in with `inject` that have not yet been recorded as "as stored".
  const injectedRef = useRef<Map<string, T>>(new Map());
  const watchersRef = useRef<Map<string, { count: number; stop: () => void }>>(new Map());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Adds rows that were read elsewhere (a page of results, one customer) to the working set; they are not treated as edits. */
  const inject = useCallback((rows: T[]) => {
    if (!rows.length) return;
    for (const r of rows) injectedRef.current.set(r.id, r);
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]));
      let changed = false;
      for (const r of rows) {
        const local = byId.get(r.id);
        const stored = prevRef.current.get(r.id);
        if (local && stored && local !== stored) continue; // an edit that is not saved yet wins
        if (local === r) continue;
        byId.set(r.id, r);
        changed = true;
      }
      return changed ? sortNewestFirst([...byId.values()]) : prev;
    });
  }, [setItems]);

  /** Keeps one row live while something shows it (so an edit starts from the current version). Returns the stop function. */
  const watchDoc = useCallback((id: string) => {
    let w = watchersRef.current.get(id);
    if (!w) {
      w = {
        count: 0,
        stop: onSnapshot(
          doc(db, name, id),
          (snap) => {
            countRead(1, `${name}/doc`);
            if (!snap.exists()) return;
            const item = { ...snap.data(), id: snap.id } as T;
            inject([optionsRef.current.transform ? optionsRef.current.transform(item) : item]);
          },
          (err) => handleFirestoreError(err, OperationType.GET, name)
        ),
      };
      watchersRef.current.set(id, w);
    }
    w.count++;
    return () => {
      const cur = watchersRef.current.get(id);
      if (!cur) return;
      cur.count--;
      if (cur.count <= 0) {
        cur.stop();
        watchersRef.current.delete(id);
      }
    };
  }, [name, inject]);

  useEffect(() => () => watchersRef.current.forEach((w) => w.stop()), []);

  // One live listener per query of the scope. When the scope changes only the queries that are new start and the
  // ones that are gone stop; the others keep running and the rows already shown (and edits not yet saved) stay valid.
  const listenersRef = useRef<Map<string, { stop: () => void; rows: Map<string, T>; answered: boolean }>>(new Map());
  const onLoadedRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const listeners = listenersRef.current;
    onLoadedRef.current = options.onLoaded;
    const specs: { key: string; filters: ScopeFilter[] }[] =
      scope === 'none' ? [] : (scope === 'all' ? [[]] : scope).map((filters) => ({ key: JSON.stringify([filters, options.window ?? null]), filters }));
    const wanted = new Set(specs.map((x) => x.key));
    let removed = false;
    for (const [key, l] of listeners) {
      if (!wanted.has(key)) {
        l.stop();
        listeners.delete(key);
        removed = true;
      }
    }

    const allAnswered = () => [...listeners.values()].every((l) => l.answered);
    const publish = () => {
      const merged = new Map<string, T>();
      for (const l of listeners.values()) for (const [id, item] of l.rows) merged.set(id, item);
      const data = sortNewestFirst([...merged.values()]);
      prevRef.current = new Map(data.map((i) => [i.id, i]));
      // Saving starts once everything asked for first answered, and stays on: later queries only add rows.
      if (allAnswered()) readyRef.current = true;
      setItems(data);
      if (allAnswered()) onLoadedRef.current?.();
    };

    if (scope === 'none') {
      if (options.lazy) {
        // Nothing is read in full; rows come in on demand and stay.
        prevRef.current = new Map(itemsRef.current.map((i) => [i.id, i]));
        readyRef.current = true;
        clearingRef.current = false;
      } else {
        readyRef.current = false;
        prevRef.current = new Map();
        clearingRef.current = true;
        setItems([]);
      }
      onLoadedRef.current?.();
      return;
    }
    clearingRef.current = false;

    const listen = (key: string, source: Query, filters: ScopeFilter[]) => {
      const entry = listeners.get(key)!;
      entry.stop = onSnapshot(
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
          countRead(snap.docChanges().length, name);
          entry.rows = new Map(
            snap.docs.map((d) => {
              const item = { ...d.data(), id: d.id } as T;
              const tf = optionsRef.current.transform;
              return [d.id, tf ? tf(item) : item];
            })
          );
          entry.answered = true;
          publish();
        },
        (err) => {
          // A windowed query whose index is not deployed yet: fall back to the plain query rather than show nothing.
          if (options.window && (err as { code?: string }).code === 'failed-precondition') {
            console.warn(`Firestore index missing for ${name}; reading without a window. Deploy firestore.indexes.json.`, err.message);
            entry.stop();
            listen(key, scopeQueries(name, [filters], undefined)[0], filters);
            return;
          }
          // A query the rules refuse means "nothing here for you", not a broken app.
          entry.answered = true;
          publish();
          handleFirestoreError(err, OperationType.GET, name);
        }
      );
    };
    const sources = scopeQueries(name, scope, options.window);
    specs.forEach((spec, index) => {
      if (listeners.has(spec.key)) return;
      listeners.set(spec.key, { stop: () => {}, rows: new Map(), answered: false });
      listen(spec.key, sources[index], spec.filters);
    });
    // Only queries were dropped: show what the remaining ones hold.
    if (removed && allAnswered()) publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, scopeKey]);

  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      listeners.forEach((l) => l.stop());
      listeners.clear();
    };
  }, [name]);

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
    // Rows that were handed in are "as stored", not edits.
    for (const [id, row] of injectedRef.current) {
      if (next.get(id) === row) prev.set(id, row);
      injectedRef.current.delete(id);
    }
    const before = options.beforeWrite;
    const writes: { id: string; item?: T; prev?: T }[] = [];
    for (const [id, item] of next) if (prev.get(id) !== item) writes.push({ id, item: before ? before(item) : item, prev: prev.get(id) });
    for (const id of prev.keys()) if (!next.has(id)) writes.push({ id });
    if (!writes.length) return;
    prevRef.current = next;
    commitInBatches(name, writes).catch((e) =>
      handleFirestoreError(e, OperationType.WRITE, name)
    );
  }, [items, name]);

  return { inject, watchDoc };
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
