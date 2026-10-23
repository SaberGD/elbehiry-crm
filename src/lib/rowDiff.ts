const sameValue = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** What differs between the stored row and the edited one: fields to set, fields to remove. */
export function changedFields(prev: Record<string, unknown>, next: Record<string, unknown>) {
  const set: Record<string, unknown> = {};
  const remove: string[] = [];
  for (const k of Object.keys(next)) if (next[k] !== undefined && !sameValue(prev[k], next[k])) set[k] = next[k];
  for (const k of Object.keys(prev)) if (next[k] === undefined && prev[k] !== undefined) remove.push(k);
  return { set, remove };
}
