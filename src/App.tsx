// Enforce HTTPS in production
if (
  typeof window !== "undefined" &&
  window.location.protocol !== "https:" &&
  window.location.hostname !== "localhost"
) {
  window.location.protocol = "https:";
}

import { Suspense, useEffect, useMemo } from "react";
import { BrowserRouter, Navigate, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { I18nProvider, useTranslation } from "./i18n";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ScrollToTop from "./components/ui/ScrollToTop";
import RouteProgress from "./components/ui/RouteProgress";
import { FullScreenLoader } from "./components/ui";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { useWorkspaceStore } from "./lib/workspaceState";
import { appRoutes, renderRouteDefinitions } from "./routes";
import SkipLinks from "./components/layout/SkipLinks";
import { useRouteFocus } from "./hooks/useRouteFocus";
import { useAuth } from "./contexts/AuthContext";
import { shouldRequireUserTypeSelection, resolveActiveWorkspace } from "./lib/workspaceRoutes";

function AppRoutes() {
  return <Routes>{renderRouteDefinitions(appRoutes)}</Routes>;
}

function AppContent() {
  useRouteFocus();
  const { tx } = useTranslation();
  const { pathname, search } = useLocation();
  const { user, profile, freelancerProfile, isFullyReady } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const isWorkspaceSwitching = useWorkspaceStore((state) => state.isSwitching);
  const resolvedWorkspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);

  const isUserTypeSelectionScreen = useMemo(() =>
    pathname === "/signup" && search.includes("step=select-type"),
  [pathname, search]);
  const isAuthCallbackPath = pathname.startsWith("/auth/callback");

  const workspaceClass = pathname.startsWith("/admin")
    ? "workspace-admin"
    : pathname.startsWith("/onboarding/client") || resolvedWorkspace === "client"
      ? "workspace-client"
      : pathname.startsWith("/onboarding/freelancer")
        ? "workspace-freelancer"
        : "";

  const workspaceMode = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/onboarding/client")
      ? "client"
      : pathname.startsWith("/onboarding/freelancer")
        ? "freelancer"
        : resolvedWorkspace === "client"
          ? "client"
          : "freelancer";

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.workspace = workspaceMode;
    root.classList.toggle("workspace-client", workspaceMode === "client");
    root.classList.toggle("workspace-admin", workspaceMode === "admin");
    root.classList.toggle("workspace-freelancer", workspaceMode === "freelancer");
  }, [workspaceMode]);

  if (
    isFullyReady &&
    user &&
    profile &&
    shouldRequireUserTypeSelection(profile) &&
    !isUserTypeSelectionScreen &&
    !isAuthCallbackPath
  ) {
    return <Navigate to="/signup?step=select-type" replace state={{ from: { pathname, search } }} />;
  }

  const PageLoader = () => (
    <FullScreenLoader label="Loading..." hint="Opening the next page" mode={workspaceMode as 'freelancer' | 'client' | 'admin'} />
  );

  return (
    <div className={`min-h-screen animate-fade-in ${workspaceClass}`}>
      {isWorkspaceSwitching && (
        <FullScreenLoader
          label={tx("workspace.switching", undefined, "Switching workspace...")}
          hint="We are aligning your dashboard configurations and shortcuts."
          mode={resolvedWorkspace as 'freelancer' | 'client' | 'admin'}
        />
      )}
      <RouteProgress />
      <ScrollToTop />
      <SkipLinks />
      <Suspense fallback={<PageLoader />}>
        <div id="main-content" className="min-h-screen">
          <AppRoutes />
        </div>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <LazyMotion features={domAnimation}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <I18nProvider defaultLanguage="ar">
                <WorkspaceProvider>
                  <ErrorBoundary>
                    <AuthProvider>
                      <ToastProvider>
                        <NotificationsProvider>
                          <AppContent />
                        </NotificationsProvider>
                      </ToastProvider>
                    </AuthProvider>
                  </ErrorBoundary>
                </WorkspaceProvider>
              </I18nProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </LazyMotion>
    </HelmetProvider>
  );
}

export default App;
