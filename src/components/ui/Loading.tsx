

import { useTranslation } from '../../i18n';
import { Logo } from './Logo';

interface LoadingProps {
    fullScreen?: boolean;
    text?: string;
}

export default function Loading({ fullScreen = false, text }: LoadingProps) {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[var(--page-bg)] transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.08),transparent_24%)] dark:bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.08),transparent_22%)]" />

                <div className="relative mx-6 flex w-full max-w-[320px] flex-col items-center rounded-[2rem] border border-black/[0.06] bg-card/88 px-8 py-10 text-center shadow-[0_28px_90px_-36px_rgba(26,24,37,0.28)] backdrop-blur-xl dark:border-white/10 border-border dark:bg-[var(--color-bg-muted)]/92">
                    <div className="absolute inset-x-10 top-6 h-20 rounded-full bg-[color:var(--workspace-primary)]/12 blur-3xl dark:bg-[color:var(--workspace-primary)]/14" />

                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/5 dark:bg-[var(--color-bg-subtle)]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <Logo variant="mark" size="lg" mode="black" />
                    </div>

                    <div className="mt-6 text-lg font-semibold text-[var(--text-primary)]">{tr('تجهيز مساحة العمل الخاصة بك', 'Preparing your workspace', 'Préparation de votre espace de travail')}</div>
                    <p className="mt-2 max-w-[220px] text-sm leading-6 text-[var(--text-muted)]">
                        {text || tr('جاري تحميل أحدث حالة والنشاط والاختصارات.', 'Loading the latest dashboard state, activity, and shortcuts.', 'Chargement...')}
                    </p>

                    <div className="relative mt-7 h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-[3px] border-black/[0.06] dark:border-white/[0.08]" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-[color:var(--workspace-primary)] border-b-transparent border-l-transparent animate-[spin_1.8s_linear_infinite]" />
                        <div className="absolute inset-[8px] rounded-full bg-[color:var(--workspace-primary)]/10 dark:bg-[color:var(--workspace-primary)]/14" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-[color:var(--workspace-primary)]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900/50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-[spin_1.8s_linear_infinite]"></div>
            </div>
            {text && <p className="mt-4 text-sm text-dark-500 dark:text-dark-400 font-medium">{text}</p>}
        </div>
    );
}

