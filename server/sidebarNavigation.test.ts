import { describe, expect, it } from "vitest";
import { normalizeSidebarFavorites, normalizeSidebarSearch, readSidebarFavorites, searchSidebarItems, sidebarFavoritesKey, toggleSidebarFavorite } from "../shared/sidebarNavigation";

const items = [
  { path: "/rental", label: "تأجير السيارات", keywords: ["rental"] },
  { path: "/automation", label: "مركز الأتمتة" },
  { path: "/hr", label: "الموارد البشرية" },
  { path: "/finance", label: "المالية والخزينة" },
];
describe("Sidebar search", () => {
  it("returns the original catalog order for empty and whitespace searches", () => {
    expect(searchSidebarItems(items, "")).toEqual(items);
    expect(searchSidebarItems(items, "   ")).toEqual(items);
  });
  it("ignores Arabic marks, tatweel and alef differences", () => {
    expect(searchSidebarItems(items, "تَـأْجِير")).toEqual([items[0]]);
    expect(searchSidebarItems(items, "اتمتة")).toEqual([items[1]]);
    expect(searchSidebarItems(items, "  المَوَارد  ")).toEqual([items[2]]);
    expect(normalizeSidebarSearch("أ إ آ ى")).toBe("ا ا ا ي");
  });
  it("matches every search term regardless of word order", () => {
    expect(searchSidebarItems(items, "السيارات تاجير")).toEqual([items[0]]);
    expect(searchSidebarItems(items, "تأجير مالية")).toEqual([]);
  });
  it("supports route keywords in English without case sensitivity", () => {
    expect(searchSidebarItems(items, "FINANCE")).toEqual([items[3]]);
    expect(searchSidebarItems(items, "RENTAL")).toEqual([items[0]]);
  });
  it("does not mutate the catalog", () => {
    const before = JSON.stringify(items);
    searchSidebarItems(items, "تأجير");
    expect(JSON.stringify(items)).toBe(before);
  });
});
describe("Sidebar favorites", () => {
  it("accepts only catalog paths, removing duplicates and invalid values", () => {
    expect(normalizeSidebarFavorites(["/finance", "/rental", "/finance", 42, "https://example.com", "/unknown"], items)).toEqual(["/finance", "/rental"]);
    expect(normalizeSidebarFavorites({ path: "/rental" }, items)).toEqual([]);
  });
  it("restores saved favorites and safely handles corrupted storage", () => {
    expect(readSidebarFavorites('["/rental","/finance"]', items)).toEqual(["/rental", "/finance"]);
    for (const raw of [null, "oops", "null", "{}", "42", "x".repeat(20001)]) expect(readSidebarFavorites(raw, items)).toEqual([]);
  });
  it("adds and removes favorites without mutating the source list", () => {
    const original = ["/rental"];
    expect(toggleSidebarFavorite(original, "/finance", items)).toEqual(["/rental", "/finance"]);
    expect(toggleSidebarFavorite(original, "/rental", items)).toEqual([]);
    expect(original).toEqual(["/rental"]);
  });
  it("does not add arbitrary links and removes obsolete catalog entries", () => {
    expect(toggleSidebarFavorite(["/obsolete", "/rental"], "/unknown", items)).toEqual(["/rental"]);
  });
  it("uses isolated versioned keys per authenticated user", () => {
    expect(sidebarFavoritesKey(1)).toBe("rasd:sidebar-favorites:v1:1");
    expect(sidebarFavoritesKey(1)).not.toBe(sidebarFavoritesKey(2));
  });
  it("can filter a favorite subset without admitting non-favorites", () => {
    const favorites = items.filter(item => item.path === "/rental");
    expect(searchSidebarItems(favorites, "finance")).toEqual([]);
    expect(searchSidebarItems(favorites, "تاجير")).toEqual([items[0]]);
  });
});
