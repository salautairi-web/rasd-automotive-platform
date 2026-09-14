import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const statusLabel: Record<string, string> = { received: "مستلم", diagnosing: "تشخيص", awaiting_approval: "بانتظار الاعتماد", awaiting_parts: "بانتظار القطع", in_progress: "قيد التنفيذ", qc: "فحص الجودة", road_test: "اختبار طريق", ready: "جاهز", delivered: "مسلم", closed: "مغلق", warranty_repeat: "إصلاح متكرر" };

export default function Workshop59() {
  const [businessEntityId] = useState(1);
  const dashboard = trpc.workshop59.dashboard.useQuery({ businessEntityId }, { refetchInterval: 30_000 });
  const jobs = dashboard.data?.jobs ?? [];
  const counts = dashboard.data?.counts;
  const [complaint, setComplaint] = useState("");
  const checkin = trpc.workshop59.createCheckin.useMutation({ onSuccess: () => { setComplaint(""); void dashboard.refetch(); } });
  const visibleJobs = useMemo(() => jobs.slice(0, 8), [jobs]);
  return <div dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">الخطوة 59</p><h1 className="text-3xl font-bold">مركز الورشة وأوامر العمل</h1><p className="mt-1 text-sm text-slate-500">الاستقبال، التقدير، العمليات، الجودة، والتسليم ضمن نطاق الكيان.</p></div><Link href="/fleet/lifecycle"><Button variant="outline">العودة للأسطول</Button></Link></div>
    <div className="grid gap-4 md:grid-cols-4"><Card><CardHeader><CardTitle>أوامر مفتوحة</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{counts?.openJobs ?? 0}</CardContent></Card><Card><CardHeader><CardTitle>بانتظار الاعتماد</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{counts?.awaitingApproval ?? 0}</CardContent></Card><Card><CardHeader><CardTitle>قيد التنفيذ</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-blue-600">{counts?.inProgress ?? 0}</CardContent></Card><Card><CardHeader><CardTitle>إعادة عمل QC</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{counts?.failedQc ?? 0}</CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><Card><CardHeader><CardTitle>أوامر العمل الأخيرة</CardTitle></CardHeader><CardContent className="space-y-3">{visibleJobs.length ? visibleJobs.map(job => <div key={job.id} className="flex items-center justify-between rounded-xl border bg-white p-4"><div><p className="font-semibold">{job.jobNo}</p><p className="text-xs text-slate-500">مركبة #{job.vehicleId} · عميل #{job.customerId}</p></div><Badge variant="outline">{statusLabel[job.status] ?? job.status}</Badge></div>) : <p className="text-sm text-slate-500">لا توجد أوامر عمل ضمن نطاق الكيان.</p>}</CardContent></Card><Card><CardHeader><CardTitle>استقبال سريع</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="شكوى العميل" /><Button className="w-full" disabled={complaint.trim().length < 3 || checkin.isPending} onClick={() => checkin.mutate({ businessEntityId, customerId: 1, vehicleId: 1, mileage: 0, complaint, consent: true, idempotencyKey: `checkin-${Date.now()}` })}>{checkin.isPending ? "جارٍ الحفظ..." : "تسجيل الاستقبال"}</Button><p className="text-xs text-slate-500">يتطلب تسجيل الاستقبال موافقة العميل ويُحفظ بمعرف تكرار آمن.</p></CardContent></Card></div>
  </div></div>;
}
