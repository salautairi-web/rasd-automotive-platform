import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, Keyboard, Search, Star, X } from "lucide-react";

const shortcuts = [
  { keys: ["/"], title: "فتح بحث الخدمات", description: "ينقل المؤشر مباشرة إلى بحث القائمة الجانبية عندما لا تكون داخل حقل إدخال." },
  { keys: ["Ctrl", "K"], macKeys: ["⌘", "K"], title: "البحث السريع", description: "يعمل من أي مكان في لوحة الإدارة لتركيز بحث القائمة أو البحث الموحد في مركز الإدارة." },
  { keys: ["Alt", "1"], title: "القسم الرئيسي", description: "ينتقل إلى قسم الرئيسية في مركز الإدارة." },
  { keys: ["Alt", "2"], title: "البيانات والمشاريع", description: "يفتح قسم البيانات والمشاريع مع آخر تبويب استخدمته." },
  { keys: ["Alt", "3"], title: "المستخدمون والصلاحيات", description: "يفتح قسم المستخدمين والصلاحيات مع آخر تبويب استخدمته." },
  { keys: ["Alt", "4"], title: "التشغيل والأنظمة", description: "يفتح قسم التشغيل والأنظمة مع آخر تبويب استخدمته." },
  { keys: ["Alt", "5"], title: "الحوكمة والتخطيط", description: "يفتح قسم الحوكمة والتخطيط مع آخر تبويب استخدمته." },
  { keys: ["Esc"], title: "مسح بحث القائمة", description: "يمسح نص بحث القائمة عند وجود المؤشر داخل حقل البحث." },
];

function KeyCaps({ keys }: { keys: string[] }) {
  return <span className="flex shrink-0 items-center gap-1" dir="ltr">{keys.map(key => <kbd key={key} className="min-w-8 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-xs font-semibold text-slate-700 shadow-sm">{key}</kbd>)}</span>;
}

export default function KeyboardShortcutsGuide() {
  return <DashboardLayout><main dir="rtl" className="-m-4 min-h-screen bg-[#f6f8fb] p-4 sm:p-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl bg-gradient-to-l from-slate-950 to-indigo-950 p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><Badge className="mb-4 border-0 bg-white/10 text-indigo-100">دليل الاستخدام السريع</Badge><h1 className="text-2xl font-semibold sm:text-3xl">اختصارات لوحة الإدارة</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">استخدم لوحة المفاتيح للوصول إلى الخدمات والأقسام بسرعة، مع حفظ آخر تبويب فرعي لكل قسم على حسابك.</p></div><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10"><Keyboard size={30} className="text-indigo-200" /></div></div></header>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><Search className="text-indigo-600" size={20}/><p className="mt-3 text-sm font-semibold">بحث أسرع</p><p className="mt-1 text-xs leading-6 text-slate-500">/ أو Ctrl+K لتركيز البحث من أي شاشة.</p></CardContent></Card><Card><CardContent className="p-5"><Command className="text-emerald-600" size={20}/><p className="mt-3 text-sm font-semibold">خمسة أقسام</p><p className="mt-1 text-xs leading-6 text-slate-500">Alt+1 إلى Alt+5 للتنقل بين أقسام الإدارة.</p></CardContent></Card><Card><CardContent className="p-5"><Star className="text-amber-500" size={20}/><p className="mt-3 text-sm font-semibold">تفضيل محفوظ</p><p className="mt-1 text-xs leading-6 text-slate-500">يُستعاد آخر تبويب فرعي لكل قسم عند عودتك.</p></CardContent></Card></div>
    <Card><CardHeader><CardTitle>الاختصارات المتاحة</CardTitle><p className="text-xs text-slate-500">على أجهزة Mac استخدم ⌘ بدلاً من Ctrl عند ظهور الاختصار.</p></CardHeader><CardContent className="space-y-2">{shortcuts.map(shortcut => <div key={shortcut.title} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 sm:flex-row sm:items-center"><KeyCaps keys={shortcut.keys}/><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{shortcut.title}</p><p className="mt-1 text-xs leading-6 text-slate-500">{shortcut.description}</p></div>{shortcut.macKeys && <div className="hidden sm:block"><KeyCaps keys={shortcut.macKeys}/></div>}</div>)}</CardContent></Card>
    <Card className="border-indigo-100 bg-indigo-50/60"><CardContent className="flex gap-3 p-5 text-sm leading-7 text-indigo-950"><X size={18} className="mt-1 shrink-0 text-indigo-600"/><p><strong>نصيحة:</strong> إذا كنت تكتب داخل نموذج، لن يتدخل اختصار البحث في النص. اضغط Esc لمسح بحث القائمة ثم تابع التنقل.</p></CardContent></Card>
  </div></main></DashboardLayout>;
}
