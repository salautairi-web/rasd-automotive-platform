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

export const salesEntities = mysqlTable("sales_entities", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), salesCode: varchar("salesCode", { length: 40 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ salesEntityCode: uniqueIndex("sales_entities_entity_code_unique").on(table.businessEntityId, table.salesCode) }));

export const salesCustomers = mysqlTable("sales_customers", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), customerNo: varchar("customerNo", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), phone: varchar("phone", { length: 40 }), email: varchar("email", { length: 320 }), status: mysqlEnum("status", ["lead", "qualified", "active", "inactive"]).default("lead").notNull() }, (table) => ({ customerEntityNo: uniqueIndex("sales_customers_entity_no_unique").on(table.businessEntityId, table.customerNo) }));

export const salesVehicles = mysqlTable("sales_vehicles", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), vehicleNo: varchar("vehicleNo", { length: 80 }).notNull(), vin: varchar("vin", { length: 64 }).notNull(), make: varchar("make", { length: 80 }).notNull(), model: varchar("model", { length: 80 }).notNull(), modelYear: int("modelYear"), branchId: int("branchId"), status: mysqlEnum("status", ["acquired", "in_transit", "received", "inspection", "preparation", "ready", "reserved", "sold", "delivered", "returned", "on_hold"]).default("acquired").notNull(), totalCostMinor: int("totalCostMinor").default(0).notNull(), currency: varchar("currency", { length: 8 }).notNull() }, (table) => ({ vehicleEntityNo: uniqueIndex("sales_vehicles_entity_no_unique").on(table.businessEntityId, table.vehicleNo), vehicleEntityVin: uniqueIndex("sales_vehicles_entity_vin_unique").on(table.businessEntityId, table.vin) }));

export const salesVehicleCosts = mysqlTable("sales_vehicle_costs", { id: int("id").autoincrement().primaryKey(), vehicleId: int("vehicleId").notNull(), businessEntityId: int("businessEntityId").notNull(), costType: varchar("costType", { length: 60 }).notNull(), amountMinor: int("amountMinor").notNull(), sourceSystem: varchar("sourceSystem", { length: 60 }).notNull(), sourceId: varchar("sourceId", { length: 80 }), currency: varchar("currency", { length: 8 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const salesLeads = mysqlTable("sales_leads", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), customerId: int("customerId").notNull(), source: varchar("source", { length: 60 }), status: mysqlEnum("status", ["new", "qualified", "converted", "lost"]).default("new").notNull(), lostReason: varchar("lostReason", { length: 120 }), assignedTo: int("assignedTo"), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const salesQuotations = mysqlTable("sales_quotations", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), quotationNo: varchar("quotationNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), targetPriceMinor: int("targetPriceMinor").notNull(), discountMinor: int("discountMinor").default(0).notNull(), taxMinor: int("taxMinor").default(0).notNull(), totalMinor: int("totalMinor").notNull(), validUntil: timestamp("validUntil").notNull(), status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "converted", "expired"]).default("draft").notNull(), correlationId: varchar("correlationId", { length: 80 }).notNull() }, (table) => ({ quotationEntityNo: uniqueIndex("sales_quotations_entity_no_unique").on(table.businessEntityId, table.quotationNo) }));

export const salesQuotationApprovals = mysqlTable("sales_quotation_approvals", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), quotationId: int("quotationId").notNull(), requestedBy: int("requestedBy"), approvedBy: int("approvedBy"), thresholdRateBps: int("thresholdRateBps").notNull(), discountMinor: int("discountMinor").notNull(), status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(), decisionNote: text("decisionNote"), createdAt: timestamp("createdAt").defaultNow().notNull(), decidedAt: timestamp("decidedAt") });

export const salesReservations = mysqlTable("sales_reservations", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), reservationNo: varchar("reservationNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), amountMinor: int("amountMinor").default(0).notNull(), startsAt: timestamp("startsAt").notNull(), expiresAt: timestamp("expiresAt").notNull(), status: mysqlEnum("status", ["pending", "confirmed", "expired", "cancelled", "converted"]).default("pending").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 100 }).notNull() }, (table) => ({ reservationEntityNo: uniqueIndex("sales_reservations_entity_no_unique").on(table.businessEntityId, table.reservationNo), reservationIdempotency: uniqueIndex("sales_reservations_entity_idempotency_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const salesOrders = mysqlTable("sales_orders", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), orderNo: varchar("orderNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), branchId: int("branchId"), totalMinor: int("totalMinor").notNull(), currency: varchar("currency", { length: 8 }).notNull(), status: mysqlEnum("status", ["draft", "pending_approval", "approved", "invoiced", "paid", "delivered", "cancelled"]).default("draft").notNull(), correlationId: varchar("correlationId", { length: 80 }).notNull() }, (table) => ({ orderEntityNo: uniqueIndex("sales_orders_entity_no_unique").on(table.businessEntityId, table.orderNo) }));

export const salesInvoices = mysqlTable("sales_invoices", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceNo: varchar("invoiceNo", { length: 80 }).notNull(), salesOrderId: int("salesOrderId").notNull(), customerId: int("customerId").notNull(), totalMinor: int("totalMinor").notNull(), paidMinor: int("paidMinor").default(0).notNull(), currency: varchar("currency", { length: 8 }).notNull(), status: mysqlEnum("status", ["draft", "posted", "partially_paid", "paid", "void"]).default("draft").notNull(), postedAt: timestamp("postedAt") }, (table) => ({ invoiceEntityNo: uniqueIndex("sales_invoices_entity_no_unique").on(table.businessEntityId, table.invoiceNo) }));

export const salesPayments = mysqlTable("sales_payments", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceId: int("invoiceId").notNull(), paymentNo: varchar("paymentNo", { length: 80 }).notNull(), amountMinor: int("amountMinor").notNull(), method: varchar("method", { length: 40 }).notNull(), idempotencyKey: varchar("idempotencyKey", { length: 100 }).notNull(), status: mysqlEnum("status", ["pending", "confirmed", "failed", "refunded"]).default("pending").notNull(), paidAt: timestamp("paidAt") }, (table) => ({ paymentEntityNo: uniqueIndex("sales_payments_entity_no_unique").on(table.businessEntityId, table.paymentNo), paymentIdempotency: uniqueIndex("sales_payments_entity_idempotency_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const salesDeliveries = mysqlTable("sales_deliveries", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), deliveryNo: varchar("deliveryNo", { length: 80 }).notNull(), salesOrderId: int("salesOrderId").notNull(), vehicleId: int("vehicleId").notNull(), recipientName: varchar("recipientName", { length: 180 }).notNull(), odometer: int("odometer"), checklistJson: text("checklistJson"), status: mysqlEnum("status", ["pending", "approved", "delivered", "cancelled"]).default("pending").notNull(), deliveredAt: timestamp("deliveredAt") }, (table) => ({ deliveryEntityNo: uniqueIndex("sales_deliveries_entity_no_unique").on(table.businessEntityId, table.deliveryNo) }));

export const partsCustomers = mysqlTable("parts_customers", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), customerNo: varchar("customerNo", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), customerType: mysqlEnum("customerType", ["retail", "b2b", "corporate"]).default("retail").notNull(), creditLimitMinor: int("creditLimitMinor").default(0).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ customerNo: uniqueIndex("parts_customers_entity_no_unique").on(table.businessEntityId, table.customerNo) }));

export const partsSuppliers = mysqlTable("parts_suppliers", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), supplierNo: varchar("supplierNo", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), currency: varchar("currency", { length: 8 }).notNull(), leadTimeDays: int("leadTimeDays").default(0).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ supplierNo: uniqueIndex("parts_suppliers_entity_no_unique").on(table.businessEntityId, table.supplierNo) }));

export const partsProducts = mysqlTable("parts_products", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), sku: varchar("sku", { length: 80 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), nameEn: varchar("nameEn", { length: 180 }), category: varchar("category", { length: 80 }), brand: varchar("brand", { length: 80 }), barcode: varchar("barcode", { length: 80 }), oemNo: varchar("oemNo", { length: 80 }), mpn: varchar("mpn", { length: 80 }), unit: varchar("unit", { length: 20 }).notNull(), costMinor: int("costMinor").default(0).notNull(), retailPriceMinor: int("retailPriceMinor").default(0).notNull(), minimumMarginBps: int("minimumMarginBps").default(1000).notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ sku: uniqueIndex("parts_products_entity_sku_unique").on(table.businessEntityId, table.sku) }));

export const partsCompatibility = mysqlTable("parts_vehicle_compatibility", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), productId: int("productId").notNull(), make: varchar("make", { length: 80 }).notNull(), model: varchar("model", { length: 80 }).notNull(), yearFrom: int("yearFrom"), yearTo: int("yearTo"), engine: varchar("engine", { length: 80 }), region: varchar("region", { length: 60 }), notes: text("notes") });

export const partsWarehouses = mysqlTable("parts_warehouses", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), warehouseCode: varchar("warehouseCode", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), branchId: int("branchId"), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ warehouseCode: uniqueIndex("parts_warehouses_entity_code_unique").on(table.businessEntityId, table.warehouseCode) }));

export const partsInventory = mysqlTable("parts_inventory", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), warehouseId: int("warehouseId").notNull(), productId: int("productId").notNull(), availableQty: int("availableQty").default(0).notNull(), reservedQty: int("reservedQty").default(0).notNull(), damagedQty: int("damagedQty").default(0).notNull(), reorderPoint: int("reorderPoint").default(0).notNull(), averageCostMinor: int("averageCostMinor").default(0).notNull() }, (table) => ({ balance: uniqueIndex("parts_inventory_entity_balance_unique").on(table.businessEntityId, table.warehouseId, table.productId) }));

export const partsInventoryMovements = mysqlTable("parts_inventory_movements", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), warehouseId: int("warehouseId").notNull(), productId: int("productId").notNull(), movementType: mysqlEnum("movementType", ["receipt", "reservation", "release", "issue", "return", "transfer", "adjustment"]).notNull(), quantity: int("quantity").notNull(), sourceType: varchar("sourceType", { length: 60 }).notNull(), sourceId: varchar("sourceId", { length: 80 }).notNull(), idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => ({ movementKey: uniqueIndex("parts_movements_entity_idempotency_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const partsPurchaseOrders = mysqlTable("parts_purchase_orders", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), purchaseOrderNo: varchar("purchaseOrderNo", { length: 80 }).notNull(), supplierId: int("supplierId").notNull(), totalMinor: int("totalMinor").notNull(), currency: varchar("currency", { length: 8 }).notNull(), status: mysqlEnum("status", ["draft", "pending_approval", "approved", "received", "closed", "cancelled"]).default("draft").notNull() }, (table) => ({ poNo: uniqueIndex("parts_purchase_orders_entity_no_unique").on(table.businessEntityId, table.purchaseOrderNo) }));

export const partsSalesOrders = mysqlTable("parts_sales_orders", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), salesOrderNo: varchar("salesOrderNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), totalMinor: int("totalMinor").notNull(), currency: varchar("currency", { length: 8 }).notNull(), sourceEntityId: int("sourceEntityId"), status: mysqlEnum("status", ["draft", "reserved", "issued", "invoiced", "paid", "cancelled"]).default("draft").notNull() }, (table) => ({ soNo: uniqueIndex("parts_sales_orders_entity_no_unique").on(table.businessEntityId, table.salesOrderNo) }));

export const partsReservations = mysqlTable("parts_reservations", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), salesOrderId: int("salesOrderId").notNull(), warehouseId: int("warehouseId").notNull(), productId: int("productId").notNull(), quantity: int("quantity").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull(), status: mysqlEnum("status", ["confirmed", "released", "issued", "cancelled"]).default("confirmed").notNull() }, (table) => ({ reservationKey: uniqueIndex("parts_reservations_entity_idempotency_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const partsInvoices = mysqlTable("parts_invoices", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceNo: varchar("invoiceNo", { length: 80 }).notNull(), salesOrderId: int("salesOrderId").notNull(), totalMinor: int("totalMinor").notNull(), paidMinor: int("paidMinor").default(0).notNull(), status: mysqlEnum("status", ["draft", "posted", "partially_paid", "paid", "void"]).default("draft").notNull() }, (table) => ({ invoiceNo: uniqueIndex("parts_invoices_entity_no_unique").on(table.businessEntityId, table.invoiceNo) }));

export const partsPayments = mysqlTable("parts_payments", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceId: int("invoiceId").notNull(), paymentNo: varchar("paymentNo", { length: 80 }).notNull(), amountMinor: int("amountMinor").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull(), status: mysqlEnum("status", ["confirmed", "failed", "refunded"]).default("confirmed").notNull(), paidAt: timestamp("paidAt").defaultNow().notNull() }, (table) => ({ paymentKey: uniqueIndex("parts_payments_entity_idempotency_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const workshopCustomers = mysqlTable("workshop_customers", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), customerNo: varchar("customerNo", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), customerType: mysqlEnum("customerType", ["individual", "corporate", "fleet", "inter_entity"]).default("individual").notNull(), status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull() }, (table) => ({ customerNo: uniqueIndex("workshop_customers_entity_no_unique").on(table.businessEntityId, table.customerNo) }));

export const workshopVehicles = mysqlTable("workshop_customer_vehicles", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), customerId: int("customerId").notNull(), vehicleNo: varchar("vehicleNo", { length: 80 }).notNull(), vin: varchar("vin", { length: 64 }).notNull(), plateNo: varchar("plateNo", { length: 40 }), make: varchar("make", { length: 80 }).notNull(), model: varchar("model", { length: 80 }).notNull(), modelYear: int("modelYear"), odometer: int("odometer").default(0).notNull(), status: mysqlEnum("status", ["checked_in", "inspection", "estimate_pending", "awaiting_approval", "in_repair", "waiting_parts", "quality_check", "ready", "delivered", "returned"]).default("checked_in").notNull() }, (table) => ({ vehicleNo: uniqueIndex("workshop_vehicles_entity_no_unique").on(table.businessEntityId, table.vehicleNo), vin: uniqueIndex("workshop_vehicles_entity_vin_unique").on(table.businessEntityId, table.vin) }));

export const workshopTechnicians = mysqlTable("workshop_technicians", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), technicianNo: varchar("technicianNo", { length: 60 }).notNull(), nameAr: varchar("nameAr", { length: 180 }).notNull(), department: varchar("department", { length: 40 }).notNull(), laborRateMinor: int("laborRateMinor").default(0).notNull(), available: int("available").default(1).notNull() }, (table) => ({ technicianNo: uniqueIndex("workshop_technicians_entity_no_unique").on(table.businessEntityId, table.technicianNo) }));

export const workshopAppointments = mysqlTable("workshop_appointments", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), appointmentNo: varchar("appointmentNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), scheduledAt: timestamp("scheduledAt").notNull(), serviceType: varchar("serviceType", { length: 120 }).notNull(), status: mysqlEnum("status", ["scheduled", "checked_in", "cancelled", "completed"]).default("scheduled").notNull() }, (table) => ({ appointmentNo: uniqueIndex("workshop_appointments_entity_no_unique").on(table.businessEntityId, table.appointmentNo) }));

export const workshopInspections = mysqlTable("workshop_inspections", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), vehicleId: int("vehicleId").notNull(), appointmentId: int("appointmentId"), checklistJson: text("checklistJson").notNull(), findings: text("findings"), status: mysqlEnum("status", ["draft", "completed"]).default("draft").notNull(), completedAt: timestamp("completedAt") });

export const workshopEstimates = mysqlTable("workshop_estimates", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), estimateNo: varchar("estimateNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), laborMinor: int("laborMinor").default(0).notNull(), partsMinor: int("partsMinor").default(0).notNull(), discountMinor: int("discountMinor").default(0).notNull(), totalMinor: int("totalMinor").notNull(), status: mysqlEnum("status", ["draft", "pending_customer", "pending_internal", "approved", "rejected", "expired"]).default("draft").notNull() }, (table) => ({ estimateNo: uniqueIndex("workshop_estimates_entity_no_unique").on(table.businessEntityId, table.estimateNo) }));

export const workshopWorkOrders = mysqlTable("workshop_work_orders", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), workOrderNo: varchar("workOrderNo", { length: 80 }).notNull(), customerId: int("customerId").notNull(), vehicleId: int("vehicleId").notNull(), estimateId: int("estimateId"), technicianId: int("technicianId"), branchId: int("branchId"), status: mysqlEnum("status", ["draft", "approved", "in_progress", "waiting_parts", "waiting_approval", "quality_check", "ready", "delivered", "cancelled"]).default("draft").notNull(), openedAt: timestamp("openedAt").defaultNow().notNull(), closedAt: timestamp("closedAt") }, (table) => ({ workOrderNo: uniqueIndex("workshop_work_orders_entity_no_unique").on(table.businessEntityId, table.workOrderNo) }));

export const workshopLaborEntries = mysqlTable("workshop_labor_entries", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), workOrderId: int("workOrderId").notNull(), technicianId: int("technicianId").notNull(), operationName: varchar("operationName", { length: 180 }).notNull(), minutes: int("minutes").notNull(), costMinor: int("costMinor").default(0).notNull(), revenueMinor: int("revenueMinor").default(0).notNull() });

export const workshopPartsRequests = mysqlTable("workshop_parts_requests", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), workOrderId: int("workOrderId").notNull(), targetPartsEntityId: int("targetPartsEntityId").notNull(), requestNo: varchar("requestNo", { length: 80 }).notNull(), payloadJson: text("payloadJson").notNull(), status: mysqlEnum("status", ["draft", "sent", "accepted", "received", "cancelled"]).default("draft").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull() }, (table) => ({ requestKey: uniqueIndex("workshop_parts_requests_entity_key_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const workshopQualityChecks = mysqlTable("workshop_quality_checks", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), workOrderId: int("workOrderId").notNull(), checklistJson: text("checklistJson").notNull(), result: mysqlEnum("result", ["passed", "failed", "recheck"]).notNull(), approvedBy: int("approvedBy"), completedAt: timestamp("completedAt").defaultNow().notNull() });

export const workshopInvoices = mysqlTable("workshop_invoices", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceNo: varchar("invoiceNo", { length: 80 }).notNull(), workOrderId: int("workOrderId").notNull(), totalMinor: int("totalMinor").notNull(), paidMinor: int("paidMinor").default(0).notNull(), status: mysqlEnum("status", ["draft", "posted", "partially_paid", "paid", "void"]).default("draft").notNull() }, (table) => ({ invoiceNo: uniqueIndex("workshop_invoices_entity_no_unique").on(table.businessEntityId, table.invoiceNo) }));

export const workshopPayments = mysqlTable("workshop_payments", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), invoiceId: int("invoiceId").notNull(), paymentNo: varchar("paymentNo", { length: 80 }).notNull(), amountMinor: int("amountMinor").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull(), paidAt: timestamp("paidAt").defaultNow().notNull() }, (table) => ({ paymentKey: uniqueIndex("workshop_payments_entity_key_unique").on(table.businessEntityId, table.idempotencyKey) }));

export const workshopDeliveries = mysqlTable("workshop_deliveries", { id: int("id").autoincrement().primaryKey(), businessEntityId: int("businessEntityId").notNull(), workOrderId: int("workOrderId").notNull(), recipientName: varchar("recipientName", { length: 180 }).notNull(), odometer: int("odometer"), deliveredAt: timestamp("deliveredAt").defaultNow().notNull(), acknowledgement: text("acknowledgement") });

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
