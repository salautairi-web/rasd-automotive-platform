import { useEffect, useState } from "react";
import { toast } from "sonner";
import { readSidebarFavorites, sidebarFavoritesKey, toggleSidebarFavorite, type SidebarEntry } from "../../../shared/sidebarNavigation";

export function useSidebarFavorites(userId: number, items: readonly SidebarEntry[]) {
  const key = sidebarFavoritesKey(userId);
  const load = () => {
    try { return readSidebarFavorites(localStorage.getItem(key), items); } catch { return []; }
  };
  const [favorites, setFavorites] = useState<string[]>(load);
  useEffect(() => {
    // Reload for a new account instead of writing another account's preference into its key.
    setFavorites(load());
    const update = (event: StorageEvent) => {
      if (event.key === key || event.key === null) setFavorites(load());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [key, items]);

  const toggle = (path: string) => {
    const next = toggleSidebarFavorite(favorites, path, items);
    setFavorites(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { toast.warning("تم تحديث المفضلة لهذه الجلسة؛ إعدادات المتصفح لا تسمح بحفظها بعد الإغلاق."); }
  };
  return { favorites, toggleFavorite: toggle };
}
