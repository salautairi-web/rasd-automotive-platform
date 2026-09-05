import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Database, GitMerge, ListChecks, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";

const businessEntityId = 1;
const money = (value:number) => new Intl.NumberFormat("ar-SA").format(value);

export default function Mdm() {
  const overview = trpc.mdm.overview.useQuery({ businessEntityId });
  const quality = trpc.mdm.qualityIssues.useQuery({ businessEntityId });
  const duplicates = trpc.mdm.duplicates.useQuery({ businessEntityId });
  const changes = trpc.mdm.changes.useQuery({ businessEntityId });
  const mappings = trpc.mdm.mappings.useQuery({ businessEntityId });
  const policies = trpc.mdm.policies.useQuery();
  const data = overview.data;
  const cards = [
    { title: "مشكلات الجودة المفتوحة", value: data?.qualityIssues ?? 0, icon: AlertTriangle, tone: "bg-rose-100 text-rose-700" },
    { title: "مرشحو التكرار", value: data?.duplicates ?? 0, icon: GitMerge, tone: "bg-amber-100 text-amber-700" },
    { title: "طلبات التغيير", value: data?.pendingChanges ?? 0, icon: ListChecks, tone: "bg-indigo-100 text-indigo-700" },
    { title: "تعارضات المزامنة", value: data?.conflicts ?? 0, icon: RefreshCw, tone: "bg-cyan-100 text-cyan-700" },
    { title: "الخرائط النشطة", value: data?.mappings ?? 0, icon: Database, tone: "bg-emerald-100 text-emerald-700" },
    { title: "سياسات الحوكمة", value: policies.data?.length ?? 0, icon: ShieldCheck, tone: "bg-violet-100 text-violet-700" },
  ];
  return <DashboardLayout><main dir="rtl" className="min-h-screen bg-muted/20 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-2xl bg-gradient-to-l from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-lg md:p-8"><p className="text-sm text-cyan-200">المرجع المركزي للمطابقة دون مصادرة ملكية الكيانات</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">حوكمة البيانات الرئيسية</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">تحديد المالك والمصدر الحقيقي وجودة البيانات والتغييرات والتعارضات والخرائط مع إبقاء العملاء والموردين والمركبات والمنتجات والسجلات المالية محلية لكل كيان.</p><div className="mt-5 inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm">نطاق المراجعة: الكيان {businessEntityId}</div></header>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(({ title, value, icon:Icon, tone }) => <Card key={title} className="border-0 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-bold">{overview.isLoading ? "—" : money(value)}</p></div><div className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></div></CardContent></Card>)}</section>
    <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>مراقبة جودة البيانات</CardTitle></CardHeader><CardContent className="space-y-3">{quality.data?.length ? quality.data.slice(0,6).map((issue) => <div key={issue.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-semibold">{issue.domainType} · {issue.ruleKey}</p><p className="text-xs text-muted-foreground">{issue.dimension} · نتيجة {issue.scoreBps / 100}%</p></div><Badge variant={issue.severity === "critical" ? "destructive" : "outline"}>{issue.severity}</Badge></div>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد مشكلات جودة مفتوحة لهذا الكيان.</p>}</CardContent></Card><Card><CardHeader><CardTitle>مرشحو التكرار والتعارض</CardTitle></CardHeader><CardContent className="space-y-3">{duplicates.data?.length ? duplicates.data.slice(0,6).map((candidate) => <div key={candidate.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-semibold">{candidate.domainType} · سجلان {candidate.leftRecordId} و{candidate.rightRecordId}</p><p className="text-xs text-muted-foreground">ثقة المطابقة {candidate.confidenceBps / 100}%</p></div><Badge variant="outline">{candidate.status}</Badge></div>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد مرشحات تكرار مفتوحة حالياً.</p>}</CardContent></Card></section>
    <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>طلبات التغيير</CardTitle></CardHeader><CardContent className="space-y-3">{changes.data?.length ? changes.data.slice(0,6).map((change) => <div key={change.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><p className="font-semibold">{change.domainType} · {change.fieldName}</p><Badge variant="outline">{change.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{change.reason}</p></div>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد طلبات تغيير معلقة.</p>}</CardContent></Card><Card><CardHeader><CardTitle>الخرائط والمرجع العالمي</CardTitle></CardHeader><CardContent className="space-y-3">{mappings.data?.length ? mappings.data.slice(0,6).map((mapping) => <div key={mapping.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-semibold">{mapping.domainType} · سجل محلي {mapping.localRecordId}</p><p className="text-xs text-muted-foreground">مرجع عالمي {mapping.globalReferenceId} · الإصدار {mapping.version}</p></div><Badge variant="outline">{mapping.mappingType}</Badge></div>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">لا توجد خرائط نشطة مرئية لهذا النطاق.</p>}</CardContent></Card></section>
  </div></main></DashboardLayout>;
}
