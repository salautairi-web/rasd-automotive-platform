import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("module entity and branch switching contracts", () => {
  it("keeps workshop switching inside the authorized entity list", () => {
    const source = read("client/src/pages/Workshop59.tsx");
    expect(source).toContain(
      "entities.find(item => item.id === selectedEntityId)"
    );
    expect(source).toContain("selectEntity(Number(event.target.value))");
    expect(source).toContain(
      "sessionStorage.setItem(`rasd:workshop-entity:${user.id}`"
    );
    expect(source).toContain("businessEntityId = entity.id");
  });

  it("sends the selected inventory entity to both operational queries", () => {
    const source = read("client/src/pages/Inventory.tsx");
    expect(source).toContain("setBusinessEntityId");
    expect(source).toContain(
      "useMemo(() => ({ businessEntityId }), [businessEntityId])"
    );
    expect(source).toContain("inventory56.dashboard.useQuery(input");
    expect(source).toContain("reorderRules.useQuery(input");
  });

  it("sends the selected sales entity to dashboard and vehicle queries", () => {
    const source = read("client/src/pages/AutoSales.tsx");
    expect(source).toContain("معرف كيان المبيعات");
    expect(source).toContain(
      "useMemo(() => ({ businessEntityId }), [businessEntityId])"
    );
    expect(source).toContain("sales.dashboard.useQuery(input");
    expect(source).toContain("sales.vehicles.useQuery(input");
  });

  it("keeps rental branch filtering in the availability input contract", () => {
    const source = read("client/src/pages/Rental.tsx");
    expect(source).toContain(
      "branchId: timeline.branchId ? Number(timeline.branchId) : undefined"
    );
    expect(source).toContain('placeholder="معرف الفرع"');
  });
});
