export function canEnterRentalGateway(input: {
  isAdmin: boolean;
  hasActiveEntityMembership: boolean;
  businessEntityId: unknown;
}): boolean {
  if (input.isAdmin) return true;
  return input.hasActiveEntityMembership && typeof input.businessEntityId === "number" && Number.isInteger(input.businessEntityId) && input.businessEntityId > 0;
}
