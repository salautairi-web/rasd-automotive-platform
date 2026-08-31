import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  centralDataMappings,
  centralDuplicateCases,
  centralGovernanceAudit,
  centralInterEntityApprovals,
  centralInterEntityDisputes,
  centralInterEntityLines,
  centralInterEntityMatches,
  centralInterEntitySettlements,
  centralInterEntityTransactions,
  centralReferenceRegistry,
  governancePolicies,
} from "../drizzle/schema";
import { canTransitionInterEntity, matchStatus, settlementState } from "../shared/governance";
import { protectedProcedure, router } from "./_core/trpc";
import { enqueueEvent, getDb } from "./db";

function requireGovernanceAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Central governance privilege required" });
  }
}

async function writeAudit(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  action: string,
  resourceType: string,
  resourceId: string,
  entityId?: number,
) {
  await db.insert(centralGovernanceAudit).values({
    userId,
    entityId,
    action,
    resourceType,
    resourceId,
    requestId: nanoid(16),
  });
}

const transactionLineSchema = z.object({
  itemType: z.string().min(2).max(80),
  sourceRecordId: z.string().min(1).max(100),
  description: z.string().min(2).max(220),
  quantity: z.number().positive(),
  unitPriceMinor: z.number().int().nonnegative(),
  taxMinor: z.number().int().nonnegative().default(0),
  referenceRegistryId: z.number().int().positive().optional(),
});

export const governanceRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    requireGovernanceAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) {
      return {
        references: 0,
        duplicates: 0,
        openTransactions: 0,
        pendingApprovals: 0,
        unmatched: 0,
        disputes: 0,
        outstandingMinor: 0,
        policies: 0,
        transactions: [],
      };
    }

    const [references, duplicates, open, approvals, unmatched, disputes, policies, outstanding] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(centralReferenceRegistry),
        db.select({ count: sql<number>`count(*)` }).from(centralDuplicateCases).where(eq(centralDuplicateCases.status, "open")),
        db.select({ count: sql<number>`count(*)` }).from(centralInterEntityTransactions).where(sql`${centralInterEntityTransactions.status} not in ('settled','cancelled')`),
        db.select({ count: sql<number>`count(*)` }).from(centralInterEntityApprovals).where(eq(centralInterEntityApprovals.decision, "pending")),
        db.select({ count: sql<number>`count(*)` }).from(centralInterEntityTransactions).where(sql`${centralInterEntityTransactions.status} in ('posted','partially_matched')`),
        db.select({ count: sql<number>`count(*)` }).from(centralInterEntityDisputes).where(eq(centralInterEntityDisputes.status, "open")),
        db.select({ count: sql<number>`count(*)` }).from(governancePolicies).where(eq(governancePolicies.status, "active")),
        db.select({ total: sql<number>`coalesce(sum(${centralInterEntityTransactions.outstandingMinor}),0)` }).from(centralInterEntityTransactions).where(sql`${centralInterEntityTransactions.status} not in ('settled','cancelled')`),
      ]);
    const transactions = await db.select().from(centralInterEntityTransactions).limit(20);

    return {
      references: Number(references[0]?.count ?? 0),
      duplicates: Number(duplicates[0]?.count ?? 0),
      openTransactions: Number(open[0]?.count ?? 0),
      pendingApprovals: Number(approvals[0]?.count ?? 0),
      unmatched: Number(unmatched[0]?.count ?? 0),
      disputes: Number(disputes[0]?.count ?? 0),
      policies: Number(policies[0]?.count ?? 0),
      outstandingMinor: Number(outstanding[0]?.total ?? 0),
      transactions,
    };
  }),

  createReference: protectedProcedure
    .input(z.object({
      referenceType: z.string().min(2).max(80),
      referenceCode: z.string().min(2).max(100),
      nameAr: z.string().min(2).max(220),
      ownerEntityId: z.number().int().positive().optional(),
      sourceSystem: z.string().min(2).max(80),
      sourceRecordId: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const inserted = await db.insert(centralReferenceRegistry).values({ ...input, effectiveFrom: new Date() });
      await writeAudit(db, ctx.user.id, "ReferenceCreated", "reference", input.referenceCode, input.ownerEntityId);
      return { id: Number(inserted[0].insertId) };
    }),

  mapReference: protectedProcedure
    .input(z.object({
      sourceEntityId: z.number().int().positive(),
      sourceSystem: z.string().min(2).max(80),
      sourceRecordId: z.string().min(1).max(100),
      referenceRegistryId: z.number().int().positive(),
      mappingType: z.enum(["exact", "probable", "manual", "merged"]),
      confidenceBps: z.number().int().min(0).max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      await db.insert(centralDataMappings).values({ ...input, approvedBy: ctx.user.id });
      return { mapped: true as const };
    }),

  createTransaction: protectedProcedure
    .input(z.object({
      transactionType: z.enum(["sale", "purchase", "service", "asset_transfer", "vehicle_transfer", "inventory_transfer", "loan", "funding"]),
      sourceEntityId: z.number().int().positive(),
      targetEntityId: z.number().int().positive(),
      sourceSystem: z.string().min(2).max(80),
      targetSystem: z.string().min(2).max(80),
      currency: z.string().length(3),
      correlationId: z.string().min(8).max(80),
      idempotencyKey: z.string().min(8).max(120),
      lines: z.array(transactionLineSchema).min(1),
    }).refine(input => input.sourceEntityId !== input.targetEntityId, "Source and target entities must differ"))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const replay = await db.select().from(centralInterEntityTransactions).where(and(
        eq(centralInterEntityTransactions.sourceEntityId, input.sourceEntityId),
        eq(centralInterEntityTransactions.idempotencyKey, input.idempotencyKey),
      )).limit(1);
      if (replay[0]) return { transactionNo: replay[0].transactionNo, replay: true as const };

      const { lines, ...header } = input;
      const grossAmountMinor = lines.reduce(
        (sum, line) => sum + Math.round(line.quantity * line.unitPriceMinor) + line.taxMinor,
        0,
      );
      const transactionNo = `IET-${nanoid(8).toUpperCase()}`;
      await db.transaction(async tx => {
        const inserted = await tx.insert(centralInterEntityTransactions).values({
          ...header,
          transactionNo,
          grossAmountMinor,
          outstandingMinor: grossAmountMinor,
          status: "pending_approval",
        });
        const transactionId = Number(inserted[0].insertId);
        await tx.insert(centralInterEntityLines).values(lines.map((line, index) => ({
          ...line,
          transactionId,
          lineNo: index + 1,
          quantity: String(line.quantity),
          lineTotalMinor: Math.round(line.quantity * line.unitPriceMinor) + line.taxMinor,
        })));
        await tx.insert(centralInterEntityApprovals).values({ transactionId, stage: 1, approverRoleKey: "central_governance" });
      });
      return { transactionNo, replay: false as const };
    }),

  approve: protectedProcedure
    .input(z.object({ transactionId: z.number().int().positive(), comment: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const [transaction] = await db.select().from(centralInterEntityTransactions).where(eq(centralInterEntityTransactions.id, input.transactionId)).limit(1);
      if (!transaction || !canTransitionInterEntity(transaction.status, "approved")) {
        throw new TRPCError({ code: "CONFLICT", message: "Invalid approval transition" });
      }
      await db.update(centralInterEntityTransactions).set({ status: "approved" }).where(eq(centralInterEntityTransactions.id, transaction.id));
      await db.update(centralInterEntityApprovals).set({ decision: "approved", approverUserId: ctx.user.id, comment: input.comment, decidedAt: new Date() }).where(and(
        eq(centralInterEntityApprovals.transactionId, transaction.id),
        eq(centralInterEntityApprovals.decision, "pending"),
      ));
      await enqueueEvent({
        eventId: nanoid(16),
        eventType: "InterEntityTransactionApproved",
        sourceSystem: "GOVERNANCE",
        entityType: "inter_entity_transaction",
        entityId: transaction.transactionNo,
        correlationId: transaction.correlationId,
        payload: JSON.stringify({ sourceEntityId: transaction.sourceEntityId, targetEntityId: transaction.targetEntityId, totalMinor: transaction.grossAmountMinor }),
        idempotencyKey: `iet-approved-${transaction.id}`,
        requestHash: transaction.idempotencyKey,
      });
      return { approved: true as const };
    }),

  match: protectedProcedure
    .input(z.object({
      transactionId: z.number().int().positive(),
      sourceDocumentId: z.string().min(1),
      targetDocumentId: z.string().min(1),
      sourceAmountMinor: z.number().int().nonnegative(),
      targetAmountMinor: z.number().int().nonnegative(),
      exchangeRate: z.number().positive().default(1),
      toleranceMinor: z.number().int().nonnegative().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const matched = matchStatus(input.sourceAmountMinor, Math.round(input.targetAmountMinor * input.exchangeRate), input.toleranceMinor);
      await db.insert(centralInterEntityMatches).values({
        transactionId: input.transactionId,
        sourceDocumentId: input.sourceDocumentId,
        targetDocumentId: input.targetDocumentId,
        sourceAmountMinor: input.sourceAmountMinor,
        targetAmountMinor: input.targetAmountMinor,
        exchangeRate: String(input.exchangeRate),
        differenceMinor: matched.difference,
        status: matched.status,
        matchedBy: ctx.user.id,
      });
      await db.update(centralInterEntityTransactions).set({ status: matched.status === "match" ? "matched" : "partially_matched" }).where(eq(centralInterEntityTransactions.id, input.transactionId));
      return matched;
    }),

  settle: protectedProcedure
    .input(z.object({
      transactionId: z.number().int().positive(),
      settlementType: z.enum(["payment", "netting", "credit_note", "debit_note"]),
      amountMinor: z.number().int().positive(),
      currency: z.string().length(3),
      sourceEventId: z.string().min(8).max(80),
    }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const [transaction] = await db.select().from(centralInterEntityTransactions).where(eq(centralInterEntityTransactions.id, input.transactionId)).limit(1);
      if (!transaction) throw new TRPCError({ code: "NOT_FOUND" });
      const next = settlementState(transaction.outstandingMinor, input.amountMinor);
      await db.insert(centralInterEntitySettlements).values({ ...input, settlementDate: new Date() });
      await db.update(centralInterEntityTransactions).set({ outstandingMinor: next.outstanding, status: next.status }).where(eq(centralInterEntityTransactions.id, transaction.id));
      await writeAudit(db, ctx.user.id, "InterEntityTransactionSettled", "transaction", transaction.transactionNo, transaction.sourceEntityId);
      return next;
    }),

  dispute: protectedProcedure
    .input(z.object({
      transactionId: z.number().int().positive(),
      openedByEntityId: z.number().int().positive(),
      reason: z.string().min(3).max(220),
      details: z.string().max(4000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireGovernanceAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new Error("database_unavailable");
      const [transaction] = await db.select().from(centralInterEntityTransactions).where(eq(centralInterEntityTransactions.id, input.transactionId)).limit(1);
      if (!transaction || ![transaction.sourceEntityId, transaction.targetEntityId].includes(input.openedByEntityId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.insert(centralInterEntityDisputes).values(input);
      await db.update(centralInterEntityTransactions).set({ status: "disputed" }).where(eq(centralInterEntityTransactions.id, transaction.id));
      return { disputed: true as const };
    }),
});
