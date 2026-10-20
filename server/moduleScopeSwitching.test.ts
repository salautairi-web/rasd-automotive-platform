import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("module entity and branch switching contracts", () => {
  it("keeps workshop switching inside the authorized entity list", () => {
    const source = read("client/src/pages/Workshop59.tsx");
    expect(source).toContain("entities.find(item => item.id === selectedEntityId)");
    expect(source).toContain("selectEntity(Number(event.target.value))");
    expect(source).toContain("sessionStorage.setItem(`rasd:workshop-entity:${user.id}`");
    expect(source).toContain("businessEntityId = entity.id");
    expect(source).toContain("BranchSelector");
    expect(source).toContain('ariaLabel="فرع الورشة"');
    expect(source).toContain(
      "branchId={branchId ? Number(branchId) : undefined}"
    );
    expect(source).toContain(
      "branchId: branchId ? Number(branchId) : undefined, ...boardRange"
    );
    expect(source).toContain(
      "branchId: branchId ? Number(branchId) : undefined,\n                    customerId"
    );
    const server = read("server/workshop59.ts");
    expect(server).toContain("eq(workshopJobCards59.branchId, input.branchId)");
    expect(server).toContain(
      "eq(workshopSchedules59.branchId, input.branchId)"
    );
    expect(server).toContain(
      "eq(workshopAppointments.branchId, input.branchId)"
    );
  });

  it("sends the selected inventory entity and branch to operational queries", () => {
    const source = read("client/src/pages/Inventory.tsx");
    expect(source).toContain("setBusinessEntityId");
    expect(source).toContain("branchId: branchId ? Number(branchId) : undefined");
    expect(source).toContain("inventory56.dashboard.useQuery(input");
    expect(source).toContain("reorderRules.useQuery(input");
    expect(source).toContain("BranchSelector");
    const server = read("server/inventory56.ts");
    expect(server).toContain("inventoryReceipts56.warehouseId");
    expect(server).toContain("inventoryIssues56.warehouseId");
    expect(server).toContain("inventoryTransfers.sourceWarehouseId");
    expect(server).toContain("inventoryStockouts56.warehouseId");
  });

  it("sends the selected sales entity and branch to dashboard and vehicle queries", () => {
    const source = read("client/src/pages/AutoSales.tsx");
    expect(source).toContain("معرف كيان المبيعات");
    expect(source).toContain("branchId: branchId ? Number(branchId) : undefined");
    expect(source).toContain("sales.dashboard.useQuery(input");
    expect(source).toContain("sales.vehicles.useQuery(input");
    expect(source).toContain("BranchSelector");
  });

  it("keeps rental branch filtering in the availability input contract", () => {
    const source = read("client/src/pages/Rental.tsx");
    expect(source).toContain("branchId: timeline.branchId ? Number(timeline.branchId) : undefined");
    expect(source).toContain('placeholder="معرف الفرع"');
  });
});
