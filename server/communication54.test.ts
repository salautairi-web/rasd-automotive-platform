import { describe, expect, it } from "vitest";
import { canSendPurpose, deliveryRate, isRetryableProviderCode, retryDelaySeconds, shouldDeadLetter } from "../shared/communication54";
describe("Communication 54 controls",()=>{
 it("blocks marketing without explicit consent but permits transactional delivery",()=>{expect(canSendPurpose("marketing",undefined)).toBe(false);expect(canSendPurpose("marketing","withdrawn")).toBe(false);expect(canSendPurpose("marketing","granted")).toBe(true);expect(canSendPurpose("transactional",undefined)).toBe(true);});
 it("uses bounded exponential retry and dead-letter threshold",()=>{expect(retryDelaySeconds(1)).toBe(30);expect(retryDelaySeconds(3)).toBe(120);expect(shouldDeadLetter(5)).toBe(true);expect(shouldDeadLetter(4)).toBe(false);});
 it("classifies provider failures and calculates delivery rate",()=>{expect(isRetryableProviderCode(429)).toBe(true);expect(isRetryableProviderCode(400)).toBe(false);expect(deliveryRate(3,4)).toBe(75);expect(deliveryRate(0,0)).toBe(0);});
});
