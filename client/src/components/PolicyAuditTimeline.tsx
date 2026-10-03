import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { GitCompareArrows, History, ShieldCheck } from "lucide-react";
import TemplateVersionHistory from "./TemplateVersionHistory";

export default function PolicyAuditTimeline() {
  const { data: audit } = trpc.layout.policyAudit.useQuery(undefined, { staleTime: 10000 });
  return <div className="space-y-6" dir="rtl"><Card className="border-indigo-100"><CardHeader><CardTitle className="flex items-center gap-2"><History size={19} className="text-indigo-600"/> سجل سياسات التخطيط</CardTitle><p className="text-xs text-slate-500">تغييرات الفرض والتعطيل وإنشاء الإصدارات مع المنفذ والوقت والبيانات السابقة والجديدة.</p></CardHeader><CardContent className="space-y-2">{(audit ?? []).map(log => <div key={log.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:grid-cols-[1fr_1.5fr_1fr_1fr]"><span className="text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("ar-OM") : "—"}</span><span><strong>{log.action}</strong><span className="mr-2 text-slate-400">{log.entityType} · {log.entityId}</span></span><span>المنفذ: {log.userId ?? "النظام"}</span><Badge variant="outline" className="w-fit"><ShieldCheck size={12} className="ml-1"/>مدقق</Badge></div>)}{!audit?.length && <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">لا توجد تغييرات مسجلة بعد.</p>}</CardContent></Card><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><GitCompareArrows size={18} className="text-indigo-600"/> مقارنة إصدارات القوالب</div><TemplateVersionHistory /></div>;
}
