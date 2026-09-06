import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { HeartHandshake, MessageCircleMore, ShieldCheck, Star, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

export default function CRM() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isError } = trpc.enterpriseExtensions.crm.dashboard.useQuery(input, { retry: false });
  const { data: interactions } = trpc.enterpriseExtensions.crm.interactions.useQuery(input, { retry: false });
  const { data: loyalty } = trpc.enterpriseExtensions.crm.loyalty.useQuery(input, { retry: false });
  const cards = [
    { label: "عملاء الكيان", value: data?.customers ?? 0, icon: UsersRound, color: "text-blue-600" },
    { label: "تفاعلات موحدة", value: data?.interactions ?? 0, icon: MessageCircleMore, color: "text-violet-600" },
    { label: "حسابات الولاء", value: data?.loyaltyAccounts ?? 0, icon: Star, color: "text-amber-600" },
    { label: "حالات خدمة مفتوحة", value: data?.openTickets ?? 0, icon: HeartHandshake, color: "text-rose-600" },
    { label: "انسحاب/رفض تسويقي", value: data?.optedOut ?? 0, icon: ShieldCheck, color: "text-emerald-600" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-blue-700">CRM · CX · Loyalty · Omnichannel</Badge><h1 className="text-3xl font-semibold">تجربة العميل والولاء</h1><p className="mt-2 text-sm text-slate-500">رؤية 360 للعميل داخل الكيان دون دمج العقود أو الائتمان أو نقاط الولاء بين الكيانات.</p></div><label className="text-sm">معرف الكيان<input className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" type="number" value={businessEntityId} onChange={e => setBusinessEntityId(Math.max(1, Number(e.target.value) || 1))} /></label></div>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية إدارة CRM.</CardContent></Card> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="border-0"><CardContent className="p-5"><Icon className={color} size={20} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardContent></Card>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><Card className="border-0"><CardHeader><CardTitle>آخر التفاعلات متعددة القنوات</CardTitle></CardHeader><CardContent className="space-y-3">{(interactions ?? []).map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><strong>{item.subject ?? item.channel}</strong><Badge variant="outline">{item.channel}</Badge></div><p className="mt-1 text-xs text-slate-500">{item.sourceSystem} · {item.direction}</p></div>)}{!interactions?.length && <p className="p-10 text-center text-slate-500">لا توجد تفاعلات مسجلة ضمن هذا الكيان.</p>}</CardContent></Card><Card className="border-0"><CardHeader><CardTitle>حسابات الولاء</CardTitle></CardHeader><CardContent className="space-y-3">{(loyalty ?? []).map(item => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><strong>{item.accountNo}</strong><p className="text-xs text-slate-500">الفئة: {item.tier ?? "غير محددة"}</p></div><span className="text-xl font-semibold">{item.pointsBalance}</span></div>)}{!loyalty?.length && <p className="p-10 text-center text-slate-500">لا توجد حسابات ولاء مسجلة.</p>}</CardContent></Card></div></>}</div></div></DashboardLayout>;
}
