import { Navigate, Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { Loading } from '../common';
import { hasAdminAccess } from '@/lib/adminAccess';
import AccountStatusGate from './AccountStatusGate';

/**
 * AdminRoute - Only allows access if user is authenticated and has admin role.
 * Non-admin users are redirected to the home page.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isFullyReady, profile, user } = useAuth();
  const { language } = useTranslation();
  const location = useLocation();
  const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

  if (!isFullyReady) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profile?.account_status === 'suspended' || profile?.account_status === 'archived') {
    return <AccountStatusGate status={profile.account_status} />;
  }

  if (!hasAdminAccess(user, profile)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle)] dark:bg-[var(--color-bg-base)] p-4">
        <div className="rounded-[24px] border border-white/70 bg-white dark:border-white/8 dark:bg-[var(--color-bg-muted)] backdrop-blur shadow-xl text-center max-w-md p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-foreground">{tr('تم رفض الوصول', 'Access Denied', 'Accès refusé')}</h1>
          <p className="text-muted mb-6">{tr('ليس لديك صلاحية لعرض لوحة تحكم المسؤول. يرجى العودة إلى الموقع الرئيسي.', 'You do not have permission to view the administrator dashboard. Please return to the main site.', 'Vous n\'êtes pas autorisé à afficher le tableau de bord administrateur. Veuillez retourner au site principal.')}</p>
          <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
            {tr('العودة للرئيسية', 'Return Home', 'Retour à l\'accueil')}
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export default AdminRoute;
