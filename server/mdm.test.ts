import { describe, expect, it } from "vitest";
import { canTransitionMdm, classifyMatch, qualityScoreBps, resolveConflict, sameEntityScope } from "../shared/mdm";

describe("MDM governance invariants", () => {
  it("keeps lifecycle transitions controlled", () => {
    expect(canTransitionMdm("draft", "active")).toBe(true);
    expect(canTransitionMdm("archived", "active")).toBe(false);
  });
  it("classifies exact and fuzzy candidates deterministically", () => {
    expect(classifyMatch(9900)).toBe("exact");
    expect(classifyMatch(8000)).toBe("fuzzy_confirmed");
    expect(classifyMatch(4000)).toBe("manual");
  });
  it("calculates bounded quality scores", () => {
    expect(qualityScoreBps({ completeness: 10000, validity: 8000 })).toBe(9000);
    expect(qualityScoreBps({ completeness: 12000, validity: -2 })).toBe(5000);
  });
  it("does not allow cross-entity equality to be assumed", () => {
    expect(sameEntityScope(1, 1)).toBe(true);
    expect(sameEntityScope(1, 2)).toBe(false);
  });
  it("keeps conflict resolution explainable", () => {
    expect(resolveConflict("source_of_truth", "erp", "crm")).toBe("erp");
    expect(resolveConflict("entity_owned", "erp", "crm")).toBe("entity-owned-local-record");
  });
  it("keeps same-name local customers independent by entity", () => {
    const rental = { businessEntityId: 1, nameAr: "شركة الاختبار", balanceMinor: 1000 };
    const workshop = { businessEntityId: 2, nameAr: "شركة الاختبار", balanceMinor: 9000 };
    expect(rental.nameAr).toBe(workshop.nameAr);
    expect(sameEntityScope(rental.businessEntityId, workshop.businessEntityId)).toBe(false);
    expect(rental.balanceMinor).not.toBe(workshop.balanceMinor);
  });
  it("keeps local product values independent from one global reference", () => {
    const productReference = { globalReferenceId: 77, sku: "OEM-1" };
    const rentalProduct = { businessEntityId: 1, globalReferenceId: productReference.globalReferenceId, localPriceMinor: 1200, localStockQty: 3 };
    const partsProduct = { businessEntityId: 2, globalReferenceId: productReference.globalReferenceId, localPriceMinor: 1450, localStockQty: 18 };
    expect(rentalProduct.globalReferenceId).toBe(partsProduct.globalReferenceId);
    expect(rentalProduct.localPriceMinor).not.toBe(partsProduct.localPriceMinor);
    expect(sameEntityScope(rentalProduct.businessEntityId, partsProduct.businessEntityId)).toBe(false);
  });
});
