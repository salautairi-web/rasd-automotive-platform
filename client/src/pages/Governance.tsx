import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeftRight, CheckCheck, Database, FileWarning, Link2 } from "lucide-react";

const money = (value: number) => new Intl.NumberFormat("ar-OM", {
  style: "currency",
  currency: "OMR",
  maximumFractionDigits: 0,
}).format(value / 1000);

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_approval: "بانتظار الموافقة",
  approved: "معتمدة",
  sent: "مرسلة",
  accepted: "مقبولة",
  posted: "مسجلة",
  partially_matched: "مطابقة جزئية",
  matched: "مطابقة",
  settled: "مسوّاة",
  disputed: "نزاع",
  cancelled: "ملغاة",
};

export default function Governance() {
  const { data, isLoading, isError } = trpc.governance.dashboard.useQuery(undefined, { retry: false });
  const cards = [
    { label: "السجل المرجعي", value: data?.references ?? 0, icon: Database, tone: "bg-blue-50 text-blue-700" },
    { label: "معاملات مفتوحة", value: data?.openTransactions ?? 0, icon: ArrowLeftRight, tone: "bg-violet-50 text-violet-700" },
    { label: "موافقات معلقة", value: data?.pendingApprovals ?? 0, icon: CheckCheck, tone: "bg-amber-50 text-amber-700" },
    { label: "حالات تكرار", value: data?.duplicates ?? 0, icon: Link2, tone: "bg-rose-50 text-rose-700" },
  ];

  return (
    <DashboardLayout>
      <div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <Badge className="mb-3 border-0 bg-blue-50 text-[#1e5eff]">Governance · Inter-Entity Engine</Badge>
          <h1 className="text-3xl font-semibold">حوكمة البيانات والمعاملات البينية</h1>
          <p className="mt-2 text-sm text-slate-500">سجل مرجعي وعمليات موثقة بين الكيانات دون مشاركة قواعدها التشغيلية.</p>

          {isError ? (
            <Card className="mt-6 border-rose-200 bg-rose-50"><CardContent className="p-6">تتطلب هذه المساحة صلاحية حوكمة مركزية.</CardContent></Card>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, tone }) => (
                  <Card key={label} className="border-0 shadow-[0_10px_35px_rgba(19,36,55,.06)]">
                    <CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{isLoading ? "—" : value}</p></div><div className={`rounded-2xl p-3 ${tone}`}><Icon size={19} /></div></div></CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_.5fr]">
                <Card className="border-0">
                  <CardHeader><CardTitle>المعاملات الأخيرة</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(data?.transactions ?? []).map(transaction => (
                      <div key={transaction.id} className="grid gap-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <div><p className="font-medium">{transaction.transactionNo}</p><p className="text-xs text-slate-500">كيان {transaction.sourceEntityId} ← كيان {transaction.targetEntityId}</p></div>
                        <Badge variant="outline">{statusLabels[transaction.status] ?? transaction.status}</Badge>
                        <strong>{money(transaction.outstandingMinor)}</strong>
                      </div>
                    ))}
                    {!data?.transactions.length && <p className="p-8 text-center text-sm text-slate-500">لا توجد معاملات بين الكيانات بعد.</p>}
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardHeader><CardTitle className="flex items-center gap-2"><FileWarning size={19} />الاستثناءات</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between"><span>غير مطابقة</span><strong>{data?.unmatched ?? 0}</strong></div>
                    <div className="flex justify-between"><span>نزاعات مفتوحة</span><strong>{data?.disputes ?? 0}</strong></div>
                    <div className="flex justify-between"><span>سياسات نشطة</span><strong>{data?.policies ?? 0}</strong></div>
                    <div className="rounded-xl bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800"><AlertTriangle size={17} /><span>رصيد بيني قائم</span></div><strong className="mt-2 block text-lg">{money(data?.outstandingMinor ?? 0)}</strong></div>
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
