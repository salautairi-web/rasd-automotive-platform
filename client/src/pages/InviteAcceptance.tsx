import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function InviteAcceptance() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get("token") ?? "");
  const { user } = useAuth();
  const accept = trpc.adminControl.acceptInvitation.useMutation({ onSuccess: () => { window.location.href = "/security"; }, onError: e => window.alert(e.message) });
  return <DashboardLayout><main dir="rtl" className="-m-4 min-h-screen bg-[#f6f8fb] p-4 sm:p-10"><Card className="mx-auto mt-12 max-w-xl border-0 shadow-sm"><CardHeader><CardTitle>قبول دعوة RASD وتفعيل الحماية</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">سجّل الدخول أولاً بالبريد الذي استلم الدعوة، ثم ألصق رمز الدعوة. بعد القبول ستنتقل مباشرة إلى إعداد MFA.</p>{!user && <Button className="w-full" onClick={() => startLogin()}>تسجيل الدخول بالبريد المدعو</Button>}<Input value={token} onChange={e => setToken(e.target.value)} placeholder="رمز الدعوة الآمن" dir="ltr"/><Button className="w-full" disabled={!token || !user || accept.isPending} onClick={() => accept.mutate({ token })}>قبول الدعوة والانتقال إلى MFA</Button></CardContent></Card></main></DashboardLayout>;
}
