import { Upload, Mic, Play, Pause, Trash2, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';

// Voice Recording Hook Return Interface
interface VoiceRecordingState {
    isRecording: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
}

interface OnboardingStep4Props {
    bio: string;
    setBio: (value: string) => void;
    workSamples: { file: File; preview: string; title: string; description: string }[];
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeWorkSample: (index: number) => void;
    updateWorkSample: (index: number, field: 'title' | 'description', value: string) => void;
    voiceRecording: VoiceRecordingState;
    isPlaying: boolean;
    playRecording: () => void;
    onComplete: () => void;
    onBack: () => void;
    isLoading: boolean;
}

export default function OnboardingStep4({
    bio,
    setBio,
    workSamples,
    handleFileUpload,
    removeWorkSample,
    updateWorkSample,
    voiceRecording,
    isPlaying,
    playRecording,
    onComplete,
    onBack,
    isLoading,
}: OnboardingStep4Props) {
    const { t, dir } = useTranslation();
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const {
        isRecording,
        duration: recordingTime,
        audioBlob: voiceBlob,
        startRecording,
        stopRecording,
        clearRecording: deleteRecording,
    } = voiceRecording;

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Upload className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t.profile.workSamples}</h2>
                    <p className="text-muted text-sm">{t.onboarding.freelancer.steps.portfolio}</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Bio */}
                <div>
                    <label className="label">
                        {t.profile.bio}
                        <span className="text-xs font-normal text-muted ms-2">(500 chars max)</span>
                    </label>
                    <div className="relative">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 500))}
                            placeholder={t.profile.bioPlaceholder}
                            rows={4}
                            className="input resize-none w-full p-4 min-h-[120px]"
                        />
                        <div className="absolute bottom-3 end-3 text-xs text-muted bg-white dark:bg-dark-800 px-2 py-1 rounded">
                            {bio.length}/500
                        </div>
                    </div>
                </div>

                {/* Voice Intro */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-2xl p-6 border border-primary-100 dark:border-primary-900/30">
                    <label className="label flex items-center gap-2 mb-3">
                        <Mic className="w-5 h-5 text-primary-600" />
                        {t.profile.voiceIntro} ({t.profile.optional})
                    </label>
                    <div className="flex items-center gap-4">
                        {!isRecording && !voiceBlob && (
                            <button
                                onClick={startRecording}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                title={t.profile.recordVoice}
                            >
                                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                {t.profile.recordVoice}
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-black transition-colors"
                            >
                                <div className="w-3 h-3 bg-white rounded-sm" />
                                {t.profile.stopRecording || 'Stop'} ({Math.round(recordingTime)}s)
                            </button>
                        )}

                        {voiceBlob && (
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={playRecording}
                                    className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ps-0.5" />}
                                </button>
                                <div className="h-1 flex-1 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                    <div className={`h-full bg-primary-500 ${isPlaying ? 'animate-progress origin-left w-full duration-[2000ms]' : 'w-full'}`} />
                                </div>
                                <button
                                    onClick={deleteRecording}
                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Portfolio Upload */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="label mb-0">{t.profile.workSamples}</label>
                        <span className="text-xs text-muted">Max: 5 files</span>
                    </div>

                    <label className="block mb-6 group">
                        <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500" />
                            </div>
                            <p className="text-dark-900 dark:text-white font-medium mb-1">{t.profile.dragDrop}</p>
                            <p className="text-muted text-sm">{t.profile.browse}</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*,video/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={workSamples.length >= 5}
                        />
                    </label>

                    {workSamples.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {workSamples.map((sample, index) => (
                                <div key={index} className="p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 flex gap-3 animate-fade-in group hover:shadow-md transition-shadow">
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-dark-700 flex-shrink-0 overflow-hidden">
                                        {sample.preview ? (
                                            <img src={sample.preview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <input
                                            type="text"
                                            value={sample.title}
                                            onChange={(e) => updateWorkSample(index, 'title', e.target.value)}
                                            className="bg-transparent font-medium text-dark-900 dark:text-white outline-none placeholder-dark-400 mb-1 w-full"
                                            placeholder="Title"
                                        />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted truncate">
                                                {(sample.file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                            <button
                                                onClick={() => removeWorkSample(index)}
                                                className="text-red-500 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-dark-700">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        leftIcon={<BackArrowIcon className="w-5 h-5" />}
                    >
                        {t.common.back}
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 text-lg"
                        onClick={onComplete}
                        isLoading={isLoading}
                        rightIcon={<CheckCircle className="w-5 h-5" />}
                    >
                        {t.auth.completeProfile}
                    </Button>
                </div>
            </div>
        </div>
    );
}
