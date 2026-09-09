import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Clock3, KeyRound, LockKeyhole, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";

const ENTITY_ID = 1;
const phaseLabels: Record<string, string> = { detected: "مكتشف", contained: "تم الاحتواء", investigating: "قيد التحقيق", recovering: "قيد التعافي", closed: "مغلق" };

export default function SecurityGovernance43() {
  const [permissionKey, setPermissionKey] = useState("finance.payment.approve");
  const [reason, setReason] = useState("");
  const overview = trpc.security43.overview.useQuery(undefined, { retry: false });
  const policies = trpc.security43.policies.useQuery(undefined, { retry: false });
  const conditional = trpc.security43.conditionalPolicies.useQuery(undefined, { retry: false });
  const privileges = trpc.security43.privilegeRequests.useQuery({ businessEntityId: ENTITY_ID }, { retry: false });
  const incidents = trpc.security43.incidents.useQuery({ businessEntityId: ENTITY_ID }, { retry: false });
  const requestPrivilege = trpc.security43.requestPrivilege.useMutation({ onSuccess: () => { privileges.refetch(); setReason(""); } });
  const decidePrivilege = trpc.security43.decidePrivilege.useMutation({ onSuccess: () => privileges.refetch() });
  const metrics = [
    ["سياسات ABAC نشطة", overview.data?.policies ?? 0, ShieldCheck, "text-indigo-600"],
    ["وصول مشروط", overview.data?.conditionalPolicies ?? 0, LockKeyhole, "text-violet-600"],
    ["طلبات امتياز معلقة", overview.data?.pendingPrivilege ?? 0, KeyRound, "text-amber-600"],
    ["إشارات خطر مفتوحة", overview.data?.openRisks ?? 0, AlertTriangle, "text-rose-600"],
    ["حوادث غير مغلقة", overview.data?.openIncidents ?? 0, ShieldAlert, "text-orange-600"],
    ["Break-Glass نشط", overview.data?.activeBreakGlass ?? 0, Smartphone, "text-slate-700"],
  ] as const;
  const submitPrivilege = () => {
    if (!reason.trim()) return;
    requestPrivilege.mutate({ businessEntityId: ENTITY_ID, permissionKey, reason, startsAt: new Date(), expiresAt: new Date(Date.now() + 60 * 60 * 1000), idempotencyKey: `priv-${permissionKey}-${Date.now()}` });
  };
  return <DashboardLayout><main dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-3xl bg-gradient-to-l from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl md:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge className="mb-3 border-0 bg-white/10 text-indigo-100">IAM · RBAC · ABAC · Zero Trust</Badge><h1 className="text-3xl font-bold md:text-4xl">مركز الأمن المؤسسي والوصول</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-indigo-100">قرارات وصول افتراضية بالرفض، تحقق مستمر من الهوية والجهاز والكيان، وامتيازات مؤقتة قابلة للتدقيق.</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm"><p className="text-indigo-200">نطاق العرض</p><p className="mt-1 font-semibold">الكيان {ENTITY_ID} · حماية متعددة الطبقات</p></div></div></header>
    {overview.isError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-6 text-rose-800">تتطلب هذه المساحة صلاحية مسؤول الأمن المؤسسي.</CardContent></Card> : <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value, Icon, tone]) => <Card key={label} className="border-0 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{overview.isLoading ? "—" : value}</p></div><Icon className={tone} /></CardContent></Card>)}</section>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-600" />طلب امتياز مؤقت</CardTitle><p className="text-sm text-slate-500">يحتاج الطلب إلى سبب واضح واعتماد منفصل، ولا يمكن لصاحب الطلب اعتماد نفسه.</p></CardHeader><CardContent className="space-y-3"><Input value={permissionKey} onChange={(event) => setPermissionKey(event.target.value)} placeholder="مفتاح الصلاحية" aria-label="مفتاح الصلاحية" /><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="سبب الطلب والأثر المتوقع" aria-label="سبب طلب الامتياز" /><Button onClick={submitPrivilege} disabled={requestPrivilege.isPending || reason.trim().length < 10}>{requestPrivilege.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}</Button></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" />مبادئ Zero Trust</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-slate-600"><div className="rounded-xl bg-indigo-50 p-3">Authentication + Authorization + Entity Context لكل طلب.</div><div className="rounded-xl bg-indigo-50 p-3">MFA وFresh Session للإجراءات الحساسة.</div><div className="rounded-xl bg-indigo-50 p-3">الجهاز والمخاطر والموقع عوامل قرار، وليست ثقة دائمة.</div></CardContent></Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2"><Card className="border-0 shadow-sm"><CardHeader><CardTitle>طلبات الامتياز</CardTitle></CardHeader><CardContent className="space-y-3">{privileges.data?.length ? privileges.data.map((request) => <div key={request.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{request.permissionKey}</p><p className="mt-1 text-sm text-slate-500">{request.reason}</p><Badge variant="outline" className="mt-2">{request.status}</Badge></div>{request.status === "requested" && <div className="flex gap-2"><Button size="sm" onClick={() => decidePrivilege.mutate({ requestId: request.id, decision: "approved" })}>اعتماد</Button><Button size="sm" variant="outline" onClick={() => decidePrivilege.mutate({ requestId: request.id, decision: "rejected" })}>رفض</Button></div>}</div>) : <p className="py-8 text-center text-sm text-slate-500">لا توجد طلبات امتياز ضمن النطاق الحالي.</p>}</CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle>الحوادث الأمنية</CardTitle></CardHeader><CardContent className="space-y-3">{incidents.data?.length ? incidents.data.map((incident) => <div key={incident.id} className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{incident.titleAr}</p><p className="text-xs text-slate-500">{incident.incidentKey}</p></div><Badge variant={incident.severity === "critical" || incident.severity === "high" ? "destructive" : "outline"}>{incident.severity}</Badge></div><div className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />{phaseLabels[incident.phase] ?? incident.phase}</div></div>) : <p className="py-8 text-center text-sm text-slate-500">لا توجد حوادث أمنية مفتوحة ضمن النطاق الحالي.</p>}</CardContent></Card></section>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle>السياسات الفعالة</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{policies.data?.length ? policies.data.map((policy) => <div key={policy.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><strong>{policy.nameAr}</strong><Badge variant="outline">{policy.effect}</Badge></div><p className="mt-2 text-xs text-slate-500">{policy.resource} · {policy.action} · إصدار {policy.version}</p></div>) : <p className="text-sm text-slate-500">لا توجد سياسات ABAC فعالة مسجلة.</p>}{conditional.data?.map((policy) => <div key={`conditional-${policy.id}`} className="rounded-2xl bg-violet-50 p-4"><div className="flex items-center justify-between gap-2"><strong>{policy.nameAr}</strong><Badge variant="outline">{policy.action}</Badge></div><p className="mt-2 text-xs text-slate-600">وصول مشروط · MFA: {policy.requireMfa ? "مطلوب" : "غير مطلوب"}</p></div>)}</CardContent></Card>
    </>}</div></main></DashboardLayout>;
}
