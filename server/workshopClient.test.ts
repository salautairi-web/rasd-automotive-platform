import { describe, expect, it } from "vitest";
import {
  filterWorkshopJobs,
  parseWorkshopMoney,
  formatWorkshopMoney,
  workshopCurrencyDigits,
  workshopNextStatuses,
  validWorkshopInteger,
} from "../shared/workshopClient";
import {
  workshopRoleTemplates,
  workshopPermissionCatalog,
  workshopTemplateRoleKey,
} from "../shared/workshopRoleTemplates";
import { canTransitionWorkshopJob } from "../shared/workshop59";

describe("Workshop operational UI rules", () => {
  it("parses OMR with three fractional places and USD with two", () => {
    expect(workshopCurrencyDigits("OMR")).toBe(3);
    expect(parseWorkshopMoney("12.345", "OMR")).toBe(12345);
    expect(parseWorkshopMoney("12.34", "USD")).toBe(1234);
    expect(parseWorkshopMoney("0", "OMR")).toBe(0);
  });
  it("rejects hidden rounding, negative, non-finite and exponential currency inputs", () => {
    for (const value of [
      "12.3456",
      "-1",
      "NaN",
      "Infinity",
      "1e3",
      "",
      "12abc",
    ])
      expect(parseWorkshopMoney(value, "OMR")).toBeNull();
    expect(parseWorkshopMoney("1.234", "USD")).toBeNull();
  });
  it("formats the invoice currency rather than assuming all values are OMR", () => {
    expect(formatWorkshopMoney(12345, "OMR")).toContain("١٢٫٣٤٥");
    expect(formatWorkshopMoney(1234, "USD")).toContain("١٢٫٣٤");
  });
  it("filters job numbers, real customer and vehicle names and state without mutating inputs", () => {
    const jobs = [
      { jobNo: "WS-1", status: "qc", customerId: 1, vehicleId: 11 },
      { jobNo: "WS-2", status: "ready", customerId: 2, vehicleId: 22 },
    ];
    const customer = (id: number) => (id === 1 ? "شركة النور" : "عميل آخر");
    const vehicle = (id: number) => (id === 11 ? "تويوتا لاندكروزر" : "نيسان");
    expect(filterWorkshopJobs(jobs, "النور", "all", customer, vehicle)).toEqual(
      [jobs[0]]
    );
    expect(filterWorkshopJobs(jobs, "تويوتا", "qc", customer, vehicle)).toEqual(
      [jobs[0]]
    );
    expect(filterWorkshopJobs(jobs, "WS-2", "qc", customer, vehicle)).toEqual(
      []
    );
    expect(jobs).toHaveLength(2);
  });
  it("does not expose direct transition to delivered in the UI", () => {
    for (const targets of Object.values(workshopNextStatuses))
      expect(targets).not.toContain("delivered");
  });
  it("keeps displayed transitions consistent with the server lifecycle", () => {
    for (const [from, targets] of Object.entries(workshopNextStatuses)) {
      for (const to of targets)
        expect(canTransitionWorkshopJob(from as any, to)).toBe(true);
    }
  });
  it("accepts integer odometers only", () => {
    expect(validWorkshopInteger("0")).toBe(true);
    expect(validWorkshopInteger("120345")).toBe(true);
    for (const value of ["", "-1", "12.3", "1e3", "Infinity"])
      expect(validWorkshopInteger(value)).toBe(false);
  });
});

describe("Workshop least-privilege role templates", () => {
  it("defines thirteen unique explicit IAM permissions", () => {
    expect(workshopPermissionCatalog).toHaveLength(13);
    expect(new Set(workshopPermissionCatalog.map(x => x.key)).size).toBe(13);
    expect(
      workshopPermissionCatalog.every(x => x.key.startsWith("workshop."))
    ).toBe(true);
  });
  it("keeps collection out of technician, quality and manager roles", () => {
    for (const key of ["technician", "quality", "manager"])
      expect(
        workshopRoleTemplates.find(x => x.key === key)?.actions
      ).not.toContain("collect");
    expect(
      workshopRoleTemplates.find(x => x.key === "accountant")?.actions
    ).toContain("collect");
  });
  it("does not give the accountant repair or quality approval privileges", () => {
    const actions = workshopRoleTemplates.find(
      x => x.key === "accountant"
    )!.actions;
    expect(actions).not.toContain("operate");
    expect(actions).not.toContain("quality");
    expect(actions).not.toContain("deliver");
  });
  it("starts every usable role with read access and only defined permissions", () => {
    for (const role of workshopRoleTemplates) {
      expect(role.actions).toContain("read");
      for (const action of role.actions)
        expect(workshopPermissionCatalog.some(x => x.action === action)).toBe(
          true
        );
    }
  });
  it("names template roles per entity without attaching any users", () => {
    expect(workshopTemplateRoleKey("advisor", 2)).toBe(
      "ws_pilot_advisor_entity_2"
    );
    expect(workshopTemplateRoleKey("advisor", 2)).not.toBe(
      workshopTemplateRoleKey("advisor", 1)
    );
  });
});
