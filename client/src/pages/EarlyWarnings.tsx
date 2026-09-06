import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BellRing, CheckCircle2, Clock3, Layers3, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

const labels: Record<string, string> = { detected: "مكتشف", open: "مفتوح", acknowledged: "تم الاطلاع", assigned: "مُسند", in_progress: "قيد المعالجة", escalated: "مصعّد", resolved: "محلول", verified: "متحقق", closed: "مغلق", suppressed: "محجوب" };
const severityLabels: Record<string, string> = { info: "معلومة", low: "منخفض", medium: "متوسط", high: "مرتفع", critical: "حرج" };

export default function EarlyWarnings() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const input = useMemo(() => ({ businessEntityId, severity }), [businessEntityId, severity]);
  const { data, isError } = trpc.alerts.dashboard.useQuery({ businessEntityId }, { retry: false });
  const { data: alerts, refetch } = trpc.alerts.list.useQuery(input, { retry: false });
  const transition = trpc.alerts.transition.useMutation({ onSuccess: () => refetch() });
  const cards = [
    { label: "تنبيهات حرجة", value: data?.critical ?? 0, icon: ShieldAlert, color: "text-rose-600" },
    { label: "مفتوحة", value: data?.open ?? 0, icon: BellRing, color: "text-amber-600" },
    { label: "متجاوزة الموعد", value: data?.overdue ?? 0, icon: Clock3, color: "text-orange-600" },
    { label: "مصعّدة", value: data?.escalated ?? 0, icon: AlertTriangle, color: "text-violet-600" },
    { label: "شذوذات محللة", value: data?.anomalies ?? 0, icon: Layers3, color: "text-blue-600" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-rose-50 text-rose-700">Early Warning · Alerts · Escalation</Badge><h1 className="text-3xl font-semibold">مركز الإنذار المبكر</h1><p className="mt-2 text-sm text-slate-500">كل تنبيه مرتبط بمصدر وقاعدة ودرجة خطورة وإجراء مقترح ضمن نطاق الكيان.</p></div><label className="text-sm text-slate-600">معرف الكيان<input type="number" value={businessEntityId} onChange={e => setBusinessEntityId(Math.max(1, Number(e.target.value) || 1))} className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية إدارة الإنذارات.</CardContent></Card> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="border-0"><CardContent className="p-5"><Icon className={color} size={20} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardContent></Card>)}</div><Card className="mt-6 border-0"><CardHeader className="flex-row items-center justify-between"><CardTitle>قائمة التنبيهات</CardTitle><select value={severity ?? ""} onChange={e => setSeverity(e.target.value || undefined)} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value="">كل الخطورة</option>{Object.entries(severityLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></CardHeader><CardContent className="space-y-3">{(alerts ?? []).map(alert => <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><div className="flex items-center gap-2"><strong>{alert.sourceSystem} · {alert.sourceRecordType} #{alert.sourceRecordId}</strong><Badge className={alert.severity === "critical" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>{severityLabels[alert.severity] ?? alert.severity}</Badge></div><p className="mt-1 text-xs text-slate-500">{alert.recommendedAction ?? "مراجعة الدليل وتحديد الإجراء"} · {labels[alert.status] ?? alert.status}</p></div>{["resolved", "verified", "closed"].includes(alert.status) ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Button size="sm" variant="outline" onClick={() => transition.mutate({ businessEntityId, alertId: alert.id, status: "acknowledged" })}>اطلاع وتكليف</Button>}</div>)}{!alerts?.length && <p className="p-10 text-center text-slate-500">لا توجد تنبيهات مسجلة ضمن هذا النطاق.</p>}</CardContent></Card></>}</div></div></DashboardLayout>;
}
