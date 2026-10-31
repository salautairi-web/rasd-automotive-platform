import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminTabPreferencesKey,
  normalizeAdminTabPreferences,
  readAdminTabPreferences,
  type AdminSectionKey,
  type AdminTabPreferences,
} from "../../../shared/adminNavigation";

export function useAdminTabPreferences(userId: number | string) {
  const key = adminTabPreferencesKey(userId);
  const load = (): AdminTabPreferences => {
    try {
      return readAdminTabPreferences(localStorage.getItem(key));
    } catch {
      return {};
    }
  };
  const [tabs, setTabs] = useState<AdminTabPreferences>(load);

  useEffect(() => {
    setTabs(load());
    const update = (event: StorageEvent) => {
      if (event.key === key || event.key === null) setTabs(load());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [key]);

  const saveTab = (section: AdminSectionKey, tab: string) => {
    const next = normalizeAdminTabPreferences({ ...tabs, [section]: tab });
    setTabs(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      toast.warning("تم حفظ التبويب لهذه الجلسة؛ إعدادات المتصفح لا تسمح بالحفظ بعد الإغلاق.");
    }
  };

  return { tabs, saveTab };
}
