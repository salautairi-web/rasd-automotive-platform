import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Camera, CheckCircle2, ClipboardCheck, Cloud, CloudOff, PackageCheck, Printer, RefreshCw, ScanLine, Send, Truck, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "receive" | "issue" | "transfer" | "count";
type Tracking = "none" | "batch" | "serial";
type ScanTone = "idle" | "success" | "error";
type PendingOperation = {
  localOperationId: string;
  operationType: Mode;
  payload: Record<string, unknown>;
  occurredAt: string;
  idempotencyKey: string;
};
type Detector = new (options?: { formats: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

const queueKey = "rasd.inventory.offline.queue.56";
const operationLabels: Record<Mode, { title: string; description: string }> = {
  receive: { title: "استلام وارد", description: "سجّل الكمية المستلمة والفحص ومصدر الشحنة قبل الإيداع." },
  issue: { title: "صرف من المخزون", description: "تحقق من الكمية المتاحة قبل إصدار الصنف لمصدر العمل." },
  transfer: { title: "تحويل مستودعي", description: "أنشئ تحويلاً داخلياً أو ابدأ طلب تحويل بين كيانين." },
  count: { title: "جرد فعلي", description: "أدخل الكمية المعدودة وأرسلها للمراجعة قبل التسوية." },
};
const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function InventoryOperations56() {
  const [mode, setMode] = useState<Mode>("receive");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [entity, setEntity] = useState(1);
  const [warehouse, setWarehouse] = useState(1);
  const [targetEntity, setTargetEntity] = useState(1);
  const [targetWarehouse, setTargetWarehouse] = useState(2);
  const [productId, setProductId] = useState(0);
  const [scanValue, setScanValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [countedQty, setCountedQty] = useState(0);
  const [sourceRef, setSourceRef] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [tracking, setTracking] = useState<Tracking>("none");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pending, setPending] = useState<PendingOperation[]>([]);
  const [status, setStatus] = useState<{ tone: ScanTone; text: string }>({ tone: "idle", text: "جاهز للمسح أو الإدخال اليدوي." });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const catalog = trpc.inventory56.catalogLookup.useQuery(
    { businessEntityId: entity, code: scanValue || "_" },
    { enabled: Boolean(scanValue) },
  );
  const variances = trpc.inventory56.varianceReport.useQuery({ businessEntityId: entity });
  const receive = trpc.inventory56.receive.useMutation();
  const issue = trpc.inventory56.issue.useMutation();
  const transfer = trpc.inventory56.createTransfer.useMutation();
  const interTransfer = trpc.inventory56.createInterEntityTransfer.useMutation();
  const count = trpc.inventory56.createCount.useMutation();
  const queueOffline = trpc.inventory56.queueOffline.useMutation();
  const syncOffline = trpc.inventory56.syncOffline.useMutation();
  const trace = trpc.inventory56.recordTrace.useMutation();
  const approveVariance = trpc.inventory56.approveVariance.useMutation();
  const busy = receive.isPending || issue.isPending || transfer.isPending || interTransfer.isPending || count.isPending;

  useEffect(() => {
    try {
      setPending(JSON.parse(localStorage.getItem(queueKey) || "[]") as PendingOperation[]);
    } catch {
      setPending([]);
    }
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!catalog.data?.product) return;
    const product = catalog.data.product;
    setProductId(product.id);
    setTracking(product.serialTracking ? "serial" : product.batchTracking ? "batch" : "none");
    setStatus({ tone: "success", text: `تم التعرف على ${product.nameAr} — ${product.sku}.` });
  }, [catalog.data]);

  const savePending = (next: PendingOperation[]) => {
    setPending(next);
    localStorage.setItem(queueKey, JSON.stringify(next));
  };
  const releaseCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };
  useEffect(() => () => releaseCamera(), []);

  const applyCatalog = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setScanValue(code);
    setStatus({ tone: "idle", text: online ? "جارٍ البحث في كتالوج الكيان..." : "حُفظ الرمز للتحقق عند عودة الاتصال." });
  };

  const startCamera = async () => {
    const DetectorClass = (window as Window & { BarcodeDetector?: Detector }).BarcodeDetector;
    if (!DetectorClass) {
      setStatus({ tone: "error", text: "المتصفح لا يدعم المسح المباشر؛ استخدم الإدخال اليدوي." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new DetectorClass({ formats: ["qr_code", "code_128", "ean_13", "ean_8"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            applyCatalog(codes[0].rawValue);
            releaseCamera();
            return;
          }
        } catch {
          // A frame can be unavailable briefly while autofocus is settling.
        }
        requestAnimationFrame(() => void scan());
      };
      requestAnimationFrame(() => void scan());
    } catch {
      setStatus({ tone: "error", text: "تعذر تشغيل الكاميرا. تحقق من الإذن أو استخدم الإدخال اليدوي." });
    }
  };

  const operationPayload = (): PendingOperation => {
    const idempotencyKey = `inventory56-${makeKey()}`;
    let payload: Record<string, unknown>;
    if (mode === "receive") {
      payload = { businessEntityId: entity, warehouseId: warehouse, productId, quantity, acceptedQuantity: quantity, rejectedQuantity: 0, inspectionStatus: "accepted", sourceRef: sourceRef || "MANUAL-RECEIPT", idempotencyKey };
    } else if (mode === "issue") {
      payload = { businessEntityId: entity, warehouseId: warehouse, productId, quantity, sourceType: "manual_issue", sourceId: sourceRef || "MANUAL-ISSUE", idempotencyKey };
    } else if (mode === "transfer") {
      payload = { sourceEntityId: entity, targetEntity, sourceWarehouseId: warehouse, targetWarehouse, productId, quantity, unitValueMinor: 0, currency: "SAR", transferType: entity === targetEntity ? "internal" : "inter_entity_transfer", idempotencyKey };
    } else {
      payload = { businessEntityId: entity, warehouseId: warehouse, countType: "cycle", lines: [{ productId, systemQty: quantity, countedQty, unitCostMinor: 0 }] };
    }
    return { localOperationId: makeKey(), operationType: mode, payload: { ...payload, tracking, batchNo, serialNo }, occurredAt: new Date().toISOString(), idempotencyKey };
  };

  const executeOperation = async (operation: PendingOperation) => {
    const payload = { ...operation.payload } as Record<string, any>;
    const operationTracking = payload.tracking as Tracking;
    const operationBatch = payload.batchNo as string;
    const operationSerial = payload.serialNo as string;
    delete payload.tracking;
    delete payload.batchNo;
    delete payload.serialNo;
    let operationId = 0;
    if (operation.operationType === "receive") operationId = (await receive.mutateAsync(payload as any)).receiptId;
    if (operation.operationType === "issue") operationId = (await issue.mutateAsync(payload as any)).issueId;
    if (operation.operationType === "transfer") {
      const result = payload.sourceEntityId === payload.targetEntityId ? await transfer.mutateAsync(payload as any) : await interTransfer.mutateAsync(payload as any);
      operationId = result.transferId;
    }
    if (operation.operationType === "count") operationId = (await count.mutateAsync(payload as any)).countId;
    if (operationTracking !== "none" && (operationBatch || operationSerial)) {
      await trace.mutateAsync({ businessEntityId: Number(payload.businessEntityId || payload.sourceEntityId), operationType: operation.operationType, operationId, productId: Number(payload.productId), batchNo: operationBatch || undefined, serialNo: operationSerial || undefined, quantity: Number(payload.quantity || payload.lines?.[0]?.countedQty || 0), tracking: operationTracking });
    }
    const queued = await queueOffline.mutateAsync({ businessEntityId: Number(payload.businessEntityId || payload.sourceEntityId), deviceId: `browser-${navigator.userAgent.slice(0, 20)}`, localOperationId: operation.localOperationId, operationType: operation.operationType, payloadJson: JSON.stringify(operation.payload), occurredAt: new Date(operation.occurredAt), idempotencyKey: operation.idempotencyKey });
    await syncOffline.mutateAsync({ businessEntityId: Number(payload.businessEntityId || payload.sourceEntityId), queueId: queued.queueId, status: "synced" });
  };

  const syncPending = async () => {
    if (!navigator.onLine || pending.length === 0) return;
    const remaining: PendingOperation[] = [];
    for (const operation of pending) {
      try {
        await executeOperation(operation);
      } catch (error) {
        remaining.push(operation);
        setStatus({ tone: "error", text: `تعذرت مزامنة حركة ${operation.operationType}: ${(error as Error).message}` });
      }
    }
    savePending(remaining);
    if (remaining.length === 0) setStatus({ tone: "success", text: "تمت مزامنة جميع حركات الجهاز تلقائياً." });
  };
  useEffect(() => { if (online) void syncPending(); }, [online]);

  const submit = async () => {
    const invalid = !productId || quantity <= 0 || (mode === "count" && countedQty < 0) || (mode === "transfer" && warehouse === targetWarehouse && entity === targetEntity) || (tracking === "batch" && !batchNo) || (tracking === "serial" && !serialNo);
    if (invalid) {
      setStatus({ tone: "error", text: "راجع الصنف والكمية والهدف ومتطلبات الدفعة أو الرقم التسلسلي." });
      return;
    }
    const operation = operationPayload();
    if (!online) {
      savePending([...pending, operation]);
      setStatus({ tone: "idle", text: "لا يوجد اتصال. حُفظت الحركة محلياً وستُزامن تلقائياً عند عودة الاتصال." });
      return;
    }
    try {
      await executeOperation(operation);
      setStatus({ tone: "success", text: "تم تسجيل الحركة ومزامنة أثرها بنجاح." });
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    }
  };

  const printLabel = async (type: "barcode" | "qr") => {
    if (!productId) {
      setStatus({ tone: "error", text: "أدخل أو امسح صنفاً قبل طباعة الملصق." });
      return;
    }
    const value = scanValue || serialNo || batchNo || `SKU-${productId}`;
    const qr = await QRCode.toDataURL(value, { width: 220, margin: 1 });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, value, { format: "CODE128", displayValue: true, width: 2, height: 58, margin: 8 });
    const visual = type === "qr" ? `<img src="${qr}" alt="QR"/>` : svg.outerHTML;
    const printWindow = window.open("", "_blank", "width=520,height=520");
    if (!printWindow) return;
    printWindow.document.write(`<html dir="rtl"><head><title>ملصق المخزون</title><style>body{font-family:Arial;text-align:center;padding:24px}.label{border:1px dashed #334155;padding:18px;width:260px;margin:auto}img,svg{max-width:220px}small{display:block;margin-top:10px}</style></head><body><div class="label"><h3>RASD · ملصق مخزون</h3>${visual}<small>الكيان ${entity} · المستودع ${warehouse}<br/>الصنف ${productId}${batchNo ? ` · الدفعة ${batchNo}` : ""}${serialNo ? ` · الرقم ${serialNo}` : ""}</small></div><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
    setStatus({ tone: "success", text: `تم تجهيز ملصق ${type === "qr" ? "QR" : "Barcode"} للطباعة.` });
  };

  const statusClass = status.tone === "success" ? "bg-emerald-50 text-emerald-800" : status.tone === "error" ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-600";
  return (
    <DashboardLayout>
      <div dir="rtl" className="-m-4 min-h-screen bg-[#f7f9fc] p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 border-0 bg-blue-50 text-blue-700">Inventory Operations · Offline Ready</Badge>
              <h1 className="text-3xl font-semibold">تشغيل المخزون الذكي</h1>
              <p className="mt-2 text-sm text-slate-500">حركات المستودع، كتالوج الأصناف، التتبع، الملصقات، ومراجعة فروقات الجرد.</p>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
              {online ? <Cloud size={16} /> : <CloudOff size={16} />} {online ? "متصل" : "دون اتصال"} · {pending.length} بانتظار المزامنة
            </div>
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                  <span>{operationLabels[mode].title}</span>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(operationLabels) as Mode[]).map((item) => <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>{operationLabels[item].title}</Button>)}
                  </div>
                </CardTitle>
                <p className="text-sm text-slate-500">{operationLabels[mode].description}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="معرف الكيان" value={entity} onChange={(value) => setEntity(Number(value))} />
                  <Field label="المستودع" value={warehouse} onChange={(value) => setWarehouse(Number(value))} />
                  <Field label="معرف الصنف" value={productId} onChange={(value) => setProductId(Number(value))} />
                  <Field label="الكمية النظامية" value={quantity} onChange={(value) => setQuantity(Number(value))} />
                </div>
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-semibold">كتالوج Barcode وQR</p><p className="mt-1 text-xs text-slate-500">المسح يبحث داخل كتالوج الكيان ويجلب سياسة الدفعة والرقم التسلسلي.</p></div>
                    <Button variant="outline" onClick={cameraOpen ? releaseCamera : startCamera}><Camera className="ml-2" size={16} />{cameraOpen ? "إيقاف الكاميرا" : "فتح الكاميرا"}</Button>
                  </div>
                  <div className="mt-3 flex gap-2"><Input value={scanValue} onChange={(event) => setScanValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyCatalog(scanValue); }} placeholder="امسح أو اكتب SKU / Barcode / QR ثم Enter" /><Button variant="secondary" onClick={() => applyCatalog(scanValue)}><ScanLine className="ml-2" size={16} />بحث</Button></div>
                  {cameraOpen && <video ref={videoRef} className="mt-3 h-44 w-full rounded-xl bg-slate-900 object-cover" muted playsInline />}
                  {catalog.data?.product && <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">{catalog.data.product.nameAr} · {catalog.data.product.sku} · تتبع {tracking === "serial" ? "تسلسلي" : tracking === "batch" ? "دفعات" : "غير مطلوب"}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-3"><Field label="الدفعة" value={batchNo} text onChange={(value) => setBatchNo(String(value))} /><Field label="الرقم التسلسلي" value={serialNo} text onChange={(value) => setSerialNo(String(value))} /><SelectField label="سياسة التتبع" value={tracking} onChange={(value) => setTracking(value as Tracking)} options={[{ value: "none", label: "بدون" }, { value: "batch", label: "دفعة" }, { value: "serial", label: "تسلسلي" }]} /></div>
                {mode === "transfer" && <div className="grid gap-4 sm:grid-cols-2"><Field label="الكيان الهدف" value={targetEntity} onChange={(value) => setTargetEntity(Number(value))} /><Field label="المستودع الهدف" value={targetWarehouse} onChange={(value) => setTargetWarehouse(Number(value))} /></div>}
                {mode === "count" && <Field label="الكمية المعدودة" value={countedQty} onChange={(value) => setCountedQty(Number(value))} />}
                {mode !== "count" && <Field label="مرجع المصدر" value={sourceRef} text onChange={(value) => setSourceRef(String(value))} />}
                <div className="flex flex-wrap gap-2"><Button onClick={() => void submit()} disabled={busy}><Send className="ml-2" size={16} />{busy ? "جارٍ الحفظ..." : "حفظ الحركة"}</Button><Button variant="outline" onClick={() => void syncPending()} disabled={!online || pending.length === 0}><RefreshCw className="ml-2" size={16} />مزامنة الآن</Button><Button variant="outline" onClick={() => void printLabel("barcode")}><Printer className="ml-2" size={16} />طباعة Barcode</Button><Button variant="outline" onClick={() => void printLabel("qr")}><Printer className="ml-2" size={16} />طباعة QR</Button></div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="border-0"><CardHeader><CardTitle>حالة التحقق والمزامنة</CardTitle></CardHeader><CardContent><div className={`rounded-xl p-4 text-sm ${statusClass}`}>{status.tone === "success" ? <CheckCircle2 className="mb-2" size={20} /> : status.tone === "error" ? <XCircle className="mb-2" size={20} /> : <ScanLine className="mb-2" size={20} />}<p>{status.text}</p></div></CardContent></Card>
              <Card className="border-0"><CardHeader><CardTitle>فروقات الجرد</CardTitle></CardHeader><CardContent className="space-y-3">{(variances.data || []).length === 0 ? <p className="text-sm text-slate-500">لا توجد فروقات ضمن الكيان الحالي.</p> : (variances.data || []).map((variance) => <div key={variance.id} className="rounded-xl border p-3 text-sm"><div className="flex items-center justify-between"><b>صنف #{variance.productId}</b><Badge variant="outline">{variance.status}</Badge></div><p className="mt-2 text-slate-500">فرق الكمية: {variance.varianceQty} · القيمة: {variance.varianceValueMinor} هللة</p>{variance.status === "open" && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => approveVariance.mutate({ businessEntityId: entity, varianceId: variance.id, decision: "approved" }, { onSuccess: () => void variances.refetch() })}>اعتماد</Button><Button size="sm" variant="outline" onClick={() => approveVariance.mutate({ businessEntityId: entity, varianceId: variance.id, decision: "rejected" }, { onSuccess: () => void variances.refetch() })}>رفض</Button></div>}</div>)}</CardContent></Card>
              <Card className="border-0"><CardContent className="p-5"><div className="flex items-center gap-3"><PackageCheck className="text-emerald-600" /><div><p className="font-semibold">ضوابط التشغيل</p><p className="mt-1 text-xs leading-5 text-slate-500">عزل كيان · Idempotency · تتبع دفعة/Serial · مراجعة فروقات الجرد</p></div></div><div className="mt-4 flex items-center gap-3"><Truck className="text-blue-600" /><div><p className="font-semibold">التزامن</p><p className="mt-1 text-xs leading-5 text-slate-500">الحركات المحلية لا تضيع عند انقطاع الشبكة وتُعاد بترتيب آمن.</p></div></div><div className="mt-4 flex items-center gap-3"><ClipboardCheck className="text-amber-600" /><div><p className="font-semibold">الاعتماد</p><p className="mt-1 text-xs leading-5 text-slate-500">لا يتحول فرق الجرد إلى تسوية قبل اعتماد مستخدم منفصل.</p></div></div></CardContent></Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, text = false }: { label: string; value: number | string; onChange: (value: number | string) => void; text?: boolean }) {
  return <div><label className="text-sm font-medium">{label}</label><Input className="mt-1" type={text ? "text" : "number"} min={text ? undefined : 0} value={value} onChange={(event) => onChange(text ? event.target.value : Math.max(0, Number(event.target.value) || 0))} /></div>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div><label className="text-sm font-medium">{label}</label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
