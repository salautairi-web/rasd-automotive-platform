import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";
const state = vi.hoisted(() => ({
  rows: [] as any[][],
  writes: [] as Array<{ table: string; data: any }>,
  where: [] as any[],
}));
vi.mock("./db", () => ({ getDb: async () => db }));
const dialect = new MySqlDialect();
const db: any = {
  select: () => {
    const rows = state.rows.shift() ?? [];
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      where: (s: any) => {
        state.where.push(dialect.sqlToQuery(s));
        return chain;
      },
      limit: () => chain,
      orderBy: () => chain,
      then: (resolve: any) => resolve(rows),
    };
    return chain;
  },
  transaction: async (fn: any) => fn(db),
  insert: (t: any) => ({
    values: async (data: any) => {
      state.writes.push({ table: getTableName(t), data });
      return [{ insertId: 81 }];
    },
  }),
};
import { customerServicesRouter } from "./customerServices";
const ctx = {
  user: null,
  customer: {
    userId: 9,
    credentialId: 19,
    sessionId: 29,
    name: "عميل",
    email: "qa@example.invalid",
    phone: "+96890000001",
  },
  req: {},
  res: {},
} as TrpcContext;
const pu = { id: 7, userId: 9, status: "active" };
const relationship = {
  relationship: {
    id: 42,
    portalUserId: 7,
    businessEntityId: 101,
    sourceProfileId: 66,
    status: "active",
  },
  entityName: "شركة اختبار",
  entityType: "company",
};
const input = {
  businessEntityId: 101,
  relationshipId: 42,
  service: "workshop" as const,
  subject: "طلب تغيير زيت",
  details: "تويوتا كورولا؛ أحتاج تغيير الزيت والفلتر",
  preferredDate: "2026-10-20",
  idempotencyKey: "service-test-001",
};
beforeEach(() => {
  state.rows = [];
  state.writes = [];
  state.where = [];
});
describe("Isolated company service requests", () => {
  it("rejects anonymous requests before DB reads", async () => {
    await expect(
      customerServicesRouter
        .createCaller({ ...ctx, customer: null })
        .request(input)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(state.where).toEqual([]);
  });
  it("rejects a foreign company or relationship", async () => {
    state.rows = [[pu], []];
    await expect(
      customerServicesRouter.createCaller(ctx).request(input)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.writes).toEqual([]);
  });
  it("rejects a suspended portal user", async () => {
    state.rows = [[{ ...pu, status: "suspended" }]];
    await expect(
      customerServicesRouter.createCaller(ctx).request(input)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.writes).toEqual([]);
  });
  it("stores a requested appointment with actual server-owned customer ID and in-app notice", async () => {
    state.rows = [[pu], [relationship], []];
    const result = await customerServicesRouter
      .createCaller(ctx)
      .request({ ...input, customerId: 999, status: "confirmed" } as any);
    expect(result).toMatchObject({
      kind: "reservation",
      reference: "RSV-81",
      status: "requested",
    });
    expect(state.writes.map(r => r.table)).toEqual([
      "portal_reservations",
      "portal_v2_notifications",
      "portal_audit",
    ]);
    expect(state.writes[0].data.status).toBe("requested");
    expect(JSON.parse(state.writes[0].data.detailsJson).customerId).toBe(66);
    expect(state.writes[1].data.channel).toBe("in_app");
    expect(state.writes[0].data.idempotencyKey).toBe(
      "customer-7-42-service-test-001"
    );
  });
  it("stores parts enquiries as orders rather than consuming stock or charging payment", async () => {
    state.rows = [[pu], [relationship], []];
    await customerServicesRouter
      .createCaller(ctx)
      .request({ ...input, service: "parts" });
    expect(state.writes[0].table).toBe("portal_orders");
    expect(state.writes[0].data.status).toBe("submitted");
    expect(
      state.writes.some(r => /payment|inventory|invoice/.test(r.table))
    ).toBe(false);
  });
  it("replays only the same customer's relationship-owned key without more writes", async () => {
    state.rows = [[pu], [relationship], [{ id: 81, status: "requested" }]];
    await expect(
      customerServicesRouter.createCaller(ctx).request(input)
    ).resolves.toMatchObject({ replay: true, id: 81 });
    expect(state.where[2].params).toEqual([
      7,
      101,
      42,
      "customer-7-42-service-test-001",
    ]);
    expect(state.writes).toEqual([]);
  });
  it("rejects invalid calendar dates and whitespace-only descriptions", async () => {
    state.rows = [[pu], [relationship]];
    await expect(
      customerServicesRouter
        .createCaller(ctx)
        .request({ ...input, preferredDate: "2026-02-31" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      customerServicesRouter
        .createCaller(ctx)
        .request({ ...input, details: "    " })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes).toEqual([]);
  });
});
