export type RentalNotificationType = "reservation" | "contract" | "deposit" | "invoice";

export function rentalNotificationLabel(type: RentalNotificationType) {
  return ({ reservation: "حجز", contract: "عقد", deposit: "وديعة", invoice: "فاتورة" })[type];
}

export function requiresRentalFinancialMfa(input: { isAdmin: boolean; roleKey: string }) {
  if (input.isAdmin) return false;
  const role = input.roleKey.toLowerCase();
  return role === "accountant" || role === "rental_manager" || role.includes("finance");
}
