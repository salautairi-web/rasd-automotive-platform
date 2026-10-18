import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import WorkshopSetupPanel from "@/components/WorkshopSetupPanel";
import BranchSelector from "@/components/BranchSelector";
import WorkshopReceiveDialog from "@/components/WorkshopReceiveDialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gauge,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wrench,
  Search,
  Settings2,
  BookOpen,
  CircleAlert,
  LockKeyhole,
  CheckCircle2,
  ImagePlus,
} from "lucide-react";
import {
  workshopNextStatuses,
  workshopStatusLabels,
  parseWorkshopMoney,
  formatWorkshopMoney,
  filterWorkshopJobs,
  validWorkshopInteger,
  workshopRequestKey,
} from "../../../shared/workshopClient";
import type { WorkshopJobStatus } from "../../../shared/workshop59";

type WorkshopEntity = {
  id: number;
  nameAr: string;
  currency: string;
  roleNames: string[];
  permissions: string[];
};
type View = "jobs" | "appointments" | "reports" | "setup";
type Panel =
  | "overview"
  | "estimate"
  | "inspection"
  | "operations"
  | "parts"
  | "quality"
  | "road"
  | "delivery"
  | "warranty";
const selectClass =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60";
const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  critical: "حرجة",
};
const statusTone = (status: string) =>
  ["ready", "delivered", "closed"].includes(status)
    ? "bg-emerald-50 text-emerald-700"
    : ["awaiting_approval", "awaiting_parts"].includes(status)
      ? "bg-amber-50 text-amber-700"
      : "bg-blue-50 text-blue-700";
const labelStatus = (status: string) =>
  workshopStatusLabels[status as WorkshopJobStatus] ?? status;
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
    >
      <CircleAlert className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export default function Workshop59() {
  const { user } = useAuth();
  const access = trpc.workshop59.access.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchInterval: 60000,
  });
  const [selectedEntityId, setSelectedEntityId] = useState(0);
  const entities = access.data?.entities ?? [];
  const entity = entities.find(item => item.id === selectedEntityId);
  useEffect(() => {
    if (!user || !entities.length) return;
    if (entities.some(item => item.id === selectedEntityId)) return;
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(`rasd:workshop-entity:${user.id}`));
    } catch {}
    setSelectedEntityId(
      entities.find(item => item.id === saved)?.id ?? entities[0].id
    );
  }, [access.data, selectedEntityId, user?.id]);
  const selectEntity = (id: number) => {
    setSelectedEntityId(id);
    try {
      if (user)
        sessionStorage.setItem(`rasd:workshop-entity:${user.id}`, String(id));
    } catch {}
  };
  return (
    <DashboardLayout>
      <div
        dir="rtl"
        className="-m-4 min-h-[calc(100dvh-2rem)] bg-[#f6f8fc] p-4 sm:p-6 lg:p-8"
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 border-0 bg-blue-50 text-blue-700">
                RASD WORKSHOP · تشغيل تجريبي 1.0
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                مركز عمليات الورشة
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                مساحة عمل للاستقبال والفنيين والقطع والجودة والتسليم، ببيانات
                فعلية وصلاحيات مرتبطة بكيان الورشة.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Field label="كيان الورشة">
                <select
                  aria-label="كيان الورشة"
                  className={selectClass}
                  value={entity?.id ?? ""}
                  disabled={!entities.length}
                  onChange={event => selectEntity(Number(event.target.value))}
                >
                  <option value="" disabled>
                    اختر كياناً مصرحاً
                  </option>
                  {entities.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
              {entity && (
                <p className="mt-2 text-xs text-slate-500">
                  {entity.roleNames.join(" · ") || "صلاحيات كيان"} ·{" "}
                  {entity.currency}
                </p>
              )}
            </div>
          </header>
          {access.isLoading ? (
            <Card>
              <CardContent role="status" className="p-8">
                جارٍ التحقق من صلاحيات الورشة…
              </CardContent>
            </Card>
          ) : access.error ? (
            <ErrorBox
              message={access.error.message}
              retry={() => void access.refetch()}
            />
          ) : !entities.length ? (
            <Card className="border-amber-200">
              <CardContent className="space-y-3 p-6">
                <LockKeyhole className="text-amber-600" />
                <h2 className="text-lg font-semibold">
                  لا توجد صلاحية دخول للورشة
                </h2>
                <p className="text-sm leading-7 text-slate-600">
                  اطلب من المسؤول عضوية نشطة وصلاحيات الورشة على مستوى كيان
                  الأعمال. الأدوار المقيدة بفرع أو بأعمال مسندة لا تُمنح وصولاً
                  إلى كل الكيان.
                </p>
                <Link
                  href="/admin/roles"
                  className="inline-block text-sm text-blue-600 underline"
                >
                  إدارة أدوار المستخدمين
                </Link>
              </CardContent>
            </Card>
          ) : entity ? (
            <WorkshopWorkspace
              key={`${user?.id}:${entity.id}`}
              entity={entity}
            />
          ) : (
            <p role="status">جارٍ تجهيز مساحة الكيان…</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function WorkshopWorkspace({ entity }: { entity: WorkshopEntity }) {
  const businessEntityId = entity.id;
  const currency = entity.currency || "OMR";
  const can = (action: string) => entity.permissions.includes(action);
  const utils = trpc.useUtils();
  const [view, setView] = useState<View>("jobs");
  const [panel, setPanel] = useState<Panel>("overview");
  const [selectedJobId, setSelectedJobId] = useState(0);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchId, setBranchId] = useState("");
  const [reportRange] = useState(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return { from, to };
  });
  const [boardRange] = useState(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from, to };
  });
  const dashboard = trpc.workshop59.dashboard.useQuery(
    { businessEntityId, branchId: branchId ? Number(branchId) : undefined },
    { refetchInterval: 30000, retry: false }
  );
  const refs = trpc.workshop59.referenceData.useQuery(
    { businessEntityId },
    { refetchInterval: 60000, retry: false }
  );
  const details = trpc.workshop59.jobDetails.useQuery(
    { businessEntityId, jobCardId: selectedJobId },
    { enabled: selectedJobId > 0, refetchInterval: 30000, retry: false }
  );
  const appointments = trpc.workshop59.appointmentsBoard.useQuery(
    { businessEntityId, ...boardRange },
    { enabled: view === "appointments", refetchInterval: 30000, retry: false }
  );
  const report = trpc.workshop59.performanceReport.useQuery(
    { businessEntityId, ...reportRange },
    {
      enabled: view === "reports" && can("report"),
      refetchInterval: 60000,
      retry: false,
    }
  );
  const customers = refs.data?.customers ?? [];
  const vehicles = refs.data?.vehicles ?? [];
  const bays = refs.data?.bays ?? [];
  const technicians = refs.data?.technicians ?? [];
  const users = refs.data?.users ?? [];
  const warehouses = refs.data?.warehouses ?? [];
  const products = refs.data?.products ?? [];
  const inventory = refs.data?.inventory ?? [];
  const customerName = (id: number) =>
    customers.find(item => item.id === id)?.nameAr ?? `عميل #${id}`;
  const vehicleName = (id: number) => {
    const v = vehicles.find(item => item.id === id);
    return v ? `${v.make} ${v.model} · ${v.vehicleNo}` : `مركبة #${id}`;
  };
  const job = details.data?.job;
  const estimateRow = details.data?.estimates?.[0];
  const invoice = details.data?.invoice;
  const money = (minor?: number | null) => formatWorkshopMoney(minor, currency);
  const refresh = () => {
    void utils.workshop59.invalidate();
    void utils.workshopSetup.readiness.invalidate({ businessEntityId });
  };
  const fail = (error: { message: string }) =>
    toast.error(error.message, { position: "top-left", closeButton: true });
  const done = (message: string) => {
    toast.success(message, {
      duration: 2500,
      position: "top-left",
      closeButton: true,
    });
    refresh();
  };
  const [estimate, setEstimate] = useState({
    labor: "0",
    parts: "0",
    subcontract: "0",
    consumables: "0",
    tax: "0",
    discount: "0",
  });
  const estimateNumbers = Object.values(estimate).map(value =>
    parseWorkshopMoney(value, currency)
  );
  const [consentNote, setConsentNote] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [inspection, setInspection] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [dtc, setDtc] = useState({
    code: "",
    description: "",
    severity: "medium" as "info" | "low" | "medium" | "high" | "critical",
  });
  const [operation, setOperation] = useState({
    name: "",
    userId: "",
    hours: "1",
    cost: "0",
  });
  const [operationHours, setOperationHours] = useState<Record<number, string>>(
    {}
  );
  const [parts, setParts] = useState({
    warehouseId: "",
    productId: "",
    qty: "1",
    key: workshopRequestKey("part"),
  });
  const [quality, setQuality] = useState({
    result: "passed" as "passed" | "failed" | "rework",
    defect: "",
    checks: { repair: false, safety: false, fluids: false, cleanliness: false },
  });
  const [road, setRoad] = useState({
    driverId: "",
    start: "",
    end: "",
    findings: "",
    incident: false,
  });
  const [delivery, setDelivery] = useState({
    mileage: "",
    documents: "",
    acknowledgement: false,
    key: workshopRequestKey("delivery"),
  });
  const [invoiceNo, setInvoiceNo] = useState("");
  const [receipt, setReceipt] = useState({
    amount: "",
    method: "cash" as "cash" | "bank_transfer",
    reference: "",
    confirmation: false,
    key: workshopRequestKey("receipt"),
  });
  const [warranty, setWarranty] = useState({
    coverage: "",
    claimNo: "",
    rootCause: "",
    action: "",
  });
  const [appointment, setAppointment] = useState({
    customerId: "",
    vehicleId: "",
    bayId: "",
    technicianId: "",
    service: "صيانة دورية",
    starts: "",
    ends: "",
    notes: "",
    key: workshopRequestKey("appointment"),
  });
  const activeRoad = details.data?.roadTests?.find(
    item => item.status === "authorized" || item.status === "in_progress"
  );
  const latestQuality = details.data?.quality?.[0];
  const outstanding = invoice
    ? Math.max(0, invoice.amountMinor - invoice.paidAmountMinor)
    : null;
  const deliveryReady =
    job?.status === "ready" &&
    latestQuality?.result === "passed" &&
    Boolean(
      invoice &&
        !["cancelled", "disputed"].includes(invoice.status) &&
        outstanding === 0
    );
  const closedJob = job && ["delivered", "closed"].includes(job.status);
  const resetJobForms = () => {
    setPanel("overview");
    setUploadedMedia([]);
    setInspection("");
    setConsentNote("");
    setConsentConfirmed(false);
    setEstimate({
      labor: "0",
      parts: "0",
      subcontract: "0",
      consumables: "0",
      tax: "0",
      discount: "0",
    });
    setOperation({ name: "", userId: "", hours: "1", cost: "0" });
    setOperationHours({});
    setDtc({ code: "", description: "", severity: "medium" });
    setParts({
      warehouseId: "",
      productId: "",
      qty: "1",
      key: workshopRequestKey("part"),
    });
    setQuality({
      result: "passed",
      defect: "",
      checks: {
        repair: false,
        safety: false,
        fluids: false,
        cleanliness: false,
      },
    });
    setRoad({
      driverId: "",
      start: "",
      end: "",
      findings: "",
      incident: false,
    });
    setDelivery({
      mileage: "",
      documents: "",
      acknowledgement: false,
      key: workshopRequestKey("delivery"),
    });
    setInvoiceNo("");
    setReceipt({
      amount: "",
      method: "cash",
      reference: "",
      confirmation: false,
      key: workshopRequestKey("receipt"),
    });
    setWarranty({ coverage: "", claimNo: "", rootCause: "", action: "" });
  };
  const chooseJob = (id: number) => {
    resetJobForms();
    setSelectedJobId(id);
  };

  const transition = trpc.workshop59.transitionJobCard.useMutation({
    onSuccess: () => done("تم تحديث مرحلة أمر العمل."),
    onError: fail,
  });
  const createEstimate = trpc.workshop59.createEstimate.useMutation({
    onSuccess: () => done("تم حفظ إصدار التقدير."),
    onError: fail,
  });
  const consent = trpc.workshop59.recordEstimateConsent.useMutation({
    onSuccess: () => {
      setConsentConfirmed(false);
      setConsentNote("");
      done("تم توثيق قرار العميل وبصمة التقدير.");
    },
    onError: fail,
  });
  const createInspection = trpc.workshop59.createInspection.useMutation({
    onSuccess: () => {
      setInspection("");
      setUploadedMedia([]);
      done("تم حفظ الفحص ومراجعه.");
    },
    onError: fail,
  });
  const upload = trpc.workshop59.uploadInspectionMedia.useMutation();
  const recordDtc = trpc.workshop59.recordDtc.useMutation({
    onSuccess: () => {
      setDtc({ code: "", description: "", severity: "medium" });
      done("تم ربط رمز العطل بأمر العمل.");
    },
    onError: fail,
  });
  const createOperation = trpc.workshop59.createOperation.useMutation({
    onSuccess: () => {
      setOperation({ name: "", userId: "", hours: "1", cost: "0" });
      done("تمت إضافة العملية.");
    },
    onError: fail,
  });
  const updateOperation = trpc.workshop59.updateOperation.useMutation({
    onSuccess: () => done("تم تحديث تنفيذ العملية."),
    onError: fail,
  });
  const requestPart = trpc.workshop59.requestPart.useMutation({
    onSuccess: () => {
      setParts(v => ({ ...v, key: workshopRequestKey("part") }));
      done("تم حجز القطعة من الرصيد الفعلي.");
    },
    onError: fail,
  });
  const issuePart = trpc.workshop59.issuePart.useMutation({
    onSuccess: () => done("تم صرف الكمية الكاملة للطلب."),
    onError: fail,
  });
  const returnPart = trpc.workshop59.returnPart.useMutation({
    onSuccess: () => done("تم تحديث إرجاع القطعة ورصيد المخزون."),
    onError: fail,
  });
  const recordQuality = trpc.workshop59.recordQuality.useMutation({
    onSuccess: () => {
      setQuality({
        result: "passed",
        defect: "",
        checks: {
          repair: false,
          safety: false,
          fluids: false,
          cleanliness: false,
        },
      });
      done("تم حفظ نتيجة الجودة.");
    },
    onError: fail,
  });
  const authorizeRoad = trpc.workshop59.authorizeRoadTest.useMutation({
    onSuccess: () => done("تم تفويض اختبار الطريق."),
    onError: fail,
  });
  const completeRoad = trpc.workshop59.completeRoadTest.useMutation({
    onSuccess: () => {
      setRoad({
        driverId: "",
        start: "",
        end: "",
        findings: "",
        incident: false,
      });
      done("تم إكمال اختبار الطريق.");
    },
    onError: fail,
  });
  const deliver = trpc.workshop59.deliver.useMutation({
    onSuccess: () => {
      setDelivery({
        mileage: "",
        documents: "",
        acknowledgement: false,
        key: workshopRequestKey("delivery"),
      });
      done("تم تسجيل التسليم وتحديث الأمر.");
    },
    onError: fail,
  });
  const issueInvoice = trpc.workshopSetup.issueInvoice.useMutation({
    onSuccess: () => done("تم إصدار فاتورة مرتبطة بالأمر في مركز التحصيل."),
    onError: fail,
  });
  const recordPayment = trpc.workshopSetup.recordPayment.useMutation({
    onSuccess: () => {
      setReceipt({
        amount: "",
        method: "cash",
        reference: "",
        confirmation: false,
        key: workshopRequestKey("receipt"),
      });
      done("تم تسجيل التحصيل الموثق وتحديث رصيد الفاتورة.");
    },
    onError: fail,
  });
  const createWarranty = trpc.workshop59.createWarranty.useMutation({
    onSuccess: () => {
      setWarranty({ coverage: "", claimNo: "", rootCause: "", action: "" });
      done("تم تسجيل الضمان.");
    },
    onError: fail,
  });
  const schedule = trpc.workshop59.scheduleAppointment.useMutation({
    onSuccess: () => {
      setAppointment(v => ({ ...v, key: workshopRequestKey("appointment") }));
      done("تم حجز الموعد بعد التحقق من التعارض.");
    },
    onError: fail,
  });
  const anyPending = [
    transition,
    createEstimate,
    consent,
    createInspection,
    upload,
    recordDtc,
    createOperation,
    updateOperation,
    requestPart,
    issuePart,
    returnPart,
    recordQuality,
    authorizeRoad,
    completeRoad,
    deliver,
    issueInvoice,
    recordPayment,
    createWarranty,
  ].some(item => item.isPending);
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!can("inspect") || !selectedJobId) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error("اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 5 ميجابايت.");
      return;
    }
    const jobAtUpload = selectedJobId;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("تعذر قراءة الصورة"));
        reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        reader.readAsDataURL(file);
      });
      const result = await upload.mutateAsync({
        businessEntityId,
        jobCardId: jobAtUpload,
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        dataUrl,
      });
      setUploadedMedia(current => [...current, result.url]);
      toast.success("تم رفع صورة الفحص. احفظ الفحص لربطها بسجله.");
    } catch (error) {
      fail({
        message: error instanceof Error ? error.message : "تعذر رفع الصورة",
      });
    }
  };
  const jobs = filterWorkshopJobs(
    dashboard.data?.jobs ?? [],
    search,
    statusFilter,
    customerName,
    vehicleName
  );
  const panels: [Panel, string][] = [
    ["overview", "ملخص الأمر"],
    ["estimate", "التقدير والموافقة"],
    ["inspection", "الفحص والتشخيص"],
    ["operations", "عمليات الفنيين"],
    ["parts", "قطع الغيار"],
    ["quality", "الجودة"],
    ["road", "اختبار الطريق"],
    ["delivery", "الفوترة والتسليم"],
    ["warranty", "الضمان"],
  ];
  const available =
    inventory.find(
      item =>
        item.warehouseId === Number(parts.warehouseId) &&
        item.productId === Number(parts.productId)
    )?.availableQty ?? 0;
  const qualityChecksPassed = Object.values(quality.checks).every(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-emerald-50 text-emerald-700">
            <ShieldCheck size={13} className="ml-1" />
            صلاحيات كيان معزولة
          </Badge>
          <span className="text-xs text-slate-500">
            {entity.nameAr} · تحديث دوري كل 30 ثانية
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <BranchSelector
              businessEntityId={businessEntityId}
              value={branchId}
              onChange={setBranchId}
              ariaLabel="فرع الورشة"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw size={15} className="ml-1" />
              تحديث
            </Button>
            {can("receive") && (
              <Button
                size="sm"
                onClick={() => setReceiveOpen(true)}
                disabled={refs.isLoading || Boolean(refs.error)}
              >
                <Plus size={16} className="ml-1" />
                استقبال جديد
              </Button>
            )}
          </div>
        </div>
      </div>
      <nav
        aria-label="أقسام الورشة"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {(
          [
            ["jobs", "أوامر العمل", Wrench],
            ["appointments", "المواعيد", CalendarDays],
            ["reports", "التقارير", Gauge],
            ["setup", "التهيئة ودليل المستخدم", BookOpen],
          ] as const
        )
          .filter(([key]) => key !== "reports" || can("report"))
          .map(([key, label, Icon]) => (
            <Button
              key={key}
              variant={view === key ? "default" : "outline"}
              className="h-11 text-xs sm:text-sm"
              onClick={() => setView(key)}
            >
              <Icon size={16} className="ml-1.5" />
              {label}
            </Button>
          ))}
      </nav>
      {refs.error && (
        <ErrorBox
          message={`تعذر تحميل البيانات المرجعية: ${refs.error.message}`}
          retry={() => void refs.refetch()}
        />
      )}
      {view === "setup" && (
        <WorkshopSetupPanel
          businessEntityId={businessEntityId}
          currency={currency}
          canConfigure={can("configure")}
        />
      )}
      {view === "reports" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              ربحية الورشة وأداء الفريق
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              آخر 30 يوماً. قيم التقديرات مؤشرات تشغيلية وليست إيراداً محاسبياً
              مرحّلاً.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.error ? (
              <ErrorBox
                message={report.error.message}
                retry={() => void report.refetch()}
              />
            ) : report.isLoading ? (
              <p role="status">جارٍ تحميل التقرير…</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "قيمة التقديرات المعتمدة",
                      money(report.data?.summary.revenueMinor),
                    ],
                    [
                      "هامش تشغيلي تقديري",
                      money(report.data?.summary.grossMarginMinor),
                    ],
                    [
                      "متوسط دورة الأمر",
                      `${report.data?.summary.averageCycleHours ?? 0} ساعة`,
                    ],
                    [
                      "إصلاح من أول مرة",
                      `${((report.data?.summary.firstTimeFixRateBps ?? 0) / 100).toFixed(1)}%`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">{label}</p>
                      <strong className="mt-2 block text-lg">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {report.data?.technicianPerformance.map(item => (
                    <div
                      key={item.technicianId}
                      className="flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm"
                    >
                      <span>
                        {users.find(user => user.id === item.technicianId)
                          ?.name ?? `مستخدم #${item.technicianId}`}{" "}
                        · {item.completed}/{item.operations} مكتملة
                      </span>
                      <span>{Number(item.actualHours).toFixed(1)} ساعة</span>
                    </div>
                  ))}
                  {!report.data?.technicianPerformance.length && (
                    <p className="py-4 text-center text-sm text-slate-500">
                      ستظهر المؤشرات بعد تسجيل عمليات التنفيذ.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {view === "appointments" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              المواعيد والبايات
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              مواعيد الأيام السبعة القادمة. تُعرض الأوقات بتوقيت جهازك وتحفظ
              كتواريخ UTC.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {can("schedule") && (
              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  schedule.mutate({
                    businessEntityId,
                    customerId: Number(appointment.customerId),
                    vehicleId: Number(appointment.vehicleId),
                    bayId: Number(appointment.bayId),
                    technicianId: appointment.technicianId
                      ? Number(appointment.technicianId)
                      : undefined,
                    serviceType: appointment.service,
                    startsAt: new Date(appointment.starts),
                    endsAt: new Date(appointment.ends),
                    notes: appointment.notes || undefined,
                    idempotencyKey: appointment.key,
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="العميل">
                    <select
                      aria-label="عميل الموعد"
                      className={selectClass}
                      value={appointment.customerId}
                      onChange={e =>
                        setAppointment(v => ({
                          ...v,
                          customerId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customers.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nameAr}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="المركبة">
                    <select
                      aria-label="مركبة الموعد"
                      className={selectClass}
                      value={appointment.vehicleId}
                      onChange={e =>
                        setAppointment(v => ({
                          ...v,
                          vehicleId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">اختر المركبة</option>
                      {vehicles.map(item => (
                        <option key={item.id} value={item.id}>
                          {vehicleName(item.id)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="الباي">
                    <select
                      aria-label="باي الموعد"
                      className={selectClass}
                      value={appointment.bayId}
                      onChange={e =>
                        setAppointment(v => ({ ...v, bayId: e.target.value }))
                      }
                      required
                    >
                      <option value="">اختر الباي</option>
                      {bays.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nameAr} · {item.bayCode}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="فني الجدولة">
                    <select
                      aria-label="فني الموعد"
                      className={selectClass}
                      value={appointment.technicianId}
                      onChange={e =>
                        setAppointment(v => ({
                          ...v,
                          technicianId: e.target.value,
                        }))
                      }
                    >
                      <option value="">اختياري</option>
                      {technicians.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nameAr}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="البداية">
                    <Input
                      aria-label="بداية الموعد"
                      type="datetime-local"
                      value={appointment.starts}
                      onChange={e =>
                        setAppointment(v => ({ ...v, starts: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="النهاية">
                    <Input
                      aria-label="نهاية الموعد"
                      type="datetime-local"
                      value={appointment.ends}
                      onChange={e =>
                        setAppointment(v => ({ ...v, ends: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="نوع الخدمة">
                    <Input
                      value={appointment.service}
                      aria-label="نوع خدمة الموعد"
                      maxLength={120}
                      onChange={e =>
                        setAppointment(v => ({ ...v, service: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="ملاحظات">
                    <Input
                      value={appointment.notes}
                      aria-label="ملاحظات الموعد"
                      maxLength={2000}
                      onChange={e =>
                        setAppointment(v => ({ ...v, notes: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  disabled={
                    schedule.isPending ||
                    !appointment.customerId ||
                    !appointment.vehicleId ||
                    !appointment.bayId ||
                    !appointment.starts ||
                    !appointment.ends ||
                    appointment.service.trim().length < 2 ||
                    new Date(appointment.ends) <= new Date(appointment.starts)
                  }
                >
                  {schedule.isPending ? "جارٍ التحقق والحجز…" : "حجز الموعد"}
                </Button>
              </form>
            )}
            {appointments.error ? (
              <ErrorBox message={appointments.error.message} />
            ) : (
              <div className="space-y-2 border-t pt-4">
                {appointments.data?.schedules.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <span>
                      {bays.find(bay => bay.id === item.bayId)?.nameAr ??
                        `باي #${item.bayId}`}{" "}
                      · {new Date(item.startsAt).toLocaleString("ar-OM")} →{" "}
                      {new Date(item.endsAt).toLocaleTimeString("ar-OM", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge variant="outline">
                      {item.status === "planned"
                        ? "مجدول"
                        : item.status === "cancelled"
                          ? "ملغى"
                          : item.status}
                    </Badge>
                  </div>
                ))}
                {!appointments.isLoading &&
                  !appointments.data?.schedules.length && (
                    <p className="py-4 text-center text-sm text-slate-500">
                      لا توجد مواعيد خلال الفترة.
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {view === "jobs" && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["أوامر مفتوحة", dashboard.data?.counts.openJobs],
              ["بانتظار موافقة", dashboard.data?.counts.awaitingApproval],
              ["قيد الإصلاح", dashboard.data?.counts.inProgress],
              ["ملاحظات جودة", dashboard.data?.counts.failedQc],
            ].map(([label, value]) => (
              <Card key={String(label)} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
                  <strong className="mt-2 block text-2xl">
                    {dashboard.isLoading || dashboard.error
                      ? "—"
                      : (value ?? 0)}
                  </strong>
                </CardContent>
              </Card>
            ))}
          </div>
          {dashboard.error && (
            <ErrorBox
              message={dashboard.error.message}
              retry={() => void dashboard.refetch()}
            />
          )}
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.5fr)]">
            <Card className="min-w-0 border-0 shadow-sm">
              <CardHeader>
                <CardTitle role="heading" aria-level={2} className="text-lg">
                  لوحة أوامر العمل
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  أحدث 50 أمراً ضمن كيانك. اختر الأمر لفتح سجل العمل.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute right-3 top-3 size-4 text-slate-400" />
                  <Input
                    aria-label="البحث في أوامر الورشة"
                    placeholder="رقم الأمر، العميل، المركبة…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-11 pr-9"
                  />
                </div>
                <select
                  aria-label="تصفية حالة أمر العمل"
                  className={selectClass}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">كل المراحل</option>
                  {Object.entries(workshopStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto">
                  {jobs.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={anyPending}
                      onClick={() => chooseJob(item.id)}
                      aria-pressed={selectedJobId === item.id}
                      className={`w-full rounded-xl border p-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 ${selectedJobId === item.id ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="break-all text-sm">
                          {item.jobNo}
                        </strong>
                        <Badge
                          className={`border-0 text-xs ${statusTone(item.status)}`}
                        >
                          {labelStatus(item.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 break-words text-xs leading-6 text-slate-500">
                        {vehicleName(item.vehicleId)} ·{" "}
                        {customerName(item.customerId)}
                      </p>
                      <p className="text-xs text-slate-400">
                        الأولوية:{" "}
                        {priorityLabels[item.priority] ?? item.priority}
                      </p>
                    </button>
                  ))}
                  {!dashboard.isLoading && !jobs.length && (
                    <p className="rounded-xl bg-slate-50 p-5 text-center text-sm leading-7 text-slate-500">
                      {search || statusFilter !== "all"
                        ? "لا توجد أوامر مطابقة للتصفية."
                        : "لا توجد أوامر بعد. ابدأ باستقبال جديد أو راجع دليل التهيئة."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="min-w-0 space-y-4">
              {selectedJobId === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="space-y-3 py-14 text-center">
                    <Wrench className="mx-auto size-9 text-blue-300" />
                    <h2 className="text-lg font-semibold">سجل العمل الموحد</h2>
                    <p className="text-sm text-slate-500">
                      اختر أمراً أو سجّل استقبالاً جديداً لبدء الدورة.
                    </p>
                    <Button variant="outline" onClick={() => setView("setup")}>
                      <BookOpen size={16} className="ml-2" />
                      دليل بدء العمل
                    </Button>
                  </CardContent>
                </Card>
              ) : details.error ? (
                <ErrorBox
                  message={details.error.message}
                  retry={() => void details.refetch()}
                />
              ) : details.isLoading || !job ? (
                <Card>
                  <CardContent role="status" className="p-8">
                    جارٍ تحميل سجل الأمر…
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="break-all text-lg font-semibold">
                            {job.jobNo}
                          </h2>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            {customerName(job.customerId)} ·{" "}
                            {vehicleName(job.vehicleId)}
                          </p>
                        </div>
                        <Badge className={`border-0 ${statusTone(job.status)}`}>
                          {labelStatus(job.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        <span className="w-full text-xs text-slate-500">
                          الانتقال إلى المرحلة التالية بعد استيفاء متطلباتها:
                        </span>
                        {(workshopNextStatuses[job.status] ?? []).map(
                          target => (
                            <Button
                              key={target}
                              size="sm"
                              variant="outline"
                              disabled={
                                anyPending ||
                                !can(
                                  target === "closed"
                                    ? "deliver"
                                    : ["qc", "ready", "road_test"].includes(
                                          target
                                        )
                                      ? "quality"
                                      : "operate"
                                )
                              }
                              onClick={() =>
                                transition.mutate({
                                  businessEntityId,
                                  jobCardId: job.id,
                                  from: job.status,
                                  to: target,
                                })
                              }
                            >
                              {labelStatus(target)}
                            </Button>
                          )
                        )}
                        {job.status === "ready" && (
                          <Button
                            size="sm"
                            onClick={() => setPanel("delivery")}
                          >
                            افتح نموذج التسليم
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <nav
                    aria-label="مراحل أمر العمل"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    {panels.map(([key, label]) => (
                      <Button
                        key={key}
                        className="min-w-0 whitespace-normal text-xs"
                        variant={panel === key ? "default" : "outline"}
                        onClick={() => setPanel(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </nav>
                  <Card className="min-w-0 border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle
                        role="heading"
                        aria-level={2}
                        className="text-lg"
                      >
                        {panels.find(([key]) => key === panel)?.[1]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {panel === "overview" && (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-4">
                              <p className="text-xs text-slate-500">
                                التقدير الحالي
                              </p>
                              <strong>
                                {estimateRow
                                  ? formatWorkshopMoney(
                                      estimateRow.totalMinor,
                                      estimateRow.currency
                                    )
                                  : "لم يصدر بعد"}
                              </strong>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                              <p className="text-xs text-slate-500">
                                المراحل المسجلة
                              </p>
                              <strong>
                                {details.data?.inspections.length ?? 0} فحص ·{" "}
                                {details.data?.operations.length ?? 0} عملية
                              </strong>
                            </div>
                          </div>
                          <p className="text-sm leading-7 text-slate-600">
                            أكمل التشخيص والتقدير وموافقة العميل، ثم الإصلاح
                            والجودة. التسليم يتطلب سداد الفاتورة فعلياً في السجل
                            المركزي، ولا يتم بمجرد تغيير الحالة.
                          </p>
                          <div className="space-y-2">
                            {details.data?.checkins.map(item => (
                              <div
                                key={item.id}
                                className="rounded-xl border p-3 text-sm"
                              >
                                <p className="font-medium">
                                  استقبال المركبة ·{" "}
                                  {item.mileage.toLocaleString("ar-OM")} كم
                                </p>
                                <p className="mt-1 whitespace-pre-wrap break-words leading-7 text-slate-600">
                                  {item.complaint}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {panel === "estimate" && (
                        <>
                          {can("estimate") && !closedJob && !invoice && (
                            <form
                              className="space-y-3"
                              onSubmit={event => {
                                event.preventDefault();
                                if (
                                  estimateNumbers.some(value => value === null)
                                )
                                  return;
                                createEstimate.mutate({
                                  businessEntityId,
                                  jobCardId: job.id,
                                  vehicleId: job.vehicleId,
                                  customerId: job.customerId,
                                  currency,
                                  version: (estimateRow?.version ?? 0) + 1,
                                  laborMinor: parseWorkshopMoney(
                                    estimate.labor,
                                    currency
                                  )!,
                                  partsMinor: parseWorkshopMoney(
                                    estimate.parts,
                                    currency
                                  )!,
                                  subcontractMinor: parseWorkshopMoney(
                                    estimate.subcontract,
                                    currency
                                  )!,
                                  consumablesMinor: parseWorkshopMoney(
                                    estimate.consumables,
                                    currency
                                  )!,
                                  taxMinor: parseWorkshopMoney(
                                    estimate.tax,
                                    currency
                                  )!,
                                  discountMinor: parseWorkshopMoney(
                                    estimate.discount,
                                    currency
                                  )!,
                                });
                              }}
                            >
                              <p className="text-xs text-slate-500">
                                أدخل المبالغ بـ {currency}، ويحوّلها النظام
                                للوحدات الصغرى بدقة.
                              </p>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {(
                                  [
                                    ["labor", "أجور العمالة"],
                                    ["parts", "قطع الغيار"],
                                    ["subcontract", "مقاول خارجي"],
                                    ["consumables", "مواد استهلاكية"],
                                    ["tax", "الضريبة"],
                                    ["discount", "الخصم"],
                                  ] as const
                                ).map(([key, label]) => (
                                  <Field key={key} label={label}>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="any"
                                      aria-label={label}
                                      value={estimate[key]}
                                      onChange={e =>
                                        setEstimate(v => ({
                                          ...v,
                                          [key]: e.target.value,
                                        }))
                                      }
                                    />
                                  </Field>
                                ))}
                              </div>
                              <Button
                                type="submit"
                                disabled={
                                  anyPending ||
                                  estimateNumbers.some(value => value === null)
                                }
                              >
                                {createEstimate.isPending
                                  ? "جارٍ الحفظ…"
                                  : "حفظ إصدار التقدير"}
                              </Button>
                            </form>
                          )}
                          {estimateRow ? (
                            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
                              <div className="flex flex-wrap justify-between gap-2">
                                <strong>
                                  الإصدار {estimateRow.version} ·{" "}
                                  {formatWorkshopMoney(
                                    estimateRow.totalMinor,
                                    estimateRow.currency
                                  )}
                                </strong>
                                <Badge variant="outline">
                                  {estimateRow.status === "approved"
                                    ? "معتمد"
                                    : estimateRow.status === "rejected"
                                      ? "مرفوض"
                                      : estimateRow.status ===
                                          "partially_approved"
                                        ? "طلب تعديل"
                                        : "قيد المراجعة"}
                                </Badge>
                              </div>
                              <p className="break-all text-xs text-slate-500">
                                بصمة الإصدار: {estimateRow.checksum}
                              </p>
                              {can("estimate") && !closedJob && !invoice && (
                                <>
                                  <Field label="مرجع قرار العميل أو سبب التعديل">
                                    <Input
                                      aria-label="مرجع موافقة العميل"
                                      value={consentNote}
                                      maxLength={2000}
                                      onChange={e =>
                                        setConsentNote(e.target.value)
                                      }
                                      placeholder="رقم موافقة مكتوبة، اتصال موثّق، سبب الرفض…"
                                    />
                                  </Field>
                                  <label className="flex items-start gap-2 text-sm leading-6">
                                    <Checkbox
                                      aria-label="تأكيد قرار العميل على إصدار التقدير"
                                      checked={consentConfirmed}
                                      onCheckedChange={checked =>
                                        setConsentConfirmed(checked === true)
                                      }
                                    />
                                    <span>
                                      أؤكد أن القرار يخص هذا الإصدار وقد صدر عن
                                      العميل. هذا توثيق داخلي وليس توقيعاً
                                      رقمياً.
                                    </span>
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {(
                                      [
                                        ["approved", "توثيق الموافقة"],
                                        ["change_requested", "طلب تعديل"],
                                        ["rejected", "توثيق الرفض"],
                                      ] as const
                                    ).map(([decision, label]) => (
                                      <Button
                                        key={decision}
                                        size="sm"
                                        variant={
                                          decision === "approved"
                                            ? "default"
                                            : "outline"
                                        }
                                        disabled={
                                          anyPending ||
                                          !consentConfirmed ||
                                          consentNote.trim().length < 3 ||
                                          !estimateRow.checksum
                                        }
                                        onClick={() =>
                                          consent.mutate({
                                            businessEntityId,
                                            estimateId: estimateRow.id,
                                            customerId: job.customerId,
                                            decision,
                                            version: estimateRow.version,
                                            estimateChecksum:
                                              estimateRow.checksum,
                                            reason: consentNote.trim(),
                                            channel: "workshop",
                                          })
                                        }
                                      >
                                        {label}
                                      </Button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              لا يوجد تقدير لهذا الأمر.
                            </p>
                          )}
                        </>
                      )}
                      {panel === "inspection" && (
                        <>
                          {can("inspect") && !closedJob && (
                            <>
                              <Field label="نتيجة الفحص الشامل">
                                <Textarea
                                  aria-label="نتيجة الفحص الشامل"
                                  value={inspection}
                                  maxLength={4000}
                                  onChange={e => setInspection(e.target.value)}
                                  placeholder="المحرك، السوائل، الإطارات، الكهرباء، السلامة…"
                                />
                              </Field>
                              <Field label="صور الفحص (حتى 5 ميجابايت للصورة)">
                                <Input
                                  aria-label="رفع صورة الفحص"
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  disabled={anyPending}
                                  onChange={e => {
                                    void uploadPhoto(e.target.files?.[0]);
                                    e.target.value = "";
                                  }}
                                />
                              </Field>
                              <p className="text-xs text-slate-500">
                                <ImagePlus size={14} className="ml-1 inline" />
                                {uploadedMedia.length} صورة جاهزة للربط بالفحص
                              </p>
                              <Button
                                disabled={
                                  anyPending || inspection.trim().length < 3
                                }
                                onClick={() =>
                                  createInspection.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    vehicleId: job.vehicleId,
                                    templateCode: "full-vehicle-inspection",
                                    findingsJson: JSON.stringify({
                                      notes: inspection,
                                    }),
                                    mediaRefsJson:
                                      JSON.stringify(uploadedMedia),
                                    summary: inspection,
                                    status: "completed",
                                  })
                                }
                              >
                                حفظ الفحص
                              </Button>
                              <div className="space-y-3 border-t pt-4">
                                <h3 className="text-sm font-semibold">
                                  رمز عطل تشخيصي
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Field label="رمز DTC">
                                    <Input
                                      aria-label="رمز DTC"
                                      value={dtc.code}
                                      maxLength={40}
                                      onChange={e =>
                                        setDtc(v => ({
                                          ...v,
                                          code: e.target.value,
                                        }))
                                      }
                                      placeholder="P0300"
                                    />
                                  </Field>
                                  <Field label="الأهمية">
                                    <select
                                      aria-label="أهمية DTC"
                                      className={selectClass}
                                      value={dtc.severity}
                                      onChange={e =>
                                        setDtc(v => ({
                                          ...v,
                                          severity: e.target
                                            .value as typeof v.severity,
                                        }))
                                      }
                                    >
                                      <option value="info">معلومة</option>
                                      <option value="low">منخفضة</option>
                                      <option value="medium">متوسطة</option>
                                      <option value="high">عالية</option>
                                      <option value="critical">حرجة</option>
                                    </select>
                                  </Field>
                                </div>
                                <Field label="وصف العطل">
                                  <Input
                                    aria-label="وصف DTC"
                                    maxLength={2000}
                                    value={dtc.description}
                                    onChange={e =>
                                      setDtc(v => ({
                                        ...v,
                                        description: e.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                                <Button
                                  variant="outline"
                                  disabled={
                                    anyPending ||
                                    dtc.code.trim().length < 2 ||
                                    dtc.description.trim().length < 2
                                  }
                                  onClick={() =>
                                    recordDtc.mutate({
                                      businessEntityId,
                                      jobCardId: job.id,
                                      ...dtc,
                                    })
                                  }
                                >
                                  ربط العطل بالأمر
                                </Button>
                              </div>
                            </>
                          )}
                          <div className="space-y-2">
                            {details.data?.inspections.map(item => (
                              <div
                                key={item.id}
                                className="rounded-xl border p-3 text-sm"
                              >
                                <p className="text-xs text-slate-500">
                                  {new Date(item.createdAt).toLocaleString(
                                    "ar-OM"
                                  )}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap break-words leading-7">
                                  {item.summary}
                                </p>
                              </div>
                            ))}
                            {details.data?.dtcs.map(item => (
                              <p
                                key={item.id}
                                className="rounded-lg bg-amber-50 p-3 text-sm"
                              >
                                {item.code} · {item.description}
                              </p>
                            ))}
                          </div>
                        </>
                      )}
                      {panel === "operations" && (
                        <>
                          {can("operate") && !closedJob && (
                            <form
                              className="space-y-3"
                              onSubmit={event => {
                                event.preventDefault();
                                const cost = parseWorkshopMoney(
                                  operation.cost,
                                  currency
                                );
                                if (cost !== null)
                                  createOperation.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    operation: operation.name,
                                    technicianUserId: operation.userId
                                      ? Number(operation.userId)
                                      : undefined,
                                    standardHours: operation.hours,
                                    laborCostMinor: cost,
                                  });
                              }}
                            >
                              <Field label="وصف العملية">
                                <Input
                                  aria-label="وصف العملية"
                                  maxLength={180}
                                  value={operation.name}
                                  onChange={e =>
                                    setOperation(v => ({
                                      ...v,
                                      name: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="حساب المستخدم المنفذ">
                                <select
                                  aria-label="المستخدم المنفذ للعملية"
                                  className={selectClass}
                                  value={operation.userId}
                                  onChange={e =>
                                    setOperation(v => ({
                                      ...v,
                                      userId: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">غير مسندة بعد</option>
                                  {users.map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.name ?? `مستخدم #${item.id}`}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="الساعات القياسية">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    step="0.01"
                                    aria-label="الساعات القياسية"
                                    value={operation.hours}
                                    onChange={e =>
                                      setOperation(v => ({
                                        ...v,
                                        hours: e.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                                <Field label={`تكلفة العمالة (${currency})`}>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    aria-label="تكلفة العمالة"
                                    value={operation.cost}
                                    onChange={e =>
                                      setOperation(v => ({
                                        ...v,
                                        cost: e.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                              </div>
                              <Button
                                type="submit"
                                disabled={
                                  anyPending ||
                                  operation.name.trim().length < 2 ||
                                  !/^\d+(\.\d{1,2})?$/.test(operation.hours) ||
                                  Number(operation.hours) > 1000 ||
                                  parseWorkshopMoney(
                                    operation.cost,
                                    currency
                                  ) === null
                                }
                              >
                                إضافة العملية
                              </Button>
                            </form>
                          )}
                          <div className="space-y-3">
                            {details.data?.operations.map(item => (
                              <div
                                key={item.id}
                                className="space-y-2 rounded-xl border p-3"
                              >
                                <div className="flex flex-wrap justify-between gap-2">
                                  <strong className="text-sm">
                                    {item.operation}
                                  </strong>
                                  <Badge variant="outline">
                                    {
                                      (
                                        {
                                          planned: "مخططة",
                                          in_progress: "قيد التنفيذ",
                                          paused: "متوقفة",
                                          completed: "مكتملة",
                                          rework: "إعادة عمل",
                                        } as Record<string, string>
                                      )[item.status]
                                    }
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                  قياسي: {item.standardHours} ساعة · فعلي:{" "}
                                  {item.actualHours} ساعة
                                </p>
                                {can("operate") && !closedJob && (
                                  <>
                                    <Field label="الوقت الفعلي (ساعات)">
                                      <Input
                                        aria-label={`الوقت الفعلي ${item.id}`}
                                        type="number"
                                        min="0"
                                        max="1000"
                                        step="0.01"
                                        value={
                                          operationHours[item.id] ??
                                          item.actualHours
                                        }
                                        onChange={e =>
                                          setOperationHours(v => ({
                                            ...v,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                      />
                                    </Field>
                                    <div className="flex flex-wrap gap-2">
                                      {(
                                        [
                                          ["in_progress", "بدء"],
                                          ["paused", "إيقاف"],
                                          ["completed", "إتمام"],
                                          ["rework", "إعادة عمل"],
                                        ] as const
                                      ).map(([status, label]) => (
                                        <Button
                                          key={status}
                                          variant="outline"
                                          size="sm"
                                          disabled={
                                            anyPending ||
                                            item.status === status ||
                                            !/^\d+(\.\d{1,2})?$/.test(
                                              operationHours[item.id] ??
                                                item.actualHours
                                            ) ||
                                            Number(
                                              operationHours[item.id] ??
                                                item.actualHours
                                            ) > 1000
                                          }
                                          onClick={() =>
                                            updateOperation.mutate({
                                              businessEntityId,
                                              operationId: item.id,
                                              status,
                                              actualHours:
                                                operationHours[item.id] ??
                                                item.actualHours,
                                            })
                                          }
                                        >
                                          {label}
                                        </Button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                            {!details.data?.operations.length && (
                              <p className="text-sm text-slate-500">
                                لا توجد عمليات مسجلة.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      {panel === "parts" && (
                        <>
                          {can("parts") && !closedJob && (
                            <div className="space-y-3">
                              <Field label="المستودع">
                                <select
                                  aria-label="مستودع قطع الورشة"
                                  className={selectClass}
                                  value={parts.warehouseId}
                                  onChange={e =>
                                    setParts(v => ({
                                      ...v,
                                      warehouseId: e.target.value,
                                      productId: "",
                                      key: workshopRequestKey("part"),
                                    }))
                                  }
                                >
                                  <option value="">اختر المستودع</option>
                                  {warehouses.map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.nameAr} · {item.warehouseCode}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="الصنف">
                                <select
                                  aria-label="صنف قطع الورشة"
                                  className={selectClass}
                                  value={parts.productId}
                                  onChange={e =>
                                    setParts(v => ({
                                      ...v,
                                      productId: e.target.value,
                                      key: workshopRequestKey("part"),
                                    }))
                                  }
                                >
                                  <option value="">اختر القطعة</option>
                                  {products.map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.nameAr} · {item.sku}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="الكمية">
                                  <Input
                                    aria-label="كمية قطع الورشة"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={parts.qty}
                                    onChange={e =>
                                      setParts(v => ({
                                        ...v,
                                        qty: e.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                                  المتاح حالياً: <strong>{available}</strong>
                                </div>
                              </div>
                              <Button
                                disabled={
                                  anyPending ||
                                  !parts.productId ||
                                  !parts.warehouseId ||
                                  !validWorkshopInteger(parts.qty) ||
                                  Number(parts.qty) < 1 ||
                                  Number(parts.qty) > available
                                }
                                onClick={() =>
                                  requestPart.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    warehouseId: Number(parts.warehouseId),
                                    productId: Number(parts.productId),
                                    quantity: Number(parts.qty),
                                    idempotencyKey: parts.key,
                                  })
                                }
                              >
                                حجز الكمية
                              </Button>
                            </div>
                          )}
                          <div className="space-y-2">
                            {details.data?.parts.map(item => (
                              <div
                                key={item.id}
                                className="space-y-2 rounded-xl border p-3"
                              >
                                <div className="flex flex-wrap justify-between gap-2 text-sm">
                                  <span>
                                    {products.find(p => p.id === item.productId)
                                      ?.nameAr ?? `صنف #${item.productId}`}{" "}
                                    · {item.quantity}
                                  </span>
                                  <Badge variant="outline">
                                    {item.status === "reserved"
                                      ? "محجوز"
                                      : item.status === "issued"
                                        ? "مصروف"
                                        : item.status === "returned"
                                          ? "مرجع"
                                          : item.status}
                                  </Badge>
                                </div>
                                {can("parts") && !closedJob && (
                                  <div className="flex flex-wrap gap-2">
                                    {item.status === "reserved" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={anyPending}
                                        onClick={() =>
                                          issuePart.mutate({
                                            businessEntityId,
                                            requestId: item.id,
                                            quantity: item.quantity,
                                            idempotencyKey: `ws-issue-${businessEntityId}-${item.id}`,
                                          })
                                        }
                                      >
                                        صرف الطلب كاملاً
                                      </Button>
                                    )}
                                    {["reserved", "issued"].includes(
                                      item.status
                                    ) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={anyPending}
                                        onClick={() =>
                                          returnPart.mutate({
                                            businessEntityId,
                                            requestId: item.id,
                                            quantity: item.quantity,
                                            idempotencyKey: `ws-return-${businessEntityId}-${item.id}`,
                                          })
                                        }
                                      >
                                        {item.status === "reserved"
                                          ? "إلغاء الحجز وإرجاعه"
                                          : "إرجاع القطع المصروفة"}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {panel === "quality" && (
                        <>
                          <p className="text-sm leading-7 text-slate-500">
                            تسجّل الجودة أثناء مرحلة فحص الجودة أو اختبار
                            الطريق. نجاح الفحص لا يغيّر الأمر إلى جاهز تلقائياً.
                          </p>
                          {can("quality") && !closedJob && (
                            <div className="space-y-3">
                              {(
                                [
                                  ["repair", "تم التحقق من إصلاح شكوى العميل"],
                                  [
                                    "safety",
                                    "السلامة والفرامل والأنظمة الأساسية",
                                  ],
                                  ["fluids", "السوائل وعدم وجود تسرب"],
                                  ["cleanliness", "النظافة وإعادة التجهيز"],
                                ] as const
                              ).map(([key, label]) => (
                                <label
                                  key={key}
                                  className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                                >
                                  <Checkbox
                                    aria-label={label}
                                    checked={quality.checks[key]}
                                    onCheckedChange={checked =>
                                      setQuality(v => ({
                                        ...v,
                                        checks: {
                                          ...v.checks,
                                          [key]: checked === true,
                                        },
                                      }))
                                    }
                                  />
                                  {label}
                                </label>
                              ))}
                              <Field label="نتيجة الفحص">
                                <select
                                  aria-label="نتيجة الجودة"
                                  className={selectClass}
                                  value={quality.result}
                                  onChange={e =>
                                    setQuality(v => ({
                                      ...v,
                                      result: e.target.value as typeof v.result,
                                    }))
                                  }
                                >
                                  <option value="passed">اجتاز</option>
                                  <option value="failed">لم يجتز</option>
                                  <option value="rework">إعادة عمل</option>
                                </select>
                              </Field>
                              <Field label="العيب أو الملاحظة">
                                <Textarea
                                  aria-label="ملاحظات الجودة"
                                  maxLength={2000}
                                  value={quality.defect}
                                  onChange={e =>
                                    setQuality(v => ({
                                      ...v,
                                      defect: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Button
                                disabled={
                                  anyPending ||
                                  !["qc", "road_test"].includes(job.status) ||
                                  (quality.result === "passed"
                                    ? !qualityChecksPassed
                                    : quality.defect.trim().length < 3)
                                }
                                onClick={() =>
                                  recordQuality.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    result: quality.result,
                                    checklistJson: JSON.stringify(
                                      quality.checks
                                    ),
                                    defect: quality.defect || undefined,
                                  })
                                }
                              >
                                حفظ نتيجة الجودة
                              </Button>
                            </div>
                          )}
                          {details.data?.quality.map(item => (
                            <div
                              key={item.id}
                              className="rounded-xl border p-3 text-sm"
                            >
                              <Badge
                                className={`border-0 ${item.result === "passed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {item.result === "passed"
                                  ? "اجتاز"
                                  : item.result === "failed"
                                    ? "لم يجتز"
                                    : "إعادة عمل"}
                              </Badge>
                              <p className="mt-2 text-slate-600">
                                {item.defect || "لا توجد ملاحظات"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(item.createdAt).toLocaleString(
                                  "ar-OM"
                                )}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                      {panel === "road" && (
                        <>
                          {can("operate") && !closedJob && (
                            <div className="space-y-3">
                              {!activeRoad ? (
                                <>
                                  <Field label="حساب السائق المخوّل">
                                    <select
                                      aria-label="سائق اختبار الطريق"
                                      className={selectClass}
                                      value={road.driverId}
                                      onChange={e =>
                                        setRoad(v => ({
                                          ...v,
                                          driverId: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">اختر المستخدم</option>
                                      {users.map(item => (
                                        <option key={item.id} value={item.id}>
                                          {item.name ?? `مستخدم #${item.id}`}
                                        </option>
                                      ))}
                                    </select>
                                  </Field>
                                  <Field label="العداد عند البداية">
                                    <Input
                                      aria-label="بداية عداد الطريق"
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={road.start}
                                      onChange={e =>
                                        setRoad(v => ({
                                          ...v,
                                          start: e.target.value,
                                        }))
                                      }
                                    />
                                  </Field>
                                  <Button
                                    disabled={
                                      anyPending ||
                                      !road.driverId ||
                                      !validWorkshopInteger(road.start) ||
                                      job.status !== "road_test"
                                    }
                                    onClick={() =>
                                      authorizeRoad.mutate({
                                        businessEntityId,
                                        jobCardId: job.id,
                                        driverUserId: Number(road.driverId),
                                        startMileage: Number(road.start),
                                      })
                                    }
                                  >
                                    تفويض اختبار الطريق
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <p className="rounded-lg bg-blue-50 p-3 text-sm">
                                    اختبار جارٍ · عداد البداية{" "}
                                    {activeRoad.startMileage}
                                  </p>
                                  <Field label="العداد عند النهاية">
                                    <Input
                                      aria-label="نهاية عداد الطريق"
                                      type="number"
                                      min={activeRoad.startMileage}
                                      step="1"
                                      value={road.end}
                                      onChange={e =>
                                        setRoad(v => ({
                                          ...v,
                                          end: e.target.value,
                                        }))
                                      }
                                    />
                                  </Field>
                                  <Field label="نتائج اختبار الطريق">
                                    <Textarea
                                      aria-label="نتائج اختبار الطريق"
                                      maxLength={3000}
                                      value={road.findings}
                                      onChange={e =>
                                        setRoad(v => ({
                                          ...v,
                                          findings: e.target.value,
                                        }))
                                      }
                                    />
                                  </Field>
                                  <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      aria-label="حادث أثناء اختبار الطريق"
                                      checked={road.incident}
                                      onCheckedChange={checked =>
                                        setRoad(v => ({
                                          ...v,
                                          incident: checked === true,
                                        }))
                                      }
                                    />
                                    حدثت واقعة أو ملاحظة سلامة
                                  </label>
                                  <Button
                                    disabled={
                                      anyPending ||
                                      !validWorkshopInteger(road.end) ||
                                      Number(road.end) <
                                        activeRoad.startMileage ||
                                      road.findings.trim().length < 3
                                    }
                                    onClick={() =>
                                      completeRoad.mutate({
                                        businessEntityId,
                                        roadTestId: activeRoad.id,
                                        endMileage: Number(road.end),
                                        findings: road.findings,
                                        incident: road.incident,
                                      })
                                    }
                                  >
                                    إكمال اختبار الطريق
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                          {details.data?.roadTests.map(item => (
                            <div
                              key={item.id}
                              className="rounded-xl border p-3 text-sm"
                            >
                              <strong>
                                {item.status === "completed"
                                  ? "اختبار مكتمل"
                                  : "اختبار مفوّض"}
                              </strong>
                              <p className="mt-1">
                                {item.startMileage} → {item.endMileage ?? "—"}{" "}
                                كم
                              </p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">
                                {item.findings}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                      {panel === "delivery" && (
                        <>
                          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                            التسليم يتحقق خادمياً من الحالة والجودة والفاتورة
                            والتحصيل. لا يؤدي الضغط هنا إلى تحصيل دفعة أو ترحيل
                            محاسبي تلقائي.
                          </div>
                          {!invoice ? (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-500">
                                لا توجد فاتورة مرتبطة بهذا الأمر.
                              </p>
                              {can("invoice") && (
                                <>
                                  <Field label="رقم الفاتورة">
                                    <Input
                                      aria-label="رقم فاتورة الورشة"
                                      value={invoiceNo}
                                      maxLength={100}
                                      onChange={e =>
                                        setInvoiceNo(e.target.value)
                                      }
                                      placeholder={`WS-INV-${job.jobNo}`}
                                    />
                                  </Field>
                                  <Button
                                    disabled={
                                      anyPending ||
                                      invoiceNo.trim().length < 3 ||
                                      estimateRow?.status !== "approved" ||
                                      Boolean(closedJob)
                                    }
                                    onClick={() =>
                                      issueInvoice.mutate({
                                        businessEntityId,
                                        jobCardId: job.id,
                                        invoiceNo,
                                      })
                                    }
                                  >
                                    إصدار الفاتورة المركزية
                                  </Button>
                                  <p className="text-xs text-slate-500">
                                    يلزم تقدير معتمد؛ تنشأ الفاتورة مرة واحدة
                                    لكل أمر.
                                  </p>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl border p-4 text-sm">
                              <p className="font-semibold">
                                {invoice.invoiceNo} ·{" "}
                                {formatWorkshopMoney(
                                  invoice.amountMinor,
                                  invoice.currency
                                )}
                              </p>
                              <p className="mt-2">
                                المحصّل:{" "}
                                {formatWorkshopMoney(
                                  invoice.paidAmountMinor,
                                  invoice.currency
                                )}{" "}
                                · المتبقي:{" "}
                                {formatWorkshopMoney(
                                  outstanding,
                                  invoice.currency
                                )}
                              </p>
                              <p className="mt-3 text-xs text-slate-500">
                                فاتورة مشتركة مع سجل الفوترة والتحصيل المركزي.
                              </p>
                            </div>
                          )}
                          {can("collect") &&
                            invoice &&
                            outstanding !== null &&
                            outstanding > 0 &&
                            !["cancelled", "disputed"].includes(
                              invoice.status
                            ) && (
                              <form
                                className="space-y-3 rounded-xl border p-4"
                                onSubmit={event => {
                                  event.preventDefault();
                                  const amount = parseWorkshopMoney(
                                    receipt.amount,
                                    invoice.currency
                                  );
                                  if (amount !== null && amount > 0)
                                    recordPayment.mutate({
                                      businessEntityId,
                                      jobCardId: job.id,
                                      amountMinor: amount,
                                      method: receipt.method,
                                      reference: receipt.reference.trim(),
                                      receivedConfirmation: true,
                                      idempotencyKey: receipt.key,
                                    });
                                }}
                              >
                                <h3 className="font-semibold">
                                  تسجيل مبلغ مستلم فعلياً
                                </h3>
                                <p className="text-xs leading-6 text-slate-500">
                                  هذا سجل قبض داخلي. لا يخصم من بطاقة ولا ينفذ
                                  حوالة خارجية أو ترحيلاً إلى دفتر الأستاذ.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Field label={`المبلغ (${invoice.currency})`}>
                                    <Input
                                      aria-label="مبلغ تحصيل الورشة"
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={receipt.amount}
                                      onChange={e =>
                                        setReceipt(v => ({
                                          ...v,
                                          amount: e.target.value,
                                        }))
                                      }
                                    />
                                  </Field>
                                  <Field label="طريقة الاستلام">
                                    <select
                                      aria-label="طريقة تحصيل الورشة"
                                      className={selectClass}
                                      value={receipt.method}
                                      onChange={e =>
                                        setReceipt(v => ({
                                          ...v,
                                          method: e.target
                                            .value as typeof v.method,
                                        }))
                                      }
                                    >
                                      <option value="cash">نقد</option>
                                      <option value="bank_transfer">
                                        حوالة مستلمة
                                      </option>
                                    </select>
                                  </Field>
                                </div>
                                <Field label="مرجع سند القبض أو الحوالة">
                                  <Input
                                    aria-label="مرجع تحصيل الورشة"
                                    value={receipt.reference}
                                    maxLength={120}
                                    onChange={e =>
                                      setReceipt(v => ({
                                        ...v,
                                        reference: e.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                                <label className="flex items-start gap-2 text-sm leading-6">
                                  <Checkbox
                                    aria-label="تأكيد استلام مبلغ التحصيل فعلياً"
                                    checked={receipt.confirmation}
                                    onCheckedChange={checked =>
                                      setReceipt(v => ({
                                        ...v,
                                        confirmation: checked === true,
                                      }))
                                    }
                                  />
                                  <span>
                                    أؤكد استلام المبلغ فعلياً والتحقق من مرجع
                                    سند القبض أو الحوالة.
                                  </span>
                                </label>
                                <Button
                                  type="submit"
                                  disabled={
                                    anyPending ||
                                    !receipt.confirmation ||
                                    receipt.reference.trim().length < 3 ||
                                    parseWorkshopMoney(
                                      receipt.amount,
                                      invoice.currency
                                    ) === null ||
                                    (parseWorkshopMoney(
                                      receipt.amount,
                                      invoice.currency
                                    ) ?? 0) <= 0 ||
                                    (parseWorkshopMoney(
                                      receipt.amount,
                                      invoice.currency
                                    ) ?? Infinity) > outstanding
                                  }
                                >
                                  {recordPayment.isPending
                                    ? "جارٍ التسجيل…"
                                    : "تسجيل التحصيل الموثق"}
                                </Button>
                              </form>
                            )}
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              ["المرحلة جاهزة", job.status === "ready"],
                              [
                                "آخر جودة ناجحة",
                                latestQuality?.result === "passed",
                              ],
                              [
                                "الفاتورة مسددة",
                                Boolean(
                                  invoice &&
                                    outstanding === 0 &&
                                    !["cancelled", "disputed"].includes(
                                      invoice.status
                                    )
                                ),
                              ],
                            ].map(([label, passed]) => (
                              <div
                                key={String(label)}
                                className={`rounded-lg p-3 text-xs ${passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {passed ? "مكتمل" : "مطلوب"} · {label}
                              </div>
                            ))}
                          </div>
                          {can("deliver") && !closedJob && (
                            <div className="space-y-3">
                              <Field label="العداد عند التسليم">
                                <Input
                                  aria-label="عداد التسليم"
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={delivery.mileage}
                                  onChange={e =>
                                    setDelivery(v => ({
                                      ...v,
                                      mileage: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="مراجع مستندات التسليم">
                                <Textarea
                                  aria-label="مستندات التسليم"
                                  maxLength={3000}
                                  value={delivery.documents}
                                  onChange={e =>
                                    setDelivery(v => ({
                                      ...v,
                                      documents: e.target.value,
                                    }))
                                  }
                                  placeholder="رقم محضر التسليم، تقرير الجودة، مرجع الفاتورة…"
                                />
                              </Field>
                              <label className="flex items-start gap-2 text-sm leading-6">
                                <Checkbox
                                  aria-label="إقرار استلام العميل"
                                  checked={delivery.acknowledgement}
                                  onCheckedChange={checked =>
                                    setDelivery(v => ({
                                      ...v,
                                      acknowledgement: checked === true,
                                    }))
                                  }
                                />
                                <span>
                                  أؤكد تسليم المستندات وحصول الورشة على إقرار
                                  استلام العميل.
                                </span>
                              </label>
                              <Button
                                disabled={
                                  anyPending ||
                                  !deliveryReady ||
                                  !validWorkshopInteger(delivery.mileage) ||
                                  delivery.documents.trim().length < 3 ||
                                  !delivery.acknowledgement
                                }
                                onClick={() =>
                                  deliver.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    customerId: job.customerId,
                                    mileage: Number(delivery.mileage),
                                    documentsJson: JSON.stringify({
                                      references: delivery.documents,
                                      invoiceNo: invoice?.invoiceNo,
                                    }),
                                    customerAcknowledgement: true,
                                    idempotencyKey: delivery.key,
                                  })
                                }
                              >
                                {deliver.isPending
                                  ? "جارٍ تسجيل التسليم…"
                                  : "تأكيد التسليم"}
                              </Button>
                            </div>
                          )}
                          {details.data?.deliveries.map(item => (
                            <p
                              key={item.id}
                              className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
                            >
                              تم التسليم ·{" "}
                              {item.deliveredAt
                                ? new Date(item.deliveredAt).toLocaleString(
                                    "ar-OM"
                                  )
                                : "—"}{" "}
                              · {item.mileage} كم
                            </p>
                          ))}
                        </>
                      )}
                      {panel === "warranty" && (
                        <>
                          {can("operate") && (
                            <div className="space-y-3">
                              <Field label="التغطية والشروط">
                                <Textarea
                                  aria-label="تغطية ضمان الورشة"
                                  maxLength={3000}
                                  value={warranty.coverage}
                                  onChange={e =>
                                    setWarranty(v => ({
                                      ...v,
                                      coverage: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="رقم المطالبة (اختياري)">
                                <Input
                                  aria-label="رقم مطالبة الضمان"
                                  maxLength={100}
                                  value={warranty.claimNo}
                                  onChange={e =>
                                    setWarranty(v => ({
                                      ...v,
                                      claimNo: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="السبب الجذري">
                                <Textarea
                                  aria-label="سبب عودة الضمان"
                                  maxLength={2000}
                                  value={warranty.rootCause}
                                  onChange={e =>
                                    setWarranty(v => ({
                                      ...v,
                                      rootCause: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="الإجراء التصحيحي">
                                <Textarea
                                  aria-label="الإجراء التصحيحي للضمان"
                                  maxLength={4000}
                                  value={warranty.action}
                                  onChange={e =>
                                    setWarranty(v => ({
                                      ...v,
                                      action: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Button
                                disabled={
                                  anyPending ||
                                  warranty.coverage.trim().length < 3
                                }
                                onClick={() =>
                                  createWarranty.mutate({
                                    businessEntityId,
                                    jobCardId: job.id,
                                    vehicleId: job.vehicleId,
                                    warrantyType: "workshop",
                                    coverageJson: JSON.stringify({
                                      coverage: warranty.coverage,
                                    }),
                                    claimNo: warranty.claimNo || undefined,
                                    rootCause: warranty.rootCause || undefined,
                                    correctiveAction:
                                      warranty.action || undefined,
                                  })
                                }
                              >
                                حفظ الضمان
                              </Button>
                            </div>
                          )}
                          {details.data?.warranties.map(item => (
                            <div
                              key={item.id}
                              className="rounded-xl border p-3 text-sm"
                            >
                              {item.claimNo || "ضمان الورشة"} ·{" "}
                              {item.warrantyType}
                              <p className="mt-1 text-slate-500">
                                {item.rootCause}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {can("receive") && (
        <WorkshopReceiveDialog
          businessEntityId={businessEntityId}
          customers={customers}
          vehicles={vehicles}
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          onCreated={id => {
            chooseJob(id);
            setView("jobs");
            refresh();
          }}
        />
      )}
    </div>
  );
}
