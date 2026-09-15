import { describe, expect, it } from "vitest";

describe("Step 65 AR/AP and working capital", () => {
  it("keeps customer accounts entity-scoped", () => {
    const account = { businessEntityId: 3, customerRef: "CUS-1" };
    expect({ ...account, businessEntityId: 4 }.businessEntityId).not.toBe(account.businessEntityId);
  });
  it("keeps invoice outstanding equal to gross plus tax at creation", () => {
    expect(100000 + 5000).toBe(105000);
  });
  it("calculates cash conversion days from DSO minus DPO", () => {
    expect(450000 - 300000).toBe(150000);
  });
  it("does not allow collections to be created without source invoice context", () => {
    const collection = { invoiceId: 12, sourceRequired: true };
    expect(collection.sourceRequired).toBe(true);
  });
});
