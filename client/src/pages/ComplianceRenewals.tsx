import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { buildRenewalSummary, daysUntil, filterRenewals, renewalUrgency, type RenewalItem, type RenewalUrgency } from "@shared/compliance42";
import { AlertTriangle, ArrowUpLeft, BellRing, CalendarClock, CheckCircle2, Clock3, FileCheck2, Gavel, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

const ENTITY_ID = 1;
const urgencyLabels: Record<RenewalUrgency, string> = { overdue: "متأخر", critical: "عاجل جداً", warning: "يحتاج متابعة", planned: "مخطط", unknown: "بدون تاريخ" };
const urgencyTone: Record<RenewalUrgency, "destructive" | "secondary" | "outline"> = { overdue: "destructive", critical: "destructive", warning: "secondary", planned: "outline", unknown: "outline" };
const typeLabels = { permit: "تصريح", contract: "عقد" } as const;

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "غير محدد";
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? "غير محدد" : parsed.toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
}

function daysLabel(days: number | null) {
  if (days === null) return "لا يوجد تاريخ تجديد";
  if (days < 0) return `متأخر منذ ${Math.abs(days)} يوم`;
  if (days === 0) return "يستحق اليوم";
  return `متبقٍ ${days} يوم`;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-muted/10 p-10 text-center text-sm text-muted-foreground">{text}</div>;
}

export default function ComplianceRenewals() {
  const [now] = useState(() => new Date());
  const [type, setType] = useState<"all" | "permit" | "contract">("all");
  const [urgency, setUrgency] = useState<RenewalUrgency | "all">("all");
  const [status, setStatus] = useState("all");
  const [ownerUserId, setOwnerUserId] = useState<number | "all">("all");
  const [horizon, setHorizon] = useState<number | "all">(90);
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = trpc.compliance42.overview.useQuery({ businessEntityId: ENTITY_ID });

  const items = useMemo<RenewalItem[]>(() => [
    ...(data?.permits ?? []).map((item) => ({ id: item.id, type: "permit" as const, label: item.permitKey, expiryDate: item.expiryDate, status: item.status, ownerUserId: item.ownerUserId, sourceKey: item.activityKey })),
    ...(data?.contracts ?? []).map((item) => ({ id: item.id, type: "contract" as const, label: `${item.contractKey} · ${item.counterpartyName}`, expiryDate: item.renewalDate ?? item.endDate, status: item.status, ownerUserId: item.ownerUserId, sourceKey: item.contractType })),
  ], [data]);
  const ownerIds = useMemo(() => Array.from(new Set(items.map((item) => item.ownerUserId).filter((id): id is number => typeof id === "number"))).sort((a, b) => a - b), [items]);
  const filtered = useMemo(() => filterRenewals(items, { type, urgency, status, ownerUserId, query, horizonDays: horizon }, now).sort((a, b) => (daysUntil(a.expiryDate, now) ?? 999999) - (daysUntil(b.expiryDate, now) ?? 999999)), [items, type, urgency, status, ownerUserId, query, horizon, now]);
  const summary = useMemo(() => buildRenewalSummary(items, now), [items, now]);
  const visibleSummary = useMemo(() => buildRenewalSummary(filtered, now), [filtered, now]);
  const resetFilters = () => { setType("all"); setUrgency("all"); setStatus("all"); setOwnerUserId("all"); setHorizon(90); setQuery(""); };

  return <DashboardLayout><main dir="rtl" className="min-h-screen bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl md:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100"><BellRing className="h-3.5 w-3.5" /> مراقبة التجديدات التنظيمية</div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">تنبيهات تجديد التصاريح والعقود</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100">لوحة متابعة استباقية تساعد فريق الامتثال على ترتيب التجديدات قبل الاستحقاق، مع إبقاء القرار القانوني والمراسلات الرسمية ضمن مسار الاعتماد المختص.</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm backdrop-blur"><p className="text-indigo-200">نطاق المتابعة</p><p className="mt-1 font-semibold">الكيان {ENTITY_ID} · حتى {formatDate(now)}</p><a className="mt-3 inline-flex items-center gap-1 text-indigo-200 hover:text-white" href="/compliance-governance">فتح مساحة الحوكمة <ArrowUpLeft className="h-4 w-4" /></a></div></div></header>

    {error ? <EmptyState text="تعذر تحميل تنبيهات التجديد ضمن نطاق الكيان المحدد." /> : <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        { label: "كل السجلات", value: summary.total, icon: CalendarClock, tone: "bg-slate-100 text-slate-700" },
        { label: "متأخر أو عاجل", value: summary.counts.overdue + summary.counts.critical, icon: ShieldAlert, tone: "bg-rose-100 text-rose-700" },
        { label: "يحتاج متابعة", value: summary.counts.warning, icon: Clock3, tone: "bg-amber-100 text-amber-700" },
        { label: "ضمن خطة المتابعة", value: summary.counts.planned, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
      ].map(({ label, value, icon: Icon, tone }) => <Card key={label} className="border-0 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon className="h-5 w-5" /></div></CardContent></Card>)}</section>

      <Card className="border-0 shadow-sm"><CardHeader className="gap-4 border-b bg-background/70 md:flex-row md:items-center md:justify-between"><div><CardTitle>صندوق التنبيهات</CardTitle><p className="mt-1 text-sm text-muted-foreground">عرض {visibleSummary.total} من أصل {summary.total} سجل وفق الفلاتر الحالية</p></div><Button variant="outline" onClick={resetFilters}><RotateCcw className="ml-2 h-4 w-4" /> إعادة ضبط</Button></CardHeader><CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6 md:p-5"><div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم التصريح أو العقد..." className="pr-9" aria-label="البحث في التنبيهات" /></div><select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="نوع السجل"><option value="all">كل الأنواع</option><option value="permit">التصاريح</option><option value="contract">العقود</option></select><select value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgency)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="درجة التنبيه"><option value="all">كل درجات التنبيه</option><option value="overdue">متأخر</option><option value="critical">عاجل جداً</option><option value="warning">يحتاج متابعة</option><option value="planned">مخطط</option><option value="unknown">بدون تاريخ</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="حالة السجل"><option value="all">كل الحالات</option><option value="active">نشط</option><option value="draft">مسودة</option><option value="expiring">ينتهي قريباً</option><option value="expired">منتهي</option></select><select value={ownerUserId === "all" ? "all" : String(ownerUserId)} onChange={(event) => setOwnerUserId(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="مسؤول السجل"><option value="all">كل المسؤولين</option>{ownerIds.map((id) => <option key={id} value={id}>مسؤول السجل #{id}</option>)}</select><select value={String(horizon)} onChange={(event) => setHorizon(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="أفق التجديد"><option value="7">خلال 7 أيام</option><option value="30">خلال 30 يوماً</option><option value="90">خلال 90 يوماً</option><option value="180">خلال 180 يوماً</option><option value="all">كل التواريخ</option></select></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><Card className="border-0 shadow-sm"><CardHeader><CardTitle>الأولوية حسب الموعد</CardTitle><p className="text-sm text-muted-foreground">تُرتب السجلات تلقائياً من الأكثر إلحاحاً إلى الأبعد.</p></CardHeader><CardContent className="space-y-3">{filtered.length ? filtered.map((item) => { const urgencyValue = renewalUrgency(item.expiryDate, now); const days = daysUntil(item.expiryDate, now); const isPermit = item.type === "permit"; return <div key={`${item.type}-${item.id}`} className="group rounded-2xl border bg-background p-4 transition hover:border-indigo-300 hover:shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 rounded-xl p-2 ${isPermit ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{isPermit ? <FileCheck2 className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold">{item.label}</p><Badge variant="outline">{typeLabels[item.type]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.sourceKey ? `${isPermit ? "النشاط" : "نوع العقد"}: ${item.sourceKey} · ` : ""}الاستحقاق: {formatDate(item.expiryDate)}</p><p className={`mt-2 text-sm font-medium ${urgencyValue === "overdue" || urgencyValue === "critical" ? "text-rose-600" : urgencyValue === "warning" ? "text-amber-700" : "text-muted-foreground"}`}>{daysLabel(days)}</p></div></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end"><Badge variant={urgencyTone[urgencyValue]}>{urgencyLabels[urgencyValue]}</Badge><a href="/compliance-governance" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">فتح المصدر <ArrowUpLeft className="h-3.5 w-3.5" /></a></div></div></div>; }) : <EmptyState text="لا توجد سجلات مطابقة للفلاتر الحالية." />}</CardContent></Card>

        <Card className="border-0 shadow-sm"><CardHeader><CardTitle>توزيع مستوى الخطر</CardTitle><p className="text-sm text-muted-foreground">ملخص حي للسجلات المحملة من الكيان الحالي.</p></CardHeader><CardContent className="space-y-5">{(["overdue", "critical", "warning", "planned", "unknown"] as RenewalUrgency[]).map((key) => { const count = summary.counts[key]; const ratio = summary.total ? Math.round((count / summary.total) * 100) : 0; return <div key={key}><div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${key === "overdue" || key === "critical" ? "bg-rose-500" : key === "warning" ? "bg-amber-500" : key === "planned" ? "bg-emerald-500" : "bg-slate-400"}`} />{urgencyLabels[key]}</span><span className="font-semibold">{count} <span className="font-normal text-muted-foreground">({ratio}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${key === "overdue" || key === "critical" ? "bg-rose-500" : key === "warning" ? "bg-amber-500" : key === "planned" ? "bg-emerald-500" : "bg-slate-400"}`} style={{ width: `${ratio}%` }} /></div></div>})}<div className="rounded-2xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-900"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>التنبيه مؤشر تشغيلي للمتابعة، ولا يستبدل مراجعة المستند أو اعتماد التجديد من الجهة المختصة.</p></div></div></CardContent></Card></div>
    </>}
  </div></main></DashboardLayout>;
}
