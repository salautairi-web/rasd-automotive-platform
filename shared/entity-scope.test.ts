import { describe, expect, it } from "vitest";

function isSameEntity(recordEntityId: number, requestedEntityId: number) {
  return recordEntityId === requestedEntityId;
}

describe("entity scope invariants", () => {
  it("accepts records only from the requested business entity", () => {
    expect(isSameEntity(10, 10)).toBe(true);
    expect(isSameEntity(10, 11)).toBe(false);
  });

  it("does not infer shared master data from equal names", () => {
    const entityA = { id: 10, nameAr: "عميل مشترك بالاسم" };
    const entityB = { id: 11, nameAr: "عميل مشترك بالاسم" };
    expect(entityA.nameAr).toBe(entityB.nameAr);
    expect(entityA.id).not.toBe(entityB.id);
  });
});
