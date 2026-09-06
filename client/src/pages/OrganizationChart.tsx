import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { filterOrganizationNodes, organizationChildren, organizationRoots } from "@shared/orgChart";
import { Building2, ChevronDown, ChevronLeft, ChevronUp, Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";

type ChartNode = { id: number; parentUnitId: number | null; unitCode: string; nameAr: string; unitType: string; employeeCount: number; hasChildren: boolean; employees: Array<{ employmentNo: string; fullNameAr: string; status: string; positionId: number | null }> };

const typeLabels: Record<string, string> = { company: "شركة", branch: "فرع", department: "إدارة", team: "فريق", cost_center: "مركز تكلفة" };

export default function OrganizationChart() {
  const [businessEntityId, setBusinessEntityId] = useState(1);
  const [query, setQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const input = useMemo(() => ({ businessEntityId }), [businessEntityId]);
  const { data, isLoading, isError } = trpc.hr41.orgChart.useQuery(input, { retry: false });
  const nodes = (data?.nodes ?? []) as ChartNode[];
  const visibleNodes = useMemo(() => filterOrganizationNodes(nodes, query, unitFilter).filter(node => !query.trim() || node.employees.some(employee => employee.fullNameAr.includes(query.trim())) || node.nameAr.includes(query.trim())), [nodes, query, unitFilter]);
  const roots = organizationRoots(visibleNodes);
  const selected = nodes.find(node => node.id === selectedId) ?? null;
  const children = (parentId: number) => organizationChildren(visibleNodes, parentId);
  const toggle = (id: number) => setExpanded(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const renderNode = (node: ChartNode, depth = 0): ReactElement => {
    const nodeChildren = children(node.id);
    const isOpen = expanded.has(node.id) || query.trim().length > 0;
    const active = selectedId === node.id;
    return <div key={node.id} className="relative" style={{ marginRight: depth ? 20 : 0 }}>
      {depth > 0 && <span className="absolute -right-3 top-0 h-1/2 w-3 border-b border-r border-slate-200" aria-hidden="true" />}
      <button type="button" onClick={() => setSelectedId(node.id)} className={`relative mb-3 w-full rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${active ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white"}`} aria-pressed={active}>
        <div className="flex items-start gap-3"><span className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><Building2 size={18}/></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong className="truncate text-sm sm:text-base">{node.nameAr}</strong><Badge variant="outline">{typeLabels[node.unitType] ?? node.unitType}</Badge></span><span className="mt-1 block text-xs text-slate-500">{node.unitCode} · {node.employeeCount} موظف</span></span>{node.hasChildren && <span onClick={event => { event.stopPropagation(); toggle(node.id); }} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" role="button" aria-label={isOpen ? "طي الوحدة" : "توسيع الوحدة"}>{isOpen ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</span>}</div>
      </button>
      {isOpen && nodeChildren.length > 0 && <div className="mr-3 border-r border-dashed border-slate-200 pr-3">{nodeChildren.map(child => renderNode(child, depth + 1))}</div>}
    </div>;
  };

  return <DashboardLayout><div dir="rtl" className="-m-4 min-h-[calc(100vh-2rem)] bg-[#f7f9fc] p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-3 border-0 bg-indigo-50 text-indigo-700">HR · Organization Chart</Badge><h1 className="text-3xl font-semibold">المخطط التنظيمي</h1><p className="mt-2 text-sm text-slate-500">استكشف هيكل الكيان والوحدات والموظفين دون كشف بيانات كيان آخر.</p></div><label className="text-sm text-slate-600">معرف الكيان<input value={businessEntityId} onChange={event => setBusinessEntityId(Math.max(1, Number(event.target.value) || 1))} type="number" className="mt-1 block w-28 rounded-xl border bg-white px-3 py-2" /></label></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="border-0"><CardContent className="p-5"><p className="text-sm text-slate-500">الوحدات الفعالة</p><strong className="mt-2 block text-2xl">{data?.totalUnits ?? 0}</strong></CardContent></Card><Card className="border-0"><CardContent className="p-5"><p className="text-sm text-slate-500">العاملون النشطون</p><strong className="mt-2 block text-2xl">{data?.totalEmployees ?? 0}</strong></CardContent></Card><Card className="border-0"><CardContent className="p-5"><p className="text-sm text-slate-500">الوحدات الظاهرة</p><strong className="mt-2 block text-2xl">{visibleNodes.length}</strong></CardContent></Card></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><Card className="border-0"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>شجرة الهيكل</CardTitle><div className="flex flex-wrap gap-2"><div className="relative"><Search className="pointer-events-none absolute right-3 top-2.5 text-slate-400" size={16}/><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن وحدة أو موظف" className="w-56 pr-9" aria-label="البحث في المخطط التنظيمي" /></div><select value={unitFilter} onChange={event => setUnitFilter(event.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm" aria-label="تصفية نوع الوحدة"><option value="all">كل الوحدات</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => setExpanded(new Set(visibleNodes.filter(node => node.hasChildren).map(node => node.id)))} className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">توسيع الكل</button><button type="button" onClick={() => setExpanded(new Set())} className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">طي الكل</button></div></div></CardHeader><CardContent>{isLoading ? <div className="space-y-3"><div className="h-20 animate-pulse rounded-2xl bg-slate-100"/><div className="h-20 animate-pulse rounded-2xl bg-slate-100"/></div> : isError ? <div className="rounded-xl bg-rose-50 p-6 text-rose-700">لا يمكن تحميل المخطط لهذا الكيان أو لا تملك الصلاحية المناسبة.</div> : roots.length ? <div>{roots.map(node => renderNode(node))}</div> : <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">لا توجد وحدات مطابقة للفلاتر الحالية.</div>}</CardContent></Card>
    <Card className="border-0"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound size={18}/>تفاصيل الوحدة</CardTitle></CardHeader><CardContent>{selected ? <div className="space-y-5"><div><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{selected.nameAr}</h2><Badge>{typeLabels[selected.unitType] ?? selected.unitType}</Badge></div><p className="mt-1 text-sm text-slate-500">{selected.unitCode}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">عدد الموظفين</p><strong className="mt-1 block text-2xl">{selected.employeeCount}</strong></div><div><h3 className="mb-2 font-semibold">أعضاء الوحدة</h3><div className="space-y-2">{selected.employees.length ? selected.employees.map(employee => <div key={employee.employmentNo} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm"><span><strong>{employee.fullNameAr}</strong><span className="block text-xs text-slate-500">{employee.employmentNo}</span></span><Badge variant="outline">{employee.status}</Badge></div>) : <p className="text-sm text-slate-500">لا توجد أسماء موظفين ظاهرة لهذه الوحدة.</p>}</div></div></div> : <div className="flex min-h-52 flex-col items-center justify-center text-center text-slate-500"><ChevronLeft className="mb-2" size={26}/><p>اختر وحدة من المخطط لعرض تفاصيلها وأعضائها.</p></div>}</CardContent></Card></div>
  </div></div></DashboardLayout>;
}
