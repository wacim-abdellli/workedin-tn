import { Check } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface WizardStep {
    id: number;
    title: string;
    description?: string;
}

interface JobWizardLayoutProps {
    currentStep: number;
    steps: WizardStep[];
    children: React.ReactNode;
}

export default function JobWizardLayout({ currentStep, steps, children }: JobWizardLayoutProps) {
    const { tx } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 -z-10 rounded-full bg-gray-200 dark:bg-white/10" />

                    {/* Active Line */}
                    <div
                        className="absolute top-1/2 right-0 h-1 bg-primary-600 -z-10 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step) => {
                        const isCompleted = step.id < currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div
                                    className={
                                        isCompleted
                                            ? 'flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-100 text-green-600 transition-all duration-300 dark:border-green-800/30 dark:bg-green-900/30 dark:text-green-400'
                                            : isCurrent
                                                ? 'flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white transition-all duration-300'
                                                : 'flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-400 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-600'
                                    }
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="font-semibold text-sm">{step.id}</span>
                                    )}
                                </div>
                                <div className="hidden md:block text-center">
                                    <p className={isCompleted
                                        ? 'text-sm text-green-600 dark:text-green-400'
                                        : isCurrent
                                            ? 'text-sm font-medium text-purple-600 dark:text-purple-400'
                                            : 'text-sm text-gray-400 dark:text-gray-600'
                                    }>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Step Title */}
                <div className="md:hidden text-center mt-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {steps[currentStep - 1].title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm duration-500 dark:border-white/5 dark:bg-[#1a1825] md:p-8">
                {children}
            </div>
        </div>
    );
}
