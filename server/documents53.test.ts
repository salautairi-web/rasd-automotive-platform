import { describe, expect, it } from "vitest";
import { canDispose, lowConfidenceNeedsReview, nextLifecycleState, signatureWebhookDecision } from "../shared/documents53";
describe("Documents 53 lifecycle controls",()=>{
 it("blocks disposal under legal hold and permits only approved secure disposal",()=>{expect(canDispose(true,"secure_dispose")).toBe(false);expect(canDispose(false,"archive")).toBe(false);expect(canDispose(false,"secure_dispose")).toBe(true);});
 it("requires human review for low-confidence OCR",()=>{expect(lowConfidenceNeedsReview(8499)).toBe(true);expect(lowConfidenceNeedsReview(8500)).toBe(false);});
 it("keeps lifecycle transitions deterministic",()=>{expect(nextLifecycleState("review","approve")).toBe("approved");expect(nextLifecycleState("approved","hold")).toBe("held");expect(nextLifecycleState("held","dispose")).toBe("disposed");});
 it("handles expired signature state and replay-safe provider events at the shared decision layer",()=>{expect(signatureWebhookDecision("sent",new Date("2020-01-01"),new Date("2021-01-01"))).toBe("expired");expect(signatureWebhookDecision("completed",null)).toBe("completed");});
});
