import { CheckCircle2 } from 'lucide-react';

type UploadStep = 'front' | 'back' | 'selfie' | 'review' | 'submitted';

interface VerificationStepperProps {
    step: UploadStep;
    stepLabels: string[];
    onStepClick: (step: UploadStep) => void;
}

const STEP_MAP: UploadStep[] = ['front', 'back', 'selfie', 'review'];

export default function VerificationStepper({ step, stepLabels, onStepClick }: VerificationStepperProps) {
    const currentStepIndex = STEP_MAP.indexOf(step as UploadStep);

    return (
        <div className="relative mb-10 flex items-center justify-between rounded-2xl border border-white/10 dark:border-gray-800 bg-white dark:bg-gray-800/5 px-2 py-5 backdrop-blur-sm md:px-6 md:py-6">
            {/* Track background */}
            <div className="absolute left-5 right-5 top-1/2 h-1 -z-10 rounded-full bg-white dark:bg-gray-800/15" />
            {/* Progress fill */}
            <div
                className="absolute left-5 top-1/2 h-1 -z-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-300"
                style={{ width: `${(currentStepIndex / (STEP_MAP.length - 1)) * 100}%` }}
            />

            {stepLabels.map((label, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => { if (idx <= currentStepIndex) onStepClick(STEP_MAP[idx]); }}
                        disabled={idx > currentStepIndex}
                        className="flex flex-col items-center px-2 disabled:cursor-not-allowed"
                    >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200 ${isCompleted || isCurrent ? 'border-primary-500 bg-primary-500 text-white' : 'border-white/35 bg-[var(--color-bg-elevated)] text-slate-300'}`}>
                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span>{idx + 1}</span>}
                        </div>
                        <span className={`mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-primary-300' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
