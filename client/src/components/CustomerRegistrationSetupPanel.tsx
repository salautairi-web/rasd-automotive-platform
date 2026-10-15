import CustomerLinkReviewPanel from "./CustomerLinkReviewPanel";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CustomerRegistrationSetupPanel() {
  const settings = trpc.customerAuth.registrationSettings.useQuery(undefined, {
    retry: false,
  });
  const [entity, setEntity] = useState("");
  const [organization, setOrganization] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const utils = trpc.useUtils();
  const selectedEntity = settings.data?.entities.find(
    item => item.id === Number(entity)
  );
  const configure = trpc.customerAuth.configureRegistration.useMutation({
    onSuccess: () => {
      const message =
        "تم حفظ إعداد التسجيل وربط الفروع غير المرتبطة تلقائياً عند وضوح المؤسسة.";
      setFeedback({ type: "success", message });
      toast.success(message);
      void utils.customerAuth.registrationSettings.invalidate();
      void utils.customerAuth.entities.invalidate();
    },
    onError: e => {
      setFeedback({ type: "error", message: e.message });
      toast.error(e.message);
    },
  });
  const activateEntity = trpc.customerAuth.activateEntity.useMutation({
    onSuccess: () => {
      const message =
        "تم تفعيل الكيان؛ يمكنك الآن اختيار المنظمة وإتاحة تسجيل العملاء.";
      setFeedback({ type: "success", message });
      toast.success(message);
      void settings.refetch();
    },
    onError: e => {
      setFeedback({ type: "error", message: e.message });
      toast.error(e.message);
    },
  });
  const chooseEntity = (id: string) => {
    setFeedback(null);
    setEntity(id);
    const row = settings.data?.settings.find(
      s => s.businessEntityId === Number(id)
    );
    setOrganization(row ? String(row.organizationId) : "");
    setEnabled(row?.enabled ?? false);
  };
  return (
    <>
      <Card className="border-blue-100 bg-blue-50/40">
        <CardHeader>
          <CardTitle role="heading" aria-level={2} className="text-base">
            إعداد التسجيل الذاتي للعملاء — للمسؤول المركزي
          </CardTitle>
          <p className="text-sm leading-7 text-slate-500">
            اختر الكيان والمنظمة الصحيحة، ثم فعّل إتاحته في نموذج التسجيل. يُنشأ
            لكل حساب سجل عميل جديد فقط، دون ربط سجلات سابقة أو منح عضويات
            موظفين.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback && (
            <div
              role="status"
              className={`rounded-xl border p-3 text-sm leading-7 ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            >
              {feedback.message}
            </div>
          )}
          {settings.isError ? (
            <div role="alert" className="text-sm text-rose-700">
              تعذر تحميل إعدادات التسجيل.{" "}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void settings.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="signup-entity-admin">كيان الخدمة</Label>
                  <select
                    id="signup-entity-admin"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                    value={entity}
                    onChange={e => chooseEntity(e.target.value)}
                    disabled={settings.isLoading || configure.isPending}
                  >
                    <option value="">اختر الكيان</option>
                    {settings.data?.entities.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nameAr} · {e.status === "planned" ? "مخطط" : "نشط"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="signup-organization-admin">
                    المنظمة المحاسبية المرتبطة
                  </Label>
                  <select
                    id="signup-organization-admin"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    disabled={settings.isLoading || configure.isPending}
                  >
                    <option value="">اختر المنظمة</option>
                    {settings.data?.organizations.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedEntity?.status === "planned" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900">
                  <span>
                    هذا الكيان مخطط ولم يُفعّل بعد؛ فعّله أولاً ليظهر للعملاء.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activateEntity.isPending || configure.isPending}
                    onClick={() =>
                      activateEntity.mutate({ businessEntityId: Number(entity) })
                    }
                  >
                    {activateEntity.isPending ? "جارٍ التفعيل…" : "تفعيل الكيان"}
                  </Button>
                </div>
              )}
              <label className="flex items-start gap-2 text-sm leading-7">
                <Checkbox
                  aria-label="تفعيل التسجيل الذاتي لهذا الكيان"
                  checked={enabled}
                  disabled={configure.isPending || selectedEntity?.status !== "active"}
                  onCheckedChange={v => setEnabled(v === true)}
                  className="mt-1"
                />
                <span>
                  إظهار هذا الكيان للعملاء والسماح بإنشاء حسابات خدمة جديدة.
                </span>
              </label>
              <Button
                disabled={
                  !entity ||
                  !organization ||
                  selectedEntity?.status !== "active" ||
                  configure.isPending ||
                  activateEntity.isPending
                }
                onClick={() =>
                  configure.mutate({
                    businessEntityId: Number(entity),
                    organizationId: Number(organization),
                    enabled,
                  })
                }
              >
                {configure.isPending ? "جارٍ الحفظ…" : "حفظ إعداد التسجيل"}
              </Button>
              {!entity && (
                <p className="text-xs text-slate-500">
                  اختر كيان الخدمة أولاً لعرض حالته وخياراته.
                </p>
              )}
              {entity && !organization && (
                <p className="text-xs text-amber-700">
                  اختر المنظمة المحاسبية قبل الحفظ.
                </p>
              )}
              {selectedEntity?.status === "planned" && (
                <p className="text-xs text-amber-700">
                  لا يمكن الحفظ الآن: الكيان مخطط. استخدم زر تفعيل الكيان أولاً.
                </p>
              )}
              <div className="space-y-2">
                {settings.data?.settings.map(row => (
                  <div
                    key={row.businessEntityId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 text-xs"
                  >
                    <span>
                      {settings.data?.entities.find(
                        e => e.id === row.businessEntityId
                      )?.nameAr ?? `كيان ${row.businessEntityId}`}{" "}
                      ·{" "}
                      {settings.data?.organizations.find(
                        o => o.id === row.organizationId
                      )?.nameAr ?? `منظمة ${row.organizationId}`}
                    </span>
                    <span
                      className={
                        row.enabled ? "text-emerald-700" : "text-slate-500"
                      }
                    >
                      {row.enabled ? "التسجيل متاح" : "التسجيل متوقف"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {settings.data && (
        <CustomerLinkReviewPanel entities={settings.data.entities} />
      )}
    </>
  );
}
