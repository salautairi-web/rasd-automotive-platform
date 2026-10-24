import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import CustomerLinkRequestPanel from "@/components/CustomerLinkRequestPanel";
import CustomerServiceRequests from "@/components/CustomerServiceRequests";
import CustomerAccessPanel from "@/components/CustomerAccessPanel";
import CustomerAccountDialog from "@/components/CustomerAccountDialog";
import CustomerRegistrationSetupPanel from "@/components/CustomerRegistrationSetupPanel";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Building2,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Headphones,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  CalendarDays,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  canReplyToPortalTicket,
  filterPortalActivity,
  formatPortalMoney,
  portalStatusLabels,
  type PortalActivity,
} from "../../../shared/customerPortal";

type Scope = {
  businessEntityId: number;
  relationshipId: number;
  entityName: string;
};
type Priority = "low" | "normal" | "high" | "urgent";
const relationshipLabels: Record<string, string> = {
  customer: "عميل",
  corporate_customer: "عميل شركة",
  supplier: "مورد",
  partner: "شريك",
  dealer: "وكيل",
};
const priorityLabel: Record<Priority, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  urgent: "عاجلة",
};
const icons = { order: ShoppingBag, reservation: Building2, payment: Receipt };
const date = (value: Date | string) =>
  new Date(value).toLocaleDateString("ar-OM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const emptyTicket = {
  category: "استفسار عام",
  subject: "",
  message: "",
  priority: "normal" as Priority,
};
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-slate-50/60 p-8 text-center text-sm leading-7 text-slate-500">
      {children}
    </div>
  );
}
function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900"
    >
      <p className="text-sm">
        تعذر تحميل البيانات. لم يتم عرض بيانات من علاقة أخرى.
      </p>
      <Button variant="outline" className="mt-3" onClick={retry}>
        إعادة المحاولة
      </Button>
    </div>
  );
}
function Loading() {
  return (
    <div
      role="status"
      aria-label="جاري تحميل بيانات العميل"
      className="space-y-4"
    >
      <div className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
      <p className="sr-only">جارٍ التحميل…</p>
    </div>
  );
}
function Status({ value }: { value: string }) {
  const tone = ["succeeded", "completed", "fulfilled", "resolved"].includes(
    value
  )
    ? "bg-emerald-50 text-emerald-700"
    : ["failed", "cancelled", "escalated"].includes(value)
      ? "bg-rose-50 text-rose-700"
      : "bg-blue-50 text-blue-700";
  return (
    <Badge className={`shrink-0 border-0 ${tone}`}>
      {portalStatusLabels[value] ?? value}
    </Badge>
  );
}

export default function CustomerPortal() {
  const auth = useAuth();
  const local = trpc.customerAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });
  const [path, navigate] = useLocation();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const localLogout = trpc.customerAuth.logout.useMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [relationshipId, setRelationshipId] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const forceAccess =
    path === "/customer-portal/register" || path === "/customer-portal/login";
  const user = local.data ?? auth.user;
  const account = trpc.portalV2.account.useQuery(
    {
      cacheIdentity: local.data
        ? `customer:${local.data.id}`
        : `oauth:${auth.user?.id ?? 0}`,
    },
    {
      enabled: Boolean(user) && !forceAccess && !isLeaving,
      retry: false,
      refetchInterval: 30000,
    }
  );
  const relationship =
    account.data?.relationships.find(
      item => String(item.id) === relationshipId
    ) ?? account.data?.relationships[0];
  const selectEntity = trpc.portalV2.selectEntity.useMutation({
    onSuccess: result => setRelationshipId(String(result.relationshipId)),
    onError: e => toast.error(e.message),
  });
  const clearPortalCache = () => {
    queryClient.removeQueries({ queryKey: getQueryKey(trpc.portalV2) });
    queryClient.removeQueries({
      queryKey: getQueryKey(trpc.customerVerification),
    });
    queryClient.removeQueries({
      queryKey: getQueryKey(trpc.customerLinkReview),
    });
    queryClient.removeQueries({ queryKey: getQueryKey(trpc.customerServices) });
    setRelationshipId("");
  };
  const signedIn = async () => {
    clearPortalCache();
    const session = await local.refetch();
    if (!session.data)
      throw new Error(
        "تعذر بدء جلسة العميل. افتح البوابة في نافذة مستقلة وتأكد من السماح بملفات الارتباط."
      );
    navigate("/customer-portal");
  };
  const logout = async () => {
    setIsLeaving(true);
    try {
      if (local.data) await localLogout.mutateAsync();
      else await auth.logout();
      clearPortalCache();
      utils.customerAuth.me.setData(undefined, null);
      navigate("/customer-portal/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر تسجيل الخروج.");
    } finally {
      setIsLeaving(false);
    }
  };
  if (forceAccess)
    return (
      <>
        <CustomerAccessPanel
          key={path}
          initialMode={path.endsWith("/register") ? "register" : "login"}
          onAuthenticated={signedIn}
        />
        {auth.user?.role === "admin" && !local.data && (
          <div dir="rtl" className="mx-auto max-w-6xl px-4 pb-8">
            <CustomerRegistrationSetupPanel />
          </div>
        )}
      </>
    );
  if (local.isLoading || (auth.loading && !local.data) || isLeaving)
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Loading />
        </div>
      </main>
    );
  if (local.isError && !user)
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <ErrorState retry={() => void local.refetch()} />
      </main>
    );
  if (!user) return <CustomerAccessPanel onAuthenticated={signedIn} />;
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div>
            <strong className="text-xl tracking-tight">
              RASD<span className="mx-2 text-cyan-600">/</span>
              <span className="text-sm font-medium">بوابة العملاء</span>
            </strong>
            <p className="mt-1 text-xs text-slate-400">
              حساب واحد · علاقات مستقلة
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-[140px] truncate text-sm text-slate-600">
              {user.name ?? "حساب العميل"}
            </span>
            {local.data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfileOpen(true)}
              >
                <ShieldCheck size={15} />
                حسابي
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={isLeaving}
              onClick={() => void logout()}
            >
              <LogOut size={15} />
              خروج
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#14213d] via-[#193b70] to-[#087f8c] p-5 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="border-0 bg-white/15 text-cyan-100">
                <ShieldCheck size={13} />
                بياناتك ضمن الكيان المصرح فقط
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
                مرحباً بك في مساحتك الرقمية
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-blue-100">
                اطلب خدمات الشركة وتابع حجوزاتك وتواصل مع فريق الخدمة.
              </p>
            </div>
            {Boolean(account.data?.relationships.length) && (
              <div className="w-full lg:w-80">
                <Label
                  htmlFor="relationship"
                  className="mb-2 block text-xs text-blue-100"
                >
                  العلاقة التجارية النشطة
                </Label>
                <Select
                  value={relationship ? String(relationship.id) : ""}
                  disabled={selectEntity.isPending}
                  onValueChange={value => {
                    const next = account.data?.relationships.find(
                      r => String(r.id) === value
                    );
                    if (next)
                      selectEntity.mutate({
                        businessEntityId: next.businessEntityId,
                        relationshipId: next.id,
                      });
                  }}
                >
                  <SelectTrigger
                    id="relationship"
                    className="h-11 w-full border-white/20 bg-white/10 text-white"
                  >
                    <SelectValue placeholder="اختر العلاقة والكيان" />
                  </SelectTrigger>
                  <SelectContent>
                    {account.data?.relationships.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.entityName} ·{" "}
                        {relationshipLabels[r.relationshipType] ??
                          r.relationshipType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </section>
        {auth.user?.role === "admin" && !local.data && (
          <>
            <CustomerRegistrationSetupPanel />
            <p className="text-sm text-slate-500">
              لإنشاء حساب عميل مستقل:{" "}
              <Link
                href="/customer-portal/register"
                className="text-blue-600 underline"
              >
                فتح نموذج التسجيل
              </Link>
            </p>
          </>
        )}
        {account.isError ? (
          <ErrorState retry={() => void account.refetch()} />
        ) : account.isLoading ? (
          <Loading />
        ) : !relationship ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto text-slate-300" size={40} />
              <h2 className="mt-4 text-xl font-semibold">
                حسابك جاهز، وعلاقتك التجارية لم تُربط بعد
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                اطلب من مسؤول البوابة ربط الحساب بكيان. تسجيل الدخول وحده لا
                يمنح وصولاً إلى سجلات الأعمال.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => void account.refetch()}
              >
                <RefreshCw size={15} />
                التحقق من الربط
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {local.data && relationship.relationshipType === "customer" && (
              <CustomerLinkRequestPanel
                key={`link:${local.data.id}:${relationship.id}`}
                scope={{
                  businessEntityId: relationship.businessEntityId,
                  relationshipId: relationship.id,
                  entityName: relationship.entityName,
                }}
                onVerify={() => setProfileOpen(true)}
              />
            )}
            <CustomerWorkspace
              key={`${user.id}:${relationship.businessEntityId}:${relationship.id}`}
              scope={{
                businessEntityId: relationship.businessEntityId,
                relationshipId: relationship.id,
                entityName: relationship.entityName,
              }}
            />
          </>
        )}
      </div>
      {local.data && (
        <CustomerAccountDialog
          key={`account:${local.data.id}`}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          profile={local.data}
        />
      )}
    </main>
  );
}

function CustomerWorkspace({ scope }: { scope: Scope }) {
  const input = {
    businessEntityId: scope.businessEntityId,
    relationshipId: scope.relationshipId,
  };
  const utils = trpc.useUtils();
  const dashboard = trpc.portalV2.dashboard.useQuery(input, {
    retry: false,
    refetchInterval: 30000,
    placeholderData: undefined,
  });
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticket, setTicket] = useState(emptyTicket);
  const [threadId, setThreadId] = useState<number | null>(null);
  const createTicket = trpc.portalV2.createTicket.useMutation({
    onSuccess: r => {
      toast.success(`تم إنشاء التذكرة ${r.ticketNo}`);
      setTicket(emptyTicket);
      setTicketOpen(false);
      setTab("support");
      void utils.portalV2.dashboard.invalidate(input);
    },
    onError: e => toast.error(e.message),
  });
  const markRead = trpc.portalV2.markNotificationRead.useMutation({
    onSuccess: () => void utils.portalV2.dashboard.invalidate(input),
    onError: e => toast.error(e.message),
  });
  const activity = useMemo<PortalActivity[]>(
    () =>
      [
        ...(dashboard.data?.orders ?? []).map(r => ({
          id: `order-${r.id}`,
          kind: "order" as const,
          title: r.orderType,
          reference: `ORD-${r.id}`,
          status: r.status,
          createdAt: r.createdAt,
        })),
        ...(dashboard.data?.reservations ?? []).map(r => ({
          id: `reservation-${r.id}`,
          kind: "reservation" as const,
          title: r.reservationType,
          reference: `RSV-${r.id}`,
          status: r.status,
          createdAt: r.createdAt,
        })),
        ...(dashboard.data?.payments ?? []).map(r => ({
          id: `payment-${r.id}`,
          kind: "payment" as const,
          title: formatPortalMoney(r.amountMinor, r.currency),
          reference: `PAY-${r.id}`,
          status: r.status,
          createdAt: r.createdAt,
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [dashboard.data]
  );
  const filtered = filterPortalActivity(activity, {
    query,
    kind,
    status,
    sort,
  });
  const notifications = (dashboard.data?.notifications ?? []).filter(
    n => !unreadOnly || !n.readAt
  );
  const unread =
    dashboard.data?.notifications.filter(n => !n.readAt).length ?? 0;
  const openTickets =
    dashboard.data?.tickets.filter(t => canReplyToPortalTicket(t.status))
      .length ?? 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    createTicket.mutate({
      ...input,
      ...ticket,
      subject: ticket.subject.trim(),
      message: ticket.message.trim(),
    });
  };
  const goToActivity = (value: string) => {
    setKind(value);
    setStatus("all");
    setQuery("");
    setTab("activity");
  };
  if (dashboard.isError)
    return <ErrorState retry={() => void dashboard.refetch()} />;
  if (dashboard.isLoading || !dashboard.data) return <Loading />;
  return (
    <>
      <CustomerServiceRequests scope={scope} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          السياق الحالي:{" "}
          <strong className="text-slate-800">{scope.entityName}</strong>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={dashboard.isFetching}
          onClick={() => void dashboard.refetch()}
        >
          <RefreshCw
            size={14}
            className={dashboard.isFetching ? "animate-spin" : ""}
          />
          {dashboard.isFetching ? "جارٍ التحديث" : "تحديث البيانات"}
        </Button>
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "أحدث الطلبات",
            value: dashboard.data.orders.length,
            icon: ShoppingBag,
            tone: "bg-blue-50 text-blue-600",
            action: () => goToActivity("order"),
          },
          {
            label: "أحدث الحجوزات",
            value: dashboard.data.reservations.length,
            icon: Building2,
            tone: "bg-violet-50 text-violet-600",
            action: () => goToActivity("reservation"),
          },
          {
            label: "أحدث المدفوعات",
            value: dashboard.data.payments.length,
            icon: Receipt,
            tone: "bg-emerald-50 text-emerald-600",
            action: () => goToActivity("payment"),
          },
          {
            label: "تذاكر نشطة معروضة",
            value: openTickets,
            icon: Headphones,
            tone: "bg-amber-50 text-amber-600",
            action: () => setTab("support"),
          },
        ].map(m => (
          <button
            type="button"
            key={m.label}
            onClick={m.action}
            className="rounded-2xl bg-white p-4 text-right shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-xl p-2 ${m.tone}`}>
                <m.icon size={18} />
              </span>
              <ChevronLeft size={14} className="text-slate-300" />
            </div>
            <p className="mt-4 text-xs text-slate-500 sm:text-sm">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {m.value.toLocaleString("ar-OM")}
            </p>
          </button>
        ))}
      </section>
      <Tabs value={tab} onValueChange={setTab} dir="rtl" className="min-w-0">
        <div className="max-w-full overflow-x-auto rounded-2xl bg-white p-1">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-transparent">
            <TabsTrigger className="min-h-11" value="overview">
              ملخص حسابي
            </TabsTrigger>
            <TabsTrigger className="min-h-11" value="profile">
              ملفي والفواتير
            </TabsTrigger>
            <TabsTrigger className="min-h-11" value="activity">
              الطلبات والحجوزات
            </TabsTrigger>
            <TabsTrigger className="min-h-11" value="support">
              تذاكر الدعم
            </TabsTrigger>
            <TabsTrigger className="min-h-11" value="notifications">
              الإشعارات{" "}
              {unread > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">
                  {unread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger className="min-h-11" value="documents">
              المستندات
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 size={18} className="text-cyan-600" />
                  آخر نشاطاتك
                </CardTitle>
                <p className="text-xs text-slate-500">
                  أحدث 10 سجلات لكل نوع، وليست إجماليات تاريخية.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActivityList items={activity.slice(0, 5)} />
                <Button
                  variant="ghost"
                  className="w-full text-blue-600"
                  onClick={() => goToActivity("all")}
                >
                  عرض النشاطات والبحث
                  <ChevronLeft size={16} />
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-5">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Headphones className="text-cyan-600" size={24} />
                  <h2 className="mt-4 font-semibold">كيف يمكننا مساعدتك؟</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    أنشئ تذكرة وتابع الردود هنا دون مغادرة البوابة.
                  </p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => setTicketOpen(true)}
                  >
                    <Plus size={16} />
                    طلب دعم جديد
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-0 bg-blue-50 text-blue-950">
                <CardContent className="p-5">
                  <p className="text-sm">
                    {unread
                      ? `لديك ${unread} إشعاراً غير مقروء في الكيان الحالي.`
                      : "أنت على اطلاع بآخر الإشعارات."}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2 text-blue-700"
                    onClick={() => setTab("notifications")}
                  >
                    فتح مركز الإشعارات
                    <ChevronLeft size={16} />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="profile" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound size={18} className="text-blue-600" />
                  بيانات ملف العميل
                </CardTitle>
                <p className="text-xs text-slate-500">
                  بيانات السجل المرتبط بهذا الكيان فقط؛ لا تظهر سجلات كيانات
                  أخرى.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {dashboard.data.profile ? (
                  <>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">الاسم</p>
                      <p className="mt-1 font-semibold">
                        {dashboard.data.profile.nameAr}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-slate-500">رقم العميل</p>
                        <p className="mt-1 font-medium">
                          {dashboard.data.profile.customerNo}
                        </p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-slate-500">حالة السجل</p>
                        <p className="mt-1 font-medium text-emerald-700">
                          {dashboard.data.profile.status === "active"
                            ? "نشط"
                            : "غير نشط"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-500">
                        البريد الإلكتروني
                      </p>
                      <p dir="ltr" className="mt-1 text-right">
                        {dashboard.data.profile.email || "غير مسجل"}
                      </p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs text-slate-500">رقم الجوال</p>
                      <p dir="ltr" className="mt-1 text-right">
                        {dashboard.data.profile.phone || "غير مسجل"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                    لم يتم ربط الحساب بسجل عميل سابق. يمكنك متابعة الخدمات وطلب
                    ربط سجل من تبويب الدعم.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt size={18} className="text-emerald-600" />
                  الفواتير الخاصة بي
                </CardTitle>
                <p className="text-xs text-slate-500">
                  الفواتير المطابقة لسجل العميل داخل {scope.entityName}.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.data.invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoiceNo}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays size={13} /> {date(invoice.createdAt)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">
                        {formatPortalMoney(
                          invoice.amountMinor,
                          invoice.currency
                        )}
                      </p>
                      <p
                        className={`mt-1 text-xs ${invoice.status === "paid" ? "text-emerald-700" : invoice.status === "overdue" ? "text-rose-700" : "text-amber-700"}`}
                      >
                        {invoice.status === "paid"
                          ? "مدفوعة"
                          : invoice.status === "overdue"
                            ? "متأخرة"
                            : invoice.status === "partially_paid"
                              ? "مدفوعة جزئياً"
                              : "مستحقة"}
                      </p>
                    </div>
                  </div>
                ))}
                {!dashboard.data.invoices.length && (
                  <Empty>
                    لا توجد فواتير مرتبطة بهذا السجل داخل الكيان الحالي.
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag size={18} className="text-violet-600" />
                  مركباتي
                </CardTitle>
                <p className="text-xs text-slate-500">
                  المركبات المرتبطة بملفك داخل الكيان الحالي فقط.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.data.customerVehicles.map(vehicle => (
                  <div key={vehicle.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.vehicleNo} · سنة الصنع {vehicle.modelYear || "غير محددة"}
                        </p>
                      </div>
                      <Badge variant="secondary">{vehicle.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500" dir="ltr">
                      VIN: {vehicle.vin}
                    </p>
                  </div>
                ))}
                {!dashboard.data.customerVehicles.length && (
                  <Empty>لا توجد مركبات مرتبطة بهذا الملف.</Empty>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText size={18} className="text-blue-600" />
                  سجل الصيانة
                </CardTitle>
                <p className="text-xs text-slate-500">
                  آخر أوامر العمل وحالاتها من نظام الورشة في الزمن الفعلي.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.data.maintenanceHistory.map(job => (
                  <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                    <div>
                      <p className="font-medium">{job.jobNo}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {job.make} {job.model} · {job.vehicleNo} · {date(job.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                ))}
                {!dashboard.data.maintenanceHistory.length && (
                  <Empty>لا يوجد سجل صيانة مرتبط بهذا الملف حتى الآن.</Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">متابعة عملياتك</CardTitle>
              <p className="text-xs text-slate-500">
                بحث وتصفية ضمن آخر 10 طلبات و10 حجوزات و10 مدفوعات.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute right-3 top-3 text-slate-400"
                  />
                  <Input
                    aria-label="البحث في النشاطات"
                    className="pr-9"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="الاسم أو المرجع أو الحالة"
                  />
                </div>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger aria-label="نوع النشاط" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="order">الطلبات</SelectItem>
                    <SelectItem value="reservation">الحجوزات</SelectItem>
                    <SelectItem value="payment">المدفوعات</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger aria-label="حالة النشاط" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    {Array.from(new Set(activity.map(a => a.status))).map(s => (
                      <SelectItem key={s} value={s}>
                        {portalStatusLabels[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger aria-label="ترتيب النشاطات" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">الأحدث أولاً</SelectItem>
                    <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {filtered.length} نتيجة
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setKind("all");
                    setStatus("all");
                    setSort("newest");
                  }}
                >
                  إعادة ضبط
                </Button>
              </div>
              <ActivityList items={filtered} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="support" className="mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">
                  تذاكر الدعم · أحدث 10
                </CardTitle>
                <Button size="sm" onClick={() => setTicketOpen(true)}>
                  <Plus size={15} />
                  طلب جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.data.tickets.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setThreadId(t.id)}
                  className="w-full rounded-2xl border bg-slate-50/40 p-4 text-right transition hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="min-w-0 break-words text-sm">
                      {t.subject}
                    </strong>
                    <Status value={t.status} />
                  </div>
                  <p className="mt-2 break-words text-xs text-slate-500">
                    {t.ticketNo} · {t.category} · {date(t.createdAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      أهمية {priorityLabel[t.priority]}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      فتح المحادثة
                      <MessageSquare size={14} />
                    </span>
                  </div>
                </button>
              ))}
              {!dashboard.data.tickets.length && (
                <Empty>لم تُنشأ أي تذكرة لهذه العلاقة بعد.</Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">
                  مركز الإشعارات · أحدث 10
                </CardTitle>
                <Button
                  variant={unreadOnly ? "default" : "outline"}
                  size="sm"
                  aria-pressed={unreadOnly}
                  onClick={() => setUnreadOnly(v => !v)}
                >
                  غير المقروء فقط
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                إشعارات حسابك في الكيان الحالي.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 ${n.readAt ? "bg-slate-50 border-slate-200" : "bg-blue-50/50 border-blue-100"}`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className="mt-1 shrink-0 text-blue-600" size={17} />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold">
                        {n.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                        {n.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">
                          {date(n.createdAt)}
                        </span>
                        {n.readAt ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <Check size={14} />
                            مقروء
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={markRead.isPending}
                            onClick={() =>
                              markRead.mutate({
                                ...input,
                                notificationId: n.id,
                              })
                            }
                          >
                            تعليم كمقروء
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!notifications.length && (
                <Empty>
                  {unreadOnly
                    ? "لا توجد إشعارات غير مقروءة ضمن السجلات الحالية."
                    : "لا توجد إشعارات لهذا الكيان."}
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-4 font-semibold">مستندات العميل</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">
                لم يُفعّل ربط المستندات المعتمدة بالبوابة بعد. لا تعرض هذه
                الصفحة مستندات داخلية أو ملفات خارج نطاق علاقتك.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setTicket({
                    ...emptyTicket,
                    category: "طلب مستند",
                    subject: "طلب مستند مرتبط بعلاقتي التجارية",
                  });
                  setTicketOpen(true);
                }}
              >
                طلب مستند من فريق الخدمة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={ticketOpen}
        onOpenChange={v => {
          if (!createTicket.isPending) setTicketOpen(v);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader className="text-right">
            <DialogTitle>طلب دعم جديد</DialogTitle>
            <DialogDescription>
              سيُرسل الطلب ضمن {scope.entityName} والعلاقة الحالية.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="ticket-category">نوع الطلب</Label>
              <Select
                value={ticket.category}
                onValueChange={v => setTicket(t => ({ ...t, category: v }))}
              >
                <SelectTrigger id="ticket-category" className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "استفسار عام",
                    "حجز وتأجير",
                    "فاتورة ومدفوعات",
                    "دعم فني",
                    "طلب مستند",
                  ].map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticket-priority">الأهمية</Label>
              <Select
                value={ticket.priority}
                onValueChange={v =>
                  setTicket(t => ({ ...t, priority: v as Priority }))
                }
              >
                <SelectTrigger id="ticket-priority" className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabel).map(([p, l]) => (
                    <SelectItem key={p} value={p}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticket-subject">موضوع الطلب</Label>
              <Input
                id="ticket-subject"
                className="mt-2"
                required
                minLength={3}
                maxLength={220}
                value={ticket.subject}
                onChange={e =>
                  setTicket(t => ({ ...t, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ticket-message">التفاصيل</Label>
              <Textarea
                id="ticket-message"
                className="mt-2"
                required
                minLength={2}
                maxLength={5000}
                rows={4}
                value={ticket.message}
                onChange={e =>
                  setTicket(t => ({ ...t, message: e.target.value }))
                }
              />
            </div>
            <Button
              className="w-full"
              disabled={
                createTicket.isPending ||
                ticket.subject.trim().length < 3 ||
                ticket.message.trim().length < 2
              }
            >
              {createTicket.isPending ? "جارٍ الإرسال…" : "إرسال طلب الدعم"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={threadId !== null}
        onOpenChange={v => {
          if (!v) setThreadId(null);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader className="text-right">
            <DialogTitle>محادثة الدعم</DialogTitle>
            <DialogDescription>
              رسائل التذكرة ضمن العلاقة الحالية فقط.
            </DialogDescription>
          </DialogHeader>
          {threadId !== null && (
            <TicketThread key={threadId} scope={scope} ticketId={threadId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function ActivityList({ items }: { items: PortalActivity[] }) {
  if (!items.length)
    return <Empty>لا توجد نشاطات مطابقة ضمن السجلات المعروضة.</Empty>;
  return (
    <div className="space-y-3">
      {items.map(r => {
        const Icon = icons[r.kind];
        return (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4"
          >
            <span className="rounded-xl bg-white p-2 text-cyan-600 shadow-sm">
              <Icon size={17} />
            </span>
            <div className="min-w-0 flex-1 basis-36">
              <p className="break-words text-sm font-medium">{r.title}</p>
              <p className="mt-1 break-words text-xs text-slate-500">
                {r.reference} · {date(r.createdAt)}
              </p>
            </div>
            <Status value={r.status} />
          </div>
        );
      })}
    </div>
  );
}
function TicketThread({ scope, ticketId }: { scope: Scope; ticketId: number }) {
  const utils = trpc.useUtils();
  const input = {
    businessEntityId: scope.businessEntityId,
    relationshipId: scope.relationshipId,
    ticketId,
  };
  const thread = trpc.portalV2.ticketThread.useQuery(input, {
    retry: false,
    refetchInterval: 30000,
  });
  const [body, setBody] = useState("");
  const reply = trpc.portalV2.replyToTicket.useMutation({
    onSuccess: () => {
      setBody("");
      toast.success("تم إرسال الرد");
      void utils.portalV2.ticketThread.invalidate(input);
    },
    onError: e => toast.error(e.message),
  });
  if (thread.isError) return <ErrorState retry={() => void thread.refetch()} />;
  if (!thread.data) return <Loading />;
  const { ticket, messages } = thread.data;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-3">
        <strong className="break-words text-sm">{ticket.subject}</strong>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500">{ticket.ticketNo}</span>
          <Status value={ticket.status} />
        </div>
      </div>
      <div
        className="max-h-72 space-y-3 overflow-y-auto"
        aria-label="رسائل التذكرة"
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`rounded-xl p-3 ${m.senderType === "portal_user" ? "ml-6 bg-blue-50" : "mr-6 bg-slate-100"}`}
          >
            <p className="text-[11px] font-medium text-slate-500">
              {m.senderType === "portal_user"
                ? "أنت"
                : m.senderType === "agent"
                  ? "فريق الخدمة"
                  : "النظام"}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
              {m.body}
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              {new Date(m.createdAt).toLocaleString("ar-OM")}
            </p>
          </div>
        ))}
        {!messages.length && <Empty>لا توجد رسائل بعد.</Empty>}
      </div>
      {canReplyToPortalTicket(ticket.status) ? (
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            reply.mutate({ ...input, body });
          }}
        >
          <Label htmlFor="ticket-reply">إضافة رد</Label>
          <Textarea
            id="ticket-reply"
            required
            minLength={2}
            maxLength={5000}
            rows={3}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <Button
            className="w-full"
            disabled={reply.isPending || body.trim().length < 2}
          >
            {reply.isPending ? "جارٍ الإرسال…" : "إرسال الرد"}
          </Button>
        </form>
      ) : (
        <Empty>
          هذه التذكرة محلولة أو مغلقة. يمكنك إنشاء طلب جديد عند الحاجة.
        </Empty>
      )}
    </div>
  );
}
