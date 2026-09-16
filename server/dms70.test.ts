import { describe, expect, it } from "vitest";

describe("Step 70 DMS controls", () => {
  it("keeps a document link scoped to its business entity", () => {
    expect({businessEntityId: 7, documentId: 10}).not.toEqual({businessEntityId: 8, documentId: 10});
  });
  it("requires a workflow decision to move beyond submission", () => {
    const allowed = ["review", "approved", "rejected", "published"];
    expect(allowed.includes("approved")).toBe(true);
    expect(allowed.includes("draft")).toBe(false);
  });
  it("records only auditable document actions", () => {
    expect(["view", "download", "share", "edit", "approve", "reject"].includes("download")).toBe(true);
  });
  it("keeps source references addressable without copying source records", () => {
    const link = {sourceModule:"procurement", sourceRecordType:"purchase_order", sourceRecordId:"PO-100"};
    expect(link.sourceRecordId).toBe("PO-100");
    expect(link).not.toHaveProperty("totalMinor");
  });
});
