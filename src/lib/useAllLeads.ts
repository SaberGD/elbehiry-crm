import { useEffect } from "react";
import { useCRM } from "../context/CRMContext";

/**
 * For a screen that works on every customer at once (totals, rankings, cross-checks). Customers are otherwise
 * read a page at a time, so this is a deliberate choice: the whole list is read while the screen is open.
 */
export function useAllLeads(enabled = true) {
  const { requestAllLeads } = useCRM();
  useEffect(() => (enabled ? requestAllLeads() : undefined), [enabled, requestAllLeads]);
}
