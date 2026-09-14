import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CalendarClock, ClipboardCheck, Gauge, ShieldCheck, Users, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

export default function AssetLifecycle57() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.assets57.dashboard.useQuery(input, { retry: false, refetchInterval: 30000 });
  const cards = [
    { label: "مكونات الأصول", value: data?.components ?? 0, icon: Wrench, color: "text-blue-600" },
    { label: "حيازة مفتوحة", value: data?.custodyOpen ?? 0, icon: Users, color: "text-emerald-600" },
    { label: "تغطيات تنتهي خلال 30 يوماً", value: (data?.expiringInsurance ?? 0) + (data?.expiringWarranty ?? 0), icon: ShieldCheck, color: "text-violet-600" },
    { label: "استثناءات التحقق", value: data?.verificationExceptions ?? 0, icon: ClipboardCheck, color: "text-rose-600" },
    { label: "قراءات القياس", value: data?.meterReadings ?? 0, icon: Gauge, color: "text-cyan-600" },
    { label: "إعادة تقييم معلقة", value: data?.pendingRevaluations ?? 0, icon: CalendarClock, color: "text-amber-600" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-amber-50 text-amber-700">Asset Lifecycle 57 · Fixed Assets</Badge><h1 className="text-3xl font-semibold">دورة حياة الأصول</h1><p className="mt-2 text-sm text-slate-500">حيازة ومكونات وتحقق وتغطيات وقراءات أصول مستقلة لكل كيان، دون تكرار مصدر المركبات أو القيود المالية.</p></div><label className="text-sm">معرف الكيان<input className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" type="number" value={businessEntityId} onChange={e => setBusinessEntityId(Math.max(1, Number(e.target.value) || 1))} /></label></div>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية إدارة الأصول.</CardContent></Card> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="border-0"><CardContent className="p-5"><Icon className={color} size={21} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{isLoading ? "…" : value}</p></CardContent></Card>)}</div>}<Card className="mt-6 border-0"><CardHeader><CardTitle>ضوابط دورة الحياة</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4">التحويل بين الكيانات يمر بموافقة وتسوية صريحة.</div><div className="rounded-xl bg-slate-50 p-4">التحقق يحفظ الموقع والحيازة والحالة والدليل.</div><div className="rounded-xl bg-slate-50 p-4">الإهلاك والرسملة يرسلان أحداثاً للمالية ولا يكرران القيود.</div></CardContent></Card></div></div></DashboardLayout>;
}
