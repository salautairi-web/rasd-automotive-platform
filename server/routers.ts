import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAuditLog, enqueueEvent, getRasdOverview } from "./db";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { storagePut } from "./storage";
import { documents, customers, vehicles, products, organizations, branches, integrationEvents, tasks, workflows, auditLogs, businessEntities, accountingBooks, journalEntries, journalLines, portfolioMetrics, salesCustomers, salesVehicles, salesLeads, salesQuotations, salesQuotationApprovals, salesReservations, salesOrders, salesInvoices, salesPayments, salesDeliveries, salesVehicleCosts, partsProducts, partsInventory, partsInventoryMovements, partsReservations, partsSalesOrders, partsInvoices, partsPayments, workshopAppointments, workshopCustomers, workshopVehicles, workshopWorkOrders, workshopPartsRequests, workshopInvoices, workshopPayments, rentalVehicles, rentalCustomers, rentalRatePlans, rentalReservations, rentalContracts, rentalOdometerReadings, rentalMaintenanceProfiles, rentalMaintenanceTasks, rentalMaintenanceRequests, rentalInvoices } from "../drizzle/schema";
import { getDb } from "./db";
import { rentalAdvancedRouter } from "./rentalAdvanced";
import { importExportRouter } from "./importExport";
import { portalRouter } from "./portal";
import { customerServicesRouter } from "./customerServices";
import { customerVerificationRouter } from "./customerVerification";
import { customerLinkReviewRouter } from "./customerLinkReview";
import { customerAuthRouter } from "./customerAuth";
import { portalV2Router } from "./portalV2";
import { communicationRouter } from "./communication";
import { communication54Router } from "./communication54";
import { procurementNetworkRouter } from "./procurementNetwork";
import { fleetRouter } from "./fleet";
import { fleet58Router } from "./fleet58";
import { workshop59Router } from "./workshop59";
import { workshopSetupRouter } from "./workshopSetup";
import { workshopRoleTemplatesRouter } from "./workshopRoleTemplates";
import { assertWorkshopPermission } from "./workshopAccess";
import { trading60Router } from "./trading60";
import { trade61Router } from "./trade61";
import { projects62Router } from "./projects62";
import { hr63Router } from "./hr63";
import { complianceRouter } from "./compliance";
import { compliance42Router } from "./compliance42";
import { centralOperationsRouter } from "./centralOperations";
import { biRouter } from "./bi";
import { biWarehouseRouter } from "./biWarehouse";
import { bi45Router } from "./bi45";
import { biDomainsRouter } from "./biDomains";
import { centralFinanceRouter } from "./centralFinance";
import { treasuryRouter } from "./treasury";
import { treasury48Router } from "./treasury48";
import { ar65Router } from "./ar65";
import { consolidation66Router } from "./consolidation66";
import { fpna67Router } from "./fpna67";
import { crm68Router } from "./crm68";
import { procurement69Router } from "./procurement69";
import { dms70Router } from "./dms70";
import { workflow71Router } from "./workflow71";
import { approval72Router } from "./approval72";
import { bi73Router } from "./bi73";
import { mdm74Router } from "./mdm74";
import { risk49Router } from "./risk49";
import { audit50Router } from "./audit50";
import { externalAuditor50Router } from "./externalAuditor50";
import { externalAuditorCollab50Router } from "./externalAuditorCollab50";
import { crm51Router } from "./crm51";
import { workflow52Router } from "./workflow52";
import { planningRouter } from "./planning";
import { costAccountingRouter } from "./costAccounting";
import { governanceRouter } from "./governance";
import { projectsRouter } from "./projects";
import { mdmRouter } from "./mdm";
import { procurementRouter } from "./procurement";
import { procurement55Router } from "./procurement55";
import { hrRouter } from "./hr";
import { hr41Router } from "./hr41";
import { assetsRouter } from "./assets";
import { assets57Router } from "./assets57";
import { inventoryRouter } from "./inventory";
import { inventory56Router } from "./inventory56";
import { crmRouter } from "./crm";
import { documentManagementRouter } from "./documents";
import { documents53Router } from "./documents53";
import { automationRouter } from "./automation";
import { alertsRouter } from "./alerts";
import { enterpriseExtensionsRouter } from "./enterpriseExtensions";
import { integrationsRouter } from "./integrations";
import { integration44Router } from "./integration44";
import { iamRouter } from "./iam";
import { security43Router } from "./security43";
import { mobileRouter } from "./mobile";
import { payments47Router } from "./payments47";
import { adminControlRouter } from "./adminControl";
import { hasActiveMfa, hasEntityMembership, hasFinancialRentalRole } from "./iam";
import { canEnterRentalGateway } from "../shared/rentalAccess";
import { nextRasdNumber } from "./numbering";
import { storageGetSignedUrl } from "./storage";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { validateBalancedJournal } from "../shared/erp";
import { canReserveVehicle, canDeliverVehicle, quotationStatus } from "../shared/auto-sales";
import { layoutRouter } from "./layout";
import { rentalSecurityRouter } from "./rentalSecurity";
import { assertEntityMembership } from "./entityAccess";

const correlationSchema = z.string().trim().min(8).max(80).optional();

const rentalScopedProcedure = protectedProcedure.use(async ({ ctx, input, next }) => {
  const businessEntityId = (input as { businessEntityId?: unknown })?.businessEntityId;
  const isAdmin = ctx.user.role === "admin";
  const hasMembership = typeof businessEntityId === "number" && await hasEntityMembership(ctx.user.id, businessEntityId);
  if (!canEnterRentalGateway({ isAdmin, hasActiveEntityMembership: hasMembership, businessEntityId })) throw new TRPCError({ code: "FORBIDDEN", message: "عضوية IAM نشطة في كيان التأجير مطلوبة" });
  if (!isAdmin && typeof businessEntityId === "number" && await hasFinancialRentalRole(ctx.user.id, businessEntityId) && !(await hasActiveMfa(ctx.user.id))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يجب تفعيل المصادقة الثنائية قبل استخدام صلاحيات التأجير المالية" });
  return next();
});

const workshopLegacyScopedProcedure = protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).use(async ({ ctx, input, next }) => {
  await assertWorkshopPermission(ctx.user, input.businessEntityId, "read");
  return next();
});

// Operational procedures must establish active IAM membership before touching
// tenant data. Admins remain governed by the admin procedure itself.
const entityScopedProcedure = protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).use(async ({ ctx, input, next }) => {
  const businessEntityId = input.businessEntityId;
  if (ctx.user.role !== "admin") await assertEntityMembership(ctx.user.id, ctx.user.role, businessEntityId);
  return next();
});

export const appRouter = router({
  branchOptions: protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertEntityMembership(ctx.user.id, ctx.user.role, input.businessEntityId);
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: branches.id, code: branches.code, nameAr: branches.nameAr, city: branches.city }).from(branches).where(and(eq(branches.businessEntityId, input.businessEntityId), eq(branches.status, "active"))).orderBy(branches.nameAr).limit(100);
  }),
  rentalAdvanced: rentalAdvancedRouter,
  rentalSecurity: rentalSecurityRouter,
  importExport: importExportRouter,
  portal: portalRouter,
  portalV2: portalV2Router,
  customerAuth: customerAuthRouter,
  customerVerification: customerVerificationRouter,
  customerLinkReview: customerLinkReviewRouter,
  customerServices: customerServicesRouter,
  communication: communicationRouter,
  communication54: communication54Router,
  procurementNetwork: procurementNetworkRouter,
  fleet: fleetRouter,
  fleet58: fleet58Router,
  workshop59: workshop59Router,
  workshopSetup: workshopSetupRouter,
  workshopRoleTemplates: workshopRoleTemplatesRouter,
  trading60: trading60Router,
  trade61: trade61Router,
  projects62: projects62Router,
  hr63: hr63Router,
  compliance: complianceRouter,
  compliance42: compliance42Router,
  centralOperations: centralOperationsRouter,
  bi: biRouter,
  biWarehouse: biWarehouseRouter,
  bi45: bi45Router,
  biDomains: biDomainsRouter,
  centralFinance: centralFinanceRouter,
  treasury: treasuryRouter,
  treasury48: treasury48Router,
  ar65: ar65Router,
  consolidation66: consolidation66Router,
  fpna67: fpna67Router,
  crm68: crm68Router,
  procurement69: procurement69Router,
  dms70: dms70Router,
  workflow71: workflow71Router,
  approval72: approval72Router,
  bi73: bi73Router,
  mdm74: mdm74Router,
  risk49: risk49Router,
  audit50: audit50Router,
  externalAuditor50: externalAuditor50Router,
  externalAuditorCollab50: externalAuditorCollab50Router,
  crm51: crm51Router,
  workflow52: workflow52Router,
  planning: planningRouter,
  costAccounting: costAccountingRouter,
  governance: governanceRouter,
  projects: projectsRouter,
  mdm: mdmRouter,
  procurement: procurementRouter,
  procurement55: procurement55Router,
  hr: hrRouter,
  hr41: hr41Router,
  assets: assetsRouter,
  assets57: assets57Router,
  inventory: inventoryRouter,
  inventory56: inventory56Router,
  crm: crmRouter,
  documentManagement: documentManagementRouter,
  documents53: documents53Router,
  automation: automationRouter,
  alerts: alertsRouter,
  enterpriseExtensions: enterpriseExtensionsRouter,
  integrations: integrationsRouter,
  integration44: integration44Router,
  iam: iamRouter,
  security43: security43Router,
  mobile: mobileRouter,
  payments47: payments47Router,
  adminControl: adminControlRouter,
  layout: layoutRouter,
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  masterData: router({
    list: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return { customers: [], vehicles: [] }; const [customerRows, vehicleRows] = await Promise.all([db.select({ id: customers.id, customerNo: customers.customerNo, nameAr: customers.nameAr, phone: customers.phone, email: customers.email }).from(customers).where(and(eq(customers.businessEntityId, input.businessEntityId), eq(customers.status, "active"))).limit(100), db.select({ id: vehicles.id, vehicleNo: vehicles.vehicleNo, vin: vehicles.vin, make: vehicles.make, model: vehicles.model, modelYear: vehicles.modelYear, lifecycleStatus: vehicles.lifecycleStatus }).from(vehicles).where(eq(vehicles.businessEntityId, input.businessEntityId)).limit(100)]); return { customers: customerRows, vehicles: vehicleRows }; }),
    createCustomer: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), organizationId: z.number().int().positive().optional(), nameAr: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional(), email: z.string().email().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const organizationId = input.organizationId ?? 1; const customerNo = await nextRasdNumber({ organizationId, entityKey: "customer" }); await db.insert(customers).values({ organizationId, businessEntityId: input.businessEntityId, customerNo, nameAr: input.nameAr, phone: input.phone, email: input.email }); return { customerNo }; }),
    createVehicle: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), organizationId: z.number().int().positive().optional(), vin: z.string().trim().min(8).max(64), make: z.string().trim().min(2).max(80), model: z.string().trim().min(1).max(80), modelYear: z.number().int().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const organizationId = input.organizationId ?? 1; const vehicleNo = await nextRasdNumber({ organizationId, entityKey: "vehicle" }); await db.insert(vehicles).values({ organizationId, businessEntityId: input.businessEntityId, vin: input.vin, make: input.make, model: input.model, modelYear: input.modelYear, vehicleNo }); return { vehicleNo }; }),
    createProduct: entityScopedProcedure.input(z.object({ organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), sku: z.string().trim().min(1).max(80), nameAr: z.string().trim().min(2).max(180), category: z.string().trim().max(80).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const productNo = await nextRasdNumber({ organizationId: input.organizationId, entityKey: "product" }); await db.insert(products).values({ ...input, productNo }); return { productNo }; }),
  }),
  sales: router({
    dashboard: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), branchId: z.number().int().positive().optional() })).query(async ({ input }) => { const db = await getDb(); if (!db) return { readyVehicles: 0, reservedVehicles: 0, openLeads: 0, pendingQuotes: 0, openOrders: 0, receivablesMinor: 0 }; const branchFilter = input.branchId ? eq(salesVehicles.branchId, input.branchId) : undefined; const [ready, reserved, leads, quotes, orders, receivables] = await Promise.all([db.select({ count: sql<number>`count(*)` }).from(salesVehicles).where(and(eq(salesVehicles.businessEntityId, input.businessEntityId), eq(salesVehicles.status, "ready"), branchFilter)), db.select({ count: sql<number>`count(*)` }).from(salesVehicles).where(and(eq(salesVehicles.businessEntityId, input.businessEntityId), eq(salesVehicles.status, "reserved"), branchFilter)), db.select({ count: sql<number>`count(*)` }).from(salesLeads).where(and(eq(salesLeads.businessEntityId, input.businessEntityId), eq(salesLeads.status, "new"))), db.select({ count: sql<number>`count(*)` }).from(salesQuotations).where(and(eq(salesQuotations.businessEntityId, input.businessEntityId), eq(salesQuotations.status, "pending_approval"))), db.select({ count: sql<number>`count(*)` }).from(salesOrders).where(and(eq(salesOrders.businessEntityId, input.businessEntityId), eq(salesOrders.status, "approved"))), db.select({ total: sql<number>`coalesce(sum(${salesInvoices.totalMinor} - ${salesInvoices.paidMinor}),0)` }).from(salesInvoices).where(and(eq(salesInvoices.businessEntityId, input.businessEntityId), sql`${salesInvoices.status} <> 'void'`))]); return { readyVehicles: Number(ready[0]?.count ?? 0), reservedVehicles: Number(reserved[0]?.count ?? 0), openLeads: Number(leads[0]?.count ?? 0), pendingQuotes: Number(quotes[0]?.count ?? 0), openOrders: Number(orders[0]?.count ?? 0), receivablesMinor: Number(receivables[0]?.total ?? 0) }; }),
    vehicles: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), branchId: z.number().int().positive().optional() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(salesVehicles).where(and(eq(salesVehicles.businessEntityId, input.businessEntityId), input.branchId ? eq(salesVehicles.branchId, input.branchId) : undefined)).limit(100); }),
    quotations: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(salesQuotations).where(eq(salesQuotations.businessEntityId, input.businessEntityId)).limit(100); }),
    createCustomer: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), nameAr: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional(), email: z.string().email().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const customerNo = `SALES-CUS-${nanoid(8).toUpperCase()}`; await db.insert(salesCustomers).values({ ...input, customerNo }); return { customerNo }; }),
    createVehicle: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), vin: z.string().trim().min(8).max(64), make: z.string().trim().min(2).max(80), model: z.string().trim().min(1).max(80), modelYear: z.number().int().optional(), currency: z.string().length(3).default("OMR") })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const vehicleNo = `SALES-VH-${new Date().getFullYear()}-${nanoid(7).toUpperCase()}`; await db.insert(salesVehicles).values({ ...input, vehicleNo }); return { vehicleNo }; }),
    createQuotation: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), targetPriceMinor: z.number().int().positive(), discountMinor: z.number().int().min(0).default(0), taxMinor: z.number().int().min(0).default(0), validUntil: z.coerce.date(), correlationId: z.string().trim().min(8).max(80) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [customer, vehicle] = await Promise.all([db.select({ id: salesCustomers.id, businessEntityId: salesCustomers.businessEntityId }).from(salesCustomers).where(eq(salesCustomers.id, input.customerId)).limit(1), db.select({ id: salesVehicles.id, businessEntityId: salesVehicles.businessEntityId }).from(salesVehicles).where(eq(salesVehicles.id, input.vehicleId)).limit(1)]); if (!customer[0] || !vehicle[0] || customer[0].businessEntityId !== input.businessEntityId || vehicle[0].businessEntityId !== input.businessEntityId || customer[0].businessEntityId !== vehicle[0].businessEntityId) throw new TRPCError({ code: "FORBIDDEN", message: "Customer and vehicle must belong to the same sales entity" }); const quotationNo = `SALES-Q-${nanoid(8).toUpperCase()}`; const totalMinor = input.targetPriceMinor - input.discountMinor + input.taxMinor; const status = quotationStatus(input.targetPriceMinor, input.discountMinor); const inserted = await db.insert(salesQuotations).values({ ...input, quotationNo, totalMinor, status }); if (status === "pending_approval") await db.insert(salesQuotationApprovals).values({ businessEntityId: input.businessEntityId, quotationId: Number(inserted[0].insertId), thresholdRateBps: 1000, discountMinor: input.discountMinor, status: "pending" }); await createAuditLog({ organizationId: 1, userId: 1, action: "quotation.created", systemKey: "auto-sales", entityType: "quotation", entityId: quotationNo }); await enqueueEvent({ eventId: nanoid(16), eventType: "QuotationCreated", sourceSystem: "AUTO_SALES", entityType: "quotation", entityId: quotationNo, correlationId: input.correlationId, payload: JSON.stringify({ businessEntityId: input.businessEntityId, status, totalMinor }), idempotencyKey: `sales-quotation-${quotationNo}`, requestHash: createHash("sha256").update(`${quotationNo}:${status}:${totalMinor}`).digest("hex") }); return { quotationNo, totalMinor, status }; }),
    reserveVehicle: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), amountMinor: z.number().int().min(0), startsAt: z.coerce.date(), expiresAt: z.coerce.date(), idempotencyKey: z.string().trim().min(8).max(100) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); return db.transaction(async (tx) => { const existing = await tx.select({ reservationNo: salesReservations.reservationNo }).from(salesReservations).where(and(eq(salesReservations.businessEntityId, input.businessEntityId), eq(salesReservations.idempotencyKey, input.idempotencyKey))).limit(1); if (existing[0]) return { reservationNo: existing[0].reservationNo, replay: true as const }; const customer = await tx.select({ id: salesCustomers.id }).from(salesCustomers).where(and(eq(salesCustomers.id, input.customerId), eq(salesCustomers.businessEntityId, input.businessEntityId))).limit(1); if (!customer[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Customer is outside the sales entity scope" }); const vehicleUpdate = await tx.update(salesVehicles).set({ status: "reserved" }).where(and(eq(salesVehicles.id, input.vehicleId), eq(salesVehicles.businessEntityId, input.businessEntityId), eq(salesVehicles.status, "ready"))); if (!vehicleUpdate[0].affectedRows || !canReserveVehicle("ready")) throw new TRPCError({ code: "CONFLICT", message: "Vehicle is not available for reservation" }); const reservationNo = `SALES-RES-${nanoid(8).toUpperCase()}`; await tx.insert(salesReservations).values({ ...input, reservationNo, status: "confirmed" }); await enqueueEvent({ eventId: nanoid(16), eventType: "VehicleReserved", sourceSystem: "AUTO_SALES", entityType: "vehicle", entityId: String(input.vehicleId), correlationId: nanoid(12), payload: JSON.stringify({ businessEntityId: input.businessEntityId, reservationNo, customerId: input.customerId }), idempotencyKey: `sales-reservation-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(`${input.businessEntityId}:${input.vehicleId}:${input.idempotencyKey}`).digest("hex") }); return { reservationNo, replay: false as const }; }); }),
    postPayment: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), invoiceId: z.number().int().positive(), paymentNo: z.string().trim().min(3).max(80), amountMinor: z.number().int().positive(), method: z.string().trim().min(2).max(40), idempotencyKey: z.string().trim().min(8).max(100) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const existing = await db.select({ paymentNo: salesPayments.paymentNo }).from(salesPayments).where(and(eq(salesPayments.businessEntityId, input.businessEntityId), eq(salesPayments.idempotencyKey, input.idempotencyKey))).limit(1); if (existing[0]) return { paymentNo: existing[0].paymentNo, replay: true as const }; const invoice = await db.select({ id: salesInvoices.id }).from(salesInvoices).where(and(eq(salesInvoices.id, input.invoiceId), eq(salesInvoices.businessEntityId, input.businessEntityId))).limit(1); if (!invoice[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Invoice is outside the sales entity scope" }); await db.insert(salesPayments).values({ ...input, status: "confirmed", paidAt: new Date() }); await enqueueEvent({ eventId: nanoid(16), eventType: "PaymentReceived", sourceSystem: "AUTO_SALES", entityType: "payment", entityId: input.paymentNo, correlationId: nanoid(12), payload: JSON.stringify({ businessEntityId: input.businessEntityId, invoiceId: input.invoiceId, amountMinor: input.amountMinor, method: input.method }), idempotencyKey: `sales-payment-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(`${input.businessEntityId}:${input.invoiceId}:${input.amountMinor}:${input.idempotencyKey}`).digest("hex") }); return { paymentNo: input.paymentNo, replay: false as const }; }),
    deliverVehicle: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), salesOrderId: z.number().int().positive(), vehicleId: z.number().int().positive(), deliveryNo: z.string().trim().min(3).max(80), recipientName: z.string().trim().min(2).max(180), odometer: z.number().int().min(0).optional(), checklistJson: z.string().max(8000) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [vehicle, order] = await Promise.all([db.select({ status: salesVehicles.status }).from(salesVehicles).where(and(eq(salesVehicles.id, input.vehicleId), eq(salesVehicles.businessEntityId, input.businessEntityId))).limit(1), db.select({ status: salesOrders.status }).from(salesOrders).where(and(eq(salesOrders.id, input.salesOrderId), eq(salesOrders.businessEntityId, input.businessEntityId))).limit(1)]); if (!vehicle[0] || !order[0] || !canDeliverVehicle(vehicle[0].status, order[0].status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Vehicle must be reserved and financially approved before delivery" }); await db.insert(salesDeliveries).values({ ...input, status: "delivered", deliveredAt: new Date() }); await db.update(salesVehicles).set({ status: "delivered" }).where(and(eq(salesVehicles.id, input.vehicleId), eq(salesVehicles.businessEntityId, input.businessEntityId))); await enqueueEvent({ eventId: nanoid(16), eventType: "VehicleDelivered", sourceSystem: "AUTO_SALES", entityType: "vehicle", entityId: String(input.vehicleId), correlationId: nanoid(12), payload: JSON.stringify({ businessEntityId: input.businessEntityId, salesOrderId: input.salesOrderId, deliveryNo: input.deliveryNo }), idempotencyKey: `sales-delivery-${input.businessEntityId}-${input.deliveryNo}`, requestHash: createHash("sha256").update(`${input.businessEntityId}:${input.salesOrderId}:${input.vehicleId}:${input.deliveryNo}`).digest("hex") }); return { deliveryNo: input.deliveryNo, status: "delivered" as const }; }),
  }),
  parts: router({
    dashboard: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return { productCount: 0, stockValueMinor: 0, lowStock: 0, outOfStock: 0, reservedQty: 0, receivablesMinor: 0 }; const [stock, productsCount, receivables] = await Promise.all([db.select({ stockValueMinor: sql<number>`coalesce(sum(${partsInventory.availableQty} * ${partsInventory.averageCostMinor}),0)`, lowStock: sql<number>`coalesce(sum(case when ${partsInventory.availableQty} <= ${partsInventory.reorderPoint} and ${partsInventory.availableQty} > 0 then 1 else 0 end),0)`, outOfStock: sql<number>`coalesce(sum(case when ${partsInventory.availableQty} = 0 then 1 else 0 end),0)`, reservedQty: sql<number>`coalesce(sum(${partsInventory.reservedQty}),0)` }).from(partsInventory).where(eq(partsInventory.businessEntityId, input.businessEntityId)), db.select({ count: sql<number>`count(*)` }).from(partsProducts).where(eq(partsProducts.businessEntityId, input.businessEntityId)), db.select({ total: sql<number>`coalesce(sum(${partsInvoices.totalMinor} - ${partsInvoices.paidMinor}),0)` }).from(partsInvoices).where(and(eq(partsInvoices.businessEntityId, input.businessEntityId), sql`${partsInvoices.status} <> 'void'`))]); return { productCount: Number(productsCount[0]?.count ?? 0), stockValueMinor: Number(stock[0]?.stockValueMinor ?? 0), lowStock: Number(stock[0]?.lowStock ?? 0), outOfStock: Number(stock[0]?.outOfStock ?? 0), reservedQty: Number(stock[0]?.reservedQty ?? 0), receivablesMinor: Number(receivables[0]?.total ?? 0) }; }),
    products: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select({ id: partsProducts.id, sku: partsProducts.sku, nameAr: partsProducts.nameAr, brand: partsProducts.brand, barcode: partsProducts.barcode, oemNo: partsProducts.oemNo, costMinor: partsProducts.costMinor, retailPriceMinor: partsProducts.retailPriceMinor, status: partsProducts.status }).from(partsProducts).where(eq(partsProducts.businessEntityId, input.businessEntityId)).limit(100); }),
    reserveStock: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), salesOrderId: z.number().int().positive(), warehouseId: z.number().int().positive(), productId: z.number().int().positive(), quantity: z.number().int().positive(), idempotencyKey: z.string().trim().min(8).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); return db.transaction(async (tx) => { const replay = await tx.select({ id: partsReservations.id }).from(partsReservations).where(and(eq(partsReservations.businessEntityId, input.businessEntityId), eq(partsReservations.idempotencyKey, input.idempotencyKey))).limit(1); if (replay[0]) return { reservationId: replay[0].id, replay: true as const }; const balance = await tx.update(partsInventory).set({ availableQty: sql`${partsInventory.availableQty} - ${input.quantity}`, reservedQty: sql`${partsInventory.reservedQty} + ${input.quantity}` }).where(and(eq(partsInventory.businessEntityId, input.businessEntityId), eq(partsInventory.warehouseId, input.warehouseId), eq(partsInventory.productId, input.productId), sql`${partsInventory.availableQty} >= ${input.quantity}`)); if (!balance[0].affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Insufficient entity-scoped stock" }); const inserted = await tx.insert(partsReservations).values({ ...input, status: "confirmed" }); await tx.insert(partsInventoryMovements).values({ businessEntityId: input.businessEntityId, warehouseId: input.warehouseId, productId: input.productId, movementType: "reservation", quantity: input.quantity, sourceType: "sales_order", sourceId: String(input.salesOrderId), idempotencyKey: `movement-${input.idempotencyKey}` }); await enqueueEvent({ eventId: nanoid(16), eventType: "PartReserved", sourceSystem: "SPARE_PARTS", entityType: "product", entityId: String(input.productId), correlationId: nanoid(12), payload: JSON.stringify(input), idempotencyKey: `parts-reservation-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(JSON.stringify(input)).digest("hex") }); return { reservationId: Number(inserted[0].insertId), replay: false as const }; }); }),
    issueStock: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), reservationId: z.number().int().positive(), warehouseId: z.number().int().positive(), productId: z.number().int().positive(), quantity: z.number().int().positive(), idempotencyKey: z.string().trim().min(8).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const reservation = await db.select().from(partsReservations).where(and(eq(partsReservations.id, input.reservationId), eq(partsReservations.businessEntityId, input.businessEntityId), eq(partsReservations.status, "confirmed"))).limit(1); if (!reservation[0] || reservation[0].productId !== input.productId || reservation[0].warehouseId !== input.warehouseId) throw new TRPCError({ code: "FORBIDDEN", message: "Reservation is outside the entity or stock scope" }); await db.update(partsInventory).set({ reservedQty: sql`${partsInventory.reservedQty} - ${input.quantity}` }).where(and(eq(partsInventory.businessEntityId, input.businessEntityId), eq(partsInventory.warehouseId, input.warehouseId), eq(partsInventory.productId, input.productId), sql`${partsInventory.reservedQty} >= ${input.quantity}`)); await db.update(partsReservations).set({ status: "issued" }).where(eq(partsReservations.id, input.reservationId)); await db.insert(partsInventoryMovements).values({ businessEntityId: input.businessEntityId, warehouseId: input.warehouseId, productId: input.productId, movementType: "issue", quantity: input.quantity, sourceType: "reservation", sourceId: String(input.reservationId), idempotencyKey: input.idempotencyKey }); return { issued: true as const }; }),
    postPayment: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), invoiceId: z.number().int().positive(), paymentNo: z.string().trim().min(3).max(80), amountMinor: z.number().int().positive(), idempotencyKey: z.string().trim().min(8).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const replay = await db.select({ paymentNo: partsPayments.paymentNo }).from(partsPayments).where(and(eq(partsPayments.businessEntityId, input.businessEntityId), eq(partsPayments.idempotencyKey, input.idempotencyKey))).limit(1); if (replay[0]) return { paymentNo: replay[0].paymentNo, replay: true as const }; const invoice = await db.select({ id: partsInvoices.id }).from(partsInvoices).where(and(eq(partsInvoices.id, input.invoiceId), eq(partsInvoices.businessEntityId, input.businessEntityId))).limit(1); if (!invoice[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Invoice is outside the parts entity scope" }); await db.insert(partsPayments).values({ ...input, status: "confirmed" }); await enqueueEvent({ eventId: nanoid(16), eventType: "PartsPaymentReceived", sourceSystem: "SPARE_PARTS", entityType: "payment", entityId: input.paymentNo, correlationId: nanoid(12), payload: JSON.stringify(input), idempotencyKey: `parts-payment-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(JSON.stringify(input)).digest("hex") }); return { paymentNo: input.paymentNo, replay: false as const }; }),
  }),
  workshop: router({
    dashboard: workshopLegacyScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), branchId: z.number().int().positive().optional() })).query(async ({ input }) => { const db = await getDb(); if (!db) return { appointmentsToday: 0, openWorkOrders: 0, waitingApproval: 0, waitingParts: 0, receivablesMinor: 0 }; const [appointments, orders, invoices] = await Promise.all([db.select({ count: sql<number>`count(*)` }).from(workshopAppointments).where(eq(workshopAppointments.businessEntityId, input.businessEntityId)), db.select({ open: sql<number>`sum(case when ${workshopWorkOrders.status} in ('approved','in_progress','waiting_parts','waiting_approval','quality_check','ready') then 1 else 0 end)`, approval: sql<number>`sum(case when ${workshopWorkOrders.status}='waiting_approval' then 1 else 0 end)`, parts: sql<number>`sum(case when ${workshopWorkOrders.status}='waiting_parts' then 1 else 0 end)` }).from(workshopWorkOrders).where(eq(workshopWorkOrders.businessEntityId, input.businessEntityId)), db.select({ due: sql<number>`coalesce(sum(${workshopInvoices.totalMinor}-${workshopInvoices.paidMinor}),0)` }).from(workshopInvoices).where(and(eq(workshopInvoices.businessEntityId, input.businessEntityId), sql`${workshopInvoices.status}<>'void'`))]); return { appointmentsToday: Number(appointments[0]?.count ?? 0), openWorkOrders: Number(orders[0]?.open ?? 0), waitingApproval: Number(orders[0]?.approval ?? 0), waitingParts: Number(orders[0]?.parts ?? 0), receivablesMinor: Number(invoices[0]?.due ?? 0) }; }),
    workOrders: workshopLegacyScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(workshopWorkOrders).where(eq(workshopWorkOrders.businessEntityId, input.businessEntityId)).limit(100); }),
    createAppointment: workshopLegacyScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), customerId: z.number().int().positive(), vehicleId: z.number().int().positive(), scheduledAt: z.coerce.date(), serviceType: z.string().trim().min(2).max(120) })).mutation(async ({ input, ctx }) => { await assertWorkshopPermission(ctx.user, input.businessEntityId, "receive"); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const [customer, vehicle] = await Promise.all([db.select({ entity: workshopCustomers.businessEntityId }).from(workshopCustomers).where(eq(workshopCustomers.id, input.customerId)).limit(1), db.select({ entity: workshopVehicles.businessEntityId }).from(workshopVehicles).where(eq(workshopVehicles.id, input.vehicleId)).limit(1)]); if (customer[0]?.entity !== input.businessEntityId || vehicle[0]?.entity !== input.businessEntityId) throw new TRPCError({ code: "FORBIDDEN", message: "Customer and vehicle must belong to the workshop entity" }); const appointmentNo = `WS-APT-${nanoid(8).toUpperCase()}`; await db.insert(workshopAppointments).values({ ...input, appointmentNo }); await enqueueEvent({ eventId: nanoid(16), eventType: "AppointmentCreated", sourceSystem: "WORKSHOP", entityType: "appointment", entityId: appointmentNo, correlationId: nanoid(12), payload: JSON.stringify(input), idempotencyKey: `workshop-appointment-${appointmentNo}`, requestHash: createHash("sha256").update(JSON.stringify(input)).digest("hex") }); return { appointmentNo }; }),
    requestParts: workshopLegacyScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), workOrderId: z.number().int().positive(), targetPartsEntityId: z.number().int().positive(), payloadJson: z.string().min(2).max(12000), idempotencyKey: z.string().trim().min(8).max(120) })).mutation(async ({ input, ctx }) => { await assertWorkshopPermission(ctx.user, input.businessEntityId, "parts"); const db = await getDb(); if (!db) throw new Error("database_unavailable"); const replay = await db.select({ requestNo: workshopPartsRequests.requestNo }).from(workshopPartsRequests).where(and(eq(workshopPartsRequests.businessEntityId, input.businessEntityId), eq(workshopPartsRequests.idempotencyKey, input.idempotencyKey))).limit(1); if (replay[0]) return { requestNo: replay[0].requestNo, replay: true as const }; const order = await db.select({ id: workshopWorkOrders.id }).from(workshopWorkOrders).where(and(eq(workshopWorkOrders.id, input.workOrderId), eq(workshopWorkOrders.businessEntityId, input.businessEntityId))).limit(1); if (!order[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Work order is outside the workshop entity" }); const requestNo = `WS-PR-${nanoid(8).toUpperCase()}`; await db.insert(workshopPartsRequests).values({ ...input, requestNo, status: "sent" }); await enqueueEvent({ eventId: nanoid(16), eventType: "PartsRequested", sourceSystem: "WORKSHOP", entityType: "work_order", entityId: String(input.workOrderId), correlationId: nanoid(12), payload: input.payloadJson, idempotencyKey: `workshop-parts-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(input.payloadJson).digest("hex") }); return { requestNo, replay: false as const }; }),
  }),
  rental: router({
    dashboard: rentalScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return { fleetSize: 0, available: 0, rented: 0, reserved: 0, maintenance: 0, overdueMaintenance: 0, activeContracts: 0, receivablesMinor: 0 }; const [fleet, maintenance, contracts, invoices] = await Promise.all([db.select({ total: sql<number>`count(*)`, available: sql<number>`sum(case when ${rentalVehicles.status}='available' then 1 else 0 end)`, rented: sql<number>`sum(case when ${rentalVehicles.status}='rented' then 1 else 0 end)`, reserved: sql<number>`sum(case when ${rentalVehicles.status}='reserved' then 1 else 0 end)`, maintenance: sql<number>`sum(case when ${rentalVehicles.status}='maintenance' then 1 else 0 end)` }).from(rentalVehicles).where(eq(rentalVehicles.businessEntityId, input.businessEntityId)), db.select({ overdue: sql<number>`sum(case when ${rentalMaintenanceProfiles.status}='overdue' then 1 else 0 end)` }).from(rentalMaintenanceProfiles).where(eq(rentalMaintenanceProfiles.businessEntityId, input.businessEntityId)), db.select({ active: sql<number>`sum(case when ${rentalContracts.status} in ('active','extended') then 1 else 0 end)` }).from(rentalContracts).where(eq(rentalContracts.businessEntityId, input.businessEntityId)), db.select({ due: sql<number>`coalesce(sum(${rentalInvoices.totalMinor}-${rentalInvoices.paidMinor}),0)` }).from(rentalInvoices).where(and(eq(rentalInvoices.businessEntityId, input.businessEntityId), sql`${rentalInvoices.status}<>'void'`))]); return { fleetSize: Number(fleet[0]?.total ?? 0), available: Number(fleet[0]?.available ?? 0), rented: Number(fleet[0]?.rented ?? 0), reserved: Number(fleet[0]?.reserved ?? 0), maintenance: Number(fleet[0]?.maintenance ?? 0), overdueMaintenance: Number(maintenance[0]?.overdue ?? 0), activeContracts: Number(contracts[0]?.active ?? 0), receivablesMinor: Number(invoices[0]?.due ?? 0) }; }),
    vehicles: rentalScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(rentalVehicles).where(eq(rentalVehicles.businessEntityId, input.businessEntityId)).limit(100); }),
    createReservation: rentalScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), customerId: z.number().int().positive(), vehicleId: z.number().int().positive().optional(), vehicleClass: z.string().min(1).max(60), ratePlanId: z.number().int().positive(), startsAt: z.coerce.date(), endsAt: z.coerce.date(), depositMinor: z.number().int().nonnegative().default(0), totalMinor: z.number().int().positive(), idempotencyKey: z.string().min(8).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Rental end must be after start" }); const replay = await db.select({ reservationNo: rentalReservations.reservationNo }).from(rentalReservations).where(and(eq(rentalReservations.businessEntityId, input.businessEntityId), eq(rentalReservations.idempotencyKey, input.idempotencyKey))).limit(1); if (replay[0]) return { reservationNo: replay[0].reservationNo, replay: true as const }; const customer = await db.select({ entity: rentalCustomers.businessEntityId }).from(rentalCustomers).where(eq(rentalCustomers.id, input.customerId)).limit(1); if (customer[0]?.entity !== input.businessEntityId) throw new TRPCError({ code: "FORBIDDEN", message: "Customer is outside the rental entity" }); if (input.vehicleId) { const conflict = await db.select({ id: rentalReservations.id }).from(rentalReservations).where(and(eq(rentalReservations.businessEntityId, input.businessEntityId), eq(rentalReservations.vehicleId, input.vehicleId), sql`${rentalReservations.status} in ('pending','confirmed')`, sql`${rentalReservations.startsAt} < ${input.endsAt}`, sql`${rentalReservations.endsAt} > ${input.startsAt}`)).limit(1); if (conflict[0]) throw new TRPCError({ code: "CONFLICT", message: "Vehicle is unavailable for the selected period" }); } const reservationNo = `RENT-RES-${nanoid(8).toUpperCase()}`; await db.insert(rentalReservations).values({ ...input, reservationNo, status: "confirmed" }); await enqueueEvent({ eventId: nanoid(16), eventType: "ReservationCreated", sourceSystem: "RENTAL", entityType: "reservation", entityId: reservationNo, correlationId: nanoid(12), payload: JSON.stringify(input), idempotencyKey: `rental-reservation-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(JSON.stringify(input)).digest("hex") }); return { reservationNo, replay: false as const }; }),
    recordOdometer: rentalScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), vehicleId: z.number().int().positive(), reading: z.number().int().nonnegative(), source: z.string().min(2).max(60) })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const vehicle = await db.select({ odometer: rentalVehicles.odometer }).from(rentalVehicles).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId))).limit(1); if (!vehicle[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle is outside the rental entity" }); if (input.reading < vehicle[0].odometer) throw new TRPCError({ code: "CONFLICT", message: "Odometer cannot decrease" }); await db.insert(rentalOdometerReadings).values({ ...input, recordedBy: ctx.user.id }); await db.update(rentalVehicles).set({ odometer: input.reading }).where(eq(rentalVehicles.id, input.vehicleId)); return { recorded: true as const }; }),
    requestMaintenance: rentalScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), vehicleId: z.number().int().positive(), targetWorkshopEntityId: z.number().int().positive(), payloadJson: z.string().min(2).max(12000), idempotencyKey: z.string().min(8).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const replay = await db.select({ requestNo: rentalMaintenanceRequests.requestNo }).from(rentalMaintenanceRequests).where(and(eq(rentalMaintenanceRequests.businessEntityId, input.businessEntityId), eq(rentalMaintenanceRequests.idempotencyKey, input.idempotencyKey))).limit(1); if (replay[0]) return { requestNo: replay[0].requestNo, replay: true as const }; const vehicle = await db.select({ id: rentalVehicles.id }).from(rentalVehicles).where(and(eq(rentalVehicles.id, input.vehicleId), eq(rentalVehicles.businessEntityId, input.businessEntityId))).limit(1); if (!vehicle[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle is outside the rental entity" }); const requestNo = `RENT-MNT-${nanoid(8).toUpperCase()}`; await db.insert(rentalMaintenanceRequests).values({ ...input, requestNo, status: "sent" }); await enqueueEvent({ eventId: nanoid(16), eventType: "MaintenanceRequestCreated", sourceSystem: "RENTAL", entityType: "vehicle", entityId: String(input.vehicleId), correlationId: nanoid(12), payload: input.payloadJson, idempotencyKey: `rental-maintenance-${input.businessEntityId}-${input.idempotencyKey}`, requestHash: createHash("sha256").update(input.payloadJson).digest("hex") }); return { requestNo, replay: false as const }; }),
  }),
  numbering: router({
    next: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityKey: z.enum(["customer", "vehicle", "product", "invoice", "workorder"]) })).query(({ input }) => nextRasdNumber(input)),
  }),
  documents: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityType: z.string().trim().min(2).max(80).optional(), entityId: z.string().trim().min(1).max(80).optional() })).query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      return db.select({ id: documents.id, fileName: documents.fileName, mimeType: documents.mimeType, entityType: documents.entityType, entityId: documents.entityId, storageKey: documents.storageKey, createdAt: documents.createdAt }).from(documents).where(eq(documents.organizationId, input.organizationId));
    }),
    download: protectedProcedure.input(z.object({ storageKey: z.string().trim().min(1).max(400) })).query(async ({ input }) => ({ url: await storageGetSignedUrl(input.storageKey) })),
    upload: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), entityType: z.string().trim().min(2).max(80), entityId: z.string().trim().min(1).max(80), fileName: z.string().trim().min(1).max(220), mimeType: z.string().trim().min(3).max(120), contentBase64: z.string().min(1).max(8_000_000) })).mutation(async ({ input, ctx }) => {
      const db = await getDb(); if (!db) throw new Error("database_unavailable");
      const stored = await storagePut(`rasd/${input.organizationId}/${input.entityType}/${input.fileName}`, Buffer.from(input.contentBase64, "base64"), input.mimeType);
      await db.insert(documents).values({ organizationId: input.organizationId, entityType: input.entityType, entityId: input.entityId, fileName: input.fileName, mimeType: input.mimeType, storageKey: stored.key, storageUrl: stored.url, uploadedBy: ctx.user.id });
      return { success: true, key: stored.key, url: stored.url } as const;
    }),
  }),
  erp: router({
    entities: protectedProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(businessEntities); }),
    createEntity: adminProcedure.input(z.object({ entityId: z.string().trim().min(3).max(40), code: z.string().trim().min(2).max(40), nameAr: z.string().trim().min(2).max(180), nameEn: z.string().trim().max(180).optional(), entityType: z.enum(["company", "subsidiary", "business_project", "business_activity", "investment_vehicle", "future"]), currency: z.string().trim().length(3).default("OMR"), timezone: z.string().trim().min(3).max(64).default("Asia/Muscat") })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); await db.insert(businessEntities).values(input); return { entityId: input.entityId, created: true }; }),
    accountingBooks: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; return db.select().from(accountingBooks).where(eq(accountingBooks.businessEntityId, input.businessEntityId)); }),
    createJournal: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), entryNo: z.string().trim().min(3).max(60), sourceSystem: z.string().trim().min(2).max(60), sourceType: z.string().trim().min(2).max(60), sourceId: z.string().trim().min(1).max(80), currency: z.string().trim().length(3), correlationId: z.string().trim().min(8).max(80), lines: z.array(z.object({ accountId: z.number().int().positive(), debitMinor: z.number().int().min(0), creditMinor: z.number().int().min(0), description: z.string().max(255).optional() })).min(2) })).mutation(async ({ input }) => { const balance = validateBalancedJournal(input.lines); const debit = balance.debitMinor; const credit = balance.creditMinor; if (!balance.valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Debit and credit totals must match and be positive" }); const db = await getDb(); if (!db) throw new Error("database_unavailable"); return db.transaction(async (tx) => { const inserted = await tx.insert(journalEntries).values({ businessEntityId: input.businessEntityId, entryNo: input.entryNo, sourceSystem: input.sourceSystem, sourceType: input.sourceType, sourceId: input.sourceId, correlationId: input.correlationId, status: "validated" }); const journalEntryId = Number(inserted[0].insertId); await tx.insert(journalLines).values(input.lines.map((line) => ({ ...line, journalEntryId, currency: input.currency }))); return { journalEntryId, status: "validated" as const, debitMinor: debit, creditMinor: credit }; }); }),
    postJournal: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), journalEntryId: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const result = await db.update(journalEntries).set({ status: "posted", postedAt: new Date() }).where(and(eq(journalEntries.id, input.journalEntryId), eq(journalEntries.businessEntityId, input.businessEntityId), eq(journalEntries.status, "validated"))); if (!result[0].affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Only a validated journal in the selected entity can be posted" }); return { journalEntryId: input.journalEntryId, status: "posted" as const }; }),
    reverseJournal: entityScopedProcedure.input(z.object({ businessEntityId: z.number().int().positive(), journalEntryId: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); const result = await db.update(journalEntries).set({ status: "reversed" }).where(and(eq(journalEntries.id, input.journalEntryId), eq(journalEntries.businessEntityId, input.businessEntityId), eq(journalEntries.status, "posted"))); if (!result[0].affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Only a posted journal in the selected entity can be reversed" }); return { journalEntryId: input.journalEntryId, status: "reversed" as const }; }),
    portfolio: protectedProcedure.input(z.object({ periodCode: z.string().trim().min(4).max(20) })).query(async ({ input }) => { const db = await getDb(); if (!db) return { periodCode: input.periodCode, entities: [], totals: { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0, roiBps: 0 } }; const rows = await db.select().from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode)); return { periodCode: input.periodCode, entities: rows, totals: rows.reduce((a, r) => ({ revenueMinor: a.revenueMinor + r.revenueMinor, profitMinor: a.profitMinor + r.profitMinor, capitalInvestedMinor: a.capitalInvestedMinor + r.capitalInvestedMinor, roiBps: a.roiBps + r.roiBps }), { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0, roiBps: 0 }) }; }),
    executiveOverview: protectedProcedure.input(z.object({ periodCode: z.string().trim().min(4).max(20) })).query(async ({ input }) => { const db = await getDb(); if (!db) return { periodCode: input.periodCode, portfolio: { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0 }, integrations: { pending: 0, failed: 0 }, tasks: { open: 0 } }; const [portfolio, integrations, tasksOpen] = await Promise.all([db.select({ revenueMinor: sql<number>`coalesce(sum(${portfolioMetrics.revenueMinor}),0)`, profitMinor: sql<number>`coalesce(sum(${portfolioMetrics.profitMinor}),0)`, capitalInvestedMinor: sql<number>`coalesce(sum(${portfolioMetrics.capitalInvestedMinor}),0)` }).from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode)), db.select({ pending: sql<number>`coalesce(sum(case when ${integrationEvents.status} = 'pending' then 1 else 0 end),0)`, failed: sql<number>`coalesce(sum(case when ${integrationEvents.status} = 'failed' then 1 else 0 end),0)` }).from(integrationEvents), db.select({ open: sql<number>`coalesce(sum(case when ${tasks.status} <> 'completed' then 1 else 0 end),0)` }).from(tasks)]); return { periodCode: input.periodCode, portfolio: portfolio[0] ?? { revenueMinor: 0, profitMinor: 0, capitalInvestedMinor: 0 }, integrations: integrations[0] ?? { pending: 0, failed: 0 }, tasks: tasksOpen[0] ?? { open: 0 } }; }),
  }),
  rasd: router({
    overview: protectedProcedure.query(async () => getRasdOverview()),
    moduleRows: entityScopedProcedure.input(z.object({ path: z.string(), organizationId: z.number().int().positive(), businessEntityId: z.number().int().positive(), periodCode: z.string().trim().min(4).max(20).default("2026") })).query(async ({ input, ctx }) => {
      if (input.path === "/integrations" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "integration.read permission required" });
      const db = await getDb(); if (!db) return [];
      if (input.path === "/organization") return db.select({ code: organizations.code, nameAr: organizations.nameAr, status: organizations.status }).from(organizations).where(eq(organizations.id, input.organizationId));
      if (input.path === "/erp/entities") return db.select({ entityId: businessEntities.entityId, nameAr: businessEntities.nameAr, entityType: businessEntities.entityType, status: businessEntities.status }).from(businessEntities);
      if (input.path === "/erp/accounting") return db.select({ bookCode: accountingBooks.bookCode, nameAr: accountingBooks.nameAr, currency: accountingBooks.currency, status: accountingBooks.status }).from(accountingBooks);
      if (input.path === "/erp/portfolio") return db.select({ businessEntityId: portfolioMetrics.businessEntityId, periodCode: portfolioMetrics.periodCode, revenueMinor: portfolioMetrics.revenueMinor, profitMinor: portfolioMetrics.profitMinor }).from(portfolioMetrics).where(eq(portfolioMetrics.periodCode, input.periodCode));
      if (input.path === "/master-data") {
        const [customerRows, vehicleRows, productRows] = await Promise.all([
          db.select({ id: customers.customerNo, name: customers.nameAr, category: sql<string>`'عميل'`, owner: sql<string>`'الهوية المركزية'` }).from(customers).where(and(eq(customers.organizationId, input.organizationId), eq(customers.businessEntityId, input.businessEntityId))).limit(50),
          db.select({ id: vehicles.vehicleNo, name: sql<string>`concat(${vehicles.make}, ' ', ${vehicles.model})`, category: sql<string>`'مركبة'`, owner: sql<string>`'الهوية المركزية'` }).from(vehicles).where(and(eq(vehicles.organizationId, input.organizationId), eq(vehicles.businessEntityId, input.businessEntityId))).limit(50),
          db.select({ id: products.productNo, name: products.nameAr, category: sql<string>`'منتج'`, owner: sql<string>`'الهوية المركزية'` }).from(products).where(and(eq(products.organizationId, input.organizationId), eq(products.businessEntityId, input.businessEntityId))).limit(50),
        ]); return [...customerRows, ...vehicleRows, ...productRows];
      }
      if (input.path === "/integrations") return db.select({ eventType: integrationEvents.eventType, sourceSystem: integrationEvents.sourceSystem, status: integrationEvents.status, retryCount: integrationEvents.retryCount }).from(integrationEvents).limit(50);
      if (input.path === "/tasks") return db.select({ titleAr: tasks.titleAr, taskType: tasks.taskType, priority: tasks.priority, status: tasks.status }).from(tasks).where(eq(tasks.organizationId, input.organizationId)).limit(50);
      if (input.path === "/workflows") return db.select({ workflowKey: workflows.workflowKey, nameAr: workflows.nameAr, status: workflows.status }).from(workflows).where(eq(workflows.organizationId, input.organizationId)).limit(50);
      if (input.path === "/documents") return db.select({ fileName: documents.fileName, entityType: documents.entityType, entityId: documents.entityId, mimeType: documents.mimeType }).from(documents).where(eq(documents.organizationId, input.organizationId)).limit(50);
      if (input.path === "/audit") return db.select({ action: auditLogs.action, systemKey: auditLogs.systemKey, entityId: auditLogs.entityId, result: sql<string>`'ناجح'` }).from(auditLogs).where(eq(auditLogs.organizationId, input.organizationId)).limit(50);
      return [];
    }),
    intakeEvent: adminProcedure.input(z.object({
      eventId: z.string().trim().min(8).max(80), eventType: z.string().trim().min(3).max(100),
      sourceSystem: z.string().trim().min(2).max(48), entityType: z.string().trim().min(2).max(80),
      entityId: z.string().trim().min(1).max(80), payload: z.record(z.string(), z.unknown()).default({}), correlationId: correlationSchema, idempotencyKey: z.string().trim().min(8).max(160),
    })).mutation(async ({ input, ctx }) => {
      const correlationId = input.correlationId ?? nanoid(16);
      const payload = JSON.stringify(input.payload);
      const requestHash = createHash("sha256").update(`${input.eventId}:${input.eventType}:${payload}`).digest("hex");
      const result = await enqueueEvent({ ...input, correlationId, payload, requestHash });
      if (result.accepted) await createAuditLog({ userId: ctx.user.id, systemKey: "integration", entityType: "event", entityId: input.eventId, action: "enqueue", correlationId, newValue: JSON.stringify({ eventType: input.eventType }) });
      return { ...result, correlationId };
    }),
  }),
});
export type AppRouter = typeof appRouter;
