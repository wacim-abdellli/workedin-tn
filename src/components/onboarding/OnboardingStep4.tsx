import { Upload, Mic, Play, Pause, Trash2, FileText, CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';

// Voice Recording Hook Return Interface
interface VoiceRecordingState {
    isRecording: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;
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
    const { t, dir, tx } = useTranslation();
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const {
        isRecording,
        duration: recordingTime,
        audioBlob: voiceBlob,
        error: voiceError,
        startRecording,
        stopRecording,
        clearRecording: deleteRecording,
    } = voiceRecording;

    return (
        <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Upload className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground dark:text-white">{t.profile.workSamples}</h2>
                    <p className="text-muted text-sm">{t.onboarding.freelancer.steps.portfolio}</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Bio */}
                <div className="bg-surface/50 dark:bg-dark-800/30 rounded-2xl p-5 border border-border dark:border-dark-700">
                    <label className="label text-base font-semibold">
                        {t.profile.bio}
                        <span className="text-xs font-normal text-muted ms-2">{tx('dynamic_key_1115664379')}</span>
                    </label>
                    <div className="relative">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 500))}
                            placeholder={t.profile.bioPlaceholder}
                            rows={4}
                            className="input resize-none w-full p-4 min-h-[120px] text-base"
                        />
                        <div className={`absolute bottom-3 end-3 text-xs px-2 py-1 rounded-md ${bio.length > 400
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-muted text-muted dark:bg-dark-700'
                            }`}>
                            {bio.length}/500
                        </div>
                    </div>
                </div>

                {/* Voice Intro */}
                <div className="bg-gradient-to-br from-primary-50/80 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 rounded-2xl p-5 border border-primary-100 dark:border-primary-900/30">
                    <label className="label flex items-center gap-2 mb-4 text-base font-semibold">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        {t.profile.voiceIntro}
                        <span className="text-xs font-normal text-muted">({t.profile.optional})</span>
                    </label>

                    {/* Error Display */}
                    {voiceError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{voiceError}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {!isRecording && !voiceBlob && (
                            <button
                                onClick={startRecording}
                                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02]"
                                title={t.profile.recordVoice}
                            >
                                <div className="w-3 h-3 rounded-full bg-card animate-pulse" />
                                <span className="font-medium">{t.profile.recordVoice}</span>
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all shadow-lg"
                            >
                                <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse" />
                                <span className="font-medium">{t.profile.stopRecording || 'إيقاف'}</span>
                                <span className="bg-card/20 px-2 py-0.5 rounded-md text-sm">{Math.round(recordingTime)}{tx('ui.s')}</span>
                            </button>
                        )}

                        {voiceBlob && (
                            <div className="flex items-center gap-3 w-full bg-card dark:bg-dark-800 rounded-xl p-3 border border-border dark:border-dark-600">
                                <button
                                    onClick={playRecording}
                                    className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-primary-500/30 transition-all flex-shrink-0"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ps-0.5" />}
                                </button>
                                <div className="flex-1">
                                    <div className="h-2 bg-muted dark:bg-dark-600 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r from-primary-400 to-primary-500 ${isPlaying ? 'animate-progress origin-left w-full duration-[2000ms]' : 'w-full'}`} />
                                    </div>
                                    <p className="text-xs text-muted mt-1">{tx('dynamic_key_2009227315')}</p>
                                </div>
                                <button
                                    onClick={deleteRecording}
                                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                        <span className="text-xs text-muted">{tx('ui.max_files')}</span>
                    </div>

                    <label className="block mb-6 group">
                        <div className="border-2 border-dashed border-border dark:border-dark-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300">
                            <div className="w-16 h-16 rounded-full bg-muted dark:bg-dark-700 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-muted group-hover:text-primary-500" />
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
                                <div key={index} className="p-3 bg-card dark:bg-dark-800 rounded-xl border border-border dark:border-dark-700 flex gap-3 animate-fade-in group hover:shadow-md transition-shadow">
                                    <div className="w-16 h-16 rounded-lg bg-muted dark:bg-dark-700 flex-shrink-0 overflow-hidden">
                                        {sample.preview ? (
                                            <img src={sample.preview} alt={tx('ui.preview')} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-muted" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <input
                                            type="text"
                                            value={sample.title}
                                            onChange={(e) => updateWorkSample(index, 'title', e.target.value)}
                                            className="bg-transparent font-medium text-dark-900 dark:text-white outline-none placeholder-dark-400 mb-1 w-full"
                                            placeholder={tx('ui.title')}
                                        />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted truncate">
                                                {(sample.file.size / 1024 / 1024).toFixed(2)} {tx('ui.mb')}</span>
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

                <div className="flex gap-4 pt-6 border-t border-border dark:border-dark-700">
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
