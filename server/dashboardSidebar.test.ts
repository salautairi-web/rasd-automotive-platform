import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "../client/src/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "../client/src/components/DashboardLayoutSkeleton";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "مسؤول اختبار", email: "qa@example.invalid" }, loading: false, logout: vi.fn() }) }));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("wouter", () => ({ useLocation: () => ["/admin/control-center", vi.fn()] }));
beforeEach(() => { vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() }); vi.stubGlobal("React", React); });

describe("Arabic dashboard sidebar layout", () => {
  it("renders the shared sidebar on the physical right within RTL layout", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardLayout, { children: React.createElement("h1", {}, "المحتوى") }));
    expect(html).toMatch(/data-slot="sidebar-wrapper"[^>]*dir="rtl"/);
    expect(html).toContain('data-side="right"');
    expect(html).toContain('right-0 group-data-[collapsible=offcanvas]');
    expect(html).toContain("المحتوى");
  });
  it("does not add a second left or right margin beyond the native sidebar spacer", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardLayout, { children: "اختبار" }));
    const inset = html.match(/<main[^>]*data-slot="sidebar-inset"[^>]*>/)?.[0];
    expect(inset).toBeDefined();
    expect(inset).not.toContain("ml-[var(--sidebar-width");
    expect(inset).not.toContain("mr-[var(--sidebar-width");
    expect(html).toContain('data-slot="sidebar-gap"');
  });
  it("places the resizing handle on the sidebar's inner left edge", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardLayout, { children: "اختبار" }));
    expect(html).toMatch(/data-slot="sidebar-resize-handle"[^>]*class="[^"]*left-0/);
    expect(html).toContain("طي أو توسيع القائمة");
  });
  it("uses RTL loading layout with a mobile-hidden right sidebar placeholder", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardLayoutSkeleton));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("border-l");
    expect(html).toContain("md:block");
    expect(html).toContain("shrink-0");
  });
});
