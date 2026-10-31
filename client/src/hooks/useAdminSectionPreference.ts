import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminSectionPreferenceKey,
  normalizeAdminSection,
  readAdminSectionPreference,
  type AdminSectionKey,
} from "../../../shared/adminNavigation";

export function useAdminSectionPreference(
  userId: number | string,
  fallback: AdminSectionKey,
) {
  const key = adminSectionPreferenceKey(userId);
  const load = () => {
    try {
      return readAdminSectionPreference(localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  };
  const [section, setSectionState] = useState<AdminSectionKey>(load);

  useEffect(() => {
    setSectionState(load());
    const update = (event: StorageEvent) => {
      if (event.key === key || event.key === null) setSectionState(load());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [key, fallback]);

  const setSection = (value: AdminSectionKey) => {
    const next = normalizeAdminSection(value, fallback);
    setSectionState(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      toast.warning("تم حفظ القسم لهذه الجلسة؛ إعدادات المتصفح لا تسمح بالحفظ بعد الإغلاق.");
    }
  };

  return { section, setSection };
}
