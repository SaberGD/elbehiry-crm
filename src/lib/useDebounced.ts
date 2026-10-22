import { useEffect, useState } from "react";

/** What was typed, once the typing pauses (the database is asked then, not on every key). */
export function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
