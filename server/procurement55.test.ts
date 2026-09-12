import { describe, expect, it } from "vitest";
import { budgetDecision, isMaverickSpend, supplierCanTransact, threeWayStatus, weightedSupplierScore } from "../shared/procurement55";
describe("Procurement 55 controls",()=>{
 it("requires active qualified compliant supplier",()=>{expect(supplierCanTransact("active","qualified","compliant")).toBe(true);expect(supplierCanTransact("active","under_review","compliant")).toBe(false);});
 it("enforces budget and identifies variance",()=>{expect(budgetDecision(1000,200,700).withinBudget).toBe(true);expect(budgetDecision(1000,900,200).varianceMinor).toBe(100);});
 it("detects maverick spend",()=>{expect(isMaverickSpend(true,true,true)).toBe(false);expect(isMaverickSpend(false,true,true)).toBe(true);expect(isMaverickSpend(true,false,true)).toBe(true);});
 it("matches three-way records within tolerance",()=>{expect(threeWayStatus(1000,1000,1001,2).status).toBe("matched");expect(threeWayStatus(1000,900,1100,2).status).toBe("variance");expect(threeWayStatus(1000,undefined,1000,2).status).toBe("missing_receipt");});
 it("scores suppliers deterministically",()=>expect(weightedSupplierScore(9000,8000,7000,6000)).toBe(7850));
});
