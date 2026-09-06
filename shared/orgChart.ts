export type OrganizationChartNode = {
  id: number;
  parentUnitId: number | null;
  unitCode: string;
  nameAr: string;
  unitType: string;
  employeeCount: number;
  hasChildren: boolean;
};

export function filterOrganizationNodes<T extends OrganizationChartNode>(nodes: T[], query: string, unitType: string): T[] {
  const normalized = query.trim().toLocaleLowerCase("ar");
  return nodes.filter(node => (unitType === "all" || node.unitType === unitType) && (!normalized || node.nameAr.toLocaleLowerCase("ar").includes(normalized) || node.unitCode.toLocaleLowerCase().includes(normalized)));
}

export function organizationRoots<T extends OrganizationChartNode>(nodes: T[]): T[] {
  const ids = new Set(nodes.map(node => node.id));
  return nodes.filter(node => !node.parentUnitId || !ids.has(node.parentUnitId));
}

export function organizationChildren<T extends OrganizationChartNode>(nodes: T[], parentId: number): T[] {
  return nodes.filter(node => node.parentUnitId === parentId);
}
