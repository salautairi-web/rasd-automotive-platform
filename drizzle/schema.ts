import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const businessEntities = mysqlTable("business_entities", { id: int("id").autoincrement().primaryKey(), entityId: varchar("entityId", { length: 40 }).notNull().unique(), code: varchar("code", { length: 40 }).notNull().unique(), nameAr: varchar("nameAr", { length: 180 }).notNull(), nameEn: varchar("nameEn", { length: 180 }), entityType: mysqlEnum("entityType", ["company", "subsidiary", "business_project", "business_activity", "investment_vehicle", "future"]).notNull(), parentCompanyId: int("parentCompanyId"), currency: varchar("currency", { length: 8 }).default("OMR").notNull(), timezone: varchar("timezone", { length: 64 }).default("Asia/Muscat").notNull(), status: mysqlEnum("status", ["active", "inactive", "planned"]).default("planned").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  city: varchar("city", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
});

export const businessUnits = mysqlTable("business_units", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  systemKey: varchar("systemKey", { length: 48 }).notNull(),
});

export const departments = mysqlTable("departments", { id: int("id").autoincrement().primaryKey(), organizationId: int("organizationId").notNull(), branchId: int("branchId"), code: varchar("code", { length: 32 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), nameEn: varchar("nameEn", { length: 180 }) });

export const warehouses = mysqlTable("warehouses", { id: int("id").autoincrement().primaryKey(), organizationId: int("organizationId").notNull(), branchId: int("branchId"), code: varchar("code", { length: 32 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), nameEn: varchar("nameEn", { length: 180 }) });

export const locations = mysqlTable("locations", { id: int("id").autoincrement().primaryKey(), organizationId: int("organizationId").notNull(), warehouseId: int("warehouseId"), code: varchar("code", { length: 32 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull() });

export const costCenters = mysqlTable("cost_centers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  customerNo: varchar("customerNo", { length: 32 }).notNull(),
  organizationId: int("organizationId").notNull(),
  businessEntityId: int("businessEntityId"),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ customerEntityNo: uniqueIndex("customers_entity_no_unique").on(table.businessEntityId, table.customerNo) }));

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  vehicleNo: varchar("vehicleNo", { length: 32 }).notNull(),
  organizationId: int("organizationId").notNull(),
  businessEntityId: int("businessEntityId"),
  vin: varchar("vin", { length: 64 }).notNull(),
  make: varchar("make", { length: 80 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  modelYear: int("modelYear"),
  lifecycleStatus: varchar("lifecycleStatus", { length: 40 }).default("imported").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ vehicleEntityNo: uniqueIndex("vehicles_entity_no_unique").on(table.businessEntityId, table.vehicleNo) }));

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productNo: varchar("productNo", { length: 32 }).notNull(),
  organizationId: int("organizationId").notNull(),
  businessEntityId: int("businessEntityId"),
  sku: varchar("sku", { length: 80 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  category: varchar("category", { length: 80 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
}, (table) => ({ productEntityNo: uniqueIndex("products_entity_no_unique").on(table.businessEntityId, table.productNo) }));

export const suppliers = mysqlTable("suppliers", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), supplierNo: varchar("supplierNo", { length: 40 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ supplierEntityNo: uniqueIndex("suppliers_entity_no_unique").on(table.businessEntityId, table.supplierNo) }));

export const inventoryItems = mysqlTable("inventory_items", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), sku: varchar("sku", { length: 80 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), unit: varchar("unit", { length: 20 }).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ inventoryEntitySku: uniqueIndex("inventory_entity_sku_unique").on(table.businessEntityId, table.sku) }));

export const stockBalances = mysqlTable("stock_balances", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), warehouseId: int("warehouseId").notNull(), inventoryItemId: int("inventoryItemId").notNull(), quantityMinor: int("quantityMinor").default(0).notNull(), valuationMinor: int("valuationMinor").default(0).notNull(), currency: varchar("currency", { length: 8 }).notNull() });

export const entitySettings = mysqlTable("entity_settings", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), settingKey: varchar("settingKey", { length: 100 }).notNull(), settingValue: text("settingValue") });

export const accountingBooks = mysqlTable("accounting_books", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), bookCode: varchar("bookCode", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), currency: varchar("currency", { length: 8 }).notNull(), status: mysqlEnum("status", ["active", "closed"]).default("active").notNull() });

export const accounts = mysqlTable("accounts", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), accountCode: varchar("accountCode", { length: 40 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), accountType: varchar("accountType", { length: 40 }).notNull(), parentAccountId: int("parentAccountId"), isControl: int("isControl").default(0).notNull(), isPostable: int("isPostable").default(1).notNull() });

export const fiscalPeriods = mysqlTable("fiscal_periods", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), periodCode: varchar("periodCode", { length: 20 }).notNull(), startsAt: timestamp("startsAt").notNull(), endsAt: timestamp("endsAt").notNull(), status: mysqlEnum("status", ["open", "closed"]).default("open").notNull() });

export const journalEntries = mysqlTable("journal_entries", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), entryNo: varchar("entryNo", { length: 60 }).notNull(), sourceSystem: varchar("sourceSystem", { length: 60 }).notNull(), sourceType: varchar("sourceType", { length: 60 }).notNull(), sourceId: varchar("sourceId", { length: 80 }).notNull(), status: mysqlEnum("status", ["draft", "validated", "approved", "posted", "reversed"]).default("draft").notNull(), correlationId: varchar("correlationId", { length: 80 }), postedAt: timestamp("postedAt"), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const journalLines = mysqlTable("journal_lines", { id: int("id").autoincrement().primaryKey(), journalEntryId: int("journalEntryId").notNull(), accountId: int("accountId").notNull(), description: text("description"), debitMinor: int("debitMinor").default(0).notNull(), creditMinor: int("creditMinor").default(0).notNull(), currency: varchar("currency", { length: 8 }).notNull(), costCenterId: int("costCenterId") });

export const interEntityTransactions = mysqlTable("inter_entity_transactions", { id: int("id").autoincrement().primaryKey(), sourceEntityId: int("sourceEntityId").notNull(), targetEntityId: int("targetEntityId").notNull(), transactionType: varchar("transactionType", { length: 60 }).notNull(), status: mysqlEnum("status", ["draft", "pending", "matched", "eliminated"]).default("draft").notNull(), sourceReference: varchar("sourceReference", { length: 80 }), targetReference: varchar("targetReference", { length: 80 }), amountMinor: int("amountMinor").default(0).notNull(), currency: varchar("currency", { length: 8 }).notNull(), correlationId: varchar("correlationId", { length: 80 }).notNull() });

export const interEntityReconciliations = mysqlTable("inter_entity_reconciliations", { id: int("id").autoincrement().primaryKey(), transactionId: int("transactionId").notNull(), status: mysqlEnum("status", ["open", "matched", "exception"]).default("open").notNull(), differenceMinor: int("differenceMinor").default(0).notNull(), note: text("note") });

export const capitalContributions = mysqlTable("capital_contributions", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), amountMinor: int("amountMinor").notNull(), currency: varchar("currency", { length: 8 }).notNull(), contributionDate: timestamp("contributionDate").notNull(), status: mysqlEnum("status", ["draft", "approved", "posted"]).default("draft").notNull(), correlationId: varchar("correlationId", { length: 80 }) });

export const entityLoans = mysqlTable("entity_loans", { id: int("id").autoincrement().primaryKey(), lenderEntityId: int("lenderEntityId").notNull(), borrowerEntityId: int("borrowerEntityId").notNull(), principalMinor: int("principalMinor").notNull(), currency: varchar("currency", { length: 8 }).notNull(), status: mysqlEnum("status", ["draft", "approved", "active", "settled"]).default("draft").notNull(), correlationId: varchar("correlationId", { length: 80 }) });

export const consolidationExceptions = mysqlTable("consolidation_exceptions", { id: int("id").autoincrement().primaryKey(), runId: int("runId").notNull(), exceptionType: varchar("exceptionType", { length: 60 }).notNull(), entityId: int("entityId"), message: text("message"), status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull() });

export const consolidationRuns = mysqlTable("consolidation_runs", { id: int("id").autoincrement().primaryKey(), periodCode: varchar("periodCode", { length: 20 }).notNull(), status: mysqlEnum("status", ["draft", "running", "completed", "failed"]).default("draft").notNull(), missingEvents: int("missingEvents").default(0).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const portfolioMetrics = mysqlTable("portfolio_metrics", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), periodCode: varchar("periodCode", { length: 20 }).notNull(), revenueMinor: int("revenueMinor").default(0).notNull(), profitMinor: int("profitMinor").default(0).notNull(), capitalInvestedMinor: int("capitalInvestedMinor").default(0).notNull(), roiBps: int("roiBps").default(0).notNull() });

export const numberingRules = mysqlTable("numbering_rules", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  entityKey: varchar("entityKey", { length: 48 }).notNull(),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  includeYear: int("includeYear").default(1).notNull(),
  sequence: int("sequence").default(0).notNull(),
});

export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  permissionKey: varchar("permissionKey", { length: 100 }).notNull().unique(),
  labelAr: varchar("labelAr", { length: 180 }).notNull(),
  systemKey: varchar("systemKey", { length: 48 }).notNull(),
});

export const accessGrants = mysqlTable("access_grants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId"),
  businessUnitId: int("businessUnitId"),
  permissionKey: varchar("permissionKey", { length: 100 }).notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  organizationId: int("organizationId"),
  systemKey: varchar("systemKey", { length: 48 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }).notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  requestId: varchar("requestId", { length: 80 }),
  correlationId: varchar("correlationId", { length: 80 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const integrationEvents = mysqlTable("integration_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 80 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  version: varchar("version", { length: 20 }).default("v1").notNull(),
  sourceSystem: varchar("sourceSystem", { length: 48 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }).notNull(),
  correlationId: varchar("correlationId", { length: 80 }).notNull(),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["pending", "processed", "failed"]).default("pending").notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commands = mysqlTable("commands", {
  id: int("id").autoincrement().primaryKey(),
  commandId: varchar("commandId", { length: 80 }).notNull().unique(),
  commandType: varchar("commandType", { length: 100 }).notNull(),
  targetSystem: varchar("targetSystem", { length: 48 }).notNull(),
  correlationId: varchar("correlationId", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["queued", "completed", "failed"]).default("queued").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  workflowKey: varchar("workflowKey", { length: 80 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  triggerDescription: text("triggerDescription"),
  status: mysqlEnum("status", ["active", "draft", "inactive"]).default("draft").notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  titleAr: varchar("titleAr", { length: 220 }).notNull(),
  taskType: varchar("taskType", { length: 80 }).notNull(),
  assigneeUserId: int("assigneeUserId"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "done", "escalated"]).default("open").notNull(),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const taskComments = mysqlTable("task_comments", { id: int("id").autoincrement().primaryKey(), taskId: int("taskId").notNull(), userId: int("userId").notNull(), body: text("body").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const documentLinks = mysqlTable("document_links", { id: int("id").autoincrement().primaryKey(), documentId: int("documentId").notNull(), entityType: varchar("entityType", { length: 80 }).notNull(), entityId: varchar("entityId", { length: 80 }).notNull() });

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }).notNull(),
  fileName: varchar("fileName", { length: 220 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  storageKey: varchar("storageKey", { length: 400 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 800 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const idempotencyKeys = mysqlTable("idempotency_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 160 }).notNull().unique(),
  operation: varchar("operation", { length: 120 }).notNull(),
  requestHash: varchar("requestHash", { length: 128 }).notNull(),
  responsePayload: text("responsePayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
