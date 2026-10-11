import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getTableName } from "drizzle-orm";
const state = vi.hoisted(() => ({
  rows: [] as any[][],
  writes: [] as Array<{ table: string; data: any }>,
  guard: vi.fn(),
  nextId: 100,
}));
vi.mock("./workshopAccess", () => ({ assertWorkshopPermission: state.guard }));
vi.mock("./db", () => ({ getDb: async () => db }));
const db: any = {
  select: () => {
    const rows = state.rows.shift() ?? [];
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: () => chain,
      then: (resolve: any) => resolve(rows),
    };
    return chain;
  },
  transaction: async (fn: any) => fn(db),
  insert: (table: any) => ({
    values: (data: any) => {
      state.writes.push({ table: getTableName(table), data });
      const id = ++state.nextId;
      return {
        $returningId: async () => [{ id }],
        then: (resolve: any) => resolve([{ insertId: id }]),
      };
    },
  }),
};
import { workshopRoleTemplatesRouter } from "./workshopRoleTemplates";
const ctx = {
  user: {
    id: 7,
    role: "admin",
    openId: "role-qa",
    name: "مسؤول اختبار",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {},
  res: {},
} as TrpcContext;
beforeEach(() => {
  state.rows = [];
  state.writes = [];
  state.nextId = 100;
  state.guard.mockReset().mockResolvedValue(undefined);
});

describe("Workshop role installer", () => {
  it("requires platform-admin access, not only a workshop manager", async () => {
    await expect(
      workshopRoleTemplatesRouter
        .createCaller({ ...ctx, user: { ...ctx.user!, role: "user" } })
        .install({ businessEntityId: 2, acknowledged: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.writes).toEqual([]);
  });
  it("requires explicit acknowledgement of the exact non-granting setup", async () => {
    await expect(
      workshopRoleTemplatesRouter
        .createCaller(ctx)
        .install({ businessEntityId: 2, acknowledged: false } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.writes).toEqual([]);
  });
  it("creates six entity-scoped roles and thirteen exact keys but no user memberships", async () => {
    const result = await workshopRoleTemplatesRouter
      .createCaller(ctx)
      .install({ businessEntityId: 2, acknowledged: true });
    expect(result.permissionsCreated).toBe(13);
    expect(result.roles.filter(role => role.created)).toHaveLength(6);
    expect(result.membershipsGranted).toBe(0);
    expect(
      state.writes
        .filter(write => write.table === "iam_roles")
        .every(write => write.data.scopeType === "entity")
    ).toBe(true);
    expect(state.writes.some(write => write.table === "iam_memberships")).toBe(
      false
    );
    expect(state.writes.some(write => write.table === "users")).toBe(false);
  });
  it("leaves all existing role grants untouched on repeated setup", async () => {
    state.rows = Array.from({ length: 13 }, (_, i) => [{ id: i + 1 }]).concat(
      Array.from({ length: 6 }, (_, i) => [
        { id: i + 20, nameAr: "دور معدّل سابقاً" },
      ])
    );
    const result = await workshopRoleTemplatesRouter
      .createCaller(ctx)
      .install({ businessEntityId: 2, acknowledged: true });
    expect(result.permissionsCreated).toBe(0);
    expect(result.roles.every(role => !role.created)).toBe(true);
    expect(state.writes.map(write => write.table)).toEqual([
      "iam_security_events",
    ]);
  });
});
