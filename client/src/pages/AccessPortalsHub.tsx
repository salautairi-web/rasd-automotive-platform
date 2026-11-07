import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, LayoutDashboard, LogIn, Share2, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const portals = [
  { key: "control", title: "واجهة التحكم", subtitle: "إدارة الكيانات والأنظمة والإعدادات والتقارير", path: "/admin/control-center", icon: LayoutDashboard, tone: "from-blue-600 to-indigo-700", badge: "للإدارة" },
  { key: "users", title: "واجهة المستخدمين", subtitle: "دخول الموظفين حسب الكيان والوظيفة والدور", path: "/login", icon: LogIn, tone: "from-violet-600 to-purple-700", badge: "للموظفين" },
  { key: "customers", title: "واجهة العملاء", subtitle: "تسجيل العملاء وخدماتهم ومركباتهم وطلباتهم", path: "/customer-portal", icon: UsersRound, tone: "from-cyan-600 to-teal-700", badge: "للعملاء" },
] as const;

export default function AccessPortalsHub() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  const links = useMemo(() => portals.map(portal => ({ ...portal, url: `${baseUrl}${portal.path}` })), [baseUrl]);
  const copyLink = async (portal: (typeof links)[number]) => {
    try {
      await navigator.clipboard.writeText(portal.url);
      setCopied(portal.key);
      toast.success(`تم نسخ رابط ${portal.title}`);
      window.setTimeout(() => setCopied(current => current === portal.key ? null : current), 1800);
    } catch {
      toast.error("تعذر نسخ الرابط؛ انسخه من الحقل يدوياً");
    }
  };
  const shareLink = async (portal: (typeof links)[number]) => {
    if (navigator.share) {
      try { await navigator.share({ title: `RASD — ${portal.title}`, text: portal.subtitle, url: portal.url }); } catch { /* إلغاء المشاركة لا يحتاج رسالة */ }
    } else await copyLink(portal);
  };

  return <DashboardLayout><main dir="rtl" className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between"><div><Badge className="mb-3 border-white/20 bg-white/10 text-blue-100">بوابة الإدارة الموحدة</Badge><h1 className="text-2xl font-bold sm:text-3xl">الوصول السريع إلى واجهات RASD</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">مكان واحد لإدارة روابط واجهة التحكم وواجهة المستخدمين وبوابة العملاء، مع إمكانية فتح الرابط أو نسخه ومشاركته دون تشتت.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-200"><p className="font-semibold text-white">ثلاث بوابات، تنظيم واحد</p><p className="mt-1">اختر البوابة المناسبة ثم شارك رابطها.</p></div></div>
    <div className="grid gap-5 lg:grid-cols-3">{links.map(portal => { const Icon = portal.icon; return <Card key={portal.key} className="group overflow-hidden border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`h-2 bg-gradient-to-l ${portal.tone}`} /><CardHeader><div className="flex items-start justify-between gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${portal.tone} text-white shadow-lg`}><Icon size={22} /></div><Badge variant="secondary">{portal.badge}</Badge></div><CardTitle className="pt-2 text-xl">{portal.title}</CardTitle><p className="text-sm leading-6 text-slate-500">{portal.subtitle}</p></CardHeader><CardContent className="space-y-3"><Button className="w-full justify-between" onClick={() => setLocation(portal.path)}>فتح الواجهة <ArrowLeft size={16} /></Button><div className="flex gap-2"><Input dir="ltr" readOnly value={portal.url} className="min-w-0 bg-slate-50 text-xs" aria-label={`رابط ${portal.title}`} /><Button variant="outline" size="icon" onClick={() => void copyLink(portal)} title="نسخ الرابط" aria-label={`نسخ رابط ${portal.title}`}>{copied === portal.key ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}</Button><Button variant="outline" size="icon" onClick={() => void shareLink(portal)} title="مشاركة الرابط" aria-label={`مشاركة رابط ${portal.title}`}><Share2 size={16} /></Button></div><a href={portal.path} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-blue-700"><ExternalLink size={13} /> فتح في نافذة جديدة</a></CardContent></Card>; })}</div>
    <Card className="border-blue-100 bg-blue-50/60 shadow-sm"><CardContent className="flex flex-col gap-3 p-5 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">اقتراح تنظيمي للإدارة</p><p className="mt-1 leading-6">استخدموا واجهة التحكم لإدارة الصلاحيات، واجهة المستخدمين لدخول الموظفين، وبوابة العملاء للوصول الخارجي. لا تشاركوا رابط واجهة التحكم مع العملاء.</p></div><Button variant="outline" onClick={() => setLocation("/admin/control-center")}>إدارة الصلاحيات <ArrowLeft size={15} /></Button></CardContent></Card>
  </div></main></DashboardLayout>;
}
