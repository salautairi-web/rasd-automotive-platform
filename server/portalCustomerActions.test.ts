import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { portalV2Router } from "./portalV2";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ db: null as any }));
vi.mock("./db", () => ({ getDb: vi.fn(async () => state.db) }));
const ctx = { user: { id: 9, role: "user" }, req: {}, res: {} } as TrpcContext;
const scope = { businessEntityId: 101, relationshipId: 42 };
const pu = { id: 7, userId: 9, status: "active" };
const relation = { relationship: { id: 42, portalUserId: 7, businessEntityId: 101, status: "active" }, entityName: "كيان الاختبار", entityType: "company" };
const ticket = { id: 55, portalUserId: 7, businessEntityId: 101, relationshipId: 42, ticketNo: "PTK-TEST", status: "open" };
const dialect = new MySqlDialect();
function dbWith(rows: unknown[][]) {
  const conditions: any[] = [];
  const db: any = {
    select: vi.fn(() => {
      const result = rows.shift() ?? [];
      const query: any = { from: () => query, innerJoin: () => query, where: (condition: any) => { conditions.push(dialect.sqlToQuery(condition)); return query; }, orderBy: () => query,
        limit: () => Object.assign(Promise.resolve(result), { for: () => Promise.resolve(result) }) };
      return query;
    }),
    insert: vi.fn(() => ({ values: vi.fn(async () => [{ insertId: 55 }]) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) })),
    transaction: vi.fn(async (fn: (tx: any) => unknown) => fn(db)),
  };
  state.db = db;
  return { db, conditions };
}
beforeEach(() => { state.db = null; vi.clearAllMocks(); });

describe("Portal customer actions through tRPC", () => {
  it("rejects unauthenticated callers before touching storage", async () => {
    const { db } = dbWith([]);
    await expect(portalV2Router.createCaller({ ...ctx, user: null }).ticketThread({ ...scope, ticketId: 55 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.select).not.toHaveBeenCalled();
  });
  it("rejects requests without an active owned relationship", async () => {
    const { db } = dbWith([[pu], []]);
    await expect(portalV2Router.createCaller(ctx).ticketThread({ ...scope, ticketId: 55 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.select).toHaveBeenCalledTimes(2);
  });
  it("queries ticket and messages with all three scope constraints", async () => {
    const { conditions } = dbWith([[pu], [relation], [ticket], [{ body: "رسالة اختبار" }]]);
    const result = await portalV2Router.createCaller(ctx).ticketThread({ ...scope, ticketId: 55 });
    expect(result.messages).toHaveLength(1);
    expect(conditions[1].params).toEqual([7, 101, "active", 42]);
    for (const condition of conditions.slice(2)) {
      expect(condition.params).toEqual([55, 7, 101, 42]);
      expect(condition.sql).toContain("relationshipId");
      expect(condition.sql).toContain("portalUserId");
      expect(condition.sql).toContain("businessEntityId");
    }
  });
  it("does not disclose another customer or relationship's ticket", async () => {
    dbWith([[pu], [relation], []]);
    await expect(portalV2Router.createCaller(ctx).ticketThread({ ...scope, ticketId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("blocks replies to closed tickets without writing", async () => {
    const { db } = dbWith([[pu], [relation], [{ ...ticket, status: "closed" }]]);
    await expect(portalV2Router.createCaller(ctx).replyToTicket({ ...scope, ticketId: 55, body: "رد جديد" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.insert).not.toHaveBeenCalled();
  });
  it("stores a trimmed reply and audit event atomically under the owned scope", async () => {
    const { db, conditions } = dbWith([[pu], [relation], [ticket]]);
    expect(await portalV2Router.createCaller(ctx).replyToTicket({ ...scope, ticketId: 55, body: "  رد اختبار  " })).toEqual({ sent: true });
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(conditions[2].params).toEqual([55, 7, 101, 42]);
    expect(db.insert.mock.results[0].value.values).toHaveBeenCalledWith(expect.objectContaining({ portalUserId: 7, relationshipId: 42, businessEntityId: 101, ticketId: 55, body: "رد اختبار", senderType: "portal_user" }));
    expect(db.insert.mock.results[1].value.values).toHaveBeenCalledWith(expect.objectContaining({ action: "ticket.reply", resourceId: "PTK-TEST" }));
  });
  it("rejects whitespace-only replies before database access", async () => {
    const { db } = dbWith([]);
    await expect(portalV2Router.createCaller(ctx).replyToTicket({ ...scope, ticketId: 55, body: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.select).not.toHaveBeenCalled();
  });
  it("creates ticket, first message and audit in one transaction", async () => {
    const { db } = dbWith([[pu], [relation]]);
    const result = await portalV2Router.createCaller(ctx).createTicket({ ...scope, category: "استفسار", subject: " موضوع اختبار ", message: " رسالة اختبار ", priority: "high" });
    expect(result.ticketId).toBe(55);
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(db.insert).toHaveBeenCalledTimes(3);
    expect(db.insert.mock.results[0].value.values).toHaveBeenCalledWith(expect.objectContaining({ subject: "موضوع اختبار", priority: "high", relationshipId: 42 }));
    expect(db.insert.mock.results[1].value.values).toHaveBeenCalledWith(expect.objectContaining({ ticketId: 55, body: "رسالة اختبار" }));
  });
  it("marks only a notification belonging to the customer and selected entity", async () => {
    const { db, conditions } = dbWith([[pu], [relation], [{ id: 11, readAt: null }]]);
    await portalV2Router.createCaller(ctx).markNotificationRead({ ...scope, notificationId: 11 });
    expect(conditions[2].params).toEqual([11, 7, 101]);
    expect(db.update).toHaveBeenCalledOnce();
  });
  it("never updates foreign notifications and preserves existing read timestamps", async () => {
    let result = dbWith([[pu], [relation], []]);
    await expect(portalV2Router.createCaller(ctx).markNotificationRead({ ...scope, notificationId: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(result.db.update).not.toHaveBeenCalled();
    result = dbWith([[pu], [relation], [{ id: 11, readAt: new Date() }]]);
    expect(await portalV2Router.createCaller(ctx).markNotificationRead({ ...scope, notificationId: 11 })).toEqual({ read: true });
    expect(result.db.update).not.toHaveBeenCalled();
  });
});
