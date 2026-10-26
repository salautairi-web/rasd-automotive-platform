import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import UnifiedEmployeeLogin from "./components/UnifiedEmployeeLogin";
const CentralERP = lazy(() => import("./pages/CentralERP"));
const AutoSales = lazy(() => import("./pages/AutoSales"));
const SpareParts = lazy(() => import("./pages/SpareParts"));
const Workshop = lazy(() => import("./pages/Workshop"));
const Rental = lazy(() => import("./pages/Rental"));
const ImportExport = lazy(() => import("./pages/ImportExport"));
const Portal = lazy(() => import("./pages/Portal"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const CentralOperations = lazy(() => import("./pages/CentralOperations"));
const ExecutiveBI = lazy(() => import("./pages/ExecutiveBI"));
const DomainAnalytics = lazy(() => import("./pages/DomainAnalytics"));
const CentralFinance = lazy(() => import("./pages/CentralFinance"));
const Treasury = lazy(() => import("./pages/Treasury"));
const Treasury64 = lazy(() => import("./pages/Treasury64"));
const ARAP65 = lazy(() => import("./pages/ARAP65"));
const Consolidation66 = lazy(() => import("./pages/Consolidation66"));
const FPNA67 = lazy(() => import("./pages/FPNA67"));
const CRM68 = lazy(() => import("./pages/CRM68"));
const Procurement69 = lazy(() => import("./pages/Procurement69"));
const DMS70 = lazy(() => import("./pages/DMS70"));
const Workflow71 = lazy(() => import("./pages/Workflow71"));
const Approval72 = lazy(() => import("./pages/Approval72"));
const BI73 = lazy(() => import("./pages/BI73"));
const MDM74 = lazy(() => import("./pages/MDM74"));
const RiskResilience49 = lazy(() => import("./pages/RiskResilience49"));
const AuditAssurance50 = lazy(() => import("./pages/AuditAssurance50"));
const ExternalAuditorWorkspace50 = lazy(() => import("./pages/ExternalAuditorWorkspace50"));
const ExternalAuditorLive50 = lazy(() => import("./pages/ExternalAuditorLive50"));
const CustomerExperience51 = lazy(() => import("./pages/CustomerExperience51"));
const WorkflowBpm52 = lazy(() => import("./pages/WorkflowBpm52"));
const WorkflowDesigner52 = lazy(() => import("./pages/WorkflowDesigner52"));
const Planning = lazy(() => import("./pages/Planning"));
const Governance = lazy(() => import("./pages/Governance"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Fleet = lazy(() => import("./pages/Fleet"));
const FleetLifecycle58 = lazy(() => import("./pages/FleetLifecycle58"));
const Workshop59 = lazy(() => import("./pages/Workshop59"));
const Trading60 = lazy(() => import("./pages/Trading60"));
const Trade61 = lazy(() => import("./pages/Trade61"));
const Projects62 = lazy(() => import("./pages/Projects62"));
const HR63 = lazy(() => import("./pages/HR63"));
const HumanResources = lazy(() => import("./pages/HumanResources"));
const OrganizationChart = lazy(() => import("./pages/OrganizationChart"));
const Assets = lazy(() => import("./pages/Assets"));
const AssetLifecycle57 = lazy(() => import("./pages/AssetLifecycle57"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryOperations56 = lazy(() => import("./pages/InventoryOperations56"));
const CRM = lazy(() => import("./pages/CRM"));
const DocumentCenter = lazy(() => import("./pages/DocumentCenter"));
const Automation = lazy(() => import("./pages/Automation"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Security = lazy(() => import("./pages/Security"));
const SecurityGovernance43 = lazy(() => import("./pages/SecurityGovernance43"));
const MobileExperience = lazy(() => import("./pages/MobileExperience"));
const Payments = lazy(() => import("./pages/Payments"));
const CommunicationCenter = lazy(() => import("./pages/CommunicationCenter"));
const Compliance = lazy(() => import("./pages/Compliance"));
const ComplianceGovernance = lazy(() => import("./pages/ComplianceGovernance"));
const ComplianceRenewals = lazy(() => import("./pages/ComplianceRenewals"));
const CostAccounting = lazy(() => import("./pages/CostAccounting"));
const Projects = lazy(() => import("./pages/Projects"));
const Mdm = lazy(() => import("./pages/Mdm"));
const EarlyWarnings = lazy(() => import("./pages/EarlyWarnings"));
const AdminControlCenter = lazy(() => import("./pages/AdminControlCenter"));
const AdminRoleManagement = lazy(() => import("./pages/AdminRoleManagement"));
const InviteAcceptance = lazy(() => import("./pages/InviteAcceptance"));
const DomainExperienceHub = lazy(() => import("./pages/DomainExperienceHub"));

function PageLoading() {
  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm">جارٍ تحميل الوحدة…</div></main>;
}

function Router() {
  return <Switch><Route path="/login" component={UnifiedEmployeeLogin} /><Route path="/" component={Home} /><Route path="/admin/control-center" component={AdminControlCenter} /><Route path="/admin/roles" component={AdminRoleManagement} /><Route path="/invite/accept" component={InviteAcceptance} /><Route path="/automation" component={Automation} /><Route path="/integrations-center" component={Integrations} /><Route path="/security" component={Security} /><Route path="/security-governance" component={SecurityGovernance43} /><Route path="/mobile-experience" component={MobileExperience} /><Route path="/mobile" component={MobileExperience} /><Route path="/payments" component={Payments} /><Route path="/communication-center" component={CommunicationCenter} /><Route path="/compliance" component={Compliance} /><Route path="/compliance-governance" component={ComplianceGovernance} /><Route path="/compliance-renewals" component={ComplianceRenewals} /><Route path="/cost-accounting" component={CostAccounting} /><Route path="/projects" component={Projects} /><Route path="/mdm" component={Mdm} /><Route path="/early-warnings" component={EarlyWarnings} /><Route path="/documents-center" component={DocumentCenter} /><Route path="/portal" component={Portal} /><Route path="/customer-portal" component={CustomerPortal} /><Route path="/customer-portal/register" component={CustomerPortal} /><Route path="/customer-portal/login" component={CustomerPortal} /><Route path="/customer-experience/domains" component={() => <DomainExperienceHub mode="customer" />} /><Route path="/user-experience/domains" component={() => <DomainExperienceHub mode="user" />} /><Route path="/operations" component={CentralOperations} /><Route path="/bi" component={ExecutiveBI} /><Route path="/bi/domains" component={DomainAnalytics} /><Route path="/finance" component={CentralFinance} /><Route path="/treasury" component={Treasury} /><Route path="/treasury/operations" component={Treasury64} /><Route path="/ar-ap/operations" component={ARAP65} /><Route path="/finance/consolidation" component={Consolidation66} /><Route path="/finance/fpna" component={FPNA67} /><Route path="/crm/customer-360" component={CRM68} /><Route path="/procurement/sourcing" component={Procurement69} /><Route path="/documents/dms" component={DMS70} /><Route path="/workflow/engine" component={Workflow71} /><Route path="/workflow/approval-designer" component={Approval72} /><Route path="/bi/executive" component={BI73} /><Route path="/mdm/governance" component={MDM74} /><Route path="/risk-resilience" component={RiskResilience49} /><Route path="/audit-assurance" component={AuditAssurance50} /><Route path="/external-auditor" component={ExternalAuditorWorkspace50} /><Route path="/external-auditor/live" component={ExternalAuditorLive50} /><Route path="/customer-experience" component={CustomerExperience51} /><Route path="/workflow-bpm" component={WorkflowBpm52} /><Route path="/workflow-bpm/designer" component={WorkflowDesigner52} /><Route path="/planning" component={Planning} /><Route path="/governance" component={Governance} /><Route path="/procurement" component={Procurement} /><Route path="/fleet" component={Fleet} /><Route path="/fleet/lifecycle" component={FleetLifecycle58} /><Route path="/trading/operations" component={Trading60} /><Route path="/trade/international" component={Trade61} /><Route path="/projects/pmo" component={Projects62} /><Route path="/hr/payroll" component={HR63} /><Route path="/hr" component={HumanResources} /><Route path="/hr/organization-chart" component={OrganizationChart} /><Route path="/assets" component={Assets} /><Route path="/assets/lifecycle" component={AssetLifecycle57} /><Route path="/inventory" component={Inventory} /><Route path="/inventory/operations" component={InventoryOperations56} /><Route path="/crm" component={CRM} /><Route path="/erp" component={CentralERP} /><Route path="/sales" component={AutoSales} /><Route path="/parts" component={SpareParts} /><Route path="/workshop" component={Workshop59} /><Route path="/rental" component={Rental} /><Route path="/import-export" component={ImportExport} /><Route path="/organization" component={OrganizationChart} /><Route path="/erp/entities" component={CentralERP} /><Route path="/erp/accounting" component={CentralFinance} /><Route path="/erp/portfolio" component={ExecutiveBI} /><Route path="/master-data" component={Mdm} /><Route path="/integrations" component={Integrations} /><Route path="/workflows" component={Workflow71} /><Route path="/tasks" component={CentralOperations} /><Route path="/documents" component={DocumentCenter} /><Route path="/audit" component={AuditAssurance50} /><Route path="/settings" component={AdminControlCenter} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Suspense fallback={<PageLoading />}><Router /></Suspense></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
