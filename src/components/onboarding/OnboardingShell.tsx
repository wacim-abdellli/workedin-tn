import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

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
    const completion = Math.round((currentStep / totalSteps) * 100);

    return (
        <main className="page-shell-content space-y-6">
            <section className="radius-shell overflow-hidden border border-primary-200/40 bg-[radial-gradient(circle_at_top_left,rgba(21,84,247,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,241,255,0.94))] p-6 shadow-[0_32px_90px_-48px_rgba(14,65,227,0.28)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(21,84,247,0.2),transparent_28%),linear-gradient(145deg,rgba(18,16,28,0.98),rgba(11,10,18,0.98))] sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-primary-200">
                                <Sparkles className="h-3.5 w-3.5" />
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

                        <div className="rounded-[1.75rem] border border-primary-100/70 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                Current step
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-[#171420] dark:text-white">
                                {steps[currentStep - 1]?.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                {steps[currentStep - 1]?.description || `Step ${currentStep} of ${totalSteps}`}
                            </p>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between text-sm font-medium text-[#353149] dark:text-[#e3def7]">
                                    <span>Progress</span>
                                    <span>{completion}%</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-primary-100 dark:bg-white/10">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-[width] duration-300" style={{ width: `${completion}%` }} />
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
                                        ? 'border-primary-500/25 bg-primary-500/[0.08] shadow-[0_22px_44px_-30px_rgba(21,84,247,0.6)]'
                                        : isCompleted
                                            ? 'border-primary-200/80 bg-primary-50/60 dark:border-primary-500/20 dark:bg-primary-500/[0.06]'
                                            : 'border-gray-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isCurrent
                                            ? 'bg-primary-600 text-white'
                                            : isCompleted
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/12 dark:text-primary-200'
                                                : 'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-[#8b8aa0]'}`}
                                        >
                                            {step.id}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${isCurrent || isCompleted ? 'text-[#171420] dark:text-white' : 'text-[#57536a] dark:text-[#b8b3ca]'}`}>
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
