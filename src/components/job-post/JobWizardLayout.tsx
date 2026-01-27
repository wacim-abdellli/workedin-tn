import { Check } from 'lucide-react';

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

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full" />

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
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white
                                        ${isCompleted
                                            ? 'border-primary-600 bg-primary-600 text-white'
                                            : isCurrent
                                                ? 'border-primary-600 text-primary-600'
                                                : 'border-gray-200 text-gray-400'
                                        }
                                    `}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="font-bold">{step.id}</span>
                                    )}
                                </div>
                                <div className="hidden md:block text-center">
                                    <p className={`text-sm font-bold ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Step Title */}
                <div className="md:hidden text-center mt-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {steps[currentStep - 1].title}
                    </h2>
                    <p className="text-sm text-gray-500">
                        الخطوة {currentStep} من {steps.length}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </div>
    );
}
