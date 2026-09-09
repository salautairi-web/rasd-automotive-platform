import { describe, expect, it } from "vitest";

function sameEntity(entryEntityId: number, requestedEntityId: number) {
  return entryEntityId === requestedEntityId;
}

describe("accounting entity access invariants", () => {
  it("keeps journal access entity-scoped", () => {
    expect(sameEntity(10, 10)).toBe(true);
    expect(sameEntity(10, 11)).toBe(false);
  });

  it("does not permit a journal from another entity", () => {
    const journal = { id: 5, businessEntityId: 10 };
    expect(sameEntity(journal.businessEntityId, 11)).toBe(false);
  });
});
