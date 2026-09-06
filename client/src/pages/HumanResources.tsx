import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Banknote, Building2, CalendarClock, GraduationCap, ShieldAlert, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

const money = (value: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(value / 1000);

export default function HumanResources() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data: legacy, isError } = trpc.hr.dashboard.useQuery(input, { retry: false });
  const { data: modern } = trpc.hr41.dashboard.useQuery(input, { retry: false });
  const { data: people } = trpc.hr41.people.useQuery(input, { retry: false });
  const { data: organization } = trpc.hr41.organization.useQuery(input, { retry: false });
  const cards = [
    { label: "العاملون النشطون", value: modern?.activeEmployments ?? legacy?.headcount ?? 0, icon: UsersRound, tone: "bg-blue-50 text-blue-700" },
    { label: "الوحدات التنظيمية", value: modern?.units ?? 0, icon: Building2, tone: "bg-violet-50 text-violet-700" },
    { label: "طلبات التوظيف", value: modern?.pendingRecruitment ?? 0, icon: CalendarClock, tone: "bg-amber-50 text-amber-700" },
    { label: "مزايا نشطة", value: modern?.activeBenefits ?? 0, icon: Banknote, tone: "bg-emerald-50 text-emerald-700" },
    { label: "شهادات تقترب من الانتهاء", value: modern?.expiringSkills ?? 0, icon: GraduationCap, tone: "bg-rose-50 text-rose-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
+    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">HR · Organization · Payroll · Workforce</Badge><h1 className="text-3xl font-semibold">الموارد البشرية والقوى العاملة</h1><p className="mt-2 text-sm text-slate-500">هوية مركزية بمرجع فقط، وعلاقات عمل ورواتب وتكاليف مستقلة لكل كيان.</p></div><label className="text-sm text-slate-600">معرف الكيان<input value={businessEntityId} onChange={e=>setBusinessEntityId(Math.max(1,Number(e.target.value)||1))} type="number" className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
+    {isError?<Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية موارد بشرية ونطاق كيان صالح.</CardContent></Card>:<><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({label,value,icon:Icon,tone})=><Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div>
+    <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound size={19}/>سجل العاملين في الكيان</CardTitle></CardHeader><CardContent className="space-y-3">{(people??[]).slice(0,10).map(row=><div key={row.employment.id} className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{row.person.fullNameAr}</strong><p className="text-xs text-slate-500">{row.employment.employmentNo} · {row.employment.employmentType}</p></div><Badge variant="outline">{row.employment.status}</Badge><span>{new Date(row.employment.startDate).toLocaleDateString("ar-OM")}</span></div>)}{!people?.length&&<p className="p-8 text-center text-sm text-slate-500">لا توجد علاقات عمل مسجلة ضمن هذا الكيان بعد.</p>}</CardContent></Card><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert size={19}/>الرقابة والرواتب</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between"><span>إجمالي علاقات العمل</span><strong>{modern?.employments??0}</strong></div><div className="flex justify-between"><span>خطط القوى العاملة</span><strong>{modern?.plans??0}</strong></div><div className="flex justify-between"><span>طلبات الإجازة</span><strong>{legacy?.pendingLeave??0}</strong></div><div className="rounded-xl bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-800"><Banknote size={17}/><span>تكلفة الرواتب المعتمدة</span></div><strong className="mt-2 block text-lg">{money(legacy?.payrollCostMinor??0)}</strong></div></CardContent></Card></div><Card className="mt-6 border-0"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 size={19}/>الهيكل التنظيمي الفعّال</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{(organization??[]).map(unit=><div key={unit.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between"><strong>{unit.nameAr}</strong><Badge variant="outline">{unit.unitType}</Badge></div><p className="mt-1 text-xs text-slate-500">{unit.unitCode} · يبدأ {new Date(unit.effectiveFrom).toLocaleDateString("ar-OM")}</p></div>)}{!organization?.length&&<p className="p-8 text-center text-sm text-slate-500 md:col-span-2">لا توجد وحدات تنظيمية فعّالة لهذا الكيان.</p>}</CardContent></Card></>}</div></div></DashboardLayout>;
}
