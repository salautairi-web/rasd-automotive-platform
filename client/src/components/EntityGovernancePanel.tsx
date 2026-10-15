import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type Entity = { id: number; nameAr: string; code: string; status: string };
type Branch = { id: number; nameAr: string; code: string; status: string; businessEntityId: number | null };

const statusLabel: Record<string, string> = { active: "نشط", inactive: "متوقف", planned: "مخطط", archived: "مؤرشف" };

export default function EntityGovernancePanel({ entities, branches, onRefresh }: { entities: Entity[]; branches: Branch[]; onRefresh: () => void }) {
  const [entityId, setEntityId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const history = trpc.adminControl.entityLifecycleHistory.useQuery(
    { businessEntityId: Number(entityId) },
    { enabled: Boolean(entityId) }
  );
  const impact = trpc.adminControl.entityOperationalImpact.useQuery(
    { businessEntityId: Number(entityId) },
    { enabled: Boolean(entityId) }
  );
  const transition = trpc.adminControl.transitionEntityStatus.useMutation({
    onSuccess: () => { setAcknowledge(false); void impact.refetch(); void history.refetch(); onRefresh(); },
    onError: error => window.alert(error.message),
  });
  const transfer = trpc.adminControl.transferBranch.useMutation({
    onSuccess: () => { setReason(""); setAcknowledge(false); setBranchId(""); setTargetEntityId(""); onRefresh(); },
    onError: error => window.alert(error.message),
  });
  const selectedEntity = entities.find(entity => entity.id === Number(entityId));
  const selectedBranch = branches.find(branch => branch.id === Number(branchId));
  const affectedBranches = branches.filter(branch => branch.businessEntityId === Number(entityId));
  const doTransition = (toStatus: "active" | "inactive" | "archived") => {
    if (!entityId) return;
    if (["inactive", "archived"].includes(toStatus) && impact.data?.blocking && !acknowledge) {
      window.alert("راجع العمليات النشطة الظاهرة في هذه اللوحة ثم فعّل تأكيد الأثر قبل المتابعة.");
      return;
    }
    transition.mutate({ businessEntityId: Number(entityId), toStatus, acknowledgeOperationalImpact: acknowledge });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">حوكمة الكيان وسجل انتقالاته</CardTitle>
          <p className="text-xs leading-6 text-slate-500">اختر كياناً لعرض تاريخ الحالات والتنبيه إلى العمليات النشطة قبل الإيقاف أو الأرشفة.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={entityId} onValueChange={value => { setEntityId(value); setAcknowledge(false); }}>
            <SelectTrigger><SelectValue placeholder="اختر الكيان" /></SelectTrigger>
            <SelectContent>{entities.map(entity => <SelectItem key={entity.id} value={String(entity.id)}>{entity.nameAr} · {statusLabel[entity.status] ?? entity.status}</SelectItem>)}</SelectContent>
          </Select>
          {selectedEntity && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"><span><strong>{selectedEntity.nameAr}</strong><span className="mr-2 text-xs text-slate-500">{selectedEntity.code}</span></span><Badge variant="outline">{statusLabel[selectedEntity.status] ?? selectedEntity.status}</Badge></div>}
          {impact.data?.blocking && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900"><strong>تنبيه قبل الإيقاف أو الأرشفة:</strong> توجد {impact.data.total} عملية نشطة: {impact.data.reservations} حجز، {impact.data.contracts} عقد، {impact.data.invoices} فاتورة مفتوحة.</div>}
          {selectedEntity && <div className="flex flex-wrap gap-2">{selectedEntity.status === "planned" && <Button size="sm" variant="outline" onClick={() => doTransition("active")} disabled={transition.isPending}>تفعيل</Button>}{selectedEntity.status === "active" && <Button size="sm" variant="outline" onClick={() => doTransition("inactive")} disabled={transition.isPending}>إيقاف</Button>}{selectedEntity.status === "inactive" && <Button size="sm" variant="outline" onClick={() => doTransition("active")} disabled={transition.isPending}>إعادة تفعيل</Button>}{selectedEntity.status !== "archived" && <Button size="sm" variant="destructive" onClick={() => doTransition("archived")} disabled={transition.isPending}>أرشفة</Button>}</div>}
          {impact.data?.blocking && selectedEntity && ["active", "inactive"].includes(selectedEntity.status) && <label className="flex items-start gap-2 rounded-lg border border-amber-100 p-2 text-xs leading-6"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} className="mt-1" /> أقرّ بمراجعة العمليات النشطة وأوافق على متابعة تغيير الحالة مع بقائها قابلة للمتابعة في أنظمتها الأصلية.</label>}
          <div className="border-t pt-3"><p className="mb-2 text-xs font-semibold text-slate-700">تاريخ الانتقالات</p>{history.isLoading && <p className="text-xs text-slate-500">جاري تحميل السجل…</p>}{history.data?.length ? <div className="max-h-56 space-y-2 overflow-auto">{history.data.map(item => <div key={item.id} className="rounded-lg border bg-white p-2 text-xs"><div className="flex items-center justify-between gap-2"><strong>{item.action.replace("status.", "انتقال إلى ")}</strong><span className="text-slate-400">{new Date(item.createdAt).toLocaleString("ar-OM")}</span></div><p className="mt-1 text-slate-500">منفذ العملية: {item.userId ?? "النظام"}</p></div>)}</div> : entityId && !history.isLoading ? <p className="text-xs text-slate-500">لا توجد انتقالات مسجلة بعد.</p> : null}
          </div>
        </CardContent>
      </Card>
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader><CardTitle className="text-base">نقل الفروع — صلاحية إدارية مستقلة</CardTitle><p className="text-xs leading-6 text-slate-500">كل عملية نقل تتطلب صلاحية مسؤول المنصة، سبباً موثقاً، وتُسجل في سجل التدقيق.</p></CardHeader>
        <CardContent className="space-y-3">
          <Select value={branchId} onValueChange={value => { setBranchId(value); setAcknowledge(false); }}><SelectTrigger><SelectValue placeholder="اختر الفرع المراد نقله" /></SelectTrigger><SelectContent>{branches.map(branch => <SelectItem key={branch.id} value={String(branch.id)}>{branch.nameAr} · {branch.code}</SelectItem>)}</SelectContent></Select>
          {selectedBranch && <p className="text-xs text-slate-500">الكيان الحالي: {entities.find(entity => entity.id === selectedBranch.businessEntityId)?.nameAr ?? "غير مرتبط"}</p>}
          <Select value={targetEntityId} onValueChange={setTargetEntityId}><SelectTrigger><SelectValue placeholder="اختر الكيان الهدف النشط" /></SelectTrigger><SelectContent>{entities.filter(entity => entity.status === "active" && entity.id !== selectedBranch?.businessEntityId).map(entity => <SelectItem key={entity.id} value={String(entity.id)}>{entity.nameAr} · {entity.code}</SelectItem>)}</SelectContent></Select>
          <Input value={reason} onChange={event => setReason(event.target.value)} placeholder="سبب النقل الإلزامي للتدقيق" />
          {selectedBranch && selectedBranch.status !== "active" && <label className="flex items-start gap-2 rounded-lg border border-amber-100 p-2 text-xs leading-6"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} className="mt-1" /> أقرّ بأن الفرع غير نشط وأوافق على النقل الاستثنائي.</label>}
          <Button className="w-full" disabled={!branchId || !targetEntityId || reason.trim().length < 5 || transfer.isPending} onClick={() => transfer.mutate({ branchId: Number(branchId), targetBusinessEntityId: Number(targetEntityId), reason: reason.trim(), acknowledgeOperationalImpact: acknowledge })}>{transfer.isPending ? "جارٍ نقل الفرع…" : "نقل الفرع وتسجيل التدقيق"}</Button>
          <div className="border-t pt-3"><p className="mb-2 text-xs font-semibold text-slate-700">الفروع التابعة للكيان المختار: {affectedBranches.length}</p><div className="flex flex-wrap gap-2">{affectedBranches.map(branch => <Badge key={branch.id} variant="outline">{branch.nameAr}</Badge>)}{!affectedBranches.length && <span className="text-xs text-slate-500">لا توجد فروع مرتبطة.</span>}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}
