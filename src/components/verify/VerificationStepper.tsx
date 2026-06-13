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
        <div className="relative mb-10 flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-6 backdrop-blur-xl md:px-8 shadow-xl">
            {/* Track background */}
            <div className="absolute left-8 right-8 top-1/2 h-[3px] -translate-y-1/2 -z-10 rounded-full bg-zinc-800/60" />
            {/* Progress fill */}
            <div
                className="absolute left-8 top-1/2 h-[3px] -translate-y-1/2 -z-10 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 transition-[width] duration-500"
                style={{ width: `${(currentStepIndex / (STEP_MAP.length - 1)) * 84}%` }}
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
                        className="flex flex-col items-center px-1 disabled:cursor-not-allowed group transition-all duration-300"
                    >
                        <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                isCompleted
                                    ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                    : isCurrent
                                    ? 'border-purple-500 bg-purple-950/80 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-110'
                                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 group-hover:border-zinc-700'
                            }`}
                        >
                            {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                            ) : (
                                <span className="text-sm font-semibold">{idx + 1}</span>
                            )}
                        </div>
                        <span
                            className={`mt-2.5 text-xs font-semibold tracking-wide transition-colors duration-300 ${
                                isCurrent
                                    ? 'text-purple-400'
                                    : isCompleted
                                    ? 'text-zinc-300'
                                    : 'text-zinc-500 group-hover:text-zinc-400'
                            }`}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
