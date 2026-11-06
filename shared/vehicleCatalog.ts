export const VEHICLE_CATALOG = [
  { key: "Toyota", label: "تويوتا", models: ["Camry", "Corolla", "Land Cruiser", "Hilux", "RAV4", "Yaris", "Fortuner", "Prado"] },
  { key: "Hyundai", label: "هيونداي", models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Accent", "Kona", "Palisade", "Staria"] },
  { key: "Kia", label: "كيا", models: ["Cerato", "K5", "Sportage", "Sorento", "Seltos", "Telluride", "Carnival", "Picanto"] },
  { key: "Nissan", label: "نيسان", models: ["Sunny", "Altima", "Maxima", "Patrol", "X-Trail", "Pathfinder", "Kicks", "Navara"] },
  { key: "Mitsubishi", label: "ميتسوبيشي", models: ["Pajero", "Outlander", "ASX", "Lancer", "Eclipse Cross", "Attrage", "Triton"] },
  { key: "Honda", label: "هوندا", models: ["Accord", "Civic", "CR-V", "Pilot", "HR-V", "City"] },
  { key: "Ford", label: "فورد", models: ["Explorer", "Expedition", "Everest", "Ranger", "F-150", "Mustang", "Edge"] },
  { key: "Chevrolet", label: "شفروليه", models: ["Tahoe", "Suburban", "Traverse", "Captiva", "Malibu", "Camaro", "Silverado"] },
  { key: "GMC", label: "جي إم سي", models: ["Yukon", "Terrain", "Acadia", "Sierra", "Canyon"] },
  { key: "Lexus", label: "لكزس", models: ["ES", "LS", "IS", "RX", "GX", "LX", "NX", "UX"] },
  { key: "Mercedes-Benz", label: "مرسيدس بنز", models: ["C-Class", "E-Class", "S-Class", "A-Class", "GLC", "GLE", "G-Class", "Sprinter"] },
  { key: "BMW", label: "بي إم دبليو", models: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7"] },
  { key: "Audi", label: "أودي", models: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "Q8"] },
  { key: "Volkswagen", label: "فولكس واجن", models: ["Golf", "Passat", "Tiguan", "Touareg", "Teramont", "Caddy"] },
  { key: "Land Rover", label: "لاند روفر", models: ["Range Rover", "Range Rover Sport", "Defender", "Discovery", "Evoque"] },
  { key: "Jeep", label: "جيب", models: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"] },
  { key: "Geely", label: "جيلي", models: ["Emgrand", "Coolray", "Monjaro", "Azkarra"] },
  { key: "MG", label: "إم جي", models: ["5", "6", "ZS", "HS", "RX5", "GT"] },
  { key: "BYD", label: "بي واي دي", models: ["Atto 3", "Han", "Seal", "Song Plus", "Qin"] },
  { key: "Other", label: "أخرى / إدخال يدوي", models: ["إدخال يدوي"] },
] as const;

export const VEHICLE_TYPES = [
  { key: "sedan", label: "سيدان" },
  { key: "suv", label: "SUV / دفع رباعي" },
  { key: "pickup", label: "بيك أب" },
  { key: "van", label: "فان / ميني فان" },
  { key: "hatchback", label: "هاتشباك" },
  { key: "coupe", label: "كوبيه" },
  { key: "convertible", label: "مكشوفة" },
  { key: "truck", label: "شاحنة" },
  { key: "motorcycle", label: "دراجة نارية" },
  { key: "other", label: "أخرى" },
] as const;

export const VEHICLE_COLORS = [
  "أبيض", "أسود", "فضي", "رمادي", "أحمر", "أزرق", "أخضر", "بني", "بيج", "ذهبي", "برتقالي", "أصفر", "بنفسجي", "أخرى / إدخال يدوي",
] as const;

export const PLATE_COUNTRIES = [
  { key: "OM", label: "سلطنة عُمان", hint: "من 2 إلى 8 محارف" },
  { key: "AE", label: "الإمارات العربية المتحدة", hint: "من 2 إلى 10 محارف" },
  { key: "SA", label: "المملكة العربية السعودية", hint: "من 2 إلى 8 محارف" },
  { key: "QA", label: "قطر", hint: "من 2 إلى 8 محارف" },
  { key: "BH", label: "البحرين", hint: "من 2 إلى 8 محارف" },
  { key: "KW", label: "الكويت", hint: "من 2 إلى 10 محارف" },
  { key: "OTHER", label: "دولة أخرى", hint: "أرقام وحروف، من 2 إلى 20 محرفاً" },
] as const;

export type VehicleCatalogMake = (typeof VEHICLE_CATALOG)[number]["key"];
export type VehicleType = (typeof VEHICLE_TYPES)[number]["key"];
export type PlateCountry = (typeof PLATE_COUNTRIES)[number]["key"];

const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const PLATE_RULES: Record<PlateCountry, { min: number; max: number }> = {
  OM: { min: 2, max: 8 },
  AE: { min: 2, max: 10 },
  SA: { min: 2, max: 8 },
  QA: { min: 2, max: 8 },
  BH: { min: 2, max: 8 },
  KW: { min: 2, max: 10 },
  OTHER: { min: 2, max: 20 },
};
export function normalizePlate(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, digit => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String(persianDigits.indexOf(digit)))
    .replace(/\s+/g, " ");
}

export function validatePlateNumber(value: string, country: PlateCountry) {
  const plate = normalizePlate(value);
  if (!plate) return { valid: true, message: "" };
  const rule = PLATE_RULES[country] ?? PLATE_RULES.OTHER;
  if (plate.length < rule.min || plate.length > rule.max) return { valid: false, message: `صيغة لوحة الدولة المختارة تقبل من ${rule.min} إلى ${rule.max} محارف.` };
  if (!/^[A-Za-z0-9\u0600-\u06FF -]+$/.test(plate)) return { valid: false, message: "يسمح في اللوحة بالأرقام والحروف والمسافة والشرطة فقط." };
  return { valid: true, message: "" };
}
