import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

type AccountStatus = 'suspended' | 'archived';

const COPY: Record<
  AccountStatus,
  {
    titleKey: string;
    titleFallback: string;
    bodyKey: string;
    bodyFallback: string;
    icon: typeof ShieldAlert;
  }
> = {
  suspended: {
    titleKey: 'accountStatus.suspended.title',
    titleFallback: 'Account suspended',
    bodyKey: 'accountStatus.suspended.body',
    bodyFallback:
      'Your account access is temporarily suspended. Contact support if you need help or think this is a mistake.',
    icon: ShieldAlert,
  },
  archived: {
    titleKey: 'accountStatus.archived.title',
    titleFallback: 'Account archived',
    bodyKey: 'accountStatus.archived.body',
    bodyFallback:
      'This account is archived and can no longer access protected platform features. Contact support for assistance.',
    icon: AlertTriangle,
  },
};

export default function AccountStatusGate({ status }: { status: AccountStatus }) {
  const { tx } = useTranslation();
  const copy = COPY[status];
  const Icon = copy.icon;
  const headingId = `account-status-${status}-title`;

  return (
    <main
      aria-labelledby={headingId}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_transparent_28%),linear-gradient(180deg,_#0a0f1a_0%,_#0f172a_100%)] px-4 py-10 text-white"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_28px_80px_-36px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <Icon className="h-8 w-8" />
          </div>
          <h1 id={headingId} className="mt-6 text-3xl font-semibold tracking-tight text-white">
            {tx(copy.titleKey, undefined, copy.titleFallback)}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {tx(copy.bodyKey, undefined, copy.bodyFallback)}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              {tx('common.returnHome', undefined, 'Return home')}
            </Link>
            <a
              href="mailto:support@khedmetna.tn"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {tx('common.contactSupport', undefined, 'Contact support')}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

