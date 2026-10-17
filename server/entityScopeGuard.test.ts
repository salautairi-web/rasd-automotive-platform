import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routersSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("central entity scope guard", () => {
  it("uses the membership guard for master data, sales, parts and core accounting routes", () => {
    for (const route of [
      "createCustomer: entityScopedProcedure",
      "dashboard: entityScopedProcedure",
      "reserveStock: entityScopedProcedure",
      "createJournal: entityScopedProcedure",
      "postJournal: entityScopedProcedure",
      "reverseJournal: entityScopedProcedure",
      "moduleRows: entityScopedProcedure",
    ]) {
      expect(routersSource).toContain(route);
    }
  });

  it("scopes journal state changes by both entry and selected entity", () => {
    expect(routersSource).toContain("eq(journalEntries.businessEntityId, input.businessEntityId), eq(journalEntries.status, \"validated\")");
    expect(routersSource).toContain("eq(journalEntries.businessEntityId, input.businessEntityId), eq(journalEntries.status, \"posted\")");
  });

  it("keeps the shared guard strict for malformed entity identifiers", () => {
    expect(routersSource).toContain("protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).use");
    expect(routersSource).toContain("const businessEntityId = input.businessEntityId");
  });
});
