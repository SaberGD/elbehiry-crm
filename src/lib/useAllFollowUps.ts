import { useEffect } from "react";
import { useCRM } from "../context/CRMContext";

/**
 * For a screen that needs finished follow-ups as well as open ones (history, ratings, reports). Only the open
 * ones are followed otherwise, so this is a deliberate choice: all of them are read while the screen is open.
 */
export function useAllFollowUps(enabled = true) {
  const { requestAllFollowUps } = useCRM();
  useEffect(() => (enabled ? requestAllFollowUps() : undefined), [enabled, requestAllFollowUps]);
}
