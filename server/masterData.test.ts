import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validatePlateNumber } from "../shared/vehicleCatalog";

const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const panel = readFileSync(
  new URL("../client/src/components/EntityMasterDataPanel.tsx", import.meta.url),
  "utf8"
);
const catalog = readFileSync(
  new URL("../shared/vehicleCatalog.ts", import.meta.url),
  "utf8"
);
const receiveDialog = readFileSync(
  new URL("../client/src/components/WorkshopReceiveDialog.tsx", import.meta.url),
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

  it("supports catalog vehicle selection and preserves customer linking", () => {
    expect(catalog).toContain('key: "Toyota"');
    expect(catalog).toContain('key: "Hyundai"');
    expect(panel).toContain("VEHICLE_CATALOG");
    expect(panel).toContain("filteredMakes");
    expect(panel).toContain("filteredModels");
    expect(panel).toContain("VEHICLE_TYPES");
    expect(panel).toContain("PLATE_COUNTRIES");
    expect(panel).toContain("plateNo");
    expect(panel).toContain("plateCountry");
    expect(panel).toContain("vehicleType");
    expect(panel).toContain("color");
    expect(router).toContain("plateNo: vehicles.plateNo");
    expect(router).toContain("color: vehicles.color");
    expect(router).toContain("customerId: input.customerId");
    expect(receiveDialog).toContain("customerId, vin: newVehicle.vin.trim()");
    expect(receiveDialog).toContain("VEHICLE_COLORS");
    expect(receiveDialog).toContain("item.customerId === Number(form.customerId)");
  });

  it("validates plate length and allowed characters by selected country", () => {
    expect(validatePlateNumber("12345678", "OM").valid).toBe(true);
    expect(validatePlateNumber("123456789", "OM").valid).toBe(false);
    expect(validatePlateNumber("12-أ ب", "SA").valid).toBe(true);
    expect(validatePlateNumber("12/34", "AE").valid).toBe(false);
    expect(validatePlateNumber("", "KW").valid).toBe(true);
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
