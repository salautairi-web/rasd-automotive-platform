import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
type ReviewRow =
  inferRouterOutputs<AppRouter>["customerLinkReview"]["adminList"][number];
const fresh = (d: Date | null) =>
  Boolean(
    d &&
      Date.now() - new Date(d).getTime() <= 86400000 &&
      new Date(d).getTime() <= Date.now()
  );
export default function CustomerLinkReviewPanel({
  entities,
}: {
  entities: { id: number; nameAr: string }[];
}) {
  const [entity, setEntity] = useState("");
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [method, setMethod] = useState<
    "in_person_id" | "existing_contract_identity"
  >("in_person_id");
  const [confirmed, setConfirmed] = useState(false);
  const [finalConfirmation, setFinalConfirmation] = useState(false);
  const [error, setError] = useState("");
  const list = trpc.customerLinkReview.adminList.useQuery(
    { businessEntityId: Number(entity) || 1 },
    { enabled: Boolean(entity), retry: false }
  );
  const availability = trpc.customerVerification.availability.useQuery();
  const review = trpc.customerLinkReview.review.useMutation({
    onSuccess: r => {
      toast.success(
        r.status === "approved"
          ? "تم اعتماد الربط المراجع وتسجيل الأدلة"
          : "سُجل قرار عدم الاعتماد"
      );
      setSelected(null);
      void list.refetch();
    },
    onError: e => {
      setError(e.message);
      setFinalConfirmation(false);
    },
  });
  const select = (r: ReviewRow, d: "approve" | "reject") => {
    setSelected(r);
    setDecision(d);
    setNote("");
    setEvidence("");
    setMethod("in_person_id");
    setConfirmed(false);
    setFinalConfirmation(false);
    setError("");
  };
  const canProceed =
    note.trim().length >= (decision === "approve" ? 15 : 10) &&
    (decision === "reject" ||
      Boolean(
        selected?.canApprove &&
          confirmed &&
          evidence.trim().length >= 5 &&
          fresh(selected.requester.emailVerifiedAt) &&
          fresh(selected.requester.phoneVerifiedAt) &&
          selected.target
      ));
  return (
    <Card className="border-cyan-100">
      <CardHeader>
        <CardTitle className="text-base">
          مراجعة ربط حسابات العملاء السابقة
        </CardTitle>
        <p className="text-xs leading-7 text-slate-500">
          الاعتماد للمسؤول المركزي مع MFA، وإثبات هوية موثق، وتطابق البريد
          والجوال وتوثيقهما خلال 24 ساعة. لا يتم دمج معاملات مالية أو منح
          صلاحيات جديدة.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-7">
            بريد التحقق:{" "}
            {availability.data?.email
              ? "الإعداد موجود؛ يجب اختبار التسليم"
              : "غير مهيأ"}{" "}
            · رسائل الجوال:{" "}
            {availability.data?.sms
              ? "الإعداد موجود؛ يجب اختبار التسليم"
              : "غير مهيأة"}
          </div>
          <div>
            <Label htmlFor="review-entity">الكيان لعرض طلبات المراجعة</Label>
            <select
              id="review-entity"
              value={entity}
              className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
              onChange={e => setEntity(e.target.value)}
            >
              <option value="">اختر كيان الخدمة</option>
              {entities.map(e => (
                <option value={e.id} key={e.id}>
                  {e.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!entity ? (
          <p className="text-sm text-slate-500">
            اختر الكيان؛ لا تُحمّل طلبات كيانات أخرى.
          </p>
        ) : list.isLoading ? (
          <p role="status">تحميل طلبات المراجعة…</p>
        ) : list.isError ? (
          <div role="alert" className="text-sm text-rose-700">
            تعذر تحميل الطلبات.{" "}
            <Button variant="ghost" onClick={() => void list.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : !list.data?.length ? (
          <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
            لا توجد طلبات معلقة في الكيان المختار.
          </p>
        ) : (
          list.data.map(r => (
            <div key={r.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-sm">
                  طلب #{r.id} · {r.requester.name}
                </strong>
                <span className="text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleString("ar-OM")}
                </span>
              </div>
              <p className="text-xs leading-7">
                مرجع العميل السابق: <strong>{r.customerNo}</strong> · مرشح
                السجل: {r.target?.nameAr ?? "غير موجود ضمن الكيان"}
              </p>
              <p
                dir="ltr"
                className="break-all text-right text-xs text-slate-500"
              >
                {r.requester.email} · {r.requester.phone}
              </p>
              <p className="text-xs text-slate-500">
                توثيق البريد حديث:{" "}
                {fresh(r.requester.emailVerifiedAt) ? "نعم" : "لا"} · توثيق
                الجوال حديث: {fresh(r.requester.phoneVerifiedAt) ? "نعم" : "لا"}
              </p>
              <p className="whitespace-pre-wrap break-words text-xs leading-7">
                {r.requesterNote}
              </p>
              <p className="text-xs leading-7 text-amber-800">
                {r.approvalExplanation}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="min-h-11"
                  disabled={!r.canApprove || !r.target}
                  onClick={() => select(r, "approve")}
                >
                  مراجعة واعتماد الربط
                </Button>
                <Button
                  className="min-h-11"
                  variant="outline"
                  onClick={() => select(r, "reject")}
                >
                  عدم اعتماد مع سبب
                </Button>
                {!r.canApprove && (
                  <Link
                    href="/security"
                    className="inline-flex min-h-11 items-center text-xs text-blue-700 underline"
                  >
                    إعداد MFA
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={v => {
          if (!review.isPending && !v) setSelected(null);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader className="text-right">
            <DialogTitle>
              {decision === "approve"
                ? "اعتماد ربط مراجع"
                : "توثيق عدم الاعتماد"}
            </DialogTitle>
            <DialogDescription>
              طلب #{selected?.id} — {selected?.requester.name} — سجل{" "}
              {selected?.customerNo} داخل{" "}
              {entities.find(e => e.id === Number(entity))?.nameAr} فقط.
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
          {!finalConfirmation ? (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                if (canProceed) setFinalConfirmation(true);
              }}
            >
              <div>
                <Label htmlFor="review-note">ملاحظة المراجعة وسبب القرار</Label>
                <Textarea
                  id="review-note"
                  className="mt-2"
                  value={note}
                  minLength={decision === "approve" ? 15 : 10}
                  maxLength={2000}
                  required
                  onChange={e => setNote(e.target.value)}
                  disabled={review.isPending}
                />
              </div>
              {decision === "approve" && (
                <>
                  <div>
                    <Label htmlFor="review-method">طريقة إثبات الهوية</Label>
                    <select
                      id="review-method"
                      value={method}
                      className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
                      onChange={e => setMethod(e.target.value as typeof method)}
                    >
                      <option value="in_person_id">مطابقة هوية حضورياً</option>
                      <option value="existing_contract_identity">
                        هوية مثبتة في عقد قائم
                      </option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="review-evidence">
                      مرجع دليل الهوية في سجل الشركة الآمن
                    </Label>
                    <Input
                      id="review-evidence"
                      value={evidence}
                      className="mt-2"
                      minLength={5}
                      maxLength={180}
                      required
                      onChange={e => setEvidence(e.target.value)}
                      placeholder="رقم مستند محفوظ وآمن، لا تكتب رقم الهوية نفسه"
                    />
                  </div>
                  <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm leading-7">
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={v => setConfirmed(v === true)}
                      aria-label="تأكيد مطابقة الهوية وبيانات السجل"
                      className="mt-1"
                    />
                    <span>
                      راجعت الدليل وتحققت من هوية صاحب الحساب وملكية بيانات
                      السجل؛ تطابق رقم الجوال وحده لا يكفي.
                    </span>
                  </label>
                  {selected &&
                    (!fresh(selected.requester.emailVerifiedAt) ||
                      !fresh(selected.requester.phoneVerifiedAt)) && (
                      <p role="alert" className="text-xs text-amber-800">
                        يحتاج العميل إلى تجديد توثيق البريد والجوال خلال 24 ساعة
                        قبل الاعتماد.
                      </p>
                    )}
                </>
              )}
              <Button className="min-h-11 w-full" disabled={!canProceed}>
                معاينة القرار قبل التأكيد
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-8">
                <strong>
                  {decision === "approve"
                    ? "سيُعتمد تغيير ارتباط الحساب"
                    : "سيُرفض طلب الربط"}
                </strong>
                <p>
                  الحساب: {selected?.requester.name} (#
                  {selected?.requester.userId})
                </p>
                <p>
                  الكيان: {entities.find(e => e.id === Number(entity))?.nameAr}
                </p>
                <p>
                  السجل: {selected?.customerNo} — {selected?.target?.nameAr}
                </p>
                {decision === "approve" && (
                  <>
                    <p>
                      طريقة التحقق:{" "}
                      {method === "in_person_id"
                        ? "مطابقة حضورياً"
                        : "هوية مثبتة بعقد"}
                    </p>
                    <p className="break-all">مرجع الدليل: {evidence}</p>
                    <p>
                      سيُعاد توجيه ملف العميل وعلاقته القائمة إلى السجل المعتمد
                      دون توسيع الصلاحيات أو تعديل الفواتير والمعاملات.
                    </p>
                  </>
                )}
                <p className="whitespace-pre-wrap break-words">
                  سبب القرار: {note}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="min-h-11 flex-1"
                  disabled={review.isPending}
                  onClick={() =>
                    selected &&
                    review.mutate({
                      requestId: selected.id,
                      decision,
                      reviewNote: note.trim(),
                      ...(decision === "approve"
                        ? {
                            evidenceReference: evidence.trim(),
                            identityCheckMethod: method,
                            identityConfirmed: confirmed,
                          }
                        : {}),
                    })
                  }
                >
                  {review.isPending
                    ? "جارٍ حفظ القرار…"
                    : decision === "approve"
                      ? "تأكيد اعتماد الربط المراجع"
                      : "تأكيد عدم الاعتماد"}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={review.isPending}
                  onClick={() => setFinalConfirmation(false)}
                >
                  رجوع للتعديل
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
