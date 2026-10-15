import { useState } from "react";
import { ShieldCheck, Mail, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
function VerifyContact({
  channel,
  verifiedAt,
  destination,
  available,
}: {
  channel: "email" | "sms";
  verifiedAt: Date | null;
  destination: string;
  available: boolean;
}) {
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    expiresAt: number;
    resendAt: number;
  } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const label = channel === "email" ? "البريد" : "الجوال";
  const send = trpc.customerVerification.send.useMutation({
    onSuccess: r => {
      setChallenge(r);
      setCode("");
      setError("");
      toast.success(`تم طلب إرسال رمز ${label}`);
    },
    onError: e => setError(e.message),
  });
  const confirm = trpc.customerVerification.confirm.useMutation({
    onSuccess: () => {
      setChallenge(null);
      setCode("");
      setError("");
      toast.success(`تم توثيق ${label}`);
      void utils.customerVerification.status.invalidate();
      void utils.customerAuth.me.invalidate();
    },
    onError: e => setError(e.message),
  });
  const pending = send.isPending || confirm.isPending;
  return (
    <section className="rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="flex items-center gap-2 text-sm">
          {channel === "email" ? <Mail size={16} /> : <Phone size={16} />}
          {label}
        </strong>
        <span
          className={`rounded-full px-2 py-1 text-xs ${verifiedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {verifiedAt ? "موثق" : "لم يُوثّق"}
        </span>
      </div>
      <p dir="ltr" className="mt-2 break-all text-right text-xs text-slate-500">
        {destination}
      </p>
      {verifiedAt && (
        <p className="mt-2 text-xs text-slate-500">
          آخر توثيق: {new Date(verifiedAt).toLocaleString("ar-OM")}
        </p>
      )}
      {!available && (
        <p className="mt-2 text-xs leading-6 text-amber-800">
          إرسال رموز {label} يحتاج إعداد مزود الشركة؛ غير متاح حالياً.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-700">
          {error}
        </p>
      )}
      {!challenge ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 min-h-11 w-full"
          disabled={pending || !available}
          onClick={() => send.mutate({ channel })}
        >
          {send.isPending
            ? "جارٍ الإرسال…"
            : verifiedAt
              ? `تجديد توثيق ${label}`
              : `إرسال رمز توثيق ${label}`}
        </Button>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={e => {
            e.preventDefault();
            setError("");
            confirm.mutate({ challengeId: challenge.challengeId, code });
          }}
        >
          <Label htmlFor={`verify-${channel}`}>رمز توثيق {label}</Label>
          <Input
            id={`verify-${channel}`}
            dir="ltr"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{4,10}"
            required
            maxLength={10}
            value={code}
            disabled={pending}
            onChange={e =>
              setCode(
                e.target.value.replace(/[٠-٩۰-۹]/g, d =>
                  String(
                    "٠١٢٣٤٥٦٧٨٩".includes(d)
                      ? "٠١٢٣٤٥٦٧٨٩".indexOf(d)
                      : "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
                  )
                )
              )
            }
            className="text-left tracking-widest"
          />
          <p className="text-xs leading-6 text-slate-500">
            الرمز صالح 10 دقائق، ولمرة واحدة، وبحد أقصى 5 محاولات. تجديد التوثيق
            مطلوب خلال 24 ساعة قبل اعتماد الربط السابق.
          </p>
          <Button className="min-h-11 w-full" disabled={pending}>
            {confirm.isPending ? "جارٍ فحص الرمز…" : `تأكيد توثيق ${label}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full"
            disabled={pending}
            onClick={() => {
              if (Date.now() < challenge.resendAt) {
                setError("انتظر دقيقة قبل إعادة الإرسال");
                return;
              }
              send.mutate({ channel });
            }}
          >
            إعادة إرسال الرمز
          </Button>
        </form>
      )}
    </section>
  );
}
export default function CustomerVerificationPanel() {
  const status = trpc.customerVerification.status.useQuery(undefined, {
    retry: false,
  });
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldCheck size={17} className="text-emerald-600" />
        توثيق بيانات الاتصال
      </h2>
      <p className="text-xs leading-7 text-slate-500">
        رمز التحقق يثبت ملكيتك لوسيلة الاتصال ولا يربط سجلاً قديماً تلقائياً. لا
        تشارك الرموز.
      </p>
      {status.isLoading ? (
        <p role="status" className="text-sm">
          تحميل حالة التوثيق…
        </p>
      ) : status.isError ? (
        <p role="alert" className="text-sm text-rose-700">
          تعذر تحميل حالة التوثيق.{" "}
          <button className="underline" onClick={() => void status.refetch()}>
            إعادة المحاولة
          </button>
        </p>
      ) : (
        status.data && (
          <div className="grid gap-3">
            <VerifyContact
              channel="email"
              verifiedAt={status.data.emailVerifiedAt}
              destination={status.data.email}
              available={status.data.delivery.email}
            />
            <VerifyContact
              channel="sms"
              verifiedAt={status.data.phoneVerifiedAt}
              destination={status.data.phone}
              available={status.data.delivery.sms}
            />
          </div>
        )
      )}
    </div>
  );
}
