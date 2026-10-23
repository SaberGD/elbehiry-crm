import { average, collection, count, getAggregateFromServer, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { restrictStreams } from "./pagedMerge";
import type { Scope } from "./useFirestoreSync";

/**
 * Average satisfaction of finished post-sale calls and how many there are, asked of the database as an aggregate
 * (one read per thousand follow-ups) so the finished follow-ups need not be loaded for it.
 * A post-sale call cannot be completed without a rating, so the averages of the person's queries are weighted by
 * how many calls each covers.
 */
export async function postSaleRating(scope: Scope): Promise<{ average: number; count: number }> {
  const parts = await Promise.all(
    restrictStreams(scope, [["category", "==", "post_sale"], ["status", "==", "completed"]]).map(async (stream) => {
      const q = query(collection(db, "followUps"), ...stream.map(([f, op, v]) => where(f, op, v)));
      const r = (await getAggregateFromServer(q, { avg: average("satisfactionRating"), n: count() })).data();
      return { avg: r.avg ?? 0, n: r.n };
    }),
  );
  const n = parts.reduce((a, p) => a + p.n, 0);
  return { average: n ? parts.reduce((a, p) => a + p.avg * p.n, 0) / n : 0, count: n };
}
