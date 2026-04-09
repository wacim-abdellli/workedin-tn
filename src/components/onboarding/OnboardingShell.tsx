import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface OnboardingStepItem {
    id: number;
    title: string;
    description?: string;
}

interface OnboardingShellProps {
    badge: string;
    title: string;
    description: string;
    currentStep: number;
    totalSteps: number;
    steps: OnboardingStepItem[];
    main: ReactNode;
    aside?: ReactNode;
}

export default function OnboardingShell({
    badge,
    title,
    description,
    currentStep,
    totalSteps,
    steps,
    main,
    aside,
}: OnboardingShellProps) {
    const { tx } = useTranslation();
    const completion = Math.round((currentStep / totalSteps) * 100);

    return (
        <main className="page-shell-content space-y-6">
            <section className="radius-shell overflow-hidden border border-border/40 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.1),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(250,250,250,0.94))] p-6 shadow-[0_32px_90px_-48px_rgba(0,0,0,0.1)] dark:border-white/10 dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.1),transparent_28%),linear-gradient(145deg,rgba(9,9,11,0.98),rgba(15,15,18,0.98))] sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white dark:bg-zinc-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                                <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--workspace-accent)' }} />
                                {badge}
                            </div>

                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-[#171420] dark:text-white sm:text-4xl">
                                    {title}
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-border bg-white dark:bg-zinc-900/70 p-5 shadow-sm dark:border-white/10 dark:white/[0.04]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-zinc-400">
                                {tx('onboarding.currentStep', undefined, 'Current step')}
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-foreground">
                                {steps[currentStep - 1]?.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-zinc-400">
                                {steps[currentStep - 1]?.description || `Step ${currentStep} of ${totalSteps}`}
                            </p>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between text-sm font-medium text-foreground dark:text-zinc-300">
                                    <span>Progress</span>
                                    <span>{completion}%</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${completion}%`, backgroundColor: 'var(--workspace-primary)' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="premium-panel radius-shell p-4 sm:p-5">
                    <div className={`grid gap-3 ${steps.length > 1 ? 'md:grid-cols-2' : ''}`}>
                        {steps.map((step) => {
                            const isCompleted = step.id < currentStep;
                            const isCurrent = step.id === currentStep;

                            return (
                                <div
                                    key={step.id}
                                    className={`rounded-[1.4rem] border p-4 transition-all duration-200 ${isCurrent
                                        ? 'border-[color-mix(in_srgb,var(--workspace-primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--workspace-primary)_4%,transparent)] shadow-[0_22px_44px_-30px_rgba(0,0,0,0.1)]'
                                        : isCompleted
                                            ? 'border-border bg-surface/60 dark:border-white/10 dark:bg-zinc-900/40'
                                            : 'border-border dark:border-zinc-800 bg-white dark:bg-zinc-900/50'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isCurrent
                                            ? 'text-white'
                                            : isCompleted
                                                ? 'bg-muted text-foreground dark:bg-white/10 dark:text-zinc-300'
                                                : 'bg-muted text-muted dark:bg-white/5 dark:text-zinc-600'}`}
                                            style={isCurrent ? { backgroundColor: 'var(--workspace-primary)' } : undefined}
                                        >
                                            {isCompleted ? <Sparkles className="h-5 w-5" /> : step.id}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${isCurrent || isCompleted ? 'text-foreground' : 'text-muted dark:text-zinc-400'}`}>
                                                {step.title}
                                            </p>
                                            {step.description ? (
                                                <p className="mt-1 text-xs leading-5 text-[#8b8aa0]">
                                                    {step.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

            <div className={`grid gap-6 ${aside ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
                <section className="premium-panel radius-shell overflow-hidden p-6 sm:p-8">
                    {main}
                </section>

                {aside ? (
                    <aside className="premium-panel radius-shell p-6">
                        {aside}
                    </aside>
                ) : null}
            </div>
        </main>
    );
}
