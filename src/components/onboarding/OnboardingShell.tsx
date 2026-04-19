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
    role?: 'freelancer' | 'client';
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
    role = 'client',
}: OnboardingShellProps) {
    const { tx } = useTranslation();
    const completion = Math.round((currentStep / totalSteps) * 100);
    const stepGridClass = steps.length >= 3 ? 'grid gap-3 md:grid-cols-3' : 'grid gap-3 md:grid-cols-2';
    
    // Role-specific colors
    const colors = role === 'freelancer' 
        ? {
            badge: 'from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-400',
            progress: 'from-purple-500 to-violet-500 shadow-purple-500/30',
            progressText: 'text-purple-400',
            progressGlow: 'bg-purple-500/10',
            currentStep: 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-violet-500/10 shadow-lg shadow-purple-500/10',
            completedStep: 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-violet-500/5',
            stepIcon: 'bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30',
            stepIconCompleted: 'bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg shadow-purple-500/20',
        }
        : {
            badge: 'from-[#E8820C]/10 to-amber-500/10 border-[#E8820C]/30 text-[#E8820C]',
            progress: 'from-[#E8820C] to-amber-500 shadow-[#E8820C]/30',
            progressText: 'text-[#E8820C]',
            progressGlow: 'bg-[#E8820C]/10',
            currentStep: 'border-[#E8820C]/50 bg-gradient-to-br from-[#E8820C]/10 to-amber-500/10 shadow-lg shadow-[#E8820C]/10',
            completedStep: 'border-[#E8820C]/30 bg-gradient-to-br from-[#E8820C]/5 to-amber-500/5',
            stepIcon: 'bg-gradient-to-r from-[#E8820C] to-amber-500 shadow-lg shadow-[#E8820C]/30',
            stepIconCompleted: 'bg-gradient-to-r from-[#E8820C] to-amber-500 shadow-lg shadow-[#E8820C]/20',
        };

    return (
        <main className="min-h-screen bg-[#0c0c0c] px-6 py-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Hero Section */}
                <section className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-xl">
                    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                        <div className="space-y-4">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.badge} rounded-full text-xs font-semibold uppercase tracking-wider`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                {badge}
                            </div>

                            <div>
                                <h1 className="text-4xl font-bold text-white">
                                    {title}
                                </h1>
                                <p className="mt-3 text-on-surface-muted leading-relaxed text-lg">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Progress Card */}
                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-6 shadow-lg">
                            <div className={`absolute top-0 right-0 w-24 h-24 ${colors.progressGlow} rounded-full blur-2xl -z-10`} />
                            
                            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
                                {tx('onboarding.currentStep', undefined, 'Current step')}
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-white">
                                {steps[currentStep - 1]?.title}
                            </h2>
                            <p className="mt-2 text-sm text-on-surface-muted">
                                {steps[currentStep - 1]?.description || `Step ${currentStep} of ${totalSteps}`}
                            </p>

                            <div className="mt-6 space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium text-on-surface-muted">
                                    <span>Progress</span>
                                    <span className={colors.progressText}>{completion}%</span>
                                </div>
                                <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-gray-800">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-500`}
                                        style={{ width: `${completion}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Steps Overview */}
                {steps.length > 1 && (
                <section className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className={stepGridClass}>
                        {steps.map((step, index) => {
                            const isCompleted = step.id < currentStep;
                            const isCurrent = step.id === currentStep;

                            return (
                                <div
                                    key={step.id}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className={`rounded-xl border p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 min-h-[120px] ${
                                        isCurrent
                                            ? colors.currentStep
                                            : isCompleted
                                            ? colors.completedStep
                                            : 'border-gray-800 bg-[#0f0f0f]'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all duration-300 ${
                                            isCurrent
                                                ? colors.stepIcon
                                                : isCompleted
                                                ? colors.stepIconCompleted
                                                : 'bg-[#1a1a1a] text-on-surface-subtle border border-gray-800'
                                        }`}>
                                            {step.id}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-semibold text-white">
                                                {step.title}
                                            </p>
                                            {step.description && (
                                                <p className="mt-1 text-sm text-on-surface-muted">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Main Content */}
                <div className={`grid gap-6 ${aside ? 'xl:grid-cols-[1fr_320px]' : ''}`}>
                    <section className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-xl">
                        {main}
                    </section>

                    {aside && (
                        <aside className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                            {aside}
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}

