import CustomerRecoveryDialog from "./CustomerRecoveryDialog";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  CarFront,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  registerSchema,
  loginSchema,
  passwordIssue,
} from "../../../shared/customerAuth";

export default function CustomerAccessPanel({
  onAuthenticated,
  initialMode = "login",
}: {
  onAuthenticated: () => Promise<unknown> | void;
  initialMode?: "login" | "register";
}) {
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [entityId, setEntityId] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const entities = trpc.customerAuth.entities.useQuery(undefined, {
    retry: false,
    refetchInterval: 15000,
    staleTime: 5000,
  });
  const authenticated = async () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    await onAuthenticated();
  };
  const login = trpc.customerAuth.login.useMutation({
    onSuccess: authenticated,
    onError: e => {
      setPassword("");
      setError(
        e.message === "طلب غير مسموح"
          ? "تعذر التحقق من أمان الجلسة. أعد تحميل الصفحة ثم حاول مرة أخرى."
          : e.message
      );
    },
  });
  const register = trpc.customerAuth.register.useMutation({
    onSuccess: authenticated,
    onError: e => {
      setPassword("");
      setConfirmPassword("");
      setError(
        e.message === "طلب غير مسموح"
          ? "تعذر التحقق من أمان الجلسة. أعد تحميل الصفحة ثم حاول مرة أخرى."
          : e.message
      );
    },
  });
  const pending = login.isPending || register.isPending;
  const selectedEntity =
    entityId ||
    (entities.data?.length === 1 ? String(entities.data[0].id) : "");
  const changeMode = (next: "login" | "register") => {
    if (pending) return;
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "login") {
      const parsed = loginSchema.safeParse({ identifier, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "راجع بيانات الدخول.");
        return;
      }
      login.mutate(parsed.data);
    } else {
      const parsed = registerSchema.safeParse({
        name,
        email,
        phone,
        password,
        confirmPassword,
        businessEntityId: Number(selectedEntity),
        acceptTerms,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "أكمل الحقول المطلوبة.");
        return;
      }
      register.mutate(parsed.data);
    }
  };
  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
          <Link
            href="/customer-portal"
            className="text-xl font-bold tracking-tight"
          >
            RASD <span className="mx-2 text-cyan-600">/</span>
            <span className="text-sm font-medium text-slate-600">
              خدمات العملاء
            </span>
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            مساحة العميل الآمنة
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-7 sm:px-8 sm:py-12 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <section className="order-2 rounded-3xl bg-gradient-to-bl from-[#14213d] via-[#193b70] to-[#087f8c] p-6 text-white sm:p-9 lg:order-1">
          <p className="text-xs font-semibold tracking-wider text-cyan-200">
            RASD · CUSTOMER EXPERIENCE
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-snug sm:text-4xl">
            حسابك، وبداية كل خدماتك
          </h1>
          <p className="mt-4 text-sm leading-8 text-blue-100">
            سجّل حسابك برقم الجوال والبريد الإلكتروني، ثم تابع طلباتك وحجوزاتك
            وتواصل مع فريق الشركة من مكان واحد.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <CarFront className="text-cyan-200" size={23} />
              <h2 className="mt-3 text-sm font-semibold">التأجير والمبيعات</h2>
              <p className="mt-2 text-xs leading-6 text-blue-100">
                أرسل طلبك وتابع حالته.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <Wrench className="text-cyan-200" size={23} />
              <h2 className="mt-3 text-sm font-semibold">الورشة وقطع الغيار</h2>
              <p className="mt-2 text-xs leading-6 text-blue-100">
                اطلب الخدمة وتواصل مع الفريق.
              </p>
            </div>
          </div>
          <div className="mt-7 rounded-2xl border border-white/15 p-4 text-xs leading-7 text-blue-100">
            <ShieldCheck className="mb-2 text-cyan-200" size={20} />
            حساب العميل مستقل عن حسابات الموظفين، ولا يمنح صلاحيات إدارية.
            بيانات سجلات العملاء السابقين لا تُربط بمجرد كتابة جوالهم أو بريدهم.
          </div>
        </section>
        <section
          className="order-1 min-w-0 rounded-3xl bg-white p-5 shadow-[0_12px_45px_-22px_#17385d55] sm:p-8 lg:order-2"
          aria-label="حساب العميل"
        >
          <div
            className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="خيارات حساب العميل"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              disabled={pending}
              className={`min-h-11 rounded-lg text-sm font-medium ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => changeMode("login")}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              disabled={pending}
              className={`min-h-11 rounded-lg text-sm font-medium ${mode === "register" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => changeMode("register")}
            >
              إنشاء حساب جديد
            </button>
          </div>
          <h2 className="mt-6 text-2xl font-semibold">
            {mode === "login" ? "أهلاً بعودتك" : "لنبدأ بحسابك الجديد"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {mode === "login"
              ? "استخدم الجوال أو البريد الإلكتروني وكلمة المرور."
              : "أدخل بياناتك الشخصية واختر شركة الخدمة."}
          </p>
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-7 text-rose-800"
            >
              {error}
            </div>
          )}
          <form
            onSubmit={submit}
            className="mt-5 space-y-4"
            aria-busy={pending}
          >
            {mode === "register" ? (
              <>
                <div>
                  <Label htmlFor="customer-name">الاسم الكامل</Label>
                  <Input
                    id="customer-name"
                    autoComplete="name"
                    className="mt-2 h-11"
                    required
                    minLength={2}
                    maxLength={180}
                    value={name}
                    disabled={pending}
                    onChange={e => {
                      setError("");
                      setName(e.target.value);
                    }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="customer-email"
                      className="inline-flex items-center gap-2"
                    >
                      <Mail size={14} />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="customer-email"
                      type="email"
                      autoComplete="email"
                      dir="ltr"
                      className="mt-2 h-11 text-left"
                      placeholder="name@example.com"
                      required
                      maxLength={254}
                      value={email}
                      disabled={pending}
                      onChange={e => {
                        setError("");
                        setEmail(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="customer-phone"
                      className="inline-flex items-center gap-2"
                    >
                      <Phone size={14} />
                      رقم الجوال
                    </Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      autoComplete="tel"
                      dir="ltr"
                      className="mt-2 h-11 text-left"
                      placeholder="+968 9XXXXXXX"
                      required
                      maxLength={40}
                      value={phone}
                      disabled={pending}
                      onChange={e => {
                        setError("");
                        setPhone(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <p className="-mt-2 text-xs leading-6 text-slate-400">
                  للجوال العماني يمكنك إدخال 8 أرقام، وللدول الأخرى أضف رمز
                  الدولة.
                </p>
                <div>
                  <Label htmlFor="customer-company">شركة الخدمة</Label>
                  <select
                    id="customer-company"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                    value={selectedEntity}
                    required
                    disabled={pending || entities.isLoading || entities.isError}
                    onChange={e => {
                      setError("");
                      setEntityId(e.target.value);
                    }}
                  >
                    <option value="">
                      {entities.isLoading ? "تحميل الشركات…" : "اختر الشركة"}
                    </option>
                    {entities.data?.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.nameAr}
                      </option>
                    ))}
                  </select>
                  {entities.isError && (
                    <p role="alert" className="mt-2 text-xs text-rose-600">
                      تعذر تحميل شركات الخدمة.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void entities.refetch()}
                      >
                        إعادة المحاولة
                      </button>
                    </p>
                  )}
                  {!entities.isLoading &&
                    !entities.isError &&
                    !entities.data?.length && (
                      <p className="mt-2 text-xs text-amber-700">
                        لا توجد شركة خدمة مهيأة للتسجيل حالياً. يرجى التواصل مع
                        الشركة.
                      </p>
                    )}
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="customer-identifier">
                  الجوال أو البريد الإلكتروني
                </Label>
                <Input
                  id="customer-identifier"
                  autoComplete="username"
                  dir="ltr"
                  className="mt-2 h-11 text-left"
                  required
                  maxLength={254}
                  value={identifier}
                  disabled={pending}
                  onChange={e => {
                    setError("");
                    setIdentifier(e.target.value);
                  }}
                />
              </div>
            )}
            <div>
              <Label
                htmlFor="customer-password"
                className="inline-flex items-center gap-2"
              >
                <LockKeyhole size={14} />
                كلمة المرور
              </Label>
              <div className="relative mt-2">
                <Input
                  id="customer-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  dir="ltr"
                  className="h-11 pl-12 text-left"
                  required
                  minLength={mode === "register" ? 12 : 1}
                  maxLength={128}
                  value={password}
                  disabled={pending}
                  onChange={e => {
                    setError("");
                    setPassword(e.target.value);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1 h-9 w-9"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </Button>
              </div>
              {mode === "register" && (
                <p
                  className={`mt-2 text-xs leading-6 ${password && passwordIssue(password) ? "text-amber-700" : "text-slate-400"}`}
                >
                  12 إلى 128 محرفاً، تتضمن حرفاً ورقماً على الأقل.
                </p>
              )}
            </div>
            {mode === "register" && (
              <>
                <div>
                  <Label htmlFor="customer-confirm-password">
                    تأكيد كلمة المرور
                  </Label>
                  <Input
                    id="customer-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    dir="ltr"
                    className="mt-2 h-11 text-left"
                    required
                    maxLength={128}
                    value={confirmPassword}
                    disabled={pending}
                    onChange={e => {
                      setError("");
                      setConfirmPassword(e.target.value);
                    }}
                  />
                </div>
                <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-7 text-slate-600">
                  <Checkbox
                    aria-label="الموافقة على إنشاء حساب العميل واستخدام البيانات للخدمة"
                    className="mt-1"
                    checked={acceptTerms}
                    disabled={pending}
                    onCheckedChange={v => setAcceptTerms(v === true)}
                  />
                  <span>
                    أوافق على إنشاء حساب باسمي واستخدام بيانات الاتصال لإدارة
                    طلباتي لدى الشركة. أدرك أن طلب الخدمة لا يعد حجزاً مؤكداً أو
                    عملية دفع.
                  </span>
                </label>
              </>
            )}
            <Button
              className="h-12 w-full text-sm"
              disabled={
                pending ||
                (mode === "register" &&
                  (!acceptTerms || !selectedEntity || !entities.data?.length))
              }
            >
              {pending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  جارٍ التحقق…
                </>
              ) : mode === "login" ? (
                "الدخول إلى خدمات الشركة"
              ) : (
                "إنشاء الحساب والدخول"
              )}
            </Button>
          </form>
          {mode === "login" && (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 min-h-11 w-full text-blue-700"
              onClick={() => setRecoveryOpen(true)}
              disabled={pending}
            >
              نسيت كلمة المرور؟
            </Button>
          )}
          <CustomerRecoveryDialog
            open={recoveryOpen}
            onOpenChange={setRecoveryOpen}
          />
          <p className="mt-5 text-xs leading-7 text-slate-400">
            لا تشارك كلمة المرور. ربط سجلات سابقة أو استعادة حساب يحتاج التحقق
            من ملكية وسيلة اتصال موثقة؛ لن نكشف سجلات اعتماداً على بيانات اتصال
            غير متحققة.
          </p>
        </section>
      </div>
    </main>
  );
}
