import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { Header } from '@/components/layout';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e17]">
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        {/* Big 404 number */}
        <div className="relative mb-8 select-none">
          <span className="text-[160px] font-black leading-none tracking-tighter text-gray-100 dark:text-white/5">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-amber-400 shadow-2xl shadow-purple-500/30">
              <Search className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {t.notFound?.title || 'Page Not Found'}
        </h1>
        <p className="mb-10 max-w-md text-center text-gray-500 dark:text-gray-400">
          {t.notFound?.description || "The page you're looking for doesn't exist or has been moved."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:bg-gray-800 dark:border-white/10 dark:bg-white dark:bg-gray-900/5 dark:text-gray-300 dark:hover:bg-white dark:bg-gray-900/10"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            {t.notFound?.goBack || 'Go Back'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-500"
          >
            <Home className="h-5 w-5" />
            {t.notFound?.goHome || 'Go Home'}
          </button>
        </div>
      </main>
    </div>
  );
}
