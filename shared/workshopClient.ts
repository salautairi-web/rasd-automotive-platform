import type { WorkshopJobStatus } from "./workshop59";

export const workshopStatusLabels: Record<WorkshopJobStatus, string> = {
  received: "استقبال",
  diagnosing: "تشخيص",
  awaiting_approval: "بانتظار موافقة العميل",
  awaiting_parts: "بانتظار قطع",
  in_progress: "قيد الإصلاح",
  qc: "فحص الجودة",
  road_test: "اختبار طريق",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
  closed: "مغلق",
  warranty_repeat: "عودة ضمان",
};
export const workshopNextStatuses: Record<
  WorkshopJobStatus,
  WorkshopJobStatus[]
> = {
  received: ["diagnosing"],
  diagnosing: ["awaiting_approval", "awaiting_parts", "in_progress"],
  awaiting_approval: ["awaiting_parts", "in_progress", "received"],
  awaiting_parts: ["in_progress"],
  in_progress: ["qc", "awaiting_parts", "warranty_repeat"],
  qc: ["road_test", "ready", "in_progress"],
  road_test: ["ready", "in_progress"],
  ready: [],
  delivered: ["closed", "warranty_repeat"],
  closed: ["warranty_repeat"],
  warranty_repeat: ["diagnosing", "in_progress"],
};
export function workshopCurrencyDigits(currency: string) {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}
export function parseWorkshopMoney(
  value: string,
  currency: string
): number | null {
  const digits = workshopCurrencyDigits(currency);
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const [whole, decimal = ""] = trimmed.split(".");
  if (decimal.length > digits) return null;
  const minor =
    Number(whole) * 10 ** digits + Number(decimal.padEnd(digits, "0"));
  return Number.isSafeInteger(minor) && minor >= 0 && minor <= 2000000000
    ? minor
    : null;
}
export function formatWorkshopMoney(
  minor: number | null | undefined,
  currency: string
) {
  const amount =
    (Number.isFinite(minor) ? minor! : 0) /
    10 ** workshopCurrencyDigits(currency);
  try {
    return new Intl.NumberFormat("ar-OM", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("ar-OM")} ${currency}`;
  }
}
export function workshopRequestKey(kind: string) {
  const unique =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `ws-${kind}-${unique}`;
}
export function filterWorkshopJobs<
  T extends {
    jobNo: string;
    status: string;
    customerId: number;
    vehicleId: number;
  },
>(
  jobs: readonly T[],
  search: string,
  status: string,
  customerName: (id: number) => string,
  vehicleName: (id: number) => string
): T[] {
  const term = search.trim().toLocaleLowerCase();
  return jobs.filter(
    job =>
      (status === "all" || job.status === status) &&
      (!term ||
        `${job.jobNo} ${customerName(job.customerId)} ${vehicleName(job.vehicleId)}`
          .toLocaleLowerCase()
          .includes(term))
  );
}
export function validWorkshopInteger(value: string) {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= 2000000000
  );
}
