import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { NavBar } from "@/components/NavBar";
import { SettingsModal } from "@/components/SettingsModal";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import NotesPage from "@/pages/NotesPage";

const queryClient = new QueryClient();

function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <NavBar onOpenSettings={() => setSettingsOpen(true)} />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/notes" component={NotesPage} />
        <Route component={NotFound} />
      </Switch>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
