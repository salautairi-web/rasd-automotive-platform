import { describe, expect, it } from "vitest";
import { localEntityNumber, validateBalancedJournal } from "../shared/erp";
import { decideIdempotency, nextJournalStatus } from "../shared/erp-lifecycle";

describe("Central ERP invariants", () => {
  it("keeps local identifiers namespaced by entity", () => {
    expect(localEntityNumber("sales", "CUS", 1)).toBe("SALES-CUS-0001");
    expect(localEntityNumber("rental", "CUS", 1)).toBe("RENTAL-CUS-0001");
    expect(localEntityNumber("sales", "CUS", 1)).not.toBe(localEntityNumber("rental", "CUS", 1));
  });

  it("accepts only balanced positive journal totals", () => {
    expect(validateBalancedJournal([{ debitMinor: 1000, creditMinor: 0 }, { debitMinor: 0, creditMinor: 1000 }]).valid).toBe(true);
    expect(validateBalancedJournal([{ debitMinor: 1000, creditMinor: 0 }, { debitMinor: 0, creditMinor: 900 }]).valid).toBe(false);
    expect(validateBalancedJournal([{ debitMinor: 0, creditMinor: 0 }, { debitMinor: 0, creditMinor: 0 }]).valid).toBe(false);
  });

  it("distinguishes new, replayed, and conflicting idempotency requests", () => {
    expect(decideIdempotency(null, "abc")).toBe("new");
    expect(decideIdempotency("abc", "abc")).toBe("replay");
    expect(decideIdempotency("abc", "xyz")).toBe("conflict");
  });

  it("allows only validated-to-posted and posted-to-reversed transitions", () => {
    expect(nextJournalStatus("validated", "post")).toBe("posted");
    expect(nextJournalStatus("posted", "reverse")).toBe("reversed");
    expect(() => nextJournalStatus("draft", "post")).toThrow();
    expect(() => nextJournalStatus("reversed", "reverse")).toThrow();
  });
});
