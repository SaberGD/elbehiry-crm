import { useEffect } from "react";
import { useCRM, type DataKind } from "../context/CRMContext";

/**
 * For a screen that works on everything of a kind (all purchases, all visits, all reviews…). These are read a part
 * at a time otherwise, so naming them here is a deliberate choice: they are read in full while the screen is open.
 */
export function useAllData(kinds: DataKind[], enabled = true) {
  const { requestAll } = useCRM();
  const key = kinds.join(",");
  useEffect(() => {
    if (!enabled) return;
    const stops = kinds.map((k) => requestAll(k));
    return () => stops.forEach((stop) => stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, requestAll]);
}
