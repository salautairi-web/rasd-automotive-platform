import { useState } from "react";
import { Car, Plus, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EntityMasterDataPanel({
  businessEntityId,
  title = "البيانات الرئيسية للكيان",
}: {
  businessEntityId: number;
  title?: string;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.masterData.list.useQuery(
    { businessEntityId },
    { retry: false }
  );
  const createCustomer = trpc.masterData.createCustomer.useMutation({
    onSuccess: () => utils.masterData.list.invalidate({ businessEntityId }),
  });
  const createVehicle = trpc.masterData.createVehicle.useMutation({
    onSuccess: () => utils.masterData.list.invalidate({ businessEntityId }),
  });
  const [customer, setCustomer] = useState({
    nameAr: "",
    phone: "",
    email: "",
  });
  const [vehicle, setVehicle] = useState({
    vin: "",
    make: "",
    model: "",
    modelYear: "",
  });
  const submitCustomer = () => {
    if (customer.nameAr.trim())
      createCustomer.mutate({
        businessEntityId,
        ...customer,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
      });
  };
  const submitVehicle = () => {
    if (vehicle.vin.trim() && vehicle.make.trim() && vehicle.model.trim())
      createVehicle.mutate({
        businessEntityId,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        modelYear: vehicle.modelYear ? Number(vehicle.modelYear) : undefined,
      });
  };
  return (
    <Card
      className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]"
      dir="rtl"
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-500">
          تُحفظ السجلات داخل الكيان الحالي فقط وتتاح للورشة وقطع الغيار والفوترة
          المركزية.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="customers">
          <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
            <TabsTrigger value="customers">
              <UserRound className="ml-2 h-4 w-4" />
              العملاء ({data?.customers.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              <Car className="ml-2 h-4 w-4" />
              المركبات ({data?.vehicles.length ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="customers"
            className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]"
          >
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">الرقم</th>
                    <th className="p-3">الاسم</th>
                    <th className="p-3">الجوال</th>
                    <th className="p-3">البريد</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.customers ?? []).map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-medium">{c.customerNo}</td>
                      <td className="p-3">{c.nameAr}</td>
                      <td className="p-3">{c.phone || "—"}</td>
                      <td className="p-3">{c.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && !data?.customers.length && (
                <p className="p-6 text-center text-sm text-slate-500">
                  لا يوجد عملاء لهذا الكيان.
                </p>
              )}
            </div>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold">إضافة عميل</h3>
              <Label>
                الاسم العربي
                <Input
                  value={customer.nameAr}
                  onChange={e =>
                    setCustomer({ ...customer, nameAr: e.target.value })
                  }
                />
              </Label>
              <Label>
                الجوال
                <Input
                  value={customer.phone}
                  onChange={e =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                />
              </Label>
              <Label>
                البريد الإلكتروني
                <Input
                  type="email"
                  value={customer.email}
                  onChange={e =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                />
              </Label>
              <Button
                onClick={submitCustomer}
                disabled={!customer.nameAr.trim() || createCustomer.isPending}
              >
                <Plus className="ml-2 h-4 w-4" />
                حفظ العميل
              </Button>
            </div>
          </TabsContent>
          <TabsContent
            value="vehicles"
            className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]"
          >
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">الرقم</th>
                    <th className="p-3">VIN</th>
                    <th className="p-3">المركبة</th>
                    <th className="p-3">السنة</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.vehicles ?? []).map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="p-3 font-medium">{v.vehicleNo}</td>
                      <td className="p-3">{v.vin}</td>
                      <td className="p-3">
                        {v.make} {v.model}
                      </td>
                      <td className="p-3">{v.modelYear || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && !data?.vehicles.length && (
                <p className="p-6 text-center text-sm text-slate-500">
                  لا توجد مركبات لهذا الكيان.
                </p>
              )}
            </div>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold">إضافة مركبة</h3>
              <Label>
                رقم VIN
                <Input
                  value={vehicle.vin}
                  onChange={e =>
                    setVehicle({ ...vehicle, vin: e.target.value })
                  }
                />
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Label>
                  الصانع
                  <Input
                    value={vehicle.make}
                    onChange={e =>
                      setVehicle({ ...vehicle, make: e.target.value })
                    }
                  />
                </Label>
                <Label>
                  الطراز
                  <Input
                    value={vehicle.model}
                    onChange={e =>
                      setVehicle({ ...vehicle, model: e.target.value })
                    }
                  />
                </Label>
              </div>
              <Label>
                سنة الصنع
                <Input
                  type="number"
                  value={vehicle.modelYear}
                  onChange={e =>
                    setVehicle({ ...vehicle, modelYear: e.target.value })
                  }
                />
              </Label>
              <Button
                onClick={submitVehicle}
                disabled={
                  !vehicle.vin.trim() ||
                  !vehicle.make.trim() ||
                  !vehicle.model.trim() ||
                  createVehicle.isPending
                }
              >
                <Plus className="ml-2 h-4 w-4" />
                حفظ المركبة
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
