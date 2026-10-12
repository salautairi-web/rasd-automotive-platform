import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CarFront, Package, Wrench, ArrowLeft, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  customerServices,
  type CustomerServiceKey,
} from "../../../shared/customerServices";

export default function CustomerServiceRequests({
  scope,
}: {
  scope: {
    businessEntityId: number;
    relationshipId: number;
    entityName: string;
  };
}) {
  const [serviceKey, setServiceKey] = useState<CustomerServiceKey | null>(null);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [error, setError] = useState("");
  const [lastReference, setLastReference] = useState("");
  const utils = trpc.useUtils();
  const request = trpc.customerServices.request.useMutation({
    onSuccess: result => {
      setLastReference(result.reference);
      setServiceKey(null);
      setSubject("");
      setDetails("");
      setPreferredDate("");
      setError("");
      toast.success(`تم إرسال الطلب ${result.reference} لمراجعة الفريق.`);
      void utils.portalV2.dashboard.invalidate({
        businessEntityId: scope.businessEntityId,
        relationshipId: scope.relationshipId,
      });
    },
    onError: e => setError(e.message),
  });
  const selected = customerServices.find(item => item.key === serviceKey);
  const open = (key: CustomerServiceKey) => {
    const service = customerServices.find(s => s.key === key)!;
    setServiceKey(key);
    setSubject(service.title);
    setDetails("");
    setPreferredDate("");
    setRequestKey(crypto.randomUUID());
    setError("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!serviceKey) return;
    request.mutate({
      businessEntityId: scope.businessEntityId,
      relationshipId: scope.relationshipId,
      service: serviceKey,
      subject,
      details,
      preferredDate: preferredDate || undefined,
      idempotencyKey: requestKey,
    });
  };
  return (
    <section aria-label="خدمات الشركة" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">كيف نخدمك اليوم؟</h2>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            طلباتك ضمن {scope.entityName} فقط؛ التأكيد النهائي بعد مراجعة فريق
            الشركة.
          </p>
        </div>
        {lastReference && (
          <p role="status" className="text-xs text-emerald-700">
            آخر طلب: {lastReference}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {customerServices.map(service => {
          const Icon =
            service.icon === "wrench"
              ? Wrench
              : service.icon === "parts"
                ? Package
                : CarFront;
          return (
            <Card key={service.key} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <span className="inline-flex rounded-xl bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={20} />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{service.title}</h3>
                <p className="mt-2 min-h-12 text-xs leading-6 text-slate-500">
                  {service.description}
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-between text-blue-700"
                  onClick={() => open(service.key)}
                >
                  طلب الخدمة
                  <ArrowLeft size={15} />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog
        open={serviceKey !== null}
        onOpenChange={value => {
          if (!value && !request.isPending) {
            setServiceKey(null);
            setError("");
          }
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader className="text-right">
            <DialogTitle>{selected?.title ?? "طلب خدمة"}</DialogTitle>
            <DialogDescription>
              سيحفظ الطلب في علاقتك الحالية مع {scope.entityName}. ليس حجزاً
              نهائياً ولا دفعاً.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
              >
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="service-subject">موضوع طلب الخدمة</Label>
              <Input
                id="service-subject"
                className="mt-2"
                required
                minLength={3}
                maxLength={180}
                value={subject}
                disabled={request.isPending}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="service-details">التفاصيل والمواصفات</Label>
              <Textarea
                id="service-details"
                className="mt-2"
                required
                minLength={5}
                maxLength={5000}
                rows={4}
                value={details}
                disabled={request.isPending}
                onChange={e => setDetails(e.target.value)}
                placeholder="معلومات المركبة، نوع الخدمة أو القطعة، وأي ملاحظات لفريق الشركة"
              />
            </div>
            {selected?.kind === "reservation" && (
              <div>
                <Label htmlFor="service-preferred-date">
                  التاريخ المفضل — اختياري
                </Label>
                <Input
                  id="service-preferred-date"
                  type="date"
                  dir="ltr"
                  className="mt-2"
                  value={preferredDate}
                  disabled={request.isPending}
                  onChange={e => setPreferredDate(e.target.value)}
                />
              </div>
            )}
            <Button
              className="w-full"
              disabled={
                request.isPending ||
                subject.trim().length < 3 ||
                details.trim().length < 5
              }
            >
              <Send size={16} />
              {request.isPending ? "جارٍ إرسال الطلب…" : "إرسال طلب الخدمة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
