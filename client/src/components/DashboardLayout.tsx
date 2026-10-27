import { useAuth } from "@/_core/hooks/useAuth";
import UnifiedEmployeeLogin from "@/components/UnifiedEmployeeLogin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { useSidebarFavorites } from "@/hooks/useSidebarFavorites";
import { searchSidebarItems } from "../../../shared/sidebarNavigation";
import { Activity, BarChart3, Boxes, Building2, Calculator, ChevronDown, ClipboardCheck, Database, FileText, Files, LayoutDashboard, LogOut, PanelRight, Settings2, ShieldCheck, Workflow, Landmark, BriefcaseBusiness, ChartNoAxesCombined, CarFront, PackageSearch, Wrench, KeyRound, Ship, Globe2, Command, UsersRound, Warehouse, Handshake, Zap, Network, Smartphone, MessageSquare, WalletCards, CreditCard, Target, AlertTriangle, Gavel, BellRing, LockKeyhole, Search, Star, X } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const menuItems = [
  { icon: LayoutDashboard, label: "نظرة عامة", path: "/" },
  { icon: ShieldCheck, label: "مركز التحكم المؤسسي", path: "/admin/control-center" },
  { icon: Building2, label: "الهيكل المؤسسي", path: "/organization" },
  { icon: Landmark, label: "سجل كيانات الأعمال", path: "/erp/entities" },
  { icon: BriefcaseBusiness, label: "دفاتر المحاسبة", path: "/erp/accounting" },
  { icon: ChartNoAxesCombined, label: "المحفظة والاستثمار", path: "/erp/portfolio" },
  { icon: CarFront, label: "مبيعات السيارات", path: "/sales" },
  { icon: PackageSearch, label: "قطع الغيار", path: "/parts" },
  { icon: Wrench, label: "الورشة", path: "/workshop" },
  { icon: KeyRound, label: "تأجير السيارات", path: "/rental" },
  { icon: Ship, label: "الاستيراد والتصدير", path: "/import-export" },
  { icon: Globe2, label: "البوابة الموحدة", path: "/portal" },
  { icon: Globe2, label: "حسابات وخدمات العملاء", path: "/customer-portal" },
  { icon: Command, label: "مركز العمليات", path: "/operations" },
  { icon: Zap, label: "مركز الأتمتة", path: "/automation" },
  { icon: AlertTriangle, label: "الإنذار المبكر", path: "/early-warnings" },
  { icon: Network, label: "مركز التكاملات", path: "/integrations-center" },
  { icon: MessageSquare, label: "مركز الاتصالات", path: "/communication-center" },
  { icon: ShieldCheck, label: "الهوية والأمن", path: "/security" },
  { icon: Smartphone, label: "تجربة الجوال", path: "/mobile-experience" },
  { icon: ChartNoAxesCombined, label: "الذكاء التحليلي", path: "/bi" },
  { icon: BarChart3, label: "لوحات المجالات", path: "/bi/domains" },
  { icon: Landmark, label: "المالية والخزينة", path: "/finance" },
  { icon: WalletCards, label: "الخزينة والمدفوعات", path: "/treasury" },
  { icon: CreditCard, label: "الفوترة والتحصيل الرقمي", path: "/payments" },
  { icon: Target, label: "التخطيط والميزانيات", path: "/planning" },
  { icon: BriefcaseBusiness, label: "المشاريع والمحفظة", path: "/projects" },
  { icon: Database, label: "حوكمة البيانات الرئيسية", path: "/mdm" },
  { icon: Calculator, label: "التكاليف والربحية", path: "/cost-accounting" },
  { icon: ShieldCheck, label: "حوكمة البيانات", path: "/governance" },
  { icon: ClipboardCheck, label: "المشتريات والموردون", path: "/procurement" },
  { icon: CarFront, label: "الأسطول ودورة المركبات", path: "/fleet" },
  { icon: UsersRound, label: "الموارد البشرية", path: "/hr" },
  { icon: Network, label: "المخطط التنظيمي", path: "/hr/organization-chart" },
  { icon: Boxes, label: "الأصول الثابتة", path: "/assets" },
  { icon: Warehouse, label: "المخزون والمستودعات", path: "/inventory" },
  { icon: Handshake, label: "إدارة علاقات العملاء", path: "/crm" },
  { icon: Files, label: "مركز المستندات", path: "/documents-center" },
  { icon: Boxes, label: "السجلات الرئيسية", path: "/master-data" },
  { icon: Workflow, label: "سير العمل", path: "/workflows" },
  { icon: ClipboardCheck, label: "المهام والموافقات", path: "/tasks" },
  { icon: FileText, label: "الوثائق", path: "/documents" },
  { icon: ShieldCheck, label: "مركز الامتثال القانوني", path: "/compliance" },
  { icon: Gavel, label: "حوكمة الامتثال والشؤون القانونية", path: "/compliance-governance" },
  { icon: BellRing, label: "تنبيهات تجديد التصاريح والعقود", path: "/compliance-renewals" },
  { icon: ShieldCheck, label: "التدقيق والأمن", path: "/audit" },
  { icon: LockKeyhole, label: "أمن المستخدمين وبيانات الدخول", path: "/admin/security-operations" },
  { icon: LockKeyhole, label: "الأمن المؤسسي وZero Trust", path: "/security-governance" },
  { icon: Settings2, label: "الإعدادات", path: "/settings" },
];
const primaryMenuPaths = new Set([
  "/",
  "/admin/control-center",
  "/sales",
  "/parts",
  "/workshop",
  "/rental",
  "/import-export",
  "/operations",
  "/finance",
  "/projects",
  "/inventory",
  "/crm",
  "/hr",
  "/documents-center",
  "/compliance",
  "/audit",
  "/admin/security-operations",
  "/settings",
]);
const primaryMenuItems = menuItems.filter(item => primaryMenuPaths.has(item.path));

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
      return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
    } catch { return DEFAULT_WIDTH; }
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); } catch { /* Private browsing may disable persistence. */ }
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return <UnifiedEmployeeLogin />;
  }

  return (
    <SidebarProvider
      dir="rtl"
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent key={user.id} setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpen, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [showMoreServices, setShowMoreServices] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const isCompact = isCollapsed && !isMobile;
  const [menuSearch, setMenuSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { favorites, toggleFavorite } = useSidebarFavorites(user?.id ?? 0, menuItems);
  const visibleItems = searchSidebarItems(menuItems, menuSearch);
  const displayedItems = menuSearch.trim() || showMoreServices ? visibleItems : primaryMenuItems;
  const favoriteItems = searchSidebarItems(favorites.map(path => menuItems.find(item => item.path === path)).filter((item): item is typeof menuItems[number] => Boolean(item)), menuSearch);

  const navigate = (path: string) => { setLocation(path); setOpenMobile(false); };
  const renderMenuItem = (item: typeof menuItems[number], section: "favorites" | "all") => {
    const favorite = favorites.includes(item.path);
    return <SidebarMenuItem key={`${section}:${item.path}`}>
      <SidebarMenuButton
        isActive={location === item.path}
        aria-current={location === item.path ? "page" : undefined}
        onClick={() => navigate(item.path)}
        tooltip={{ children: item.label, side: "left" }}
        className={`h-11 font-normal text-right ${isCompact ? "" : "pl-10"}`}
      >
        <item.icon className={`h-4 w-4 ${location === item.path ? "text-primary" : ""}`} />
        <span>{item.label}</span>
      </SidebarMenuButton>
      {!isCompact && <button type="button"
        aria-label={`${favorite ? "إزالة" : "إضافة"} ${item.label} ${favorite ? "من" : "إلى"} المفضلة`}
        aria-pressed={favorite}
        title={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        onClick={() => toggleFavorite(item.path)}
        className={`absolute left-0.5 top-1 grid size-9 place-items-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${favorite ? "text-amber-500" : "text-muted-foreground/60 hover:text-amber-500"}`}
      ><Star className="size-4" fill={favorite ? "currentColor" : "none"} /></button>}
    </SidebarMenuItem>;
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? window.innerWidth;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative shrink-0" ref={sidebarRef}>
        <Sidebar
          side="right"
          collapsible="icon"
          className="border-l border-sidebar-border"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="طي أو توسيع القائمة"
              >
                <PanelRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCompact ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col items-start truncate"><span className="text-lg font-semibold tracking-tight">RASD</span><span className="text-[10px] font-normal text-muted-foreground">لوحة الإدارة المؤسسية</span></div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <div className={isCompact ? "px-2 pb-2" : "px-3 pb-3"}>
            {isCompact ? <button type="button" aria-label="فتح البحث داخل القائمة" title="البحث داخل القائمة"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => { setOpen(true); requestAnimationFrame(() => searchRef.current?.focus()); }}><Search size={16} /></button> : <>
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                <Input ref={searchRef} type="search" aria-label="البحث داخل القائمة" placeholder="ابحث عن خدمة…"
                  value={menuSearch} onChange={event => setMenuSearch(event.target.value)}
                  onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setMenuSearch(""); } }}
                  className="h-10 bg-background pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:appearance-none" />
                {menuSearch && <button type="button" aria-label="مسح البحث في القائمة" onClick={() => { setMenuSearch(""); searchRef.current?.focus(); }}
                  className="absolute left-1 top-1 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"><X size={14} /></button>}
              </div>
              {menuSearch.trim() && <p role="status" className="mt-2 text-xs text-muted-foreground">{visibleItems.length} خدمة مطابقة</p>}
            </>}
          </div>

          <SidebarContent className="gap-0">
            <nav aria-label="الخدمات المفضلة" data-sidebar-section="favorites" className="px-2 pb-2">
              {!isCompact && <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5 font-medium"><Star size={13} className="text-amber-500" />الخدمات المفضلة</span><span>{favoriteItems.length}</span></div>}
              <SidebarMenu>{favoriteItems.map(item => renderMenuItem(item, "favorites"))}</SidebarMenu>
              {!isCompact && favoriteItems.length === 0 && <p className="px-2 pb-2 text-xs leading-6 text-muted-foreground">{menuSearch.trim() && favorites.length ? "لا توجد مفضلة مطابقة للبحث." : "اضغط النجمة بجوار أي خدمة لإضافتها هنا."}</p>}
              {(favoriteItems.length > 0 || !isCompact) && <div className="mt-2 border-b border-border" />}
            </nav>
            <nav aria-label="جميع الخدمات" data-sidebar-section="all" className="px-2 py-1">
              {!isCompact && <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">الخدمات الأساسية</p>}
              <SidebarMenu>{displayedItems.map(item => renderMenuItem(item, "all"))}</SidebarMenu>
              {!isCompact && visibleItems.length === 0 && <p role="status" className="rounded-lg bg-muted/50 px-3 py-4 text-center text-xs leading-6 text-muted-foreground">لا توجد خدمة مطابقة. جرّب كلمة أخرى.</p>}
              {!isCompact && !menuSearch.trim() && <button type="button" onClick={() => setShowMoreServices(value => !value)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><ChevronDown className={`size-4 transition-transform ${showMoreServices ? "rotate-180" : ""}`} />{showMoreServices ? "إخفاء الخدمات المتقدمة" : `عرض المزيد (${menuItems.length - primaryMenuItems.length})`}</button>}
            </nav>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          data-slot="sidebar-resize-handle"
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed || isMobile ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="min-w-0">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger aria-label="فتح القائمة" className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "القائمة"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
