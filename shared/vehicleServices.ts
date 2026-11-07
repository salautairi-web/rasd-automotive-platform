export const vehicleServiceTypes = [
  { key: "oil_filter", label: "تغيير الزيت والفلتر", intervalKm: 10000, intervalMiles: 6200, intervalMonths: 6 },
  { key: "periodic_inspection", label: "فحص دوري شامل", intervalKm: 15000, intervalMiles: 9300, intervalMonths: 12 },
  { key: "brakes", label: "فحص وصيانة الفرامل", intervalKm: 20000, intervalMiles: 12400, intervalMonths: 12 },
  { key: "tires", label: "فحص وترصيص الإطارات", intervalKm: 10000, intervalMiles: 6200, intervalMonths: 6 },
  { key: "battery", label: "فحص البطارية والكهرباء", intervalKm: 20000, intervalMiles: 12400, intervalMonths: 12 },
  { key: "air_conditioning", label: "صيانة المكيف", intervalKm: 30000, intervalMiles: 18600, intervalMonths: 12 },
  { key: "transmission", label: "خدمة ناقل الحركة", intervalKm: 60000, intervalMiles: 37200, intervalMonths: 24 },
  { key: "suspension", label: "فحص نظام التعليق", intervalKm: 30000, intervalMiles: 18600, intervalMonths: 12 },
  { key: "diagnostics", label: "فحص كمبيوتر وتشخيص أعطال", intervalKm: 15000, intervalMiles: 9300, intervalMonths: 12 },
  { key: "body_repair", label: "إصلاح هيكل ودهان", intervalKm: 0, intervalMiles: 0, intervalMonths: 0 },
] as const;

export type VehicleServiceType = (typeof vehicleServiceTypes)[number]["key"];

export const vehicleServiceLabel = (key: string) =>
  vehicleServiceTypes.find(service => service.key === key)?.label ?? "خدمة صيانة";
