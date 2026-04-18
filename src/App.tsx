// Enforce HTTPS in production
if (
  typeof window !== "undefined" &&
  window.location.protocol !== "https:" &&
  window.location.hostname !== "localhost"
) {
  window.location.protocol = "https:";
}

import { Suspense, useMemo } from "react";
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

const PageLoader = () => (
  <FullScreenLoader label="Loading..." hint="Opening the next page" />
);

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

  const workspaceClass = pathname.startsWith("/admin")
    ? "workspace-admin"
    : resolvedWorkspace === "client"
      ? "workspace-client"
      : "";

  return (
    <div className={`min-h-screen animate-fade-in ${workspaceClass}`}>
      {isWorkspaceSwitching && (
        <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center transition-opacity duration-150 no-transition">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[color:var(--workspace-primary)] border-t-transparent animate-spin no-transition" />
            <p className="text-xs text-[var(--text-muted)]">
              {tx("workspace.switching", undefined, "Switching workspace...")}
            </p>
          </div>
        </div>
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
