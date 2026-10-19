export type PostSaleMilestone = "7d" | "30d" | "6m" | "12m";

interface MilestoneDef {
  id: PostSaleMilestone;
  label: string;
  reason: string;
  days?: number;
  months?: number;
}

// Follow-ups scheduled after the work is delivered, counted from the delivery date.
export const postSaleMilestones: MilestoneDef[] = [
  {
    id: "7d",
    label: "بعد أسبوع من التسليم",
    days: 7,
    reason: "متابعة بعد التسليم: تأكد من رضا العميل وسجّل أي ملاحظات على الشغل.",
  },
  {
    id: "30d",
    label: "بعد شهر",
    days: 30,
    reason: "متابعة الشهر الأول: جودة التنفيذ وأي احتياج لصيانة أو تعديل.",
  },
  {
    id: "6m",
    label: "بعد 6 شهور",
    months: 6,
    reason:
      "متابعة 6 شهور: الحالة العامة للشغل، وفرص إضافية (باقي الوحدة أو مشروع جديد).",
  },
  {
    id: "12m",
    label: "بعد سنة",
    months: 12,
    reason: "متابعة سنوية: صيانة أو إعادة طلاء، وترشيح الأقارب والمعارف.",
  },
];

export const milestoneLabel = (id?: PostSaleMilestone) =>
  postSaleMilestones.find((m) => m.id === id)?.label ?? "";

const pad = (n: number) => String(n).padStart(2, "0");

/** Adds days/months to a YYYY-MM-DD date; month overflow clamps to the month end. */
export function addToDate(
  date: string,
  { days = 0, months = 0 }: { days?: number; months?: number },
): string {
  const [y, m, d] = date.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) + months;
  const ty = Math.floor(totalMonths / 12);
  const tm = totalMonths % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const base = Date.UTC(ty, tm, Math.min(d, lastDay));
  const out = new Date(base + days * 86_400_000);
  return `${out.getUTCFullYear()}-${pad(out.getUTCMonth() + 1)}-${pad(out.getUTCDate())}`;
}

export function buildPostSaleSchedule(deliveredDate: string) {
  return postSaleMilestones.map((m) => ({
    milestone: m.id,
    date: addToDate(deliveredDate, { days: m.days, months: m.months }),
    reason: m.reason,
  }));
}
