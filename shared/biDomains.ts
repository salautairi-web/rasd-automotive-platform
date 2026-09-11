export const biDomainCatalog = [
  { key: "finance", nameAr: "المالية والخزينة", metrics: ["revenue", "gross_margin", "cash", "working_capital", "budget_variance"] },
  { key: "fleet", nameAr: "التأجير والأسطول", metrics: ["fleet_utilization", "rental_revenue", "maintenance_cost", "fuel_cost", "vehicle_profitability"] },
  { key: "workshop", nameAr: "الورشة", metrics: ["workshop_jobs", "workshop_revenue", "labor_utilization", "parts_consumption", "average_repair_time"] },
  { key: "sales", nameAr: "مبيعات السيارات", metrics: ["units_sold", "sales_revenue", "sales_margin", "inventory_aging", "lead_conversion"] },
  { key: "parts", nameAr: "القطع والمخزون", metrics: ["inventory_value", "inventory_turnover", "fill_rate", "stockout_rate", "dead_stock"] },
  { key: "procurement", nameAr: "المشتريات والموردون", metrics: ["procurement_spend", "sourcing_savings", "supplier_concentration", "po_cycle_time", "on_time_delivery"] },
  { key: "projects", nameAr: "المشاريع", metrics: ["project_budget", "project_committed", "project_actual", "project_forecast", "schedule_variance"] },
  { key: "hr", nameAr: "الموارد البشرية", metrics: ["headcount", "labor_cost", "turnover", "absence", "vacancy"] },
  { key: "assets", nameAr: "الأصول الثابتة", metrics: ["asset_base", "net_book_value", "depreciation", "asset_maintenance_cost", "asset_utilization"] },
  { key: "compliance", nameAr: "الامتثال", metrics: ["open_obligations", "license_expiry_risk", "open_cases", "control_effectiveness", "compliance_score"] },
  { key: "crm", nameAr: "تجربة العميل", metrics: ["customer_count", "lead_conversion", "case_resolution_time", "retention", "loyalty_points"] },
] as const;

export type BiDomainKey = (typeof biDomainCatalog)[number]["key"];
export const getBiDomain = (key: string) => biDomainCatalog.find(domain => domain.key === key);
