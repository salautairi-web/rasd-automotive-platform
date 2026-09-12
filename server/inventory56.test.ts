import { describe, expect, it } from "vitest";
import { agingRisk, availableQuantity, balanceConservation, canIssueInventory, canReserveInventory, interEntityRequired, landedCostTotal, replenishmentSuggestion } from "../shared/inventory56";
describe("Inventory 56 controls",()=>{
 it("conserves stock balance",()=>expect(balanceConservation(100,20,5,30,10,8,2)).toBe(95));
 it("blocks negative stock and respects reserved quantity",()=>{expect(canIssueInventory(10,3,0,7)).toBe(true);expect(canIssueInventory(10,3,0,8)).toBe(false);expect(canReserveInventory(10,3,0,7)).toBe(true);});
 it("requires explicit inter-entity transaction",()=>{expect(interEntityRequired(1,2)).toBe(true);expect(interEntityRequired(1,1)).toBe(false);});
 it("calculates landed cost and replenishment",()=>{expect(landedCostTotal(100,50,25,25)).toBe(200);expect(replenishmentSuggestion(3,10,20,2)).toBe(17);});
 it("classifies aging and expiry risk",()=>{expect(agingRisk(10,20)).toBe("expiry_risk");expect(agingRisk(190,undefined)).toBe("dead_stock");expect(agingRisk(30,undefined)).toBe("normal");});
});
