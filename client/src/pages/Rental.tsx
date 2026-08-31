import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront, CalendarCheck, Gauge, Wrench } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export default function Rental() {
  const input = useMemo(() => ({ businessEntityId: 1 }), []);
  const { data, isLoading, isError } = trpc.rental.dashboard.useQuery(input, { retry: false });
  const { data: vehicles } = trpc.rental.vehicles.useQuery(input, { retry: false });
  const cards = [
    { label: "حجم الأسطول", value: data?.fleetSize ?? 0, icon: CarFront, tone: "bg-blue-50 text-blue-700" },
    { label: "مركبات متاحة", value: data?.available ?? 0, icon: CalendarCheck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "عقود نشطة", value: data?.activeContracts ?? 0, icon: Gauge, tone: "bg-violet-50 text-violet-700" },
    { label: "صيانة متأخرة", value: data?.overdueMaintenance ?? 0, icon: Wrench, tone: "bg-amber-50 text-amber-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="min-h-[calc(100vh-2rem)] bg-[#f7f9fc] -m-4 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Car Rental · كيان مستقل</Badge><h1 className="text-3xl font-semibold text-slate-950">إدارة تأجير السيارات</h1><p className="mt-2 text-sm text-slate-500">أسطول وحجوزات وعقود وصيانة محلية للكيان، مع تكامل محكوم مع الورشة وCentral ERP.</p>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6 text-rose-900">تعذر تحميل بيانات التأجير ضمن نطاق الصلاحيات.</CardContent></Card> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone}) => <Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div><Card className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardHeader><CardTitle>الأسطول المحلي</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">رقم المركبة</th><th className="px-5 py-3">المركبة</th><th className="px-5 py-3">اللوحة</th><th className="px-5 py-3">العداد</th><th className="px-5 py-3">الحالة</th></tr></thead><tbody>{(vehicles ?? []).map(v => <tr key={v.id} className="border-t border-slate-100"><td className="px-5 py-3 font-medium">{v.vehicleNo}</td><td className="px-5 py-3">{v.make} {v.model}</td><td className="px-5 py-3">{v.plateNo ?? "—"}</td><td className="px-5 py-3">{v.odometer.toLocaleString("ar")}</td><td className="px-5 py-3"><Badge variant="outline">{v.status}</Badge></td></tr>)}</tbody></table>{!vehicles?.length && <div className="p-10 text-center text-sm text-slate-500">لا توجد مركبات ضمن هذا الكيان.</div>}</div></CardContent></Card></>}</div></div></DashboardLayout>;
}
