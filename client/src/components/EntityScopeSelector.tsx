import { Building2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEntityScope } from "@/hooks/useEntityScope";

export default function EntityScopeSelector() {
  const { memberships, activeMembership, businessEntityId, setBusinessEntityId, isLoading, hasContext } = useEntityScope();

  if (isLoading) return <div className="rounded-xl border bg-white px-3 py-2 text-xs text-muted-foreground">جاري تحميل نطاق الكيان…</div>;
  if (!hasContext) return <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">لا توجد عضوية فعالة في أي كيان.</div>;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 shadow-sm" dir="rtl">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">نطاق العمل</span>
      <select
        value={businessEntityId ?? ""}
        onChange={event => setBusinessEntityId(Number(event.target.value))}
        className="min-w-[180px] rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
        aria-label="اختيار كيان الأعمال"
      >
        {memberships.map(membership => (
          <option key={membership.id} value={membership.businessEntityId}>
            {membership.entityName} · {membership.roleKey}
          </option>
        ))}
      </select>
      {activeMembership && <Badge variant="outline" className="gap-1"><Check className="h-3 w-3" />{activeMembership.entityType}</Badge>}
    </div>
  );
}
