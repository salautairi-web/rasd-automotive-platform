import { describe, expect, it } from "vitest";
import { canMutateSourceSystem44, classifyIntegrationError44, deliveryDecision44, isCompatibleSchema44 } from "../shared/integration44";

describe("integration step 44 contracts", () => {
  it("classifies retryable provider failures and permanent validation failures", () => {
    expect(classifyIntegrationError44("503")).toBe("provider");
    expect(classifyIntegrationError44("SCHEMA_VIOLATION")).toBe("validation");
    expect(deliveryDecision44(1, 3, "TIMEOUT")).toEqual({ retryable: true, nextAttempt: 2, deadLetter: false });
    expect(deliveryDecision44(0, 3, "SCHEMA_VIOLATION").deadLetter).toBe(true);
  });

  it("enforces required event fields without mutating the payload", () => {
    const payload = { entityId: 7, correlationId: "corr-1" };
    expect(isCompatibleSchema44(["entityId", "correlationId"], payload)).toBe(true);
    expect(isCompatibleSchema44(["entityId", "amount"], payload)).toBe(false);
    expect(payload).toEqual({ entityId: 7, correlationId: "corr-1" });
  });

  it("keeps source-system mutation behind explicit privileged access", () => {
    expect(canMutateSourceSystem44("admin", "finance")).toBe(true);
    expect(canMutateSourceSystem44("user", "finance")).toBe(false);
    expect(canMutateSourceSystem44("admin", "")).toBe(false);
  });
});
