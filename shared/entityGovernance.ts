export type OperationalImpact = {
  reservations: number;
  contracts: number;
  invoices: number;
};

export function operationalImpactTotal(impact: OperationalImpact) {
  return impact.reservations + impact.contracts + impact.invoices;
}

export function requiresOperationalAcknowledgement(
  targetStatus: "active" | "inactive" | "planned" | "archived",
  impact: OperationalImpact,
  acknowledged: boolean
) {
  return ["inactive", "archived"].includes(targetStatus) && operationalImpactTotal(impact) > 0 && !acknowledged;
}

export function canTransferBranch({
  branchStatus,
  targetStatus,
  isSameEntity,
  acknowledged,
}: {
  branchStatus: "active" | "inactive";
  targetStatus: "active" | "inactive" | "planned" | "archived";
  isSameEntity: boolean;
  acknowledged: boolean;
}) {
  if (isSameEntity) return { allowed: false, reason: "same_entity" as const };
  if (targetStatus !== "active") return { allowed: false, reason: "target_not_active" as const };
  if (branchStatus !== "active" && !acknowledged) return { allowed: false, reason: "inactive_branch_ack_required" as const };
  return { allowed: true as const };
}
