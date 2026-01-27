import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Loading from './components/ui/Loading';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FreelancerOnboarding from './pages/FreelancerOnboarding';
import ClientOnboarding from './pages/ClientOnboarding';
import JobPost from './pages/JobPost';
import JobPostSuccess from './pages/JobPostSuccess';
import JobProposals from './pages/JobProposals';
import JobMatches from './pages/JobMatches';
import ContractWorkspace from './pages/ContractWorkspace';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerProfile from './pages/FreelancerProfile';
import Settings from './pages/Settings';
import HowItWorks from './pages/HowItWorks';
import ForClients from './pages/ForClients';
import JobBoard from './pages/JobBoard';
import JobDetail from './pages/JobDetail';
import PortfolioDashboard from './pages/PortfolioDashboard';
import FindFreelancers from './pages/FindFreelancers';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import FreelancerEarnings from './pages/FreelancerEarnings';
import SearchResults from './pages/SearchResults';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import FAQ from './pages/FAQ';

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

// Placeholder component
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">هذه الصفحة قيد التطوير</p>
        <a href="/" className="btn-primary">
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

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
          <PlaceholderPage title="البروفايل" />
        </ProtectedRoute>
      } />
      <Route path="/freelancer/:freelancerId" element={
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
      <I18nProvider defaultLanguage="ar">
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
