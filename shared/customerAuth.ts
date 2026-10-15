import { z } from "zod";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const letters = new RegExp("\\p{L}", "u");
const numbers = new RegExp("\\p{N}", "u");
function asciiDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => {
    const index = ARABIC_DIGITS.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN_DIGITS.indexOf(digit));
  });
}
export function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}
export function normalizeCustomerPhone(
  phone: string,
  defaultCountryCode = "+968"
) {
  let value = asciiDigits(phone)
    .trim()
    .replace(/[\s().-]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (/^\d{8}$/.test(value)) value = `${defaultCountryCode}${value}`;
  return /^\+[1-9]\d{7,14}$/.test(value) ? value : "";
}
export function passwordIssue(password: string): string | null {
  if (password.length < 12)
    return "كلمة المرور يجب أن تحتوي على 12 محرفاً على الأقل";
  if (password.length > 128) return "كلمة المرور يجب ألا تتجاوز 128 محرفاً";
  if (!letters.test(password)) return "أضف حرفاً إلى كلمة المرور";
  if (!numbers.test(password)) return "أضف رقماً إلى كلمة المرور";
  return null;
}
const passwordSchema = z
  .string()
  .min(12, "كلمة المرور قصيرة؛ الحد الأدنى 12 محرفاً")
  .max(128, "كلمة المرور طويلة جداً")
  .refine(password => passwordIssue(password) === null, {
    message: "كلمة المرور تحتاج حرفاً ورقماً على الأقل",
  });
const emailSchema = z
  .string()
  .max(254, "البريد الإلكتروني طويل جداً")
  .transform(normalizeCustomerEmail)
  .pipe(z.string().email("أدخل بريداً إلكترونياً صحيحاً"));
const phoneSchema = z
  .string()
  .max(40, "رقم الجوال طويل جداً")
  .transform(value => normalizeCustomerPhone(value))
  .refine(phone => Boolean(phone), {
    message: "أدخل جوالاً صحيحاً: 8 أرقام للعُمان، أو رقم دولي مع رمز الدولة",
  });
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "أدخل الاسم الكامل")
      .max(180, "الاسم طويل جداً"),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().max(128, "تأكيد كلمة المرور طويل جداً"),
    businessEntityId: z.number().int().positive("اختر شركة الخدمة"),
    acceptTerms: z.literal(true, {
      message: "يلزم الموافقة على إنشاء حساب الخدمة",
    }),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "تأكيد كلمة المرور غير مطابق",
      });
  });
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "أدخل الجوال أو البريد الإلكتروني")
    .max(254, "بيانات الدخول طويلة جداً")
    .transform(value =>
      value.includes("@")
        ? normalizeCustomerEmail(value)
        : normalizeCustomerPhone(value)
    )
    .refine(value => Boolean(value), {
      message: "أدخل الجوال أو البريد الإلكتروني بشكل صحيح",
    }),
  password: z
    .string()
    .min(1, "أدخل كلمة المرور")
    .max(128, "كلمة المرور طويلة جداً"),
});
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "أدخل كلمة المرور الحالية")
      .max(128, "كلمة المرور طويلة جداً"),
    newPassword: passwordSchema,
    confirmPassword: z.string().max(128, "تأكيد كلمة المرور طويل جداً"),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "تأكيد كلمة المرور غير مطابق",
      });
    if (value.currentPassword === value.newPassword)
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "اختر كلمة مرور جديدة مختلفة عن الحالية",
      });
  });
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type CustomerRegistrationEntityStatus =
  | "active"
  | "inactive"
  | "planned"
  | "archived";

export function canEnableCustomerRegistration(
  status: CustomerRegistrationEntityStatus
) {
  return status === "active";
}
