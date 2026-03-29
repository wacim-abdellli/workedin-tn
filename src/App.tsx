import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { I18nProvider } from './i18n';
import { useTranslation } from './i18n';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Loading } from './components/common';
import ScrollToTop from './components/ui/ScrollToTop';
import RouteProgress from './components/ui/RouteProgress';

import { ProfileRedirect } from './components/routing/ProfileRedirect';
import { AdminRoute } from './components/routing/AdminRoute';
import { OnboardingRoute } from './components/routing/OnboardingRoute';
import { DashboardRedirect } from './components/navigation/DashboardRedirect';
import { MyJobsRedirect } from './components/navigation/MyJobsRedirect';
import { SavedRedirect } from './components/navigation/SavedRedirect';

import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceRoute } from './components/routing/WorkspaceRoute';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { useWorkspaceStore } from './lib/workspaceState';

// Lazy Load Pages
import SkipLinks from './components/layout/SkipLinks';
import { useRouteFocus } from './hooks/useRouteFocus';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const FreelancerOnboarding = lazy(() => import('./pages/FreelancerOnboarding'));
const ClientOnboarding = lazy(() => import('./pages/ClientOnboarding'));
const JobPost = lazy(() => import('./pages/JobPost'));
const JobPostSuccess = lazy(() => import('./pages/JobPostSuccess'));
const JobProposals = lazy(() => import('./pages/JobProposals'));
const JobMatches = lazy(() => import('./pages/JobMatches'));
const ContractWorkspace = lazy(() => import('./pages/ContractWorkspace'));
const FreelancerDashboard = lazy(() => import('./pages/FreelancerDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const FreelancerProfile = lazy(() => import('./pages/FreelancerProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const ForClients = lazy(() => import('./pages/ForClients'));
const JobBoard = lazy(() => import('./pages/JobBoard'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const PortfolioDashboard = lazy(() => import('./pages/PortfolioDashboard'));
const FindFreelancers = lazy(() => import('./pages/FindFreelancers'));
const Messages = lazy(() => import('./pages/Messages'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TestAdminAccess = lazy(() => import('./pages/admin/TestAdminAccess'));
const DirectQueryTest = lazy(() => import('./pages/admin/DirectQueryTest'));
const FreelancerEarnings = lazy(() => import('./pages/FreelancerEarnings'));
const MyProposals = lazy(() => import('./pages/MyProposals'));
const Wallet = lazy(() => import('./pages/Wallet'));
const ClientJobs = lazy(() => import('./pages/ClientJobs'));
const ContractsList = lazy(() => import('./pages/ContractsList'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const VerifyIdentity = lazy(() => import('./pages/VerifyIdentity'));
const VerificationQueue = lazy(() => import('./pages/admin/VerificationQueue'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
// Redirect /profile to the correct dashboard


function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/for-clients" element={<ForClients />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Onboarding routes */}
      <Route path="/onboarding/freelancer" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <OnboardingRoute workspace="freelancer">
              <FreelancerOnboarding />
            </OnboardingRoute>
          </ProtectedRoute>
        </ErrorBoundary>
      } />
      <Route path="/onboarding/client" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <OnboardingRoute workspace="client">
              <ClientOnboarding />
            </OnboardingRoute>
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      } />
      <Route path="/my-jobs" element={
        <ProtectedRoute>
          <MyJobsRedirect />
        </ProtectedRoute>
      } />
      <Route path="/saved" element={
        <ProtectedRoute>
          <SavedRedirect />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/dashboard" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <WorkspaceRoute workspace="freelancer">
              <FreelancerDashboard />
            </WorkspaceRoute>
          </ProtectedRoute>
        </ErrorBoundary>
      } />
      <Route path="/freelancer/portfolio" element={
        <ProtectedRoute>
          <WorkspaceRoute workspace="freelancer">
            <PortfolioDashboard />
          </WorkspaceRoute>
        </ProtectedRoute>
      } />
      <Route path="/freelancer/earnings" element={
        <ProtectedRoute>
          <WorkspaceRoute workspace="freelancer">
            <FreelancerEarnings />
          </WorkspaceRoute>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      } />
      <Route path="/my-proposals" element={
        <ProtectedRoute>
          <MyProposals />
        </ProtectedRoute>
      } />
      <Route path="/client/jobs" element={
        <ProtectedRoute>
          <ClientJobs />
        </ProtectedRoute>
      } />
      <Route path="/contracts" element={
        <ProtectedRoute>
          <ContractsList />
        </ProtectedRoute>
      } />
      <Route path="/client/dashboard" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <WorkspaceRoute workspace="client">
              <ClientDashboard />
            </WorkspaceRoute>
          </ProtectedRoute>
        </ErrorBoundary>
      } />
      <Route path="/client/jobs/:jobId/proposals" element={
        <ProtectedRoute>
          <JobProposals />
        </ProtectedRoute>
      } />

      {/* Job routes */}
      <Route path="/jobs/new" element={
        <ProtectedRoute>
          <WorkspaceRoute workspace="client">
            <JobPost />
          </WorkspaceRoute>
        </ProtectedRoute>
      } />
      <Route path="/post-job" element={<Navigate to="/jobs/new" replace />} />
      <Route path="/jobs/posted/:jobId" element={
        <ProtectedRoute>
          <JobPostSuccess />
        </ProtectedRoute>
      } />
      <Route path="/jobs/:jobId/matches" element={
        <ProtectedRoute>
          <JobMatches />
        </ProtectedRoute>
      } />
      <Route path="/jobs/:jobId" element={<ErrorBoundary><JobDetail /></ErrorBoundary>} />
      <Route path="/jobs" element={<JobBoard />} />

      {/* Freelancer Discovery */}
      <Route path="/find-freelancers" element={<ErrorBoundary><FindFreelancers /></ErrorBoundary>} />

      {/* Messages */}
      <Route path="/messages" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Contract routes */}
      <Route path="/contracts/:contractId" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <ContractWorkspace />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Payment routes */}
      <Route path="/payment/success" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        </ErrorBoundary>
      } />
      <Route path="/payment/failed" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <PaymentFailed />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Profile & Settings */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileRedirect />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/:usernameOrId" element={
        <ErrorBoundary>
          <FreelancerProfile />
        </ErrorBoundary>
      } />
      <Route path="/settings" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </ErrorBoundary>
      } />
      <Route path="/settings/:tab" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ErrorBoundary>
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        </ErrorBoundary>
      } />
      <Route path="/admin/test" element={
        <ErrorBoundary>
          <AdminRoute>
            <TestAdminAccess />
          </AdminRoute>
        </ErrorBoundary>
      } />
      <Route path="/admin/direct-test" element={
        <ErrorBoundary>
          <AdminRoute>
            <DirectQueryTest />
          </AdminRoute>
        </ErrorBoundary>
      } />
      <Route path="/admin/verifications" element={
        <ErrorBoundary>
          <AdminRoute>
            <VerificationQueue />
          </AdminRoute>
        </ErrorBoundary>
      } />

      {/* Identity Verification */}
      <Route path="/verify-identity" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <VerifyIdentity />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* Search */}
      <Route path="/search" element={<SearchResults />} />

      {/* Notifications */}
      <Route path="/notifications" element={
        <ErrorBoundary>
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        </ErrorBoundary>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  useRouteFocus();
  const { pathname } = useLocation();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const workspaceClass = pathname.startsWith('/admin')
    ? 'workspace-admin'
    : activeWorkspace === 'client'
      ? 'workspace-client'
      : '';

  return (
    <div className={`min-h-screen animate-fade-in ${workspaceClass}`}>
      <RouteProgress />
      <ScrollToTop />
      <SkipLinks />
      <Suspense fallback={<Loading fullScreen />}>
        <div id="main-content" className="min-h-screen">
          <AppRoutes />
        </div>
      </Suspense>
    </div>
  );
}

function DocumentLanguageHelmet() {
  const { language, dir } = useTranslation();

  return <Helmet htmlAttributes={{ lang: language, dir }} />;
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <I18nProvider defaultLanguage="ar">
              <DocumentLanguageHelmet />
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
    </HelmetProvider>
  );
}

export default App;
