import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, CircleDollarSign, PackageCheck, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import EntityMasterDataPanel from "@/components/EntityMasterDataPanel";

const money = (minor: number) => new Intl.NumberFormat("ar-OM", { style: "currency", currency: "OMR", maximumFractionDigits: 0 }).format(minor / 1000);

export default function SpareParts() {
  const input = useMemo(() => ({ businessEntityId: 1 }), []);
  const { data, isLoading, isError } = trpc.parts.dashboard.useQuery(input, { retry: false });
  const { data: products } = trpc.parts.products.useQuery(input, { retry: false });
  const cards = [
    { label: "قيمة المخزون", value: money(data?.stockValueMinor ?? 0), icon: CircleDollarSign, tone: "bg-blue-50 text-blue-700" },
    { label: "الأصناف", value: data?.productCount ?? 0, icon: Boxes, tone: "bg-violet-50 text-violet-700" },
    { label: "منخفض المخزون", value: data?.lowStock ?? 0, icon: TriangleAlert, tone: "bg-amber-50 text-amber-700" },
    { label: "كميات محجوزة", value: data?.reservedQty ?? 0, icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
  ];
  return <DashboardLayout><div dir="rtl" className="min-h-[calc(100vh-2rem)] bg-[#f7f9fc] -m-4 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Spare Parts · كيان مستقل</Badge><h1 className="text-3xl font-semibold text-slate-950">إدارة قطع الغيار</h1><p className="mt-2 text-sm text-slate-500">كتالوج ومخزون ومبيعات محلية للكيان، مع حجز آمن وتكامل مالي عبر طبقة الأحداث.</p>{isError ? <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6 text-rose-900">تعذر تحميل بيانات قطع الغيار ضمن نطاق الصلاحيات.</CardContent></Card> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({label,value,icon:Icon,tone}) => <Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]"><CardContent className="p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19}/></div></div></CardContent></Card>)}</div><Card className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]"><CardHeader><CardTitle>كتالوج القطع المحلي</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">SKU</th><th className="px-5 py-3">الصنف</th><th className="px-5 py-3">العلامة</th><th className="px-5 py-3">السعر</th><th className="px-5 py-3">الحالة</th></tr></thead><tbody>{(products ?? []).map(p => <tr key={p.id} className="border-t border-slate-100"><td className="px-5 py-3 font-medium">{p.sku}</td><td className="px-5 py-3">{p.nameAr}</td><td className="px-5 py-3 text-slate-500">{p.brand ?? "—"}</td><td className="px-5 py-3">{money(p.retailPriceMinor)}</td><td className="px-5 py-3"><Badge variant="outline">{p.status}</Badge></td></tr>)}</tbody></table>{!products?.length && <div className="p-10 text-center text-sm text-slate-500">لا توجد أصناف في نطاق هذا الكيان.</div>}</div></CardContent></Card></>}<EntityMasterDataPanel businessEntityId={input.businessEntityId} title="عملاء ومركبات كيان قطع الغيار" /></div></div></DashboardLayout>;
}
