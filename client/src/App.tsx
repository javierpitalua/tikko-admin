import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import EventNewPage from "@/pages/event-new";
import ReservePage from "@/pages/reserve";
import NotFound from "@/pages/not-found";

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const style = {
    "--sidebar-width": "16.5rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 px-5 h-14 border-b border-border/60 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-5 md:p-7">
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/events" component={EventsPage} />
              <Route path="/events/new" component={EventNewPage} />
              <Route path="/events/:id" component={EventDetailPage} />
              <Route path="/reserve" component={ReservePage} />
              <Route>
                <Redirect to="/dashboard" />
              </Route>
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isAuthenticated && location === "/login") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route>
        <ProtectedLayout />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
