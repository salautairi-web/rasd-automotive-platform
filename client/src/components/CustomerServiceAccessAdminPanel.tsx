import { useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { customerServices } from "../../../shared/customerServices";

const labelFor = (key: string) =>
  customerServices.find(service => service.key === key)?.title ?? key;

export default function CustomerServiceAccessAdminPanel() {
  const utils = trpc.useUtils();
  const requests = trpc.adminControl.customerServiceAccessRequests.useQuery(
    { status: "pending" },
    { refetchInterval: 30000 }
  );
  const [notes, setNotes] = useState<Record<number, string>>({});
  const review = trpc.adminControl.reviewCustomerServiceAccessRequest.useMutation({
    onSuccess: () => {
      void utils.adminControl.customerServiceAccessRequests.invalidate();
    },
  });

  return (
    <Card className="mt-5 border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 size={18} className="text-amber-600" />
          طلبات تفعيل خدمات العملاء
        </CardTitle>
        <p className="text-xs leading-6 text-slate-500">
          يرسل العميل طلباً رسمياً لإضافة كيان جديد، ولا تُنشأ العلاقة إلا بعد
          اعتماد الإدارة.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.isLoading && <p className="text-sm text-slate-500">جارٍ تحميل الطلبات…</p>}
        {requests.data?.map(request => {
          let services: string[] = [];
          try {
            services = JSON.parse(request.requestedServicesJson) as string[];
          } catch {
            services = [];
          }
          const note = notes[request.id] ?? "";
          return (
            <div key={request.id} className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.userName ?? "عميل بدون اسم"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.userEmail ?? "بدون بريد"} · طلب إضافة {request.targetEntityName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {services.map(service => (
                      <span key={service} className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-600">
                        {labelFor(service)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">بانتظار المراجعة</span>
              </div>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-600">{request.requesterNote}</p>
              <Textarea
                className="mt-3 bg-white"
                value={note}
                onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))}
                placeholder="ملاحظة القرار للعميل"
                maxLength={1000}
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={review.isPending || note.trim().length < 3}
                  onClick={() => review.mutate({ requestId: request.id, decision: "approve", reviewNote: note.trim() })}
                >
                  <Check size={15} /> اعتماد وإضافة الكيان
                </Button>
                <Button
                  variant="outline"
                  className="text-rose-700"
                  disabled={review.isPending || note.trim().length < 3}
                  onClick={() => review.mutate({ requestId: request.id, decision: "reject", reviewNote: note.trim() })}
                >
                  <X size={15} /> رفض الطلب
                </Button>
              </div>
            </div>
          );
        })}
        {!requests.isLoading && !requests.data?.length && (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">لا توجد طلبات تفعيل جديدة.</p>
        )}
        {review.error && <p role="alert" className="text-sm text-rose-700">{review.error.message}</p>}
      </CardContent>
    </Card>
  );
}
