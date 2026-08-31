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
import CentralOperations from "./pages/CentralOperations";
import ExecutiveBI from "./pages/ExecutiveBI";
import CentralFinance from "./pages/CentralFinance";
import Governance from "./pages/Governance";

const modulePaths = ["/organization", "/erp/entities", "/erp/accounting", "/erp/portfolio", "/master-data", "/integrations", "/workflows", "/tasks", "/documents", "/audit", "/settings"];
function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/portal" component={Portal} /><Route path="/operations" component={CentralOperations} /><Route path="/bi" component={ExecutiveBI} /><Route path="/finance" component={CentralFinance} /><Route path="/governance" component={Governance} /><Route path="/erp" component={CentralERP} /><Route path="/sales" component={AutoSales} /><Route path="/parts" component={SpareParts} /><Route path="/workshop" component={Workshop} /><Route path="/rental" component={Rental} /><Route path="/import-export" component={ImportExport} />{modulePaths.map((path) => <Route key={path} path={path}>{() => <ModulePlaceholder path={path} />}</Route>)}<Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
