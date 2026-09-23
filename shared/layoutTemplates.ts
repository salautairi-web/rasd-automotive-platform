export type LayoutMode = "customer" | "user";
export type LayoutConfig = {
  domainOrder: string[];
  visibleDomains: string[];
  serviceOrder: Record<string, string[]>;
};

const baseDomains = ["rental", "workshop", "sales", "parts", "finance"];
const roleFocus: Record<string, string> = {
  branch_manager: "rental",
  rental_manager: "rental",
  rental_agent: "rental",
  workshop_manager: "workshop",
  workshop_technician: "workshop",
  quality_controller: "workshop",
  sales_manager: "sales",
  sales_agent: "sales",
  warehouse_manager: "parts",
  warehouse_clerk: "parts",
  finance_manager: "finance",
  accountant: "finance",
};

export const layoutRoleKeys = [
  "branch_manager", "finance_manager", "project_manager", "warehouse_manager", "sales_manager", "hr_manager", "hr_specialist", "accountant", "sales_agent", "warehouse_clerk", "workshop_technician", "rental_agent", "customer_service", "auditor_readonly", "workshop_manager", "rental_manager", "quality_controller",
] as const;

export function defaultLayoutForRole(roleKey: string, mode: LayoutMode = "user"): LayoutConfig {
  const focus = roleFocus[roleKey];
  const domainOrder = focus ? [focus, ...baseDomains.filter(domain => domain !== focus)] : [...baseDomains];
  const serviceOrder: Record<string, string[]> = {};
  if (mode === "customer") return { domainOrder: [...baseDomains], visibleDomains: [...baseDomains], serviceOrder };
  return { domainOrder, visibleDomains: [...baseDomains], serviceOrder };
}

export function cloneLayoutConfig(config: LayoutConfig): LayoutConfig {
  return { domainOrder: [...config.domainOrder], visibleDomains: [...config.visibleDomains], serviceOrder: Object.fromEntries(Object.entries(config.serviceOrder).map(([key, value]) => [key, [...value]])) };
}
