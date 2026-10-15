import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { passwordIssue } from "../../../shared/customerAuth";
export default function CustomerRecoveryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const availability = trpc.customerVerification.availability.useQuery(
    undefined,
    { enabled: open, retry: false }
  );
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    expiresAt: number;
    resendAt: number;
  } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const start = trpc.customerVerification.requestReset.useMutation({
    onSuccess: r => {
      setChallenge(r);
      setError("");
      toast.info(r.message);
    },
    onError: e => setError(e.message),
  });
  const finish = trpc.customerVerification.completeReset.useMutation({
    onSuccess: r => {
      toast.success(r.message);
      setPassword("");
      setConfirm("");
      setCode("");
      setChallenge(null);
      onOpenChange(false);
    },
    onError: e => {
      setPassword("");
      setConfirm("");
      setError(e.message);
    },
  });
  const pending = start.isPending || finish.isPending;
  const close = (next: boolean) => {
    if (pending) return;
    if (!next) {
      setCode("");
      setPassword("");
      setConfirm("");
      setChallenge(null);
      setError("");
    }
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader className="text-right">
          <DialogTitle>استعادة كلمة المرور</DialogTitle>
          <DialogDescription>
            تصل التعليمات إلى وسيلة اتصال سبق توثيق ملكيتها فقط، ولا نكشف وجود
            حساب بهذا المعرف.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
          >
            {error}
          </p>
        )}
        {!challenge ? (
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              setError("");
              start.mutate({ identifier, channel });
            }}
          >
            <div>
              <Label htmlFor="recovery-identifier">
                الجوال أو البريد لاستعادة الحساب
              </Label>
              <Input
                id="recovery-identifier"
                dir="ltr"
                className="mt-2 text-left"
                autoComplete="username"
                value={identifier}
                maxLength={254}
                required
                onChange={e => setIdentifier(e.target.value)}
                disabled={pending}
              />
            </div>
            <div>
              <Label htmlFor="recovery-channel">
                وسيلة استلام رمز الاستعادة
              </Label>
              <select
                id="recovery-channel"
                value={channel}
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3"
                onChange={e => setChannel(e.target.value as "email" | "sms")}
                disabled={pending}
              >
                <option value="email">البريد الإلكتروني</option>
                <option value="sms">رسالة الجوال</option>
              </select>
            </div>
            {availability.isLoading ? (
              <p role="status" className="text-sm">
                فحص وسائل الإرسال…
              </p>
            ) : availability.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                تعذر فحص إعداد الإرسال.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void availability.refetch()}
                >
                  إعادة المحاولة
                </button>
              </p>
            ) : (
              !availability.data?.[channel] && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-800">
                  وسيلة الإرسال المختارة غير مهيأة حالياً. لا توجد رموز تجريبية
                  أو استعادة يدوية دون تحقق؛ تواصل مع فريق الشركة.
                </p>
              )
            )}
            <Button
              className="min-h-11 w-full"
              disabled={pending || !availability.data?.[channel]}
            >
              {start.isPending
                ? "جارٍ طلب الاستعادة…"
                : "إرسال تعليمات الاستعادة"}
            </Button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              const issue = passwordIssue(password);
              if (issue || password !== confirm) {
                setError(issue ?? "تأكيد كلمة المرور غير مطابق");
                return;
              }
              setError("");
              finish.mutate({
                challengeId: challenge.challengeId,
                code,
                newPassword: password,
                confirmPassword: confirm,
              });
            }}
          >
            <p
              role="status"
              className="rounded-xl bg-blue-50 p-3 text-sm leading-7"
            >
              إن استوفى الحساب الشروط فستصلك رسالة. الرمز صالح 10 دقائق
              وللاستخدام مرة واحدة. نجاح الاستعادة يغلق جميع جلسات الحساب؛ لا
              يسجل الدخول تلقائياً.
            </p>
            <div>
              <Label htmlFor="recovery-code">رمز استعادة كلمة المرور</Label>
              <Input
                id="recovery-code"
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                maxLength={10}
                pattern="[0-9]{4,10}"
                required
                className="mt-2 text-left tracking-widest"
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
                disabled={pending}
              />
            </div>
            <div>
              <Label htmlFor="recovery-password">
                كلمة المرور الجديدة للاستعادة
              </Label>
              <Input
                id="recovery-password"
                dir="ltr"
                type="password"
                autoComplete="new-password"
                value={password}
                minLength={12}
                maxLength={128}
                required
                className="mt-2 text-left"
                onChange={e => setPassword(e.target.value)}
                disabled={pending}
              />
            </div>
            <div>
              <Label htmlFor="recovery-confirm">
                تأكيد كلمة المرور للاستعادة
              </Label>
              <Input
                id="recovery-confirm"
                dir="ltr"
                type="password"
                autoComplete="new-password"
                value={confirm}
                maxLength={128}
                required
                className="mt-2 text-left"
                onChange={e => setConfirm(e.target.value)}
                disabled={pending}
              />
            </div>
            <Button className="min-h-11 w-full" disabled={pending}>
              {finish.isPending
                ? "جارٍ تأمين الحساب…"
                : "تغيير كلمة المرور واستعادة الحساب"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => {
                setChallenge(null);
                setCode("");
                setPassword("");
                setConfirm("");
              }}
            >
              طلب تعليمات جديدة
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
