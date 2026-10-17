import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CarFront,
  FileText,
  HandCoins,
  Receipt,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const amount = (minor: number) =>
  new Intl.NumberFormat("ar-OM", {
    style: "currency",
    currency: "OMR",
    maximumFractionDigits: 0,
  }).format(minor / 1000);

export default function AutoSales() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.sales.dashboard.useQuery(input, {
    retry: false,
  });
  const { data: vehicles } = trpc.sales.vehicles.useQuery(input, {
    retry: false,
  });
  const cards = [
    {
      label: "سيارات جاهزة للبيع",
      value: data?.readyVehicles ?? 0,
      icon: CarFront,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "حجوزات مؤكدة",
      value: data?.reservedVehicles ?? 0,
      icon: HandCoins,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "عملاء محتملون",
      value: data?.openLeads ?? 0,
      icon: Users,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "ذمم مستحقة",
      value: amount(data?.receivablesMinor ?? 0),
      icon: Receipt,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];
  return (
    <DashboardLayout>
      <div
        dir="rtl"
        className="min-h-[calc(100vh-2rem)] bg-[#f7f9fc] -m-4 p-4 sm:p-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">
                Auto Sales · كيان مستقل
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                مبيعات السيارات
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                إدارة دورة البيع المحلية من العميل المحتمل إلى التسليم، مع عزل
                كامل للمركبات والعملاء والمخزون.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              <Activity size={15} className="text-emerald-600" /> نطاق الكيان:{" "}
              <input
                aria-label="معرف كيان المبيعات"
                className="w-16 rounded border px-2 py-1"
                type="number"
                min="1"
                value={businessEntityId}
                onChange={event =>
                  setBusinessEntityId(
                    Math.max(1, Number(event.target.value) || 1)
                  )
                }
              />
            </div>
          </div>
          {isError ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-6 text-rose-900">
                تعذر تحميل مؤشرات مبيعات السيارات ضمن نطاق الصلاحيات.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, tone }) => (
                  <Card
                    key={label}
                    className="border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{label}</p>
                          <p className="mt-3 text-2xl font-semibold text-slate-950">
                            {isLoading ? "—" : value}
                          </p>
                        </div>
                        <div className={`rounded-2xl p-3 ${tone}`}>
                          <Icon size={19} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Card className="border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">مخزون المركبات</CardTitle>
                      <p className="mt-1 text-xs text-slate-500">
                        بيانات محلية للكيان، دون مشاركة Vehicle Master
                      </p>
                    </div>
                    <CarFront size={20} className="text-[#1e5eff]" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-5 py-3">المركبة</th>
                            <th className="px-5 py-3">VIN</th>
                            <th className="px-5 py-3">الحالة</th>
                            <th className="px-5 py-3">التكلفة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(vehicles ?? []).slice(0, 8).map(vehicle => (
                            <tr
                              key={vehicle.id}
                              className="border-t border-slate-100"
                            >
                              <td className="px-5 py-3 font-medium text-slate-800">
                                {vehicle.make} {vehicle.model}
                              </td>
                              <td className="px-5 py-3 text-slate-500">
                                {vehicle.vin}
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant="outline">
                                  {vehicle.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3">
                                {amount(vehicle.totalCostMinor)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!vehicles?.length && (
                        <div className="p-10 text-center text-sm text-slate-500">
                          لا توجد مركبات في نطاق هذا الكيان.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-[0_10px_35px_rgba(19,36,55,0.06)]">
                  <CardHeader>
                    <CardTitle className="text-lg">نقاط التحكم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        label: "عروض بانتظار الموافقة",
                        value: data?.pendingQuotes ?? 0,
                        icon: FileText,
                      },
                      {
                        label: "أوامر بيع معتمدة",
                        value: data?.openOrders ?? 0,
                        icon: Receipt,
                      },
                      {
                        label: "مصدر التكاليف",
                        value: "محلي + أحداث الكيانات",
                        icon: Activity,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={17} className="text-[#1e5eff]" />
                          <span className="text-sm text-slate-600">
                            {label}
                          </span>
                        </div>
                        <strong className="text-slate-900">{value}</strong>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
