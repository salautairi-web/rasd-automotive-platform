import { useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
const labels: Record<string, string> = {
  pending: "بانتظار مراجعة الهوية",
  approved: "تم اعتماد الربط",
  rejected: "لم يُعتمد الطلب",
  cancelled: "أُلغي الطلب",
};
export default function CustomerLinkRequestPanel({
  scope,
  onVerify,
}: {
  scope: {
    businessEntityId: number;
    relationshipId: number;
    entityName: string;
  };
  onVerify: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [customerNo, setCustomerNo] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const input = {
    businessEntityId: scope.businessEntityId,
    relationshipId: scope.relationshipId,
  };
  const proof = trpc.customerVerification.status.useQuery(undefined, {
    retry: false,
  });
  const mine = trpc.customerLinkReview.mine.useQuery(input, {
    retry: false,
    refetchInterval: 30000,
  });
  const request = trpc.customerLinkReview.request.useMutation({
    onSuccess: r => {
      toast.success(
        r.replay
          ? "يوجد طلب ربط مسجل لهذا الكيان؛ تم تحديث حالته."
          : "تم إرسال طلب الربط للمراجعة دون كشف أي سجل سابق."
      );
      setCustomerNo("");
      setNote("");
      setError("");
      void utils.customerLinkReview.mine.invalidate(input);
    },
    onError: e => setError(e.message),
  });
  const cancel = trpc.customerLinkReview.cancel.useMutation({
    onSuccess: () => {
      toast.success("أُلغي طلب الربط");
      void utils.customerLinkReview.mine.invalidate(input);
    },
    onError: e => setError(e.message),
  });
  const dualProof = Boolean(
    proof.data?.emailVerifiedAt && proof.data?.phoneVerifiedAt
  );
  const active = mine.data?.some(r =>
    ["pending", "approved"].includes(r.status)
  );
  return (
    <Card className="border-cyan-100 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 size={18} className="text-cyan-600" />
            ربط حسابي بسجل عميل سابق
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 text-cyan-700"
            aria-expanded={expanded}
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? "إخفاء التفاصيل" : "عرض الطلبات والربط"}
          </Button>
        </div>
        <p className="text-xs leading-7 text-slate-500">
          لديك تعاملات سابقة مع {scope.entityName}؟ الربط يحتاج توثيق البريد
          والجوال ومراجعة الهوية، ولا يحدث تلقائياً بمجرد تطابق الاسم.
        </p>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {!dualProof && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-900">
              <ShieldCheck size={18} className="mb-2" />
              أكمل توثيق البريد والجوال أولاً. يجب تجديد التوثيق خلال 24 ساعة
              قبل اعتماد المراجع.
              <Button
                type="button"
                variant="outline"
                className="mt-2 min-h-11 w-full sm:w-auto"
                onClick={onVerify}
              >
                فتح توثيق بيانات الاتصال
              </Button>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
            >
              {error}
            </p>
          )}
          {mine.isLoading ? (
            <p role="status" className="text-sm">
              تحميل طلبات الربط…
            </p>
          ) : mine.isError ? (
            <p role="alert" className="text-sm text-rose-700">
              تعذر تحميل طلبات هذا السياق.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => void mine.refetch()}
              >
                إعادة المحاولة
              </button>
            </p>
          ) : (
            <>
              {!active && (
                <form
                  className="space-y-3"
                  onSubmit={e => {
                    e.preventDefault();
                    setError("");
                    request.mutate({
                      ...input,
                      customerNo: customerNo.trim(),
                      requesterNote: note.trim(),
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="link-customer-no">
                        رقم العميل السابق لدى الشركة
                      </Label>
                      <Input
                        id="link-customer-no"
                        className="mt-2"
                        value={customerNo}
                        maxLength={32}
                        required
                        disabled={request.isPending || !dualProof}
                        onChange={e => setCustomerNo(e.target.value)}
                        placeholder="المرجع الموجود على فاتورتك أو عقدك"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-request-note">
                        تفاصيل تساعد فريق المراجعة
                      </Label>
                      <Textarea
                        id="link-request-note"
                        className="mt-2"
                        value={note}
                        maxLength={1000}
                        required
                        disabled={request.isPending || !dualProof}
                        onChange={e => setNote(e.target.value)}
                        placeholder="اذكر مرجع تعامل سابق دون كتابة رقم هوية أو بيانات حساسة"
                      />
                    </div>
                  </div>
                  <p className="text-xs leading-7 text-slate-500">
                    إن لم تعرف الرقم اطلبه عبر الدعم. لا يعرض البحث سجلات أو
                    بيانات عملاء آخرين، ولا ترسل صورة هوية في خانة الملاحظات.
                  </p>
                  <Button
                    className="min-h-11 w-full sm:w-auto"
                    disabled={
                      !dualProof ||
                      request.isPending ||
                      !customerNo.trim() ||
                      !note.trim()
                    }
                  >
                    {request.isPending
                      ? "جارٍ إرسال الطلب…"
                      : "إرسال طلب ربط للمراجعة"}
                  </Button>
                </form>
              )}
              {mine.data?.map(r => (
                <div key={r.id} className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="break-all text-sm">
                      طلب #{r.id} · {r.customerNo}
                    </strong>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${r.status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}
                    >
                      {labels[r.status]}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-7 text-slate-500">
                    {r.requesterNote}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString("ar-OM")}
                  </p>
                  {r.status === "pending" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 min-h-11 text-rose-700"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate({ requestId: r.id })}
                    >
                      إلغاء طلب الربط
                    </Button>
                  )}
                  {r.status === "approved" && (
                    <p className="mt-2 text-xs leading-7 text-emerald-800">
                      تم تحديث ارتباط ملفك بالسجل المعتمد؛ لم تُدمج أو تُحذف
                      معاملات أو طلبات مالية تلقائياً.
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
