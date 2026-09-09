export type DeliveryResult44 = { retryable: boolean; nextAttempt: number; deadLetter: boolean };

export function classifyIntegrationError44(code: string): "validation" | "authentication" | "authorization" | "provider" | "timeout" | "business" {
  if (["400", "SCHEMA_VIOLATION", "VALIDATION"].includes(code)) return "validation";
  if (["401", "AUTHENTICATION"].includes(code)) return "authentication";
  if (["403", "AUTHORIZATION"].includes(code)) return "authorization";
  if (["408", "TIMEOUT"].includes(code)) return "timeout";
  if (["429", "500", "502", "503", "PROVIDER_UNAVAILABLE"].includes(code)) return "provider";
  return "business";
}

export function deliveryDecision44(attempts: number, maxAttempts: number, errorCode: string): DeliveryResult44 {
  const kind = classifyIntegrationError44(errorCode);
  const retryable = kind === "provider" || kind === "timeout";
  const nextAttempt = attempts + 1;
  return { retryable, nextAttempt, deadLetter: !retryable || nextAttempt >= maxAttempts };
}

export function isCompatibleSchema44(required: string[], payload: Record<string, unknown>) {
  return required.every((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

export function canMutateSourceSystem44(role: string, sourceSystem: string) {
  return role === "admin" && sourceSystem.length >= 2;
}
