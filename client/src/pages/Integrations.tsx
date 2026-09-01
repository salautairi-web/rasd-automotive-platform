import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Boxes, CheckCircle2, GitBranch, Radio, ServerCog, Webhook } from "lucide-react";
import { useMemo, useState } from "react";

const metricStyles = ["text-blue-600", "text-emerald-600", "text-violet-600", "text-amber-600", "text-rose-600", "text-orange-600"];
const metricIcons = [ServerCog, CheckCircle2, Boxes, Radio, AlertTriangle, Webhook];

export default function Integrations() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.integrations.dashboard.useQuery(input, { retry: false });
  const { data: services } = trpc.integrations.services.useQuery(input, { retry: false });
  const { data: events } = trpc.integrations.events.useQuery(input, { retry: false });
  const metrics = [
    ["الخدمات المسجلة", data?.services ?? 0],
    ["الخدمات النشطة", data?.activeServices ?? 0],
    ["واجهات API", data?.apis ?? 0],
    ["أحداث قيد المعالجة", data?.queuedEvents ?? 0],
    ["أحداث فاشلة", data?.failedEvents ?? 0],
    ["رسائل ميتة", data?.openDeadLetters ?? 0],
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-indigo-50 text-indigo-700">Integration Hub · Event Bus · API Gateway</Badge><h1 className="text-3xl font-semibold">مركز التكاملات والأحداث</h1><p className="mt-2 text-sm text-slate-500">رؤية موحدة للتكاملات مع الحفاظ على نطاق الكيان وسلامة العقود.</p></div><label className="text-sm">معرف الكيان<input aria-label="معرف الكيان" type="number" value={businessEntityId} onChange={e => setBusinessEntityId(Math.max(1, Number(e.target.value) || 1))} className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
    {isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية إدارة التكاملات.</CardContent></Card> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value], index) => { const Icon = metricIcons[index]; return <Card key={label} className="border-0"><CardContent className="p-5"><Icon className={metricStyles[index]} size={20} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{isLoading ? "—" : value}</p></CardContent></Card>; })}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2"><Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><GitBranch size={19} />الخدمات المسجلة</CardTitle></CardHeader><CardContent className="space-y-3">{(services ?? []).map(service => <div key={service.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><strong>{service.nameAr}</strong><p className="text-xs text-slate-500">{service.serviceKey} · {service.ownerSystem} · {service.version}</p></div><Badge variant="outline" className={service.healthStatus === "healthy" ? "border-emerald-200 text-emerald-700" : "border-slate-200"}>{service.healthStatus}</Badge></div>)}{!services?.length && <p className="p-10 text-center text-slate-500">لا توجد خدمات مسجلة ضمن هذا النطاق.</p>}</CardContent></Card>
      <Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><Activity size={19} />آخر أحداث ناقل الأحداث</CardTitle></CardHeader><CardContent className="space-y-3">{(events ?? []).slice(0, 8).map(event => <div key={event.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><strong>{event.eventType}</strong><p className="text-xs text-slate-500">{event.eventId} · {event.correlationId}</p></div><Badge className={event.status === "processed" ? "bg-emerald-100 text-emerald-700" : event.status === "failed" || event.status === "dead_lettered" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>{event.status}</Badge></div>)}{!events?.length && <p className="p-10 text-center text-slate-500">لا توجد أحداث مسجلة ضمن هذا النطاق.</p>}</CardContent></Card></div>
    </>}</div></div></DashboardLayout>;
}
