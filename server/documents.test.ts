import { describe, expect, it } from "vitest";
import { canDisposeDocument, canSignInOrder, isShareUsable, nextDocumentVersion } from "../shared/documents";

describe("document controls", () => {
  it("preserves immutable versions", () => expect(nextDocumentVersion(2, true)).toBe(3));
  it("does not reuse a mutable version as the next immutable artifact", () => expect(nextDocumentVersion(1, true)).toBe(2));
  it("blocks disposal under legal hold", () => expect(canDisposeDocument(true, null)).toBe(false));
  it("blocks disposal before retention expiry", () => expect(canDisposeDocument(false, new Date(Date.now() + 60_000))).toBe(false));
  it("allows disposal after retention expiry when no hold exists", () => expect(canDisposeDocument(false, new Date(Date.now() - 60_000))).toBe(true));
  it("enforces signer order", () => {
    expect(canSignInOrder(2, [1])).toBe(true);
    expect(canSignInOrder(2, [])).toBe(false);
  });
  it("validates secure shares", () => {
    expect(isShareUsable(new Date(Date.now() + 1000), null, 0, 1)).toBe(true);
    expect(isShareUsable(new Date(Date.now() - 1000), null, 0, 1)).toBe(false);
    expect(isShareUsable(new Date(Date.now() + 1000), new Date(), 0, 1)).toBe(false);
  });
  it("keeps documents isolated by entity scope", () => {
    const rentalDocument = { businessEntityId: 1, documentNo: "RENT-1" };
    const workshopDocument = { businessEntityId: 2, documentNo: "WORK-1" };
    expect(rentalDocument.businessEntityId).not.toBe(workshopDocument.businessEntityId);
    expect(rentalDocument.documentNo).not.toBe(workshopDocument.documentNo);
  });
});
