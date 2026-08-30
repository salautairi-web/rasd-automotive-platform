import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const modulePaths = ["/organization", "/master-data", "/integrations", "/workflows", "/tasks", "/documents", "/audit", "/settings"];
function Router() {
  return <Switch><Route path="/" component={Home} />{modulePaths.map((path) => <Route key={path} path={path}>{() => <ModulePlaceholder path={path} />}</Route>)}<Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
