export const entityStatuses = [
  "planned",
  "active",
  "inactive",
  "archived",
] as const;

export type EntityStatus = (typeof entityStatuses)[number];

const transitions: Record<EntityStatus, readonly EntityStatus[]> = {
  planned: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
};

export function canTransitionEntityStatus(
  from: EntityStatus,
  to: EntityStatus
) {
  return from !== to && transitions[from].includes(to);
}

export function entityStatusLabel(status: EntityStatus) {
  return {
    planned: "مخطط",
    active: "نشط",
    inactive: "متوقف",
    archived: "مؤرشف",
  }[status];
}

export function entityStatusReason(from: EntityStatus, to: EntityStatus) {
  if (from === "archived") return "الكيان مؤرشف ولا يمكن تغيير حالته";
  if (from === to) return "الحالة الجديدة مطابقة للحالة الحالية";
  if (!canTransitionEntityStatus(from, to)) {
    return `لا يمكن الانتقال من ${entityStatusLabel(from)} إلى ${entityStatusLabel(to)}`;
  }
  return null;
}

export function canAutoLinkBranches(
  entityCountForOrganization: number,
  requestedEntityIsKnown: boolean
) {
  return requestedEntityIsKnown && entityCountForOrganization <= 1;
}
