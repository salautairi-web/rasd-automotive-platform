export const workshopPermissionCatalog = [
  {
    action: "read",
    key: "workshop.jobcard.read",
    nameAr: "قراءة أوامر الورشة",
    resource: "workshop_jobcard",
    sensitivity: "normal",
  },
  {
    action: "receive",
    key: "workshop.jobcard.create",
    nameAr: "استقبال المركبات وفتح الأوامر",
    resource: "workshop_jobcard",
    sensitivity: "normal",
  },
  {
    action: "schedule",
    key: "workshop.schedule.create",
    nameAr: "جدولة مواعيد الورشة",
    resource: "workshop_schedule",
    sensitivity: "normal",
  },
  {
    action: "estimate",
    key: "workshop.estimate.create",
    nameAr: "إصدار التقدير وتوثيق قرار العميل",
    resource: "workshop_estimate",
    sensitivity: "sensitive",
  },
  {
    action: "inspect",
    key: "workshop.inspection.create",
    nameAr: "الفحص والتشخيص وصور المركبة",
    resource: "workshop_inspection",
    sensitivity: "normal",
  },
  {
    action: "operate",
    key: "workshop.operation.create",
    nameAr: "تشغيل عمليات إصلاح الورشة",
    resource: "workshop_operation",
    sensitivity: "normal",
  },
  {
    action: "parts",
    key: "workshop.part.request",
    nameAr: "حجز وصرف وإرجاع قطع الورشة",
    resource: "workshop_part",
    sensitivity: "sensitive",
  },
  {
    action: "quality",
    key: "workshop.quality.record",
    nameAr: "تسجيل فحص الجودة واعتماد الجاهزية",
    resource: "workshop_quality",
    sensitivity: "sensitive",
  },
  {
    action: "deliver",
    key: "workshop.delivery.create",
    nameAr: "تسليم المركبة وإغلاق أمر العمل",
    resource: "workshop_delivery",
    sensitivity: "sensitive",
  },
  {
    action: "configure",
    key: "workshop.configure.update",
    nameAr: "تهيئة دليل الورشة والبايات",
    resource: "workshop_configuration",
    sensitivity: "sensitive",
  },
  {
    action: "report",
    key: "workshop.report.read",
    nameAr: "قراءة تقارير ربحية الورشة",
    resource: "workshop_report",
    sensitivity: "sensitive",
  },
  {
    action: "invoice",
    key: "workshop.invoice.issue",
    nameAr: "إصدار الفاتورة المركزية للورشة",
    resource: "workshop_invoice",
    sensitivity: "sensitive",
  },
  {
    action: "collect",
    key: "workshop.payment.record",
    nameAr: "تسجيل قبض مستلم لفاتورة الورشة",
    resource: "workshop_payment",
    sensitivity: "critical",
  },
] as const;
export type WorkshopTemplateAction =
  (typeof workshopPermissionCatalog)[number]["action"];
export const workshopRoleTemplates: Array<{
  key: string;
  nameAr: string;
  description: string;
  actions: WorkshopTemplateAction[];
}> = [
  {
    key: "advisor",
    nameAr: "مستشار خدمة الورشة",
    description:
      "استقبال وجدولة وتقدير وتوثيق قرار العميل والتسليم دون تسجيل مبالغ قبض.",
    actions: ["read", "receive", "schedule", "estimate", "deliver"],
  },
  {
    key: "technician",
    nameAr: "فني الورشة",
    description:
      "الفحص والتشخيص وعمليات الإصلاح واختبار الطريق دون الفوترة أو اعتماد الجودة.",
    actions: ["read", "inspect", "operate"],
  },
  {
    key: "parts",
    nameAr: "أمين قطع الورشة",
    description: "حجز وصرف وإرجاع القطع دون تعديل التقدير أو قبض مبالغ.",
    actions: ["read", "parts"],
  },
  {
    key: "quality",
    nameAr: "مراقب جودة الورشة",
    description: "نتائج فحص الجودة والجاهزية دون قبض مبالغ أو تعديل التقدير.",
    actions: ["read", "quality"],
  },
  {
    key: "accountant",
    nameAr: "محاسب الورشة",
    description:
      "إصدار الفاتورة وتوثيق القبض وتقارير الربحية دون تنفيذ الإصلاح أو اعتماد الجودة.",
    actions: ["read", "invoice", "collect", "report"],
  },
  {
    key: "manager",
    nameAr: "مدير الورشة",
    description:
      "إدارة التشغيل والتهيئة والتقارير؛ تسجيل القبض يظل لدى المحاسب.",
    actions: [
      "read",
      "receive",
      "schedule",
      "estimate",
      "inspect",
      "operate",
      "parts",
      "quality",
      "deliver",
      "configure",
      "report",
      "invoice",
    ],
  },
];
export function workshopTemplateRoleKey(templateKey: string, entityId: number) {
  return `ws_pilot_${templateKey}_entity_${entityId}`;
}
