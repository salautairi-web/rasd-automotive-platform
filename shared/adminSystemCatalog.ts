export type AdminSystemStatus = "ready" | "in_progress" | "planned";
export type AdminSystem = {
  key: string;
  nameAr: string;
  description: string;
  category: "core" | "operations" | "finance" | "governance";
  route: string;
  status: AdminSystemStatus;
  ownerRole: string;
  requiredPermissionPrefix: string;
};

export const adminSystemCatalog: AdminSystem[] = [
  { key: "central-erp", nameAr: "نظرة عامة موحدة", description: "المؤشرات والمهام والسياق المؤسسي", category: "core", route: "/", status: "ready", ownerRole: "branch_manager", requiredPermissionPrefix: "read" },
  { key: "master-data", nameAr: "حوكمة البيانات الرئيسية", description: "الهويات المركزية للعملاء والمركبات والمنتجات", category: "governance", route: "/mdm", status: "ready", ownerRole: "admin", requiredPermissionPrefix: "mdm" },
  { key: "rental", nameAr: "التأجير وإدارة الأسطول", description: "الحجوزات والعقود والتسليم والربحية", category: "operations", route: "/rental", status: "ready", ownerRole: "rental_manager", requiredPermissionPrefix: "rental" },
  { key: "workshop", nameAr: "الورشة والصيانة", description: "أوامر العمل والفحص والقطع والجودة", category: "operations", route: "/workshop", status: "ready", ownerRole: "workshop_manager", requiredPermissionPrefix: "workshop" },
  { key: "sales", nameAr: "مبيعات السيارات", description: "الفرص والعروض والعقود وربحية المركبات", category: "operations", route: "/sales", status: "ready", ownerRole: "sales_manager", requiredPermissionPrefix: "sales" },
  { key: "parts", nameAr: "قطع الغيار والمخزون", description: "الاستلام والصرف والتحويل والجرد والباركود", category: "operations", route: "/inventory/operations", status: "ready", ownerRole: "warehouse_manager", requiredPermissionPrefix: "inventory" },
  { key: "projects", nameAr: "PMO والمشاريع", description: "دراسات الجدوى وWBS والميزانيات والبوابات", category: "governance", route: "/projects/pmo", status: "ready", ownerRole: "project_manager", requiredPermissionPrefix: "project" },
  { key: "finance", nameAr: "المالية والخزينة", description: "الدفاتر والتحصيل والمدفوعات والمطابقة", category: "finance", route: "/finance", status: "ready", ownerRole: "finance_manager", requiredPermissionPrefix: "finance" },
  { key: "procurement", nameAr: "المشتريات والموردون", description: "طلبات الشراء وأوامر الشراء والفواتير", category: "finance", route: "/procurement", status: "ready", ownerRole: "procurement_manager", requiredPermissionPrefix: "procurement" },
  { key: "hr", nameAr: "الموارد البشرية", description: "الموظفون والحضور والرواتب والهيكل التنظيمي", category: "core", route: "/hr", status: "ready", ownerRole: "hr_manager", requiredPermissionPrefix: "hr" },
  { key: "workflow", nameAr: "محرك سير العمل", description: "قواعد الاعتماد والتنبيهات واحتساب SLA", category: "governance", route: "/workflow/engine", status: "in_progress", ownerRole: "admin", requiredPermissionPrefix: "workflow" },
  { key: "audit", nameAr: "التدقيق والامتثال", description: "الأدلة وسجل التدقيق ومساحات المراجعة", category: "governance", route: "/audit-assurance", status: "ready", ownerRole: "auditor_readonly", requiredPermissionPrefix: "audit" },
];

export const systemOrderKeys = adminSystemCatalog.map(system => system.key);
export const adminSystemStatusLabel: Record<AdminSystemStatus, string> = { ready: "جاهز للتشغيل", in_progress: "قيد التطوير", planned: "مخطط" };
export const adminSystemCategoryLabel: Record<AdminSystem["category"], string> = { core: "الأساس المؤسسي", operations: "العمليات", finance: "المالية والدعم", governance: "الحوكمة والرقابة" };

export function moveSystemOrder(order: string[], index: number, delta: number) {
  const next = [...order];
  const target = index + delta;
  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
