export const earlyWarningTemplates = [
  { key: "rental_maintenance_due", domain: "rental", severity: "high", metric: "maintenance_due_days", action: "create_maintenance_request" },
  { key: "rental_insurance_expiry", domain: "rental", severity: "critical", metric: "insurance_expiry_days", action: "create_task" },
  { key: "workshop_job_overdue", domain: "workshop", severity: "high", metric: "job_overdue_days", action: "create_task" },
  { key: "parts_stockout_risk", domain: "parts", severity: "high", metric: "stock_cover_days", action: "create_purchase_request" },
  { key: "sales_margin_below_target", domain: "sales", severity: "medium", metric: "margin_bps", action: "request_approval" },
  { key: "import_shipment_delay", domain: "import_export", severity: "high", metric: "transit_delay_days", action: "create_compliance_task" },
  { key: "treasury_liquidity_gap", domain: "treasury", severity: "critical", metric: "liquidity_gap", action: "start_workflow" },
  { key: "project_milestone_delay", domain: "project", severity: "high", metric: "milestone_delay_days", action: "start_workflow" },
  { key: "compliance_license_expiry", domain: "compliance", severity: "critical", metric: "license_expiry_days", action: "create_compliance_task" },
  { key: "security_incident", domain: "security", severity: "critical", metric: "security_risk_score", action: "request_approval" },
] as const;
