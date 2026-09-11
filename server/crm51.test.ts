import { describe, expect, it } from "vitest";
import { caseProgress, consentAllows, maskPII, mergeRequiresApproval, sameEntity } from "../shared/crm51";

describe("CRM 3.0 and Customer 360", () => {
  it("keeps operational profiles entity scoped", () => {
    expect(sameEntity(1, 1)).toBe(true);
    expect(sameEntity(1, 2)).toBe(false);
  });
  it("enforces outbound consent and channel matching", () => {
    expect(consentAllows(1, 0, "email", "email")).toBe(true);
    expect(consentAllows(1, 0, "email", "sms")).toBe(false);
    expect(consentAllows(1, 1, "all", "email")).toBe(false);
  });
  it("requires merge approval when operational accounts exist", () => {
    expect(mergeRequiresApproval(90, 2)).toBe(true);
    expect(mergeRequiresApproval(90, 0)).toBe(false);
  });
  it("derives case progress and masks PII", () => {
    expect(caseProgress("in_progress")).toBe(45);
    expect(maskPII("0501234567")).toBe("05***67");
  });
});
