import { useState } from "react";
import { Building2, Clock3, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerServices } from "../../../shared/customerServices";

type Option = { id: number; nameAr: string; entityType: string | null };
type Props = { scope: { businessEntityId: number; relationshipId: number }; options: Option[]; requests: Array<{ id: number; entityName: string; status: string; requesterNote: string; createdAt: Date }> };

export default function CustomerServiceAccessPanel({ scope, options, requests }: Props) {
  const [target, setTarget] = useState("");
  const [selected, setSelected] = useState<string[]>(["workshop"]);
  const [note, setNote] = useState("");
  const request = trpc.portalV2.requestServiceAccess.useMutation({ onSuccess: result => { toast.success(`تم إرسال طلب إضافة ${result.targetEntityName} للإدارة`); setTarget(""); setNote(""); }, onError: error => toast.error(error.message) });
  const toggle = (key: string) => setSelected(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  return <Card className="border-0 bg-cyan-50/60 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 size={18} className="text-cyan-700" /> خدمات وكيانات إضافية</CardTitle><p className="text-xs leading-6 text-slate-600">الخدمات الظاهرة لك مقيدة بالكيانات المفعلة في حسابك. لطلب خدمة مثل المبيعات أو التأجير أرسل طلباً رسمياً للمراجعة.</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 lg:grid-cols-[.8fr_1.2fr]"><div><Label>الكيان المطلوب</Label><Select value={target} onValueChange={setTarget}><SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="اختر كياناً متاحاً" /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.id} value={String(option.id)}>{option.nameAr}</SelectItem>)}</SelectContent></Select></div><div><Label>الخدمات المطلوبة</Label><div className="mt-1 flex flex-wrap gap-2">{customerServices.map(service => <button type="button" key={service.key} onClick={() => toggle(service.key)} className={`rounded-full border px-3 py-2 text-xs transition ${selected.includes(service.key) ? "border-cyan-700 bg-cyan-700 text-white" : "bg-white text-slate-600 hover:bg-cyan-100"}`}>{service.title}</button>)}</div></div></div><Input value={note} onChange={event => setNote(event.target.value)} placeholder="ملاحظة للإدارة: سبب طلب الخدمة أو احتياجك" maxLength={1000} /><Button disabled={!target || !selected.length || note.trim().length < 5 || request.isPending} onClick={() => request.mutate({ ...scope, requestedBusinessEntityId: Number(target), requestedServices: selected, requesterNote: note.trim() })}><Send size={15} /> إرسال طلب الموافقة</Button>{requests.length > 0 && <div className="space-y-2 border-t border-cyan-100 pt-3"><p className="text-xs font-semibold text-slate-700">آخر الطلبات</p>{requests.slice(0, 3).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-xs"><span>{item.entityName} · {item.requesterNote}</span><span className={item.status === "approved" ? "text-emerald-700" : item.status === "rejected" ? "text-rose-700" : "text-amber-700"}>{item.status === "approved" ? "معتمد" : item.status === "rejected" ? "مرفوض" : "قيد المراجعة"} <Clock3 className="mr-1 inline" size={12} /></span></div>)}</div>}</CardContent></Card>;
}
