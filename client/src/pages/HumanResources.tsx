import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Banknote, BriefcaseBusiness, CalendarClock, Clock3, ShieldAlert, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

const money = (value: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(value / 1000);

export default function HumanResources() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.hr.dashboard.useQuery(input, { retry: false });
  const { data: employees } = trpc.hr.employees.useQuery(input, { retry: false });
  const cards = [
    { label: "إجمالي الموظفين", value: data?.headcount ?? 0, icon: UsersRound, tone: "bg-blue-50 text-blue-700" },
    { label: "في فترة التجربة", value: data?.probation ?? 0, icon: BriefcaseBusiness, tone: "bg-violet-50 text-violet-700" },
    { label: "طلبات إجازة", value: data?.pendingLeave ?? 0, icon: CalendarClock, tone: "bg-amber-50 text-amber-700" },
    { label: "غياب اليوم", value: data?.absentToday ?? 0, icon: Clock3, tone: "bg-rose-50 text-rose-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">HR · Payroll · Workforce</Badge><h1 className="text-3xl font-semibold">الموارد البشرية والقوى العاملة</h1><p className="mt-2 text-sm text-slate-500">ملفات ورواتب محلية محمية لكل كيان مع تقارير مركزية آمنة.</p></div><label className="text-sm text-slate-600">معرف الكيان<input value={businessEntityId} onChange={e=>setBusinessEntityId(Math.max(1,Number(e.target.value)||1))} type="number" className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
    {isError?<Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية موارد بشرية ونطاق كيان صالح.</CardContent></Card>:<><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone})=><Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading?"—":value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_.5fr]"><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound size={19}/>دليل الموظفين</CardTitle></CardHeader><CardContent className="space-y-3">{(employees??[]).slice(0,8).map(e=><div key={e.id} className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{e.fullNameAr}</strong><p className="text-xs text-slate-500">{e.employeeNo}</p></div><Badge variant="outline">{e.employmentStatus}</Badge><span>{new Date(e.hireDate).toLocaleDateString("ar-OM")}</span></div>)}{!employees?.length&&<p className="p-8 text-center text-sm text-slate-500">لا توجد ملفات موظفين ضمن هذا الكيان بعد.</p>}</CardContent></Card><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert size={19}/>الرواتب والرقابة</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between"><span>في إجازة</span><strong>{data?.onLeave??0}</strong></div><div className="flex justify-between"><span>خدمات بين الكيانات</span><strong>{data?.interEntityAssignments??0}</strong></div><div className="flex justify-between"><span>متوسط الأداء</span><strong>{((data?.performanceAverageBps??0)/100).toFixed(1)}%</strong></div><div className="rounded-xl bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-800"><Banknote size={17}/><span>تكلفة الرواتب المعتمدة</span></div><strong className="mt-2 block text-lg">{money(data?.payrollCostMinor??0)}</strong></div></CardContent></Card></div></>}</div></div></DashboardLayout>;
}
