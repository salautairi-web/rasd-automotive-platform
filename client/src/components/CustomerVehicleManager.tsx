import { useMemo, useState } from "react";
import { CarFront, Gauge, Plus, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VEHICLE_CATALOG, VEHICLE_COLORS, VEHICLE_TYPES, PLATE_COUNTRIES } from "../../../shared/vehicleCatalog";

export type CustomerVehicle = {
  id: number;
  vehicleNo: string;
  vin: string;
  make: string;
  model: string;
  modelYear: number | null;
  vehicleType: string | null;
  plateNo: string | null;
  plateCountry: string | null;
  color: string | null;
  odometerValue: number;
  odometerUnit: "km" | "mile";
  nextServiceOdometer: number | null;
  nextServiceAt: Date | null;
  status: string;
};

type Props = {
  scope: { businessEntityId: number; relationshipId: number };
  vehicles: CustomerVehicle[];
  onChanged: () => void;
};

const emptyForm = {
  make: "", model: "", modelYear: "", vehicleType: "", plateNo: "", plateCountry: "", color: "", vin: "", odometerValue: "0", odometerUnit: "km" as "km" | "mile", nextServiceOdometer: "", nextServiceAt: "",
};

export default function CustomerVehicleManager({ scope, vehicles, onChanged }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Record<number, { odometerValue: string; odometerUnit: "km" | "mile"; nextServiceOdometer: string; nextServiceAt: string }>>({});
  const create = trpc.portalV2.createVehicle.useMutation({ onSuccess: () => { toast.success("تمت إضافة المركبة إلى ملفك"); setForm(emptyForm); setOpen(false); setMakeSearch(""); onChanged(); }, onError: e => toast.error(e.message) });
  const update = trpc.portalV2.updateVehicle.useMutation({ onSuccess: () => { toast.success("تم تحديث بيانات العداد والتنبيه"); onChanged(); }, onError: e => toast.error(e.message) });
  const filtered = useMemo(() => vehicles.filter(vehicle => `${vehicle.make} ${vehicle.model} ${vehicle.vehicleNo} ${vehicle.plateNo ?? ""} ${vehicle.vin}`.toLowerCase().includes(search.toLowerCase())), [vehicles, search]);
  const makeOptions = VEHICLE_CATALOG.filter(item => `${item.key} ${item.label}`.toLowerCase().includes(makeSearch.toLowerCase()));
  const selectedMake = VEHICLE_CATALOG.find(item => item.key === form.make);
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!form.make || !form.model || !form.vehicleType || !form.vin) { toast.error("أكمل الشركة والطراز والنوع ورقم الهيكل"); return; } create.mutate({ ...scope, make: form.make, model: form.model, modelYear: form.modelYear ? Number(form.modelYear) : undefined, vehicleType: form.vehicleType, plateNo: form.plateNo || undefined, plateCountry: form.plateCountry || undefined, color: form.color || undefined, vin: form.vin.trim(), odometerValue: Number(form.odometerValue || 0), odometerUnit: form.odometerUnit, nextServiceOdometer: form.nextServiceOdometer ? Number(form.nextServiceOdometer) : undefined, nextServiceAt: form.nextServiceAt ? new Date(form.nextServiceAt) : undefined }); };
  const editFor = (vehicle: CustomerVehicle) => editing[vehicle.id] ?? { odometerValue: String(vehicle.odometerValue), odometerUnit: vehicle.odometerUnit, nextServiceOdometer: vehicle.nextServiceOdometer == null ? "" : String(vehicle.nextServiceOdometer), nextServiceAt: vehicle.nextServiceAt ? new Date(vehicle.nextServiceAt).toISOString().slice(0, 10) : "" };
  const saveMeter = (vehicle: CustomerVehicle) => { const current = editFor(vehicle); update.mutate({ ...scope, vehicleId: vehicle.id, odometerValue: Number(current.odometerValue || 0), odometerUnit: current.odometerUnit, nextServiceOdometer: current.nextServiceOdometer ? Number(current.nextServiceOdometer) : null, nextServiceAt: current.nextServiceAt ? new Date(current.nextServiceAt) : null }); };
  const updateEdit = (vehicle: CustomerVehicle, patch: Partial<ReturnType<typeof editFor>>) => setEditing(current => ({ ...current, [vehicle.id]: { ...editFor(vehicle), ...patch } }));

  return <Card className="border-0 shadow-sm">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><CardTitle className="flex items-center gap-2 text-base"><CarFront size={18} className="text-violet-600" /> مركباتي وخدماتها</CardTitle><p className="mt-1 text-xs text-slate-500">أضف مركباتك، حدّث العداد، واستقبل تنبيهاً عند استحقاق الصيانة.</p></div>
        <Button size="sm" onClick={() => setOpen(value => !value)}><Plus size={15} /> {open ? "إغلاق الإضافة" : "إضافة مركبة"}</Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {open && <form onSubmit={submit} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
        <p className="mb-3 text-sm font-semibold">بيانات المركبة الجديدة</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><Label>بحث الشركة</Label><Input value={makeSearch} onChange={e => setMakeSearch(e.target.value)} placeholder="تويوتا أو Toyota" /></div>
          <div><Label>الشركة</Label><Select value={form.make} onValueChange={value => setForm(current => ({ ...current, make: value, model: "" }))}><SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger><SelectContent>{makeOptions.map(make => <SelectItem key={make.key} value={make.key}>{make.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>الطراز</Label><Select value={form.model} onValueChange={value => set("model", value)} disabled={!selectedMake}><SelectTrigger><SelectValue placeholder="اختر الطراز" /></SelectTrigger><SelectContent>{selectedMake?.models.map(model => <SelectItem key={model} value={model}>{model}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>نوع المركبة</Label><Select value={form.vehicleType} onValueChange={value => set("vehicleType", value)}><SelectTrigger><SelectValue placeholder="سيدان، SUV…" /></SelectTrigger><SelectContent>{VEHICLE_TYPES.map(type => <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>سنة الصنع</Label><Input type="number" value={form.modelYear} onChange={e => set("modelYear", e.target.value)} /></div>
          <div><Label>رقم الهيكل VIN</Label><Input dir="ltr" required value={form.vin} onChange={e => set("vin", e.target.value)} placeholder="إلزامي للتعرّف على المركبة" /></div>
          <div><Label>دولة اللوحة</Label><Select value={form.plateCountry} onValueChange={value => set("plateCountry", value)}><SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger><SelectContent>{PLATE_COUNTRIES.map(country => <SelectItem key={country.key} value={country.key}>{country.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>رقم اللوحة</Label><Input value={form.plateNo} onChange={e => set("plateNo", e.target.value)} placeholder="أرقام وحروف" /></div>
          <div><Label>اللون</Label><Select value={form.color} onValueChange={value => set("color", value)}><SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger><SelectContent>{VEHICLE_COLORS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>العداد الحالي</Label><Input type="number" min="0" value={form.odometerValue} onChange={e => set("odometerValue", e.target.value)} /></div>
          <div><Label>نوع العداد</Label><Select value={form.odometerUnit} onValueChange={value => set("odometerUnit", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="km">كيلومتر</SelectItem><SelectItem value="mile">ميل</SelectItem></SelectContent></Select></div>
          <div><Label>موعد الصيانة عند العداد</Label><Input type="number" min="1" value={form.nextServiceOdometer} onChange={e => set("nextServiceOdometer", e.target.value)} placeholder="اختياري" /></div>
          <div><Label>أو تاريخ الصيانة القادم</Label><Input type="date" value={form.nextServiceAt} onChange={e => set("nextServiceAt", e.target.value)} /></div>
        </div>
        <Button type="submit" className="mt-4" disabled={create.isPending}><Plus size={15} /> حفظ المركبة</Button>
      </form>}
      <div className="relative"><Search size={16} className="absolute right-3 top-3 text-slate-400" /><Input className="pr-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالسيارة أو اللوحة أو VIN" /></div>
      {filtered.map(vehicle => { const current = editFor(vehicle); const due = (vehicle.nextServiceOdometer != null && vehicle.odometerValue >= vehicle.nextServiceOdometer) || Boolean(vehicle.nextServiceAt && new Date(vehicle.nextServiceAt).getTime() <= Date.now()); return <div key={vehicle.id} className={`rounded-2xl border p-4 ${due ? "border-amber-200 bg-amber-50/40" : "bg-white"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{vehicle.make} {vehicle.model} {vehicle.modelYear ? `· ${vehicle.modelYear}` : ""}</p><p className="mt-1 text-xs text-slate-500">{vehicle.vehicleNo} · {vehicle.plateNo || "بدون لوحة"} · {vehicle.color || "لون غير محدد"}</p><p dir="ltr" className="mt-1 text-xs text-slate-500">VIN: {vehicle.vin}</p></div><span className={`rounded-full px-2 py-1 text-xs ${due ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{due ? "تنبيه صيانة" : "لا يوجد تنبيه"}</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4"><div><Label>العداد</Label><Input type="number" min="0" value={current.odometerValue} onChange={e => updateEdit(vehicle, { odometerValue: e.target.value })} /></div><div><Label>الوحدة</Label><Select value={current.odometerUnit} onValueChange={value => updateEdit(vehicle, { odometerUnit: value as "km" | "mile" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="km">كم</SelectItem><SelectItem value="mile">ميل</SelectItem></SelectContent></Select></div><div><Label>العداد القادم</Label><Input type="number" min="1" value={current.nextServiceOdometer} onChange={e => updateEdit(vehicle, { nextServiceOdometer: e.target.value })} /></div><div><Label>التاريخ القادم</Label><Input type="date" value={current.nextServiceAt} onChange={e => updateEdit(vehicle, { nextServiceAt: e.target.value })} /></div></div>
        <Button size="sm" variant="outline" className="mt-3" disabled={update.isPending} onClick={() => saveMeter(vehicle)}><Save size={14} /> حفظ العداد والتنبيه</Button>
      </div>})}
      {!filtered.length && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">لا توجد مركبات مطابقة للبحث.</p>}
      <div className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600"><Gauge size={14} className="mb-1 inline text-violet-600" /> أنواع الخدمات المقترحة: تغيير الزيت والفلتر، الفحص الدوري، الفرامل، الإطارات، البطارية، المكيف، ناقل الحركة، التعليق، التشخيص، والهيكل والدهان.</div>
    </CardContent>
  </Card>;
}
