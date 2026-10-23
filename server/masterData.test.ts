import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const panel = readFileSync(
  new URL("../client/src/components/EntityMasterDataPanel.tsx", import.meta.url),
  "utf8"
);

describe("entity master data contract", () => {
  it("exposes entity-scoped list and creation procedures", () => {
    expect(router).toContain("list: entityScopedProcedure");
    expect(router).toContain("createCustomer: entityScopedProcedure");
    expect(router).toContain("createVehicle: entityScopedProcedure");
    expect(router).toContain("eq(customers.businessEntityId, input.businessEntityId)");
    expect(router).toContain("eq(vehicles.businessEntityId, input.businessEntityId)");
  });

  it("keeps the shared panel connected to the scoped procedures", () => {
    expect(panel).toContain("trpc.masterData.list.useQuery(");
    expect(panel).toContain("trpc.masterData.createCustomer.useMutation");
    expect(panel).toContain("trpc.masterData.createVehicle.useMutation");
    expect(panel).toContain("utils.masterData.list.invalidate");
  });

  it("is mounted in both operational entities", () => {
    const workshop = readFileSync(
      new URL("../client/src/pages/Workshop59.tsx", import.meta.url),
      "utf8"
    );
    const parts = readFileSync(
      new URL("../client/src/pages/SpareParts.tsx", import.meta.url),
      "utf8"
    );
    expect(workshop).toContain("EntityMasterDataPanel");
    expect(parts).toContain("EntityMasterDataPanel");
  });
});
