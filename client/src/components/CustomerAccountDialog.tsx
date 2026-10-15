import CustomerVerificationPanel from "./CustomerVerificationPanel";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "../../../shared/customerAuth";

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};
export default function CustomerAccountDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const change = trpc.customerAuth.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      toast.success("تم تغيير كلمة المرور وإغلاق الجلسات الأخرى.");
      void utils.customerAuth.me.invalidate();
      onOpenChange(false);
    },
    onError: e => {
      setCurrentPassword("");
      setError(e.message);
    },
  });
  const close = (next: boolean) => {
    if (change.isPending) return;
    if (!next) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
    onOpenChange(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "راجع كلمة المرور الجديدة.");
      return;
    }
    change.mutate(parsed.data);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader className="text-right">
          <DialogTitle>حسابي وأمان الدخول</DialogTitle>
          <DialogDescription>
            بيانات الحساب وتغيير كلمة المرور دون منح صلاحيات إدارية.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <strong>{profile.name}</strong>
          <p dir="ltr" className="break-all text-right">
            {profile.email}
          </p>
          <p dir="ltr" className="text-right">
            {profile.phone}
          </p>
          <p className="text-xs leading-6 text-amber-700">
            {profile.emailVerified && profile.phoneVerified
              ? "بيانات الاتصال متحققة."
              : "أكمل توثيق كل وسيلة اتصال باستخدام رمز يصل إليها قبل طلب الربط بسجل سابق."}
          </p>
        </div>
        <CustomerVerificationPanel />
        <form onSubmit={submit} className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={17} className="text-blue-600" />
            تغيير كلمة المرور
          </h2>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
            >
              {error}
            </p>
          )}
          <div>
            <Label htmlFor="customer-current-password">
              كلمة المرور الحالية
            </Label>
            <Input
              id="customer-current-password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              className="mt-2 text-left"
              required
              maxLength={128}
              disabled={change.isPending}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customer-new-password">كلمة المرور الجديدة</Label>
            <Input
              id="customer-new-password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              className="mt-2 text-left"
              required
              minLength={12}
              maxLength={128}
              disabled={change.isPending}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customer-new-confirm">
              تأكيد كلمة المرور الجديدة
            </Label>
            <Input
              id="customer-new-confirm"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              className="mt-2 text-left"
              required
              maxLength={128}
              disabled={change.isPending}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <p className="text-xs leading-6 text-slate-500">
            12 محرفاً على الأقل مع حرف ورقم. يؤدي التغيير إلى إنهاء الجلسات
            السابقة، مع إبقاء دخولك الحالي بجلسة جديدة.
          </p>
          <Button className="w-full" disabled={change.isPending}>
            {change.isPending
              ? "جارٍ تأمين الحساب…"
              : "حفظ كلمة المرور الجديدة"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
