import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  CircleAlert,
  BookOpen,
  UsersRound,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import WorkshopRoleSetupPanel from "./WorkshopRoleSetupPanel";
import { parseWorkshopMoney } from "../../../shared/workshopClient";

const steps = [
  [
    "1 · تجهيز الوصول",
    "يسجّل كل موظف بحسابه، ثم يختار كيان الورشة المصرح له. يمنح المسؤول أدواراً على مستوى الكيان وصلاحيات واضحة للاستقبال والفني والقطع والجودة والفوترة؛ لا تُمنح الصلاحيات تلقائياً.",
  ],
  [
    "2 · استقبال المركبة",
    "اختر العميل والمركبة من السجل، سجّل العداد والشكوى والأضرار الظاهرة، وتأكد من موافقة العميل. ينشئ النموذج استقبالاً ثم أمر عمل؛ عند تعثر فتح الأمر أعد المحاولة دون تكرار الاستقبال.",
  ],
  [
    "3 · التشخيص والتقدير",
    "انتقل إلى التشخيص، سجّل الفحص والصور ورموز الأعطال. أنشئ التقدير بعملة الكيان. يسجّل الموظف المخوّل قرار العميل ومرجعه، وتُثبت بصمة الإصدار تلقائياً؛ التسجيل الداخلي ليس توقيعاً إلكترونياً للعميل.",
  ],
  [
    "4 · الإصلاح والقطع",
    "أضف عمليات التنفيذ وأسندها إلى حسابات المستخدمين المصرح لهم، ثم سجّل الوقت الفعلي. اختر القطع والمستودع من البيانات الفعلية واحجز وصرف أو أرجع الكمية الكاملة للطلب.",
  ],
  [
    "5 · الجودة والفوترة",
    "أكمل عمليات الإصلاح، انتقل لفحص الجودة وسجل قائمة التحقق ونتيجة الفحص. أصدر فاتورة مرتبطة بأمر العمل من التقدير المعتمد، وتابع تحصيلها في المركز المالي.",
  ],
  [
    "6 · الطريق والتسليم",
    "فوّض اختبار الطريق وسجّل البداية والنهاية والملاحظات. عند الجاهزية، تأكد من نجاح الجودة وسداد الفاتورة في السجل المركزي، ثم وثّق مستندات التسليم وإقرار العميل والعداد. تُمنع محاولات تجاوز الشروط.",
  ],
];

export default function WorkshopSetupPanel({
  businessEntityId,
  currency,
  canConfigure,
}: {
  businessEntityId: number;
  currency: string;
  canConfigure: boolean;
}) {
  const utils = trpc.useUtils();
  const readiness = trpc.workshopSetup.readiness.useQuery(
    { businessEntityId },
    { refetchInterval: 60000, retry: false }
  );
  const [bay, setBay] = useState({ bayCode: "", nameAr: "" });
  const [technician, setTechnician] = useState({
    technicianNo: "",
    nameAr: "",
    department: "الصيانة",
    rate: "0",
  });
  const refresh = () => {
    void utils.workshopSetup.readiness.invalidate({ businessEntityId });
    void utils.workshop59.referenceData.invalidate({ businessEntityId });
  };
  const createBay = trpc.workshopSetup.createBay.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الباي.");
      setBay({ bayCode: "", nameAr: "" });
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const createTechnician = trpc.workshopSetup.createTechnician.useMutation({
    onSuccess: () => {
      toast.success(
        "تمت إضافة الفني إلى دليل الجدولة. تعيين حسابه يتم من إدارة الأدوار."
      );
      setTechnician({
        technicianNo: "",
        nameAr: "",
        department: "الصيانة",
        rate: "0",
      });
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const rate = parseWorkshopMoney(technician.rate, currency);
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle
              role="heading"
              aria-level={2}
              className="flex items-center gap-2"
            >
              <ShieldCheck size={20} className="text-blue-600" />
              جاهزية التشغيل التجريبي
            </CardTitle>
            <Badge variant="outline">
              {readiness.data?.canStart
                ? "البيانات الأساسية مكتملة"
                : "تحتاج استكمال التهيئة"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            هذه قائمة بيانات أولية، وليست شهادة جاهزية إنتاجية أو بديلاً عن
            اختبار قبول المستخدمين.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {readiness.isLoading && <p role="status">جارٍ فحص بيانات الكيان…</p>}
          {readiness.error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
            >
              {readiness.error.message}
              <Button
                variant="outline"
                size="sm"
                className="mr-3"
                onClick={() => void readiness.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {readiness.data?.checks.map(item => (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                {item.passed ? (
                  <CheckCircle2
                    size={20}
                    className="shrink-0 text-emerald-600"
                  />
                ) : (
                  <CircleAlert size={20} className="shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    السجلات المتاحة: {item.count}
                  </p>
                  {item.route && (
                    <Link
                      href={item.route}
                      className="mt-2 inline-block text-xs font-medium text-blue-600 underline"
                    >
                      فتح الإدارة
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            <strong>قبل تسليم النسخة للمستخدمين</strong>
            <ul className="list-inside list-disc">
              {readiness.data?.limitations.map(text => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <p>
              راجع بيانات الاتصال والعملات وسياسة الضمان، اختبر دورة كاملة بحساب
              موظف غير مسؤول، وأثبت النسخ الاحتياطي والاستعادة قبل العمل على
              بيانات حقيقية.
            </p>
          </div>
        </CardContent>
      </Card>
      <WorkshopRoleSetupPanel businessEntityId={businessEntityId} />
      {canConfigure && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle
                role="heading"
                aria-level={2}
                className="flex items-center gap-2 text-lg"
              >
                <Wrench size={18} />
                إضافة باي عمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={event => {
                  event.preventDefault();
                  createBay.mutate({ businessEntityId, ...bay });
                }}
              >
                <label className="block text-sm">
                  رمز الباي
                  <Input
                    aria-label="رمز الباي"
                    value={bay.bayCode}
                    maxLength={40}
                    onChange={e =>
                      setBay(v => ({ ...v, bayCode: e.target.value }))
                    }
                    placeholder="BAY-01"
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm">
                  اسم الباي
                  <Input
                    aria-label="اسم الباي"
                    value={bay.nameAr}
                    maxLength={160}
                    onChange={e =>
                      setBay(v => ({ ...v, nameAr: e.target.value }))
                    }
                    placeholder="باي الصيانة السريعة"
                    className="mt-1"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  باي لمركبة واحدة؛ يمنع النظام الحجوزات المتداخلة.
                </p>
                <Button
                  type="submit"
                  disabled={
                    !/^[A-Za-z0-9_-]{2,40}$/.test(bay.bayCode.trim()) ||
                    bay.nameAr.trim().length < 2 ||
                    createBay.isPending
                  }
                >
                  {createBay.isPending ? "جارٍ الحفظ…" : "إضافة الباي"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle
                role="heading"
                aria-level={2}
                className="flex items-center gap-2 text-lg"
              >
                <UsersRound size={18} />
                إضافة إلى دليل الفنيين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={event => {
                  event.preventDefault();
                  if (rate !== null)
                    createTechnician.mutate({
                      businessEntityId,
                      technicianNo: technician.technicianNo,
                      nameAr: technician.nameAr,
                      department: technician.department,
                      laborRateMinor: rate,
                    });
                }}
              >
                <label className="block text-sm">
                  رقم الفني
                  <Input
                    aria-label="رقم الفني"
                    value={technician.technicianNo}
                    maxLength={60}
                    onChange={e =>
                      setTechnician(v => ({
                        ...v,
                        technicianNo: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm">
                  اسم الفني
                  <Input
                    aria-label="اسم الفني"
                    value={technician.nameAr}
                    maxLength={180}
                    onChange={e =>
                      setTechnician(v => ({ ...v, nameAr: e.target.value }))
                    }
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm">
                  التخصص
                  <Input
                    aria-label="تخصص الفني"
                    value={technician.department}
                    maxLength={40}
                    onChange={e =>
                      setTechnician(v => ({ ...v, department: e.target.value }))
                    }
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm">
                  سعر ساعة العمل ({currency})
                  <Input
                    aria-label="سعر ساعة الفني"
                    type="number"
                    min="0"
                    step="any"
                    value={technician.rate}
                    onChange={e =>
                      setTechnician(v => ({ ...v, rate: e.target.value }))
                    }
                    className="mt-1"
                  />
                </label>
                <p className="text-xs leading-6 text-muted-foreground sm:col-span-2">
                  سجل الجدولة لا ينشئ حساب دخول. أسند العمليات إلى الحساب الصحيح
                  من قائمة مستخدمي الكيان، ولا تخلط رقم الفني بمعرف المستخدم.
                </p>
                <Button
                  type="submit"
                  disabled={
                    technician.technicianNo.trim().length < 2 ||
                    technician.nameAr.trim().length < 2 ||
                    technician.department.trim().length < 2 ||
                    rate === null ||
                    rate > 100000000 ||
                    createTechnician.isPending
                  }
                >
                  {createTechnician.isPending ? "جارٍ الحفظ…" : "إضافة الفني"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle
            role="heading"
            aria-level={2}
            className="flex items-center gap-2"
          >
            <BookOpen size={20} className="text-blue-600" />
            دليل المستخدم · أول يوم عمل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map(([title, body]) => (
              <div key={title} className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
