export const customerServices = [
  {
    key: "rental",
    title: "طلب تأجير مركبة",
    description: "حدد احتياجك ليُراجع الفريق المركبات والتوافر.",
    kind: "reservation",
    icon: "car",
  },
  {
    key: "workshop",
    title: "طلب موعد ورشة",
    description: "سجّل المركبة والملاحظة وموعدك المفضل.",
    kind: "reservation",
    icon: "wrench",
  },
  {
    key: "sales",
    title: "استفسار شراء مركبة",
    description: "أرسل المواصفات التي تبحث عنها لفريق المبيعات.",
    kind: "order",
    icon: "car",
  },
  {
    key: "parts",
    title: "طلب قطع غيار",
    description: "أرفق وصف القطعة ومعلومات المركبة لتحديد المناسب.",
    kind: "order",
    icon: "parts",
  },
] as const;
export type CustomerServiceKey = (typeof customerServices)[number]["key"];
