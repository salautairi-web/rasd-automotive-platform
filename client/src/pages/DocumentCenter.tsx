import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Archive, FileCheck2, Files, HardDrive, LockKeyhole, PenLine, Search, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

const statusLabels: Record<string, string> = { draft: "مسودة", review: "قيد المراجعة", approved: "معتمد", signature_pending: "بانتظار التوقيع", signed: "موقّع", archived: "مؤرشف", superseded: "مستبدل", disposed: "متلف محمياً" };
const classLabels: Record<string, string> = { public: "عام", internal: "داخلي", confidential: "سري", restricted: "مقيّد" };

export default function DocumentCenter() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const [search, setSearch] = useState("");
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isError } = trpc.documentManagement.dashboard.useQuery(input, { retry: false });
  const { data: docs } = trpc.documentManagement.list.useQuery({ ...input, search: search || undefined }, { retry: false });
  const cards = [
    { label: "المستندات", value: data?.documents ?? 0, icon: Files, tone: "text-blue-600" },
    { label: "توقيعات معلقة", value: data?.pendingSignatures ?? 0, icon: PenLine, tone: "text-violet-600" },
    { label: "تنتهي قريباً", value: data?.expiring ?? 0, icon: FileCheck2, tone: "text-amber-600" },
    { label: "حجز قانوني", value: data?.legalHolds ?? 0, icon: LockKeyhole, tone: "text-rose-600" },
    { label: "حجم التخزين", value: `${Math.round((data?.storageBytes ?? 0) / 1024)} KB`, icon: HardDrive, tone: "text-emerald-600" },
  ];
  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-blue-50 text-blue-700">DMS · Archive · eSignature</Badge><h1 className="text-3xl font-semibold">مركز المستندات والتوقيع</h1><p className="mt-2 text-sm text-slate-500">مستودع موحّد تقنياً، مع ملكية وعزل وصلاحيات مستقلة لكل كيان.</p></div><label className="text-sm text-slate-500">نطاق الكيان<Input aria-label="معرّف الكيان" type="number" value={businessEntityId} onChange={e => setBusinessEntityId(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-28 bg-white" /></label></div>
    {isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية إدارة المستندات ونطاق الكيان.</CardContent></Card> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="border-0 shadow-sm"><CardContent className="p-5"><Icon className={tone} size={20} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></CardContent></Card>)}</div>
      <Card className="mt-6 border-0 shadow-sm"><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>سجل المستندات</CardTitle><p className="mt-1 text-xs text-slate-500">نتائج البحث تُصفّى أولاً بنطاق الكيان والصلاحية.</p></div><div className="relative w-full sm:w-64"><Search className="absolute right-3 top-2.5 text-slate-400" size={16} /><Input placeholder="بحث بالعنوان أو الرقم" value={search} onChange={e => setSearch(e.target.value)} className="pr-9" /></div></CardHeader><CardContent className="space-y-3">{(docs ?? []).map(document => <div key={document.id} className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm transition hover:bg-slate-100 sm:grid-cols-[1fr_auto_auto_auto]"><div><strong>{document.title}</strong><p className="text-xs text-slate-500">{document.documentNo}</p>{document.expiresAt && <p className="mt-1 text-xs text-amber-700">انتهاء: {new Date(document.expiresAt).toLocaleDateString("ar-SA")}</p>}</div><Badge variant="outline">{classLabels[document.classification] ?? document.classification}</Badge><span className="self-center">الإصدار {document.currentVersion}</span><Badge>{statusLabels[document.status] ?? document.status}</Badge></div>)}{!docs?.length && <div className="p-10 text-center text-slate-500"><Archive className="mx-auto mb-3 text-slate-300" size={30} /><p>لا توجد مستندات مسجلة ضمن هذا النطاق.</p><p className="mt-1 text-xs">الرفع والتوقيع والمشاركة لا تتجاوز ملكية السجل المحلي للكيان.</p></div>}</CardContent></Card>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><Card className="border-0 bg-slate-900 text-white"><CardContent className="p-5"><PenLine className="mb-3 text-violet-300" size={20} /><h3 className="font-semibold">توقيع محايد للمزود</h3><p className="mt-2 text-sm text-slate-300">طلبات مرتبة بالأدلة والتدقيق، مع إمكانية ربط Adapter لمزود لاحقاً.</p></CardContent></Card><Card className="border-0"><CardContent className="p-5"><LockKeyhole className="mb-3 text-rose-600" size={20} /><h3 className="font-semibold">الحجز القانوني</h3><p className="mt-2 text-sm text-slate-500">يمنع الإتلاف أثناء سريان الحجز ويحفظ سبب الإجراء وصاحبه.</p></CardContent></Card><Card className="border-0"><CardContent className="p-5"><Share2 className="mb-3 text-blue-600" size={20} /><h3 className="font-semibold">مشاركة آمنة</h3><p className="mt-2 text-sm text-slate-500">روابط محددة المدة والصلاحية مع قابلية الإلغاء وسجل الوصول.</p></CardContent></Card></div>
    </>}</div></div></DashboardLayout>;
}
