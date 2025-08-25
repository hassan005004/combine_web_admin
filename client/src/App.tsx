import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavigation } from "@/components/layout/top-navigation";
import { DomainSelector } from "@/components/domain-selector";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Pages from "@/pages/pages";
import Domains from "@/pages/domains";
import DomainSettings from "@/pages/domain-settings";
import SeoSettings from "@/pages/seo-settings";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";

const pageConfig = {
  "/dashboard": { title: "Dashboard", subtitle: "Manage your domains and content" },
  "/pages": { title: "Pages", subtitle: "Create and manage website pages" },
  "/domain-settings": { title: "Domain Settings", subtitle: "Configure domain-specific options" },
  "/seo-settings": { title: "SEO & Analytics", subtitle: "Optimize for search engines" },
  "/users": { title: "Users", subtitle: "Manage admin users and permissions" },
};

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="flex-1 lg:ml-64">
        <Switch>
          <Route path="/dashboard">
            {(params) => {
              const config = pageConfig["/dashboard"];
              return (
                <>
                  <TopNavigation
                    onMenuClick={() => setSidebarOpen(true)}
                    title={config.title}
                    subtitle={config.subtitle}
                  />
                  <div className="p-6">
                    <div className="mb-6">
                      <DomainSelector
                        selectedDomainId={selectedDomainId}
                        onDomainChange={setSelectedDomainId}
                      />
                    </div>
                    <Dashboard selectedDomainId={selectedDomainId} />
                  </div>
                </>
              );
            }}
          </Route>
          
          <Route path="/pages">
            {(params) => {
              const config = pageConfig["/pages"];
              return (
                <>
                  <TopNavigation
                    onMenuClick={() => setSidebarOpen(true)}
                    title={config.title}
                    subtitle={config.subtitle}
                  />
                  <div className="p-6">
                    <div className="mb-6">
                      <DomainSelector
                        selectedDomainId={selectedDomainId}
                        onDomainChange={setSelectedDomainId}
                      />
                    </div>
                    <Pages selectedDomainId={selectedDomainId} />
                  </div>
                </>
              );
            }}
          </Route>

          <Route path="/domain-settings">
            {(params) => {
              const config = pageConfig["/domain-settings"];
              return (
                <>
                  <TopNavigation
                    onMenuClick={() => setSidebarOpen(true)}
                    title={config.title}
                    subtitle={config.subtitle}
                  />
                  <div className="p-6">
                    <div className="mb-6">
                      <DomainSelector
                        selectedDomainId={selectedDomainId}
                        onDomainChange={setSelectedDomainId}
                      />
                    </div>
                    <DomainSettings selectedDomainId={selectedDomainId} />
                  </div>
                </>
              );
            }}
          </Route>

          <Route path="/seo-settings">
            {(params) => {
              const config = pageConfig["/seo-settings"];
              return (
                <>
                  <TopNavigation
                    onMenuClick={() => setSidebarOpen(true)}
                    title={config.title}
                    subtitle={config.subtitle}
                  />
                  <div className="p-6">
                    <div className="mb-6">
                      <DomainSelector
                        selectedDomainId={selectedDomainId}
                        onDomainChange={setSelectedDomainId}
                      />
                    </div>
                    <SeoSettings selectedDomainId={selectedDomainId} />
                  </div>
                </>
              );
            }}
          </Route>

          <Route path="/users">
            {(params) => {
              const config = pageConfig["/users"];
              return (
                <>
                  <TopNavigation
                    onMenuClick={() => setSidebarOpen(true)}
                    title={config.title}
                    subtitle={config.subtitle}
                  />
                  <div className="p-6">
                    <Users />
                  </div>
                </>
              );
            }}
          </Route>

          <Route path="/">{() => <Route path="/dashboard" />}</Route>

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
