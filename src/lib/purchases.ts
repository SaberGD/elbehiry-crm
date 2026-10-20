import type { Booking, Department } from "../types/crm";

/** The four main departments a purchase is split across. */
export const departmentIds: Department[] = [
  "construction",
  "decor",
  "garden",
  "general",
];

/** Amount of a purchase per department; older records fall back to their single department. */
export function bookingSplit(b: Booking): Record<Department, number> {
  const out = { construction: 0, decor: 0, garden: 0, general: 0 } as Record<
    Department,
    number
  >;
  if (b.departmentAmounts) {
    for (const id of departmentIds) out[id] = b.departmentAmounts[id] || 0;
  } else {
    out[b.department] = b.amount;
  }
  return out;
}

export function splitTotals(bookings: Booking[]): Record<Department, number> {
  const out = { construction: 0, decor: 0, garden: 0, general: 0 } as Record<
    Department,
    number
  >;
  for (const b of bookings) {
    const s = bookingSplit(b);
    for (const id of departmentIds) out[id] += s[id];
  }
  return out;
}
