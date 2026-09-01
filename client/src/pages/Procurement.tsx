import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ClipboardCheck, FileSearch, PackageCheck, ShoppingCart, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

const money = (value: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(value / 1000);

export default function Procurement() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.procurement.dashboard.useQuery(input, { retry: false });
  const network = trpc.procurementNetwork.overview.useQuery(input, { retry: false });
  const cards = [
    { label: "طلبات شراء مفتوحة", value: data?.openRequests ?? 0, icon: ShoppingCart, tone: "bg-blue-50 text-blue-700" },
    { label: "موافقات معلقة", value: data?.pendingApprovals ?? 0, icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700" },
    { label: "عطاءات مفتوحة", value: data?.openRfqs ?? 0, icon: FileSearch, tone: "bg-violet-50 text-violet-700" },
    { label: "أوامر شراء مفتوحة", value: data?.openPos ?? 0, icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Procurement · Vendor Management</Badge><h1 className="text-3xl font-semibold">المشتريات وإدارة الموردين</h1><p className="mt-2 text-sm text-slate-500">سياسات موحدة وعمليات شراء محلية مستقلة لكل كيان.</p></div><label className="text-sm text-slate-600">معرف الكيان<input value={businessEntityId} onChange={e=>setBusinessEntityId(Math.max(1,Number(e.target.value)||1))} type="number" className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
    {isError?<Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية مشتريات ونطاق كيان صالح.</CardContent></Card>:<><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "الموردون المحليون", value: network.data?.totals.suppliers ?? 0, icon: UsersRound, tone: "bg-slate-100 text-slate-700" },
        { label: "طلبات الشراء المفتوحة", value: network.data?.totals.openRequisitions ?? 0, icon: ShoppingCart, tone: "bg-blue-50 text-blue-700" },
        { label: "طلبات العروض المفتوحة", value: network.data?.totals.openRfqs ?? 0, icon: FileSearch, tone: "bg-violet-50 text-violet-700" },
        { label: "استثناءات المطابقة والموافقات", value: network.data?.totals.exceptions ?? 0, icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
      ].map(({label,value,icon:Icon,tone})=><Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{network.isLoading?"—":value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}
    </div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone})=><Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading?"—":value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_.5fr]"><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound size={19}/>أداء الموردين</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.topSuppliers??[]).map(v=><div key={v.supplierId} className="grid grid-cols-3 items-center rounded-xl bg-slate-50 p-4 text-sm"><span>مورد #{v.supplierId}</span><span>التقييم {(v.score/100).toFixed(1)}%</span><strong className="text-left">{money(v.spendMinor)}</strong></div>)}{!data?.topSuppliers.length&&<p className="p-8 text-center text-sm text-slate-500">لا توجد نتائج أداء مسجلة بعد.</p>}</CardContent></Card><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={19}/>الرقابة والمخاطر</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between"><span>أوامر متأخرة</span><strong>{data?.overduePos??0}</strong></div><div className="flex justify-between"><span>فواتير غير مطابقة</span><strong>{data?.unmatchedInvoices??0}</strong></div><div className="flex justify-between"><span>موردون مرتفعو المخاطر</span><strong>{data?.highRiskSuppliers??0}</strong></div><div className="rounded-xl bg-blue-50 p-4"><span>إجمالي الإنفاق</span><strong className="mt-2 block text-lg">{money(data?.spendMinor??0)}</strong></div></CardContent></Card></div></>}</div></div></DashboardLayout>;
}
