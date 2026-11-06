import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Car, Pencil, Plus, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATE_COUNTRIES, VEHICLE_CATALOG, VEHICLE_COLORS, VEHICLE_TYPES, validatePlateNumber, type PlateCountry } from "../../../shared/vehicleCatalog";

const emptyCustomer = { nameAr: "", customerType: "individual" as "individual" | "corporate", companyName: "", taxNo: "", phone: "", email: "" };
const emptyVehicle = { vin: "", make: "", model: "", modelYear: "", vehicleType: "", plateNo: "", plateCountry: "" as "" | PlateCountry, color: "", customerId: "" };

export default function EntityMasterDataPanel({ businessEntityId, title = "البيانات الرئيسية للكيان" }: { businessEntityId: number; title?: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading, isError } = trpc.masterData.list.useQuery({ businessEntityId }, { retry: false });
  const [customer, setCustomer] = useState(emptyCustomer);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const refresh = () => utils.masterData.list.invalidate({ businessEntityId });
  const createCustomer = trpc.masterData.createCustomer.useMutation({ onSuccess: () => { setCustomer(emptyCustomer); refresh(); } });
  const updateCustomer = trpc.masterData.updateCustomer.useMutation({ onSuccess: () => { setEditingCustomerId(null); setCustomer(emptyCustomer); refresh(); } });
  const createVehicle = trpc.masterData.createVehicle.useMutation({ onSuccess: () => { setVehicle(emptyVehicle); refresh(); } });
  const updateVehicle = trpc.masterData.updateVehicle.useMutation({ onSuccess: () => { setEditingVehicleId(null); setVehicle(emptyVehicle); refresh(); } });
  const customers = data?.customers ?? [];
  const vehicles = data?.vehicles ?? [];
  const customerName = useMemo(() => new Map(customers.map(c => [c.id, c.nameAr])), [customers]);
  const saving = createCustomer.isPending || updateCustomer.isPending || createVehicle.isPending || updateVehicle.isPending;
  const filteredMakes = VEHICLE_CATALOG.filter(item => `${item.label} ${item.key}`.toLowerCase().includes(makeSearch.toLowerCase()));
  const availableModels = VEHICLE_CATALOG.find(item => item.key === vehicle.make)?.models ?? [];
  const filteredModels = availableModels.filter(model => model.toLowerCase().includes(modelSearch.toLowerCase()));

  const submitCustomer = () => {
    if (!customer.nameAr.trim() || (customer.customerType === "corporate" && !customer.companyName.trim())) return;
    const payload = { businessEntityId, nameAr: customer.nameAr.trim(), customerType: customer.customerType, companyName: customer.companyName.trim() || undefined, taxNo: customer.taxNo.trim() || undefined, phone: customer.phone.trim() || undefined, email: customer.email.trim() || undefined };
    if (editingCustomerId) updateCustomer.mutate({ ...payload, customerId: editingCustomerId });
    else createCustomer.mutate(payload);
  };
  const submitVehicle = () => {
    if (!vehicle.vin.trim() || !vehicle.make.trim() || !vehicle.model.trim() || !vehicle.vehicleType.trim()) return;
    const plateCheck = validatePlateNumber(vehicle.plateNo, (vehicle.plateCountry || "OTHER") as PlateCountry);
    if (!plateCheck.valid) { toast.error(plateCheck.message); return; }
    const payload = { businessEntityId, vin: vehicle.vin.trim(), make: vehicle.make.trim(), model: vehicle.model.trim(), modelYear: vehicle.modelYear ? Number(vehicle.modelYear) : undefined, vehicleType: vehicle.vehicleType.trim() || undefined, plateNo: vehicle.plateNo.trim() || undefined, plateCountry: vehicle.plateCountry || undefined, color: vehicle.color.trim() || undefined, customerId: vehicle.customerId ? Number(vehicle.customerId) : undefined };
    if (editingVehicleId) updateVehicle.mutate({ ...payload, vehicleId: editingVehicleId, customerId: payload.customerId ?? null });
    else createVehicle.mutate(payload);
  };
  const editCustomer = (row: (typeof customers)[number]) => setCustomer({ nameAr: row.nameAr, customerType: row.customerType, companyName: row.companyName ?? "", taxNo: row.taxNo ?? "", phone: row.phone ?? "", email: row.email ?? "" });
  const editVehicle = (row: (typeof vehicles)[number]) => setVehicle({ vin: row.vin, make: row.make, model: row.model, modelYear: row.modelYear ? String(row.modelYear) : "", vehicleType: row.vehicleType ?? "", plateNo: row.plateNo ?? "", plateCountry: (row.plateCountry as PlateCountry | null) ?? "", color: row.color ?? "", customerId: row.customerId ? String(row.customerId) : "" });

  return (
    <Card className="mt-6 border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]" dir="rtl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-500">سجل موحّد للعملاء والمركبات داخل الكيان الحالي. يمكن ربط عدة مركبات بالعميل نفسه مع تدقيق تغييرات البيانات.</p>
      </CardHeader>
      <CardContent>
        {isError && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">لا تملك صلاحية قراءة البيانات الرئيسية لهذا الكيان.</p>}
        <Tabs defaultValue="customers">
          <TabsList className="grid w-full grid-cols-2 sm:w-[420px]">
            <TabsTrigger value="customers"><UserRound className="ml-2 h-4 w-4" /> العملاء ({customers.length})</TabsTrigger>
            <TabsTrigger value="vehicles"><Car className="ml-2 h-4 w-4" /> المركبات ({vehicles.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[680px] text-right text-sm">
                <thead className="bg-slate-50"><tr><th className="p-3">الرقم</th><th className="p-3">العميل</th><th className="p-3">النوع</th><th className="p-3">الجوال</th><th className="p-3">المركبات</th><th className="p-3">إجراء</th></tr></thead>
                <tbody>{customers.map(c => <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.customerNo}</td><td className="p-3"><div>{c.nameAr}</div>{c.companyName && <div className="text-xs text-slate-500">{c.companyName} · {c.taxNo || "بدون رقم ضريبي"}</div>}</td><td className="p-3">{c.customerType === "corporate" ? "شركة" : "فرد"}</td><td className="p-3">{c.phone || "—"}</td><td className="p-3">{vehicles.filter(v => v.customerId === c.id).length}</td><td className="p-3"><Button variant="outline" size="sm" onClick={() => { setEditingCustomerId(c.id); editCustomer(c); }}><Pencil className="ml-1 h-3.5 w-3.5" /> تعديل</Button></td>
                </tr>)}</tbody>
              </table>
              {!isLoading && !customers.length && <p className="p-6 text-center text-sm text-slate-500">لا يوجد عملاء لهذا الكيان.</p>}
            </div>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{editingCustomerId ? "تعديل بيانات العميل" : "إضافة عميل"}</h3>{editingCustomerId && <Button variant="ghost" size="sm" onClick={() => { setEditingCustomerId(null); setCustomer(emptyCustomer); }}>إلغاء</Button>}</div>
              <Label>الاسم العربي<Input value={customer.nameAr} onChange={e => setCustomer({ ...customer, nameAr: e.target.value })} /></Label>
              <Label>نوع العميل<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={customer.customerType} onChange={e => setCustomer({ ...customer, customerType: e.target.value as "individual" | "corporate" })}><option value="individual">فرد</option><option value="corporate">شركة</option></select></Label>
              {customer.customerType === "corporate" && <><Label>اسم الشركة<Input value={customer.companyName} onChange={e => setCustomer({ ...customer, companyName: e.target.value })} /></Label><Label>الرقم الضريبي<Input value={customer.taxNo} onChange={e => setCustomer({ ...customer, taxNo: e.target.value })} /></Label></>}
              <div className="grid gap-3 sm:grid-cols-2"><Label>الجوال<Input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} /></Label><Label>البريد الإلكتروني<Input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} /></Label></div>
              <Button onClick={submitCustomer} disabled={!customer.nameAr.trim() || (customer.customerType === "corporate" && !customer.companyName.trim()) || saving}>{editingCustomerId ? "حفظ التعديل" : <><Plus className="ml-2 h-4 w-4" /> حفظ العميل</>}</Button>
            </div>
          </TabsContent>
          <TabsContent value="vehicles" className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
            <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[820px] text-right text-sm"><thead className="bg-slate-50"><tr><th className="p-3">الرقم</th><th className="p-3">VIN</th><th className="p-3">المركبة</th><th className="p-3">النوع</th><th className="p-3">اللوحة</th><th className="p-3">اللون</th><th className="p-3">العميل</th><th className="p-3">إجراء</th></tr></thead><tbody>{vehicles.map(v => <tr key={v.id} className="border-t"><td className="p-3 font-medium">{v.vehicleNo}</td><td className="p-3">{v.vin}</td><td className="p-3">{v.make} {v.model} {v.modelYear ? `· ${v.modelYear}` : ""}</td><td className="p-3">{VEHICLE_TYPES.find(item => item.key === v.vehicleType)?.label || v.vehicleType || "—"}</td><td className="p-3">{v.plateNo || "—"}</td><td className="p-3">{v.color || "—"}</td><td className="p-3">{v.customerId ? customerName.get(v.customerId) || "—" : "غير مرتبط"}</td><td className="p-3"><Button variant="outline" size="sm" onClick={() => { setEditingVehicleId(v.id); editVehicle(v); }}><Pencil className="ml-1 h-3.5 w-3.5" /> تعديل</Button></td></tr>)}</tbody></table>{!isLoading && !vehicles.length && <p className="p-6 text-center text-sm text-slate-500">لا توجد مركبات لهذا الكيان.</p>}</div>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold">{editingVehicleId ? "تعديل وربط المركبة" : "إضافة مركبة"}</h3>{editingVehicleId && <Button variant="ghost" size="sm" onClick={() => { setEditingVehicleId(null); setVehicle(emptyVehicle); }}>إلغاء</Button>}</div><Label>رقم VIN<Input value={vehicle.vin} onChange={e => setVehicle({ ...vehicle, vin: e.target.value })} /></Label><div className="grid gap-2 sm:grid-cols-2"><Label>بحث الشركة<Input value={makeSearch} onChange={e => setMakeSearch(e.target.value)} placeholder="اكتب تويوتا أو Toyota" /></Label><Label>بحث الطراز<Input value={modelSearch} onChange={e => setModelSearch(e.target.value)} placeholder="اكتب Camry أو كامري" disabled={!vehicle.make} /></Label></div><div className="grid grid-cols-2 gap-2"><Label>الشركة<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.make} onChange={e => { setVehicle({ ...vehicle, make: e.target.value, model: "" }); setModelSearch(""); }}><option value="">اختر الشركة</option>{filteredMakes.map(item => <option key={item.key} value={item.key}>{item.label} · {item.key}</option>)}</select></Label><Label>الطراز<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.model} onChange={e => setVehicle({ ...vehicle, model: e.target.value })} disabled={!vehicle.make}><option value="">اختر الطراز</option>{filteredModels.map(model => <option key={model} value={model}>{model}</option>)}</select></Label></div><div className="grid gap-2 sm:grid-cols-3"><Label>نوع المركبة<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.vehicleType} onChange={e => setVehicle({ ...vehicle, vehicleType: e.target.value })}><option value="">اختر النوع</option>{VEHICLE_TYPES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Label><Label>سنة الصنع<Input type="number" value={vehicle.modelYear} onChange={e => setVehicle({ ...vehicle, modelYear: e.target.value })} /></Label><Label>لون السيارة<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.color} onChange={e => setVehicle({ ...vehicle, color: e.target.value })}><option value="">اختياري</option>{VEHICLE_COLORS.map(color => <option key={color} value={color}>{color}</option>)}</select></Label></div><div className="grid gap-2 sm:grid-cols-2"><Label>دولة اللوحة<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.plateCountry} onChange={e => setVehicle({ ...vehicle, plateCountry: e.target.value as "" | PlateCountry })}><option value="">اختياري</option>{PLATE_COUNTRIES.map(country => <option key={country.key} value={country.key}>{country.label}</option>)}</select></Label><Label>رقم اللوحة (اختياري)<Input value={vehicle.plateNo} onChange={e => setVehicle({ ...vehicle, plateNo: e.target.value })} maxLength={32} placeholder="مثال: 12345 أ ب" /></Label></div><Label>العميل المرتبط<select className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={vehicle.customerId} onChange={e => setVehicle({ ...vehicle, customerId: e.target.value })}><option value="">بدون عميل</option>{customers.map(c => <option key={c.id} value={c.id}>{c.nameAr}{c.companyName ? ` · ${c.companyName}` : ""}</option>)}</select></Label><Button onClick={submitVehicle} disabled={!vehicle.vin.trim() || !vehicle.make.trim() || !vehicle.model.trim() || !vehicle.vehicleType.trim() || saving}>{editingVehicleId ? "حفظ التعديل" : <><Plus className="ml-2 h-4 w-4" /> حفظ المركبة</>}</Button></div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
