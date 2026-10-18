import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

type BranchSelectorProps = {
  businessEntityId: number;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  ariaLabel?: string;
};

export default function BranchSelector({
  businessEntityId,
  value,
  onChange,
  label = "الفرع",
  ariaLabel = "فرع الوحدة",
}: BranchSelectorProps) {
  const { data: branches = [], isLoading } = trpc.branchOptions.useQuery(
    { businessEntityId },
    { enabled: businessEntityId > 0, retry: false }
  );

  useEffect(() => {
    if (value && !branches.some(branch => String(branch.id) === value)) {
      onChange("");
    }
  }, [branches, onChange, value]);

  return (
    <label className="text-sm text-slate-700">
      {label}
      <select
        aria-label={ariaLabel}
        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={isLoading || businessEntityId <= 0}
      >
        <option value="">كل فروع الكيان</option>
        {branches.map(branch => (
          <option key={branch.id} value={String(branch.id)}>
            {branch.nameAr} · {branch.code}
            {branch.city ? ` · ${branch.city}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
