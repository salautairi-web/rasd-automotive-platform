import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  customerNo: varchar("customerNo", { length: 32 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  vehicleNo: varchar("vehicleNo", { length: 32 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  vin: varchar("vin", { length: 64 }).notNull().unique(),
  make: varchar("make", { length: 80 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  modelYear: int("modelYear"),
  lifecycleStatus: varchar("lifecycleStatus", { length: 40 }).default("imported").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productNo: varchar("productNo", { length: 32 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  sku: varchar("sku", { length: 80 }).notNull(),
  nameAr: varchar("nameAr", { length: 180 }).notNull(),
  nameEn: varchar("nameEn", { length: 180 }),
  category: varchar("category", { length: 80 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
});

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
