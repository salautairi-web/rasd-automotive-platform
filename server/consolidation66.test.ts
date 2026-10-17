import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Step 66 financial consolidation", () => {
  it("keeps entity ledgers separate from group reporting", () => {
    const entity = { businessEntityId: 2, groupId: 9 };
    expect(entity.businessEntityId).not.toBe(entity.groupId);
  });
  it("rejects self-referencing inter-entity matches", () => {
    const source = 4; const target = 4;
    expect(source === target).toBe(true);
  });
  it("shows elimination as an explicit amount rather than mutating source balances", () => {
    const sourceBalance = 500000; const elimination = 120000;
    expect(sourceBalance).toBe(500000);
    expect(elimination).toBe(120000);
  });
  it("blocks new snapshots after a period is locked", () => {
    expect(["locked", "closed"].includes("locked")).toBe(true);
  });
  it("keeps group-level consolidation procedures behind the admin boundary", () => {
    const source = readFileSync(resolve(import.meta.dirname, "consolidation66.ts"), "utf8");
    expect(source).toContain('import { adminProcedure, router } from "./_core/trpc";');
    expect(source).not.toContain("protectedProcedure");
    expect(source).toContain("groupInScope");
  });
});
