import { describe, expect, it } from "vitest";
import { filterOrganizationNodes, organizationChildren, organizationRoots } from "../shared/orgChart";

const nodes = [
  { id: 1, parentUnitId: null, unitCode: "HQ", nameAr: "المقر الرئيسي", unitType: "company", employeeCount: 2, hasChildren: true },
  { id: 2, parentUnitId: 1, unitCode: "SALES", nameAr: "المبيعات", unitType: "department", employeeCount: 1, hasChildren: false },
  { id: 3, parentUnitId: 1, unitCode: "WORKSHOP", nameAr: "الورشة", unitType: "department", employeeCount: 1, hasChildren: false },
];

describe("organization chart helpers", () => {
  it("returns only roots for the filtered graph", () => { expect(organizationRoots(nodes).map(node => node.id)).toEqual([1]); expect(organizationRoots(nodes.filter(node => node.id !== 1)).map(node => node.id)).toEqual([2, 3]); });
  it("filters by Arabic name and unit type", () => { expect(filterOrganizationNodes(nodes, "ورشة", "all").map(node => node.id)).toEqual([3]); expect(filterOrganizationNodes(nodes, "", "department").map(node => node.id)).toEqual([2, 3]); });
  it("returns direct children only", () => { expect(organizationChildren(nodes, 1).map(node => node.id)).toEqual([2, 3]); expect(organizationChildren(nodes, 2)).toEqual([]); });
});
