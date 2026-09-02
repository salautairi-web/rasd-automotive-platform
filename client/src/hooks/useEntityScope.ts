import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "rasd.active-business-entity";

export function useEntityScope() {
  const { data: memberships, isLoading, isError } = trpc.portal.memberships.useQuery(undefined, { retry: false });
  const [storedId, setStoredId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });

  const activeMembership = useMemo(() => {
    if (!memberships?.length) return null;
    return memberships.find(m => m.businessEntityId === storedId) ?? memberships[0];
  }, [memberships, storedId]);

  useEffect(() => {
    if (!activeMembership) return;
    setStoredId(activeMembership.businessEntityId);
    window.localStorage.setItem(STORAGE_KEY, String(activeMembership.businessEntityId));
  }, [activeMembership]);

  const setBusinessEntityId = (businessEntityId: number) => {
    setStoredId(businessEntityId);
    window.localStorage.setItem(STORAGE_KEY, String(businessEntityId));
  };

  return {
    memberships: memberships ?? [],
    activeMembership,
    businessEntityId: activeMembership?.businessEntityId ?? null,
    setBusinessEntityId,
    isLoading,
    isError,
    hasContext: Boolean(activeMembership),
  };
}
