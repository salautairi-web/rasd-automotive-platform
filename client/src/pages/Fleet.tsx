import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CarFront, CircleDollarSign, Gauge, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

const money = (value: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(value / 1000);

export default function Fleet() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.fleet.overview.useQuery(input, { retry: false });
  const cards = [
    { label: "حجم الأسطول", value: data?.totals.fleetSize ?? 0, icon: CarFront, tone: "bg-blue-50 text-blue-700" },
    { label: "متاحة للتشغيل", value: data?.totals.available ?? 0, icon: Gauge, tone: "bg-emerald-50 text-emerald-700" },
    { label: "قيد الصيانة", value: data?.totals.maintenance ?? 0, icon: Wrench, tone: "bg-amber-50 text-amber-700" },
    { label: "تنبيهات مفتوحة", value: data?.totals.openAlerts ?? 0, icon: AlertTriangle, tone: "bg-rose-50 text-rose-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Fleet · Vehicle Lifecycle</Badge><h1 className="text-3xl font-semibold">الأسطول ودورة حياة المركبات</h1><p className="mt-2 text-sm text-slate-500">سجل مركبات محلي لكل كيان، مع فصل واضح بين التشغيل والصيانة والربحية.</p></div><label className="text-sm text-slate-600">معرف الكيان<input value={businessEntityId} onChange={e=>setBusinessEntityId(Math.max(1,Number(e.target.value)||1))} type="number" className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
    {isError?<Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية الأسطول ونطاق كيان صالح.</CardContent></Card>:<><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone})=><Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading?"—":value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_.6fr]"><Card className="border-0"><CardHeader><CardTitle>حالة المركبات</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.vehicles??[]).slice(0,8).map(v=><div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm"><span className="font-medium">{v.vehicleNo} · {v.make} {v.model}</span><Badge variant="outline">{v.status}</Badge></div>)}{!data?.vehicles.length&&<p className="p-8 text-center text-sm text-slate-500">لا توجد مركبات مسجلة لهذا الكيان.</p>}</CardContent></Card><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><CircleDollarSign size={19}/>الملف المالي</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">صافي المساهمة المسجلة</p><strong className="mt-2 block text-2xl">{money(data?.totals.netContributionMinor??0)}</strong><div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm"><div className="flex justify-between"><span>حوادث مسجلة</span><strong>{data?.totals.accidents??0}</strong></div><div className="mt-3 flex justify-between"><span>مركبات مؤجرة</span><strong>{data?.totals.rented??0}</strong></div></div></CardContent></Card></div></>}</div></div></DashboardLayout>;
}
