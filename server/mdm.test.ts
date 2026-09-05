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
});
