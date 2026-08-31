import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Car, Clock3, Wrench } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export default function Workshop() {
  const input = useMemo(() => ({ businessEntityId: 1 }), []);
  const { data, isLoading, isError } = trpc.workshop.dashboard.useQuery(input, { retry: false });
  const { data: orders } = trpc.workshop.workOrders.useQuery(input, { retry: false });
  const cards = [
    { label: "مواعيد اليوم", value: data?.appointmentsToday ?? 0, icon: CalendarDays, tone: "bg-blue-50 text-blue-700" },
    { label: "أوامر عمل مفتوحة", value: data?.openWorkOrders ?? 0, icon: Wrench, tone: "bg-violet-50 text-violet-700" },
    { label: "بانتظار قطع", value: data?.waitingParts ?? 0, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "بانتظار اعتماد", value: data?.waitingApproval ?? 0, icon: Car, tone: "bg-emerald-50 text-emerald-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="min-h-[calc(100vh-2rem)] bg-[#f7f9fc] -m-4 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Workshop · كيان مستقل</Badge><h1 className="text-3xl font-semibold text-slate-950">إدارة الورشة</h1><p className="mt-2 text-sm text-slate-500">استقبال وفحص وأوامر عمل محلية، مع طلب قطع الغيار والتكامل المالي عبر طبقة الأحداث.</p>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6 text-rose-900">تعذر تحميل بيانات الورشة ضمن نطاق الصلاحيات.</CardContent></Card> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone}) => <Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div><Card className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardHeader><CardTitle>أوامر العمل</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">رقم الأمر</th><th className="px-5 py-3">المركبة</th><th className="px-5 py-3">الفني</th><th className="px-5 py-3">الحالة</th></tr></thead><tbody>{(orders ?? []).map(o => <tr key={o.id} className="border-t border-slate-100"><td className="px-5 py-3 font-medium">{o.workOrderNo}</td><td className="px-5 py-3">{o.vehicleId}</td><td className="px-5 py-3">{o.technicianId ?? "—"}</td><td className="px-5 py-3"><Badge variant="outline">{o.status}</Badge></td></tr>)}</tbody></table>{!orders?.length && <div className="p-10 text-center text-sm text-slate-500">لا توجد أوامر عمل في نطاق هذا الكيان.</div>}</div></CardContent></Card></>}</div></div></DashboardLayout>;
}
