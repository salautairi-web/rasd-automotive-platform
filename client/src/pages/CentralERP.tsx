import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowUpRight, BriefcaseBusiness, CheckSquare, Coins, Landmark } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

const formatAmount = (minor: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(minor / 1000);

export default function CentralERP() {
  const input = useMemo(() => ({ periodCode: "2026" }), []);
  const { data, isLoading, isError } = trpc.erp.executiveOverview.useQuery(input, { retry: false });
  const cards = [
    { label: "إيرادات المحفظة", value: formatAmount(data?.portfolio.revenueMinor ?? 0), icon: Coins, tone: "text-blue-700 bg-blue-50" },
    { label: "ربحية المحفظة", value: formatAmount(data?.portfolio.profitMinor ?? 0), icon: BriefcaseBusiness, tone: "text-emerald-700 bg-emerald-50" },
    { label: "أحداث قيد المعالجة", value: String(data?.integrations.pending ?? 0), icon: Activity, tone: "text-amber-700 bg-amber-50" },
    { label: "مهام مفتوحة", value: String(data?.tasks.open ?? 0), icon: CheckSquare, tone: "text-violet-700 bg-violet-50" },
  ];
  return <DashboardLayout><div dir="rtl" className="min-h-[calc(100vh-2rem)] bg-[#f7f9fc] -m-4 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Central ERP · إصدار v1</Badge><h1 className="text-3xl font-semibold tracking-tight text-slate-950">المركز التنفيذي</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">رؤية تجميعية للمحفظة والكيانات المستقلة دون تعديل سجلاتها التشغيلية المحلية.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"><Landmark size={15} className="text-[#1e5eff]" /> الفترة: {input.periodCode}</div></div>{isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-6 text-rose-900">تعذر تحميل مؤشرات المركز التنفيذي ضمن نطاق الصلاحيات.</CardContent></Card> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19} /></div></div><div className="mt-5 flex items-center gap-1 text-xs text-slate-400"><ArrowUpRight size={13} /> قراءة تجميعية محكومة</div></CardContent></Card>)}</div><Card className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]"><CardHeader><CardTitle className="text-lg">سلامة التكامل والرقابة</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">رأس المال المستثمر</p><p className="mt-2 font-semibold text-slate-900">{formatAmount(data?.portfolio.capitalInvestedMinor ?? 0)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">أحداث فاشلة</p><p className="mt-2 font-semibold text-rose-700">{data?.integrations.failed ?? 0}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">مصدر الحقيقة</p><p className="mt-2 font-semibold text-slate-900">دفاتر الكيانات المحلية</p></div></CardContent></Card></>}</div></div></DashboardLayout>;
}
