import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Loading } from './components/common';
import ScrollToTop from './components/ui/ScrollToTop';

import { ProfileRedirect } from './components/routing/ProfileRedirect';

// Lazy Load Pages
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
const FreelancerEarnings = lazy(() => import('./pages/FreelancerEarnings'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const FAQ = lazy(() => import('./pages/FAQ'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
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

      {/* Onboarding routes */}
      <Route path="/onboarding/freelancer" element={
        <ProtectedRoute>
          <FreelancerOnboarding />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/client" element={
        <ProtectedRoute>
          <ClientOnboarding />
        </ProtectedRoute>
      } />

      {/* Dashboard routes */}
      <Route path="/freelancer/dashboard" element={
        <ProtectedRoute>
          <FreelancerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/portfolio" element={
        <ProtectedRoute>
          <PortfolioDashboard />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/earnings" element={
        <ProtectedRoute>
          <FreelancerEarnings />
        </ProtectedRoute>
      } />
      <Route path="/client/dashboard" element={
        <ProtectedRoute>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/client/jobs/:jobId/proposals" element={
        <ProtectedRoute>
          <JobProposals />
        </ProtectedRoute>
      } />

      {/* Job routes */}
      <Route path="/jobs/new" element={
        <ProtectedRoute>
          <JobPost />
        </ProtectedRoute>
      } />
      <Route path="/post-job" element={
        <ProtectedRoute>
          <JobPost />
        </ProtectedRoute>
      } />
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
      <Route path="/jobs/:jobId" element={<JobDetail />} />
      <Route path="/jobs" element={<JobBoard />} />

      {/* Freelancer Discovery */}
      <Route path="/find-freelancers" element={<FindFreelancers />} />

      {/* Messages */}
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />

      {/* Contract routes */}
      <Route path="/contracts/:contractId" element={
        <ProtectedRoute>
          <ContractWorkspace />
        </ProtectedRoute>
      } />

      {/* Profile & Settings */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileRedirect />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/:usernameOrId" element={
        <FreelancerProfile />
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/:tab" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Search */}
      <Route path="/search" element={<SearchResults />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider defaultLanguage="ar">
          <ErrorBoundary>
            <AuthProvider>
              <ToastProvider>
                <div className="animate-fade-in">
                  <ScrollToTop />
                  <Suspense fallback={<Loading fullScreen />}>
                    <AppRoutes />
                  </Suspense>
                </div>
              </ToastProvider>
            </AuthProvider>
          </ErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
