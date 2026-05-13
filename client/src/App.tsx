import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import CareerPaths from "./pages/CareerPaths";
import CVAnalysis from "./pages/CVAnalysis";
import Interview from "./pages/Interview";
import Roadmap from "./pages/Roadmap";
import LinkedIn from "./pages/LinkedIn";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/chat" component={Chat} />
      <Route path="/career-paths" component={CareerPaths} />
      <Route path="/cv-analysis" component={CVAnalysis} />
      <Route path="/interview" component={Interview} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/linkedin" component={LinkedIn} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
