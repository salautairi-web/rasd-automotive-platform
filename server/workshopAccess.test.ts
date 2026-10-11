import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const state = vi.hoisted(() => ({
  rows: [] as any[][],
  conditions: [] as Array<{ sql: string; params: unknown[] }>,
}));
vi.mock("./db", () => ({ getDb: async () => db }));
const dialect = new MySqlDialect();
const db: any = {
  select: () => {
    const rows = state.rows.shift() ?? [];
    const chain: any = {
      from: () => chain,
      where: (condition: any) => {
        state.conditions.push(dialect.sqlToQuery(condition));
        return chain;
      },
      innerJoin: () => chain,
      limit: () => chain,
      orderBy: () => chain,
      then: (resolve: any) => resolve(rows),
    };
    return chain;
  },
};
import {
  assertWorkshopPermission,
  getWorkshopAccess,
  hasWorkshopPermission,
  safeEntityScope,
  WORKSHOP_PERMISSION_KEYS,
} from "./workshopAccess";
import { workshopPermissionCatalog } from "../shared/workshopRoleTemplates";
const entity = { id: 2, nameAr: "ورشة اختبار", currency: "OMR" };
beforeEach(() => {
  state.rows = [];
  state.conditions = [];
});

describe("Workshop live guard contracts", () => {
  it("uses exact declared catalog keys, never role-name substring grants", () => {
    for (const permission of workshopPermissionCatalog)
      expect(WORKSHOP_PERMISSION_KEYS[permission.action]).toBe(permission.key);
  });
  it("never bypasses active-entity validation even for the platform admin", async () => {
    state.rows = [[]];
    await expect(
      assertWorkshopPermission({ id: 1, role: "admin" }, 2, "read")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.conditions[0].params).toEqual([2, "active"]);
  });
  it("allows an admin only after checking the active entity", async () => {
    state.rows = [[entity]];
    await expect(
      assertWorkshopPermission({ id: 1, role: "admin" }, 2, "configure")
    ).resolves.toBeUndefined();
    expect(state.conditions).toHaveLength(1);
  });
  it("allows an explicit active entity-wide permission with a nonrestricted scope", async () => {
    state.rows = [
      [entity],
      [{ permissionId: 12, scopeJson: '{"source":"role-management"}' }],
    ];
    await expect(
      hasWorkshopPermission({ id: 7, role: "user" }, 2, "quality")
    ).resolves.toBe(true);
    const grant = state.conditions[1];
    expect(grant.params).toContain("workshop.quality.record");
    expect(grant.params).toContain(7);
    expect(grant.params).toContain(2);
    expect(grant.params).toContain("entity");
    expect(grant.params).not.toContain("branch");
  });
  it("constrains membership starts and ends in the database rather than trusting active status alone", async () => {
    state.rows = [[entity], []];
    await hasWorkshopPermission({ id: 7, role: "user" }, 2, "read");
    const grant = state.conditions[1];
    expect(grant.sql).toContain("`iam_memberships`.`startsAt` <=");
    expect(grant.sql).toContain("`iam_memberships`.`endsAt` is null");
    expect(grant.sql).toContain("`iam_memberships`.`endsAt` >");
    expect(
      grant.params.filter(
        value =>
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}/.test(value) &&
          Number.isFinite(Date.parse(value))
      ).length
    ).toBe(2);
  });
  it("fails closed for branch restrictions and corrupted scopes", () => {
    for (const scope of [
      '{"branchId":1}',
      '{"branchIds":[1]}',
      '{"assigned":true}',
      '{"own":true}',
      "null",
      "[]",
      "not-json",
    ])
      expect(safeEntityScope(scope)).toBe(false);
    expect(safeEntityScope("{}")).toBe(true);
    expect(safeEntityScope('{"taskType":"technician"}')).toBe(true);
  });
  it("does not accept a branch-constrained entity role as entity-wide", async () => {
    state.rows = [
      [entity],
      [{ permissionId: 12, scopeJson: '{"branchId":1}' }],
    ];
    await expect(
      hasWorkshopPermission({ id: 7, role: "user" }, 2, "read")
    ).resolves.toBe(false);
  });
  it("does not let one restricted membership hide a second valid grant", async () => {
    state.rows = [
      [entity],
      [
        { permissionId: 12, scopeJson: '{"branchId":1}' },
        { permissionId: 12, scopeJson: "{}" },
      ],
    ];
    await expect(
      hasWorkshopPermission({ id: 7, role: "user" }, 2, "read")
    ).resolves.toBe(true);
  });
  it("does not advertise an entity when the only grant is branch-constrained", async () => {
    state.rows = [
      [entity],
      [
        {
          entityId: 2,
          roleNameAr: "فني",
          scopeType: "entity",
          scopeJson: '{"branchId":1}',
        },
      ],
      [
        {
          entityId: 2,
          permissionKey: "workshop.jobcard.read",
          scopeType: "entity",
          scopeJson: '{"branchId":1}',
        },
      ],
    ];
    await expect(getWorkshopAccess({ id: 7, role: "user" })).resolves.toEqual({
      entities: [],
    });
  });
  it("advertises normalized actions only for real read/operate grants", async () => {
    state.rows = [
      [entity],
      [
        {
          entityId: 2,
          roleNameAr: "فني",
          scopeType: "entity",
          scopeJson: "{}",
        },
      ],
      [
        {
          entityId: 2,
          permissionKey: "workshop.jobcard.read",
          scopeType: "entity",
          scopeJson: "{}",
        },
        {
          entityId: 2,
          permissionKey: "workshop.operation.create",
          scopeType: "entity",
          scopeJson: "{}",
        },
      ],
    ];
    const result = await getWorkshopAccess({ id: 7, role: "user" });
    expect(result.entities[0].permissions).toEqual(["read", "operate"]);
    expect(result.entities[0].permissions).not.toContain("collect");
  });
});
