import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CentralERP from "./pages/CentralERP";
import AutoSales from "./pages/AutoSales";
import SpareParts from "./pages/SpareParts";
import Workshop from "./pages/Workshop";
import Rental from "./pages/Rental";
import ImportExport from "./pages/ImportExport";
import Portal from "./pages/Portal";
import CustomerPortal from "./pages/CustomerPortal";
import CentralOperations from "./pages/CentralOperations";
import ExecutiveBI from "./pages/ExecutiveBI";
import CentralFinance from "./pages/CentralFinance";
import Treasury from "./pages/Treasury";
import Planning from "./pages/Planning";
import Governance from "./pages/Governance";
import Procurement from "./pages/Procurement";
import Fleet from "./pages/Fleet";
import HumanResources from "./pages/HumanResources";
import OrganizationChart from "./pages/OrganizationChart";
import Assets from "./pages/Assets";
import Inventory from "./pages/Inventory";
import CRM from "./pages/CRM";
import DocumentCenter from "./pages/DocumentCenter";
import Automation from "./pages/Automation";
import Integrations from "./pages/Integrations";
import Security from "./pages/Security";
import MobileExperience from "./pages/MobileExperience";
import CommunicationCenter from "./pages/CommunicationCenter";
import Compliance from "./pages/Compliance";
import ComplianceGovernance from "./pages/ComplianceGovernance";
import ComplianceRenewals from "./pages/ComplianceRenewals";
import CostAccounting from "./pages/CostAccounting";
import Projects from "./pages/Projects";
import Mdm from "./pages/Mdm";
import EarlyWarnings from "./pages/EarlyWarnings";

const modulePaths = ["/organization", "/erp/entities", "/erp/accounting", "/erp/portfolio", "/master-data", "/integrations", "/workflows", "/tasks", "/documents", "/audit", "/settings"];
function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/automation" component={Automation} /><Route path="/integrations-center" component={Integrations} /><Route path="/security" component={Security} /><Route path="/mobile-experience" component={MobileExperience} /><Route path="/communication-center" component={CommunicationCenter} /><Route path="/compliance" component={Compliance} /><Route path="/compliance-governance" component={ComplianceGovernance} /><Route path="/compliance-renewals" component={ComplianceRenewals} /><Route path="/cost-accounting" component={CostAccounting} /><Route path="/projects" component={Projects} /><Route path="/mdm" component={Mdm} /><Route path="/early-warnings" component={EarlyWarnings} /><Route path="/documents-center" component={DocumentCenter} /><Route path="/portal" component={Portal} /><Route path="/customer-portal" component={CustomerPortal} /><Route path="/operations" component={CentralOperations} /><Route path="/bi" component={ExecutiveBI} /><Route path="/finance" component={CentralFinance} /><Route path="/treasury" component={Treasury} /><Route path="/planning" component={Planning} /><Route path="/governance" component={Governance} /><Route path="/procurement" component={Procurement} /><Route path="/fleet" component={Fleet} /><Route path="/hr" component={HumanResources} /><Route path="/hr/organization-chart" component={OrganizationChart} /><Route path="/assets" component={Assets} /><Route path="/inventory" component={Inventory} /><Route path="/crm" component={CRM} /><Route path="/erp" component={CentralERP} /><Route path="/sales" component={AutoSales} /><Route path="/parts" component={SpareParts} /><Route path="/workshop" component={Workshop} /><Route path="/rental" component={Rental} /><Route path="/import-export" component={ImportExport} />{modulePaths.map((path) => <Route key={path} path={path}>{() => <ModulePlaceholder path={path} />}</Route>)}<Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
