import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FilePlus2, ImagePlus, UserPlus, CarFront, Wrench, PackageCheck } from "lucide-react";
import { workshopRequestKey, validWorkshopInteger } from "../../../shared/workshopClient";
import { PLATE_COUNTRIES, VEHICLE_CATALOG, VEHICLE_COLORS, VEHICLE_TYPES, validatePlateNumber, type PlateCountry } from "../../../shared/vehicleCatalog";

type Customer = { id: number; nameAr: string; customerNo: string; phone?: string | null; companyName?: string | null };
type Vehicle = { id: number; make: string; model: string; vehicleNo: string; vin?: string; customerId?: number | null; modelYear?: number | null; vehicleType?: string | null; plateNo?: string | null; plateCountry?: string | null; color?: string | null };
type Product = { id: number; sku: string; nameAr: string };
type Warehouse = { id: number; warehouseCode: string; nameAr: string };
type PartLine = { warehouseId: string; productId: string; quantity: string };

const newForm = () => ({
  customerId: "", vehicleId: "", mileage: "", complaint: "", fuel: "", damage: "",
  jobNo: `WS-${Date.now().toString(36).toUpperCase()}-${workshopRequestKey("number").slice(-6).toUpperCase()}`,
  priority: "normal" as "normal" | "low" | "high" | "critical", expectedExit: "",
  labor: "0", parts: "0", tax: "0", discount: "0", technicianSignature: "", customerSignature: "",
  customerConsent: false, technicianConsent: false, checkinKey: workshopRequestKey("checkin"), jobKey: workshopRequestKey("job"),
});
const selectClass = "mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";
const money = (value: string) => { const number = Number(value); return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : null; };

export default function WorkshopReceiveDialog({ businessEntityId, branchId, customers, vehicles, products = [], warehouses = [], permissions = [], open, onOpenChange, onCreated }: {
  businessEntityId: number; branchId?: number; customers: Customer[]; vehicles: Vehicle[]; products?: Product[]; warehouses?: Warehouse[]; permissions?: string[]; open: boolean; onOpenChange: (value: boolean) => void; onCreated: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState(newForm);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [vehicleMode, setVehicleMode] = useState<"existing" | "new">("existing");
  const [newCustomer, setNewCustomer] = useState({ nameAr: "", phone: "", email: "", customerType: "individual" as "individual" | "corporate", companyName: "" });
  const [newVehicle, setNewVehicle] = useState({ vin: "", make: "", model: "", modelYear: "", vehicleType: "", plateNo: "", plateCountry: "" as "" | PlateCountry, color: "" });
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [partsLines, setPartsLines] = useState<PartLine[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [receivedId, setReceivedId] = useState<number | null>(null);
  const receive = trpc.workshop59.createCheckin.useMutation();
  const createJob = trpc.workshop59.openJobCard.useMutation();
  const createCustomer = trpc.masterData.createCustomer.useMutation();
  const createVehicle = trpc.masterData.createVehicle.useMutation();
  const createEstimate = trpc.workshop59.createEstimate.useMutation();
  const createInspection = trpc.workshop59.createInspection.useMutation();
  const upload = trpc.workshop59.uploadInspectionMedia.useMutation();
  const requestPart = trpc.workshop59.requestPart.useMutation();
  const busy = [receive, createJob, createCustomer, createVehicle, createEstimate, createInspection, upload, requestPart].some(item => item.isPending);
  const can = (key: string) => permissions.length === 0 || permissions.includes(key);
  const selectedCustomer = customers.find(item => item.id === Number(form.customerId));
  const filteredMakes = VEHICLE_CATALOG.filter(item => `${item.label} ${item.key}`.toLowerCase().includes(makeSearch.toLowerCase()));
  const availableModels = VEHICLE_CATALOG.find(item => item.key === newVehicle.make)?.models ?? [];
  const filteredModels = availableModels.filter(model => model.toLowerCase().includes(modelSearch.toLowerCase()));
  const customerVehicles = useMemo(() => vehicles.filter(item => item.customerId === Number(form.customerId)), [vehicles, form.customerId]);
  const valid = Boolean(form.mileage && validWorkshopInteger(form.mileage) && form.complaint.trim().length >= 3 && form.jobNo.trim().length >= 3 && form.customerSignature.trim() && form.technicianSignature.trim() && form.customerConsent && form.technicianConsent && (mode === "new" ? newCustomer.nameAr.trim().length >= 2 : form.customerId) && !(mode === "new" && vehicleMode === "existing") && (vehicleMode === "new" ? newVehicle.vin.trim().length >= 8 && newVehicle.make.trim() && newVehicle.model.trim() && newVehicle.vehicleType.trim() : form.vehicleId));
  const update = (key: keyof ReturnType<typeof newForm>, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const reset = () => { setForm(newForm()); setMode("existing"); setVehicleMode("existing"); setNewCustomer({ nameAr: "", phone: "", email: "", customerType: "individual", companyName: "" }); setNewVehicle({ vin: "", make: "", model: "", modelYear: "", vehicleType: "", plateNo: "", plateCountry: "", color: "" }); setPartsLines([]); setPhotos([]); setReceivedId(null); };
  const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الصورة")); reader.onerror = () => reject(new Error("تعذر قراءة الصورة")); reader.readAsDataURL(file); });

  const submit = async () => {
    if (!valid || busy) return;
    try {
      let customerId = Number(form.customerId);
      if (mode === "new") {
        if (!can("master_data.customer.create")) throw new Error("لا تملك صلاحية إنشاء عميل جديد.");
        const created = await createCustomer.mutateAsync({ businessEntityId, nameAr: newCustomer.nameAr.trim(), phone: newCustomer.phone.trim() || undefined, email: newCustomer.email.trim() || undefined, customerType: newCustomer.customerType, companyName: newCustomer.companyName.trim() || undefined });
        await utils.masterData.list.invalidate({ businessEntityId });
        const rows = await utils.masterData.list.fetch({ businessEntityId });
        customerId = rows.customers.find(item => item.customerNo === created.customerNo)?.id ?? 0;
        if (!customerId) throw new Error("تم إنشاء العميل لكن تعذر تحديد سجله لإكمال الأمر.");
      }
      let vehicleId = Number(form.vehicleId);
      if (vehicleMode === "new") {
        if (!can("master_data.vehicle.create")) throw new Error("لا تملك صلاحية إنشاء مركبة جديدة.");
        const plateCheck = validatePlateNumber(newVehicle.plateNo, (newVehicle.plateCountry || "OTHER") as PlateCountry);
        if (!plateCheck.valid) throw new Error(plateCheck.message);
        const created = await createVehicle.mutateAsync({ businessEntityId, customerId, vin: newVehicle.vin.trim(), make: newVehicle.make.trim(), model: newVehicle.model.trim(), modelYear: newVehicle.modelYear ? Number(newVehicle.modelYear) : undefined, vehicleType: newVehicle.vehicleType.trim() || undefined, plateNo: newVehicle.plateNo.trim() || undefined, plateCountry: newVehicle.plateCountry || undefined, color: newVehicle.color.trim() || undefined });
        await utils.masterData.list.invalidate({ businessEntityId });
        const rows = await utils.masterData.list.fetch({ businessEntityId });
        vehicleId = rows.vehicles.find(item => item.vehicleNo === created.vehicleNo)?.id ?? 0;
        if (!vehicleId) throw new Error("تم إنشاء المركبة لكن تعذر تحديد سجلها لإكمال الأمر.");
      }
      const evidence = { visibleDamage: form.damage, customerSignature: form.customerSignature.trim(), technicianSignature: form.technicianSignature.trim(), capturedAt: new Date().toISOString() };
      const checkin = await receive.mutateAsync({ businessEntityId, branchId, customerId, vehicleId, mileage: Number(form.mileage), fuelLevel: form.fuel.trim() || undefined, complaint: form.complaint.trim(), consent: true, existingDamageJson: JSON.stringify({ notes: form.damage }), evidenceJson: JSON.stringify(evidence), idempotencyKey: form.checkinKey });
      setReceivedId(checkin.id);
      const job = await createJob.mutateAsync({ businessEntityId, branchId, customerId, vehicleId, checkinId: checkin.id, jobNo: form.jobNo.trim(), priority: form.priority, promisedAt: form.expectedExit ? new Date(form.expectedExit) : undefined, idempotencyKey: form.jobKey });
      if (can("estimate")) {
        await createEstimate.mutateAsync({ businessEntityId, jobCardId: job.id, vehicleId, customerId, currency: "OMR", version: 1, laborMinor: money(form.labor) ?? 0, partsMinor: money(form.parts) ?? 0, subcontractMinor: 0, consumablesMinor: 0, taxMinor: money(form.tax) ?? 0, discountMinor: money(form.discount) ?? 0, validUntil: form.expectedExit ? new Date(form.expectedExit) : undefined });
      }
      const mediaRefs: string[] = [];
      if (can("inspect") && photos.length) for (const photo of photos) { const dataUrl = await toDataUrl(photo); const result = await upload.mutateAsync({ businessEntityId, jobCardId: job.id, fileName: photo.name, contentType: photo.type as "image/jpeg" | "image/png" | "image/webp", dataUrl }); mediaRefs.push(result.url); }
      if (can("inspect")) await createInspection.mutateAsync({ businessEntityId, jobCardId: job.id, vehicleId, templateCode: "intake", findingsJson: JSON.stringify({ complaint: form.complaint.trim(), damage: form.damage, customerSignature: form.customerSignature.trim(), technicianSignature: form.technicianSignature.trim() }), mediaRefsJson: JSON.stringify(mediaRefs), summary: "فحص استقبال أولي من نموذج أمر العمل الموحد", status: "draft" });
      for (const part of partsLines) if (can("parts") && part.warehouseId && part.productId && Number(part.quantity) > 0) await requestPart.mutateAsync({ businessEntityId, jobCardId: job.id, warehouseId: Number(part.warehouseId), productId: Number(part.productId), quantity: Number(part.quantity), idempotencyKey: workshopRequestKey("intake-part") });
      toast.success("تم إنشاء أمر العمل مع بيانات الاستقبال والتقدير والفحص الأولي.");
      reset(); onOpenChange(false); onCreated(job.id);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر إنشاء أمر العمل؛ يمكنك إعادة المحاولة بأمان."); }
  };

  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}><DialogContent dir="rtl" className="max-h-[94dvh] overflow-y-auto sm:max-w-5xl">
    <DialogHeader className="text-right sm:text-right"><DialogTitle className="flex items-center gap-2 text-xl"><FilePlus2 className="text-blue-600" /> أمر عمل جديد — نموذج موحد</DialogTitle><DialogDescription>أدخل البيانات الأساسية مرة واحدة، وسيتم إنشاء الاستقبال والأمر والتقدير والفحص الأولي وطلبات القطع بحسب الصلاحيات.</DialogDescription></DialogHeader>
    {receivedId && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">تم تسجيل الاستقبال برقم {receivedId}. جارٍ إكمال بقية دورة إنشاء الأمر بأمان.</div>}
    <form onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><UserPlus size={18} /> العميل</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex gap-2"><Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>عميل محفوظ</Button><Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>تسجيل عميل جديد</Button></div>
          {mode === "existing" ? <Field label="اختيار العميل"><select aria-label="عميل أمر العمل" className={selectClass} value={form.customerId} onChange={event => { update("customerId", event.target.value); update("vehicleId", ""); }} required><option value="">اختر العميل</option>{customers.map(item => <option key={item.id} value={item.id}>{item.nameAr} · {item.customerNo}{item.phone ? ` · ${item.phone}` : ""}</option>)}</select></Field> : <><Field label="اسم العميل"><Input value={newCustomer.nameAr} onChange={event => setNewCustomer({ ...newCustomer, nameAr: event.target.value })} required /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="الجوال"><Input value={newCustomer.phone} onChange={event => setNewCustomer({ ...newCustomer, phone: event.target.value })} /></Field><Field label="البريد"><Input type="email" value={newCustomer.email} onChange={event => setNewCustomer({ ...newCustomer, email: event.target.value })} /></Field></div><Field label="نوع العميل"><select className={selectClass} value={newCustomer.customerType} onChange={event => setNewCustomer({ ...newCustomer, customerType: event.target.value as typeof newCustomer.customerType })}><option value="individual">فرد</option><option value="corporate">شركة</option></select></Field>{newCustomer.customerType === "corporate" && <Field label="اسم الشركة"><Input value={newCustomer.companyName} onChange={event => setNewCustomer({ ...newCustomer, companyName: event.target.value })} required /></Field>}</>}
        </CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CarFront size={18} /> المركبة</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex gap-2"><Button type="button" size="sm" variant={vehicleMode === "existing" ? "default" : "outline"} onClick={() => setVehicleMode("existing")}>مركبة محفوظة</Button><Button type="button" size="sm" variant={vehicleMode === "new" ? "default" : "outline"} onClick={() => setVehicleMode("new")}>إضافة مركبة</Button></div>
          {vehicleMode === "existing" ? <Field label="سيارات العميل"><select aria-label="مركبة أمر العمل" className={selectClass} value={form.vehicleId} onChange={event => update("vehicleId", event.target.value)} disabled={!form.customerId || !customerVehicles.length} required><option value="">{!form.customerId ? "اختر العميل أولاً" : "اختر سيارة العميل"}</option>{customerVehicles.map(item => <option key={item.id} value={item.id}>{item.make} {item.model} · {item.vehicleNo}{item.plateNo ? ` · لوحة ${item.plateNo}` : ""}</option>)}</select>{form.customerId && !customerVehicles.length && <span className="mt-1 block text-xs text-amber-700">لا توجد مركبة محفوظة لهذا العميل؛ اختر إضافة مركبة.</span>}</Field> : <><Field label="رقم VIN"><Input value={newVehicle.vin} onChange={event => setNewVehicle({ ...newVehicle, vin: event.target.value })} minLength={8} required /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="بحث الشركة"><Input value={makeSearch} onChange={event => setMakeSearch(event.target.value)} placeholder="تويوتا أو Toyota" /></Field><Field label="بحث الطراز"><Input value={modelSearch} onChange={event => setModelSearch(event.target.value)} placeholder="Camry أو كامري" disabled={!newVehicle.make} /></Field></div><div className="grid gap-3 sm:grid-cols-3"><Field label="الشركة"><select className={selectClass} value={newVehicle.make} onChange={event => { setNewVehicle({ ...newVehicle, make: event.target.value, model: "" }); setModelSearch(""); }} required><option value="">اختر الشركة</option>{filteredMakes.map(item => <option key={item.key} value={item.key}>{item.label} · {item.key}</option>)}</select></Field><Field label="الطراز"><select className={selectClass} value={newVehicle.model} onChange={event => setNewVehicle({ ...newVehicle, model: event.target.value })} disabled={!newVehicle.make} required><option value="">اختر الطراز</option>{filteredModels.map(model => <option key={model} value={model}>{model}</option>)}</select></Field><Field label="نوع المركبة"><select className={selectClass} value={newVehicle.vehicleType} onChange={event => setNewVehicle({ ...newVehicle, vehicleType: event.target.value })} required><option value="">اختر النوع</option>{VEHICLE_TYPES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Field></div><div className="grid gap-3 sm:grid-cols-3"><Field label="السنة"><Input type="number" value={newVehicle.modelYear} onChange={event => setNewVehicle({ ...newVehicle, modelYear: event.target.value })} /></Field><Field label="دولة اللوحة"><select className={selectClass} value={newVehicle.plateCountry} onChange={event => setNewVehicle({ ...newVehicle, plateCountry: event.target.value as "" | PlateCountry })}><option value="">اختياري</option>{PLATE_COUNTRIES.map(country => <option key={country.key} value={country.key}>{country.label}</option>)}</select></Field><Field label="لون السيارة (اختياري)"><select className={selectClass} value={newVehicle.color} onChange={event => setNewVehicle({ ...newVehicle, color: event.target.value })}><option value="">اختر اللون</option>{VEHICLE_COLORS.map(color => <option key={color} value={color}>{color}</option>)}</select></Field></div><Field label="رقم اللوحة (اختياري)"><Input value={newVehicle.plateNo} onChange={event => setNewVehicle({ ...newVehicle, plateNo: event.target.value })} maxLength={32} placeholder="12345 أ ب" /></Field></>}
        </CardContent></Card>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Wrench size={18} /> بيانات أمر العمل</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="رقم أمر العمل"><Input value={form.jobNo} onChange={event => update("jobNo", event.target.value)} required /></Field><Field label="الأولوية"><select className={selectClass} value={form.priority} onChange={event => update("priority", event.target.value)}><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="critical">حرجة</option></select></Field>
        <Field label="تاريخ الدخول"><Input type="datetime-local" value={new Date().toISOString().slice(0, 16)} disabled /></Field><Field label="تاريخ الخروج المتوقع"><Input type="datetime-local" value={form.expectedExit} onChange={event => update("expectedExit", event.target.value)} /></Field>
        <Field label="قراءة العداد (كم)"><Input type="number" min="0" value={form.mileage} onChange={event => update("mileage", event.target.value)} required /></Field><Field label="مستوى الوقود"><Input value={form.fuel} onChange={event => update("fuel", event.target.value)} placeholder="ربع الخزان، نصف الخزان…" /></Field>
        <div className="sm:col-span-2"><Field label="وصف العطل وطلب العميل"><Textarea value={form.complaint} onChange={event => update("complaint", event.target.value)} maxLength={2000} className="min-h-24" required /></Field></div><div className="sm:col-span-2"><Field label="الأضرار الظاهرة وملاحظات الاستقبال"><Textarea value={form.damage} onChange={event => update("damage", event.target.value)} maxLength={2000} /></Field></div>
      </CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">التقدير المالي الأولي</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Field label="قيمة عمل اليد"><Input type="number" min="0" step="0.01" value={form.labor} onChange={event => update("labor", event.target.value)} /></Field><Field label="تقدير قطع الغيار"><Input type="number" min="0" step="0.01" value={form.parts} onChange={event => update("parts", event.target.value)} /></Field><Field label="الضريبة"><Input type="number" min="0" step="0.01" value={form.tax} onChange={event => update("tax", event.target.value)} /></Field><Field label="الخصم"><Input type="number" min="0" step="0.01" value={form.discount} onChange={event => update("discount", event.target.value)} /></Field></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><PackageCheck size={18} /> احتياجات قطع الغيار</CardTitle></CardHeader><CardContent className="space-y-3">{partsLines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_auto]"><select className={selectClass} value={line.warehouseId} onChange={event => setPartsLines(rows => rows.map((row, i) => i === index ? { ...row, warehouseId: event.target.value } : row))}><option value="">المستودع</option>{warehouses.map(item => <option key={item.id} value={item.id}>{item.nameAr} · {item.warehouseCode}</option>)}</select><select className={selectClass} value={line.productId} onChange={event => setPartsLines(rows => rows.map((row, i) => i === index ? { ...row, productId: event.target.value } : row))}><option value="">القطعة</option>{products.map(item => <option key={item.id} value={item.id}>{item.nameAr} · {item.sku}</option>)}</select><Input type="number" min="1" value={line.quantity} onChange={event => setPartsLines(rows => rows.map((row, i) => i === index ? { ...row, quantity: event.target.value } : row))} /><Button type="button" variant="ghost" onClick={() => setPartsLines(rows => rows.filter((_, i) => i !== index))}>حذف</Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setPartsLines(rows => [...rows, { warehouseId: "", productId: "", quantity: "1" }])}>إضافة قطعة مطلوبة</Button><p className="text-xs leading-6 text-slate-500">ستُحجز القطع بعد إنشاء الأمر إذا كانت الكمية متوفرة وصلاحية القطع مفعلة.</p></CardContent></Card>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ImagePlus size={18} /> الصور والتوقيعات</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="صور الأعطال"><Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => setPhotos(Array.from(event.target.files ?? []).slice(0, 8))} /><p className="mt-1 text-xs text-slate-500">حتى 8 صور، وسيتم رفعها إلى التخزين الآمن وربطها بالفحص الأولي.</p>{photos.length > 0 && <Badge variant="outline">تم اختيار {photos.length} صورة</Badge>}</Field><div className="grid gap-3 sm:grid-cols-2"><Field label="توقيع العميل بالاسم (إقرار استلام الطلب)" ><Input value={form.customerSignature} onChange={event => update("customerSignature", event.target.value)} placeholder="اكتب اسم العميل كما يقر به" required /></Field><Field label="توقيع الفني بالاسم"><Input value={form.technicianSignature} onChange={event => update("technicianSignature", event.target.value)} placeholder="اكتب اسم الفني" required /></Field></div><div className="grid gap-3 sm:grid-cols-2"><label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm leading-6"><Checkbox checked={form.customerConsent} onCheckedChange={checked => update("customerConsent", checked === true)} /><span>أقر بأن العميل وافق على الفحص وتسجيل بيانات المركبة والتقدير الأولي.</span></label><label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm leading-6"><Checkbox checked={form.technicianConsent} onCheckedChange={checked => update("technicianConsent", checked === true)} /><span>أقر بأن الفني راجع بيانات العطل والصور الأولية قبل بدء التشخيص.</span></label></div></CardContent></Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs leading-6 text-slate-500">ستنتقل الحالة بعد الحفظ إلى مرحلة الاستقبال، ثم تستكمل مراحل التشخيص والتقدير والموافقة والإصلاح والجودة والتسليم من لوحة الأمر.</p><Button type="submit" className="h-11 min-w-52" disabled={!valid || busy}>{busy ? "جارٍ إنشاء دورة أمر العمل…" : <><CheckCircle2 size={17} className="ml-2" /> حفظ وفتح أمر العمل</>}</Button></div>
    </form>
  </DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <Label className="block text-sm font-medium text-slate-700">{label}{children}</Label>; }
