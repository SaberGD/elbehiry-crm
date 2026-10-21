/** What the system schedules on its own, in plain words (shown at the top of the follow-ups page). */
export interface AutoRule {
  when: string;
  what: string;
  after: string;
}

export const autoFollowUpRules: AutoRule[] = [
  { when: "أي عملية شراء (من زيارة أو من ملف العميل)", what: "متابعات بعد البيع: رضا العميل وترشيح (الشراء معناه إنه استلم)", after: "بعد أسبوع، شهر، 6 شهور، سنة من الشراء" },
  { when: "«لسه ما اشترى» بسبب «مش عارف»", what: "سؤاله: إيه اللي خلاك ما كملتش؟", after: "بعد يومين" },
  { when: "عميل رشّح حد (بعد 4 أو 5 نجوم)", what: "اتصال بالمرشَّح ومعاه اسم اللي رشّحه", after: "بعد يومين" },
  { when: "زيارة اتسجلت", what: "تذكير تبعت طلب تقييم (يختفي لما يتبعت)", after: "بعد الزيارة" },
  { when: "طلب تقييم ما اترد عليه", what: "تذكير واحد تبعته للعميل", after: "بعد 48 ساعة" },
  { when: "اقتراح من زكي وانت وافقت عليه", what: "متابعة بالموعد اللي اتفقنا عليه", after: "حسب الاقتراح" },
];
