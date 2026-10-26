import { useEffect, useState } from "react";
import { ShieldCheck, UserRound, LockKeyhole, Building2, BriefcaseBusiness, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

export default function UnifiedEmployeeLogin() {
  const [, navigate] = useLocation();
  const auth = useAuth();
  const options = trpc.employeeAuth.accessOptions.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const login = trpc.employeeAuth.login.useMutation({
    onSuccess: result => {
      sessionStorage.setItem("rasd-selected-access", JSON.stringify({ entityId: result.entity.id, roleKey: result.role.key, roleNameAr: result.role.nameAr }));
      window.location.href = "/";
    },
  });
  const setCredential = trpc.employeeAuth.setMyCredential.useMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [businessEntityId, setBusinessEntityId] = useState("");
  const [roleKey, setRoleKey] = useState("");

  useEffect(() => {
    if (!businessEntityId && options.data?.entities.length === 1) setBusinessEntityId(String(options.data.entities[0].id));
    if (!roleKey && options.data?.roles.length === 1) setRoleKey(options.data.roles[0].roleKey);
  }, [businessEntityId, roleKey, options.data]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!businessEntityId || !roleKey) return;
    login.mutate({ username, password, businessEntityId: Number(businessEntityId), roleKey });
  };
  const saveCredential = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCredential.mutate({ username, password }, { onSuccess: () => window.location.reload() });
  };

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dff7f5,transparent_38%),linear-gradient(135deg,#f8fafc,#eef4f8)] p-4 sm:p-8">
      <Card className="w-full max-w-2xl overflow-hidden border-0 shadow-xl shadow-slate-200/70">
        <div className="grid md:grid-cols-[.82fr_1.18fr]">
          <div className="hidden bg-[#102a43] p-8 text-white md:block">
            <Badge className="border-0 bg-white/10 text-cyan-100"><ShieldCheck size={14} /> دخول مؤسسي محمي</Badge>
            <h1 className="mt-10 text-3xl font-semibold leading-relaxed">مساحة عمل واحدة لكل كيانات RASD</h1>
            <p className="mt-4 text-sm leading-8 text-slate-300">اختر الكيان والدور المصرح لك بهما. يتم التحقق من العضوية والصلاحيات على الخادم قبل إنشاء الجلسة.</p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Building2 size={17} className="text-cyan-300" /> عزل كامل بين الكيانات والفروع</p>
              <p className="flex items-center gap-2"><BriefcaseBusiness size={17} className="text-cyan-300" /> دور وظيفي مرتبط بالعضوية</p>
              <p className="flex items-center gap-2"><LockKeyhole size={17} className="text-cyan-300" /> جلسة HttpOnly وتسجيل محاولات الدخول</p>
            </div>
          </div>
          <div>
            <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-4">
              <div className="mb-4 flex items-center gap-2 text-[#0f766e] md:hidden"><ShieldCheck size={21} /><span className="font-semibold">RASD · دخول المستخدمين</span></div>
              <CardTitle className="text-2xl">تسجيل دخول المستخدم</CardTitle>
              <CardDescription className="leading-7">أدخل بياناتك ثم حدد الكيان والوظيفة للعمل ضمن النطاق المصرح.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-3 sm:p-8 sm:pt-4">
              {auth.user && (
                <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="font-semibold text-cyan-950">إعداد الدخول المحلي</p>
                  <p className="mt-1 text-xs leading-6 text-cyan-900">أنت مسجل حالياً عبر الدخول المؤسسي. أنشئ اسم مستخدم ورقماً سرياً لاستخدام هذه الواجهة لاحقاً.</p>
                  <form className="mt-3 space-y-3" onSubmit={saveCredential}>
                    <Input value={username} onChange={event => setUsername(event.target.value)} placeholder="اسم المستخدم الجديد" minLength={3} required />
                    <Input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="رقم سري لا يقل عن 8 أحرف" minLength={8} required />
                    {setCredential.error && <p className="text-xs text-rose-700">{setCredential.error.message}</p>}
                    <Button type="submit" size="sm" disabled={setCredential.isPending}>{setCredential.isPending ? "جارٍ الحفظ…" : "حفظ بيانات الدخول"}</Button>
                  </form>
                </div>
              )}
              {!auth.user && <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="employee-username">اسم المستخدم</Label>
                  <div className="relative"><UserRound size={16} className="absolute right-3 top-3 text-slate-400" /><Input id="employee-username" className="pr-9" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="مثال: ahmed.rasd" required /></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-password">الرقم السري</Label>
                  <div className="relative"><LockKeyhole size={16} className="absolute right-3 top-3 text-slate-400" /><Input id="employee-password" className="pr-9" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••" minLength={8} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>الكيان</Label>
                  <Select value={businessEntityId} onValueChange={setBusinessEntityId} disabled={options.isLoading || !options.data?.entities.length}>
                    <SelectTrigger><SelectValue placeholder={options.isLoading ? "جارٍ تحميل الكيانات…" : "حدد الكيان الذي ستعمل فيه"} /></SelectTrigger>
                    <SelectContent>{options.data?.entities.map(entity => <SelectItem key={entity.id} value={String(entity.id)}>{entity.nameAr} · {entity.code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوظيفة / الدور</Label>
                  <Select value={roleKey} onValueChange={setRoleKey} disabled={options.isLoading || !options.data?.roles.length}>
                    <SelectTrigger><SelectValue placeholder={options.isLoading ? "جارٍ تحميل الأدوار…" : "حدد وظيفتك أو دورك"} /></SelectTrigger>
                    <SelectContent>{options.data?.roles.map(role => <SelectItem key={role.roleKey} value={role.roleKey}>{role.nameAr} · {role.scopeType}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {login.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800">{login.error.message}</p>}
                {!options.isLoading && !options.data?.entities.length && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">لا توجد كيانات نشطة متاحة حالياً. اطلب من مسؤول النظام تفعيل الكيان.</p>}
                <Button className="h-11 w-full bg-[#0f766e] hover:bg-[#115e59]" type="submit" disabled={login.isPending || options.isLoading || !businessEntityId || !roleKey}>
                  {login.isPending ? <><Loader2 size={16} className="animate-spin" /> جارٍ التحقق…</> : "تسجيل الدخول"}
                </Button>
                <p className="text-center text-xs leading-6 text-slate-500">اختيار الكيان والدور لا يمنح صلاحية جديدة؛ يجب أن تكون العضوية الفعالة مطابقة لاختيارك.</p>
                <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => navigate("/customer-portal/login")}>الدخول إلى بوابة العملاء</Button>
                <Button type="button" variant="ghost" className="w-full text-xs text-slate-500" onClick={() => startLogin()}>الدخول المؤسسي لأول مرة / إعداد بيانات الدخول</Button>
              </form>}
              {auth.user && <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => navigate("/customer-portal/login")}>الدخول إلى بوابة العملاء</Button>}
            </CardContent>
          </div>
        </div>
      </Card>
    </main>
  );
}
