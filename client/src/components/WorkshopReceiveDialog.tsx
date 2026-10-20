import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  workshopRequestKey,
  validWorkshopInteger,
} from "../../../shared/workshopClient";

type Customer = { id: number; nameAr: string; customerNo: string };
type Vehicle = { id: number; make: string; model: string; vehicleNo: string };
const newForm = () => ({
  customerId: "",
  vehicleId: "",
  mileage: "",
  complaint: "",
  fuel: "",
  damage: "",
  consent: false,
  jobNo: `WS-${Date.now().toString(36).toUpperCase()}-${workshopRequestKey("number").slice(-6).toUpperCase()}`,
  priority: "normal" as "normal" | "low" | "high" | "critical",
  checkinKey: workshopRequestKey("checkin"),
  jobKey: workshopRequestKey("job"),
});
const selectClass =
  "mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

export default function WorkshopReceiveDialog({
  businessEntityId,
  branchId,
  customers,
  vehicles,
  open,
  onOpenChange,
  onCreated,
}: {
  businessEntityId: number;
  branchId?: number;
  customers: Customer[];
  vehicles: Vehicle[];
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onCreated: (id: number) => void;
}) {
  const [form, setForm] = useState(newForm);
  const [receivedId, setReceivedId] = useState<number | null>(null);
  const receive = trpc.workshop59.createCheckin.useMutation();
  const createJob = trpc.workshop59.openJobCard.useMutation();
  const busy = receive.isPending || createJob.isPending;
  const valid = Boolean(
    form.customerId &&
      form.vehicleId &&
      validWorkshopInteger(form.mileage) &&
      form.complaint.trim().length >= 3 &&
      form.consent &&
      form.jobNo.trim().length >= 3
  );
  const submit = async () => {
    if (!valid || busy) return;
    try {
      let id = receivedId;
      if (!id) {
        const row = await receive.mutateAsync({
          businessEntityId,
          branchId,
          customerId: Number(form.customerId),
          vehicleId: Number(form.vehicleId),
          mileage: Number(form.mileage),
          fuelLevel: form.fuel || undefined,
          complaint: form.complaint.trim(),
          consent: true,
          existingDamageJson: JSON.stringify({ notes: form.damage }),
          idempotencyKey: form.checkinKey,
        });
        id = row.id;
        setReceivedId(id);
      }
      const job = await createJob.mutateAsync({
        businessEntityId,
        branchId,
        customerId: Number(form.customerId),
        vehicleId: Number(form.vehicleId),
        checkinId: id,
        jobNo: form.jobNo.trim(),
        priority: form.priority,
        idempotencyKey: form.jobKey,
      });
      toast.success("تم تسجيل الاستقبال وفتح أمر العمل.");
      setForm(newForm());
      setReceivedId(null);
      onOpenChange(false);
      onCreated(job.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تسجيل الاستقبال؛ يمكنك إعادة المحاولة دون إنشاء سجل مكرر."
      );
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        dir="rtl"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="pl-6">استقبال مركبة وفتح أمر عمل</DialogTitle>
          <DialogDescription>
            اختر بيانات فعلية وسجّل موافقة العميل؛ لا تُستخدم معرفات افتراضية.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
            void submit();
          }}
        >
          {receivedId && (
            <div
              role="status"
              className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-800"
            >
              تم حفظ الاستقبال. أكمل فتح أمر العمل أو أعد المحاولة؛ بيانات
              الاستقبال مقفلة لمنع تكراره أو ربطه بمركبة مختلفة.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              العميل
              <select
                aria-label="عميل الاستقبال"
                className={selectClass}
                disabled={busy || Boolean(receivedId)}
                value={form.customerId}
                onChange={e =>
                  setForm(v => ({ ...v, customerId: e.target.value }))
                }
                required
              >
                <option value="">اختر العميل</option>
                {customers.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr} · {item.customerNo}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              المركبة
              <select
                aria-label="مركبة الاستقبال"
                className={selectClass}
                disabled={busy || Boolean(receivedId)}
                value={form.vehicleId}
                onChange={e =>
                  setForm(v => ({ ...v, vehicleId: e.target.value }))
                }
                required
              >
                <option value="">اختر المركبة</option>
                {vehicles.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.make} {item.model} · {item.vehicleNo}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              قراءة العداد (كم)
              <Input
                aria-label="عداد الاستقبال"
                type="number"
                min="0"
                step="1"
                value={form.mileage}
                disabled={busy || Boolean(receivedId)}
                onChange={e =>
                  setForm(v => ({ ...v, mileage: e.target.value }))
                }
                className="mt-1 h-11"
                required
              />
            </label>
            <label className="text-sm">
              مستوى الوقود
              <Input
                aria-label="وقود الاستقبال"
                value={form.fuel}
                maxLength={40}
                disabled={busy || Boolean(receivedId)}
                onChange={e => setForm(v => ({ ...v, fuel: e.target.value }))}
                className="mt-1 h-11"
                placeholder="ربع الخزان، نصف الخزان…"
              />
            </label>
            <label className="text-sm">
              رقم أمر العمل
              <Input
                aria-label="رقم أمر العمل الجديد"
                value={form.jobNo}
                maxLength={100}
                disabled={busy}
                onChange={e => setForm(v => ({ ...v, jobNo: e.target.value }))}
                className="mt-1 h-11"
                required
              />
            </label>
            <label className="text-sm">
              الأولوية
              <select
                aria-label="أولوية أمر العمل"
                className={selectClass}
                disabled={busy}
                value={form.priority}
                onChange={e =>
                  setForm(v => ({
                    ...v,
                    priority: e.target.value as typeof v.priority,
                  }))
                }
              >
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            شكوى العميل
            <Textarea
              aria-label="شكوى العميل"
              value={form.complaint}
              disabled={busy || Boolean(receivedId)}
              maxLength={2000}
              onChange={e =>
                setForm(v => ({ ...v, complaint: e.target.value }))
              }
              className="mt-1"
              required
            />
          </label>
          <label className="block text-sm">
            الأضرار الظاهرة والملاحظات
            <Textarea
              aria-label="أضرار الاستقبال"
              value={form.damage}
              disabled={busy || Boolean(receivedId)}
              maxLength={1000}
              onChange={e => setForm(v => ({ ...v, damage: e.target.value }))}
              className="mt-1"
            />
          </label>
          <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm leading-6">
            <Checkbox
              aria-label="تأكيد موافقة العميل على الفحص"
              checked={form.consent}
              disabled={busy || Boolean(receivedId)}
              onCheckedChange={checked =>
                setForm(v => ({ ...v, consent: checked === true }))
              }
              className="mt-1"
            />
            <span>
              أؤكد حصول الورشة على موافقة العميل للفحص وتسجيل بيانات المركبة.
            </span>
          </label>
          {(!customers.length || !vehicles.length) && (
            <p role="alert" className="text-sm text-amber-700">
              أضف العميل والمركبة في البيانات الرئيسية أولاً ثم حدّث بيانات
              الورشة.
            </p>
          )}
          <Button
            type="submit"
            className="w-full h-11"
            disabled={!valid || busy}
          >
            {busy
              ? receive.isPending
                ? "جارٍ تسجيل الاستقبال…"
                : "جارٍ فتح الأمر…"
              : receivedId
                ? "متابعة فتح أمر العمل"
                : "تسجيل الاستقبال وفتح الأمر"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
