import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Briefcase,
    Upload,
    Mic,
    Play,
    Pause,
    Trash2,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    Camera,
    DollarSign,
    Languages,
    GraduationCap,
    Plus,
    X,
    Sparkles,
    FileText
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, uploadFile } from '../lib/supabase';
import { GOVERNORATES, PREDEFINED_SKILLS } from '../types';
import type { Skill } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Header } from '../components/layout';
import useVoiceRecording from '../hooks/useVoiceRecording';

// Types
interface LanguageEntry {
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
}

interface EducationEntry {
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
}

// Validation schemas inside function to simpler approach or outside with generic messages
// Moving outside to keep cleaner file structure, using generic English messages or keys if we were advanced.
// Using simplified messages for now as Zod i18n is complex without a library.

const step1Schema = z.object({
    full_name: z.string().min(3, 'Minimum 3 characters'),
    title: z.string().min(5, 'Minimum 5 characters'),
    location: z.string().min(1, 'Required'),
});

const step2Schema = z.object({
    hourly_rate: z.string().optional(),
    availability: z.string().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

function FreelancerOnboarding() {
    const { t, language, dir } = useTranslation();
    const { user, updateProfile, updateFreelancerProfile, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Languages state
    const [languages, setLanguages] = useState<LanguageEntry[]>([
        { language: 'ar', proficiency: 'native' }
    ]);

    // Education state
    const [education, setEducation] = useState<EducationEntry[]>([]);

    // Bio state
    const [bio, setBio] = useState('');

    // Portfolio state
    const [workSamples, setWorkSamples] = useState<{ file: File; preview: string; title: string; description: string }[]>([]);

    const {
        isRecording,
        duration: recordingTime,
        audioBlob: voiceBlob,
        audioUrl,
        startRecording,
        stopRecording,
        clearRecording: deleteRecording,
    } = useVoiceRecording();

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
    const BackArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    const step1Form = useForm<Step1FormData>({
        resolver: zodResolver(step1Schema),
    });

    const step2Form = useForm<Step2FormData>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            hourly_rate: '',
            availability: 'available',
        }
    });

    const totalSteps = 4;

    // Const options using Translations
    const LANGUAGES_OPTIONS = [
        { value: 'ar', label: 'العربية' },
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' },
        { value: 'it', label: 'Italiano' },
        { value: 'es', label: 'Español' },
    ];

    const PROFICIENCY_LEVELS = [
        { value: 'native', label: t.profile.languages.levels.native },
        { value: 'fluent', label: t.profile.languages.levels.fluent },
        { value: 'conversational', label: t.profile.languages.levels.conversational },
        { value: 'basic', label: t.profile.languages.levels.basic },
    ];

    const AVAILABILITY_OPTIONS = [
        { value: 'available', label: t.publicProfile.available },
        { value: 'busy', label: t.publicProfile.busy },
        { value: 'offline', label: t.publicProfile.offline },
    ];

    // Get skill name based on current language
    const getSkillName = (skill: Skill) => {
        switch (language) {
            case 'fr':
                return skill.name_fr;
            case 'en':
                return skill.name_en;
            default:
                return skill.name_ar;
        }
    };

    // Handle avatar upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast(t.common.error || 'Size error', 'error');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Toggle skill selection
    const toggleSkill = (skill: Skill) => {
        if (selectedSkills.find((s) => s.id === skill.id)) {
            setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
        } else if (selectedSkills.length < 5) {
            setSelectedSkills([...selectedSkills, skill]);
        } else {
            showToast('Max 5 skills', 'warning');
        }
    };

    // Add language
    const addLanguage = () => {
        if (languages.length < 5) {
            setLanguages([...languages, { language: '', proficiency: 'conversational' }]);
        }
    };

    // Remove language
    const removeLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    // Update language
    const updateLanguage = (index: number, field: keyof LanguageEntry, value: string) => {
        const newLanguages = [...languages];
        if (field === 'proficiency') {
            newLanguages[index].proficiency = value as LanguageEntry['proficiency'];
        } else {
            newLanguages[index].language = value;
        }
        setLanguages(newLanguages);
    };

    // Add education
    const addEducation = () => {
        if (education.length < 3) {
            setEducation([...education, { institution: '', degree: '', field: '', startYear: '', endYear: '' }]);
        }
    };

    // Remove education
    const removeEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    // Update education
    const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
        const newEducation = [...education];
        newEducation[index][field] = value;
        setEducation(newEducation);
    };

    // Handle file upload for portfolio
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxFiles = 5 - workSamples.length;
        const newSamples: { file: File; preview: string; title: string; description: string }[] = [];

        for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
            const file = files[i];
            if (file.size > 10 * 1024 * 1024) {
                showToast('Max size 10MB', 'error');
                continue;
            }

            const preview = file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : ''; // We'll handle icon display for non-images

            newSamples.push({ file, preview, title: file.name.split('.')[0], description: '' });
        }

        setWorkSamples([...workSamples, ...newSamples]);
    };

    // Remove work sample
    const removeWorkSample = (index: number) => {
        const newSamples = [...workSamples];
        if (newSamples[index].preview) {
            URL.revokeObjectURL(newSamples[index].preview);
        }
        newSamples.splice(index, 1);
        setWorkSamples(newSamples);
    };

    // Update work sample
    const updateWorkSample = (index: number, field: 'title' | 'description', value: string) => {
        const newSamples = [...workSamples];
        newSamples[index][field] = value;
        setWorkSamples(newSamples);
    };

    // Play voice recording
    const playRecording = () => {
        if (audioUrl && !isPlaying) {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => setIsPlaying(false);
            audio.play();
            setIsPlaying(true);
        } else if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Step 1: Basic Info
    const onStep1Submit = async (data: Step1FormData) => {
        setIsLoading(true);
        try {
            // Upload avatar if exists
            let avatarUrl = undefined;
            if (avatarFile && user) {
                const path = `${user.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
                avatarUrl = await uploadFile('avatars', path, avatarFile);
            }

            await updateProfile({
                full_name: data.full_name,
                location: data.location,
                avatar_url: avatarUrl,
            });

            await updateFreelancerProfile({
                title: data.title,
            });

            setStep(2);
        } catch (error) {
            showToast(t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Skills & Rate
    const onStep2Submit = async (data: Step2FormData) => {
        if (selectedSkills.length === 0) {
            showToast(t.common.error, 'warning');
            return;
        }

        setIsLoading(true);
        try {
            await updateFreelancerProfile({
                skills: selectedSkills,
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
                availability: data.availability as 'available' | 'busy' | 'offline',
            });
            setStep(3);
        } catch (error) {
            showToast(t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Languages & Education
    const saveLanguagesAndEducation = async () => {
        setIsLoading(true);
        try {
            const validLanguages = languages.filter(l => l.language);
            const validEducation = education.filter(e => e.institution && e.degree);

            await updateFreelancerProfile({
                languages: validLanguages,
                education: validEducation,
            });
            setStep(4);
        } catch (error) {
            showToast(t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Bio & Portfolio - Complete
    const completeOnboarding = async () => {
        setIsLoading(true);
        try {
            // Update bio
            if (bio) {
                await updateProfile({ bio });
            }

            // Upload work samples
            for (const sample of workSamples) {
                const path = `${user?.id}/${Date.now()}-${sample.file.name}`;
                const url = await uploadFile('portfolio', path, sample.file);

                await supabase.from('portfolio_items').insert({
                    freelancer_id: user?.id,
                    title: sample.title,
                    description: sample.description,
                    thumbnail_url: sample.file.type.startsWith('image/') ? url : null,
                    media_urls: [url],
                });
            }

            // Upload voice intro if exists
            if (voiceBlob) {
                const path = `${user?.id}/voice-intro-${Date.now()}.webm`;
                const file = new File([voiceBlob], 'voice-intro.webm', { type: 'audio/webm' });
                const url = await uploadFile('voice_intros', path, file);

                if (url) {
                    await updateFreelancerProfile({
                        voice_intro_url: url,
                    });
                }
            }

            await refreshProfile();
            showToast(t.payment.success, 'success');
            navigate('/freelancer/dashboard');
        } catch (error) {
            console.error(error);
            showToast(t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden relative transition-colors duration-300">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 start-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[100px]" />
            </div>

            <Header />

            <div className="container-custom py-12 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="heading-md mb-2">{t.onboarding.freelancer.welcome}</h1>
                        <p className="text-muted">{t.onboarding.freelancer.welcomeDesc}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-3 text-sm font-medium text-dark-500">
                            <span>{t.common.next} {step} / {totalSteps}</span>
                            <span className="text-primary-600 dark:text-primary-400">{Math.round((step / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary-500/30"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-muted">
                            {[
                                t.onboarding.freelancer.steps.skills, // Using steps.skills as generic 'Info' replacement if needed or just reusing keys
                                t.profile.skills,
                                t.profile.languages.title,
                                t.onboarding.freelancer.steps.portfolio
                            ].map((label, i) => (
                                <span
                                    key={i}
                                    className={`transition-colors duration-300 ${step >= i + 1 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="card-glass shadow-xl dark:shadow-black/20 animate-fade-in">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t.settings.profile}</h2>
                                        <p className="text-muted text-sm">{t.onboarding.client.profileDesc}</p>
                                    </div>
                                </div>

                                <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
                                    {/* Avatar Upload */}
                                    <div className="flex justify-center mb-8">
                                        <div className="relative group">
                                            <div
                                                className="w-28 h-28 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white dark:border-dark-700 shadow-xl group-hover:shadow-2xl transition-all"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-10 h-10 text-gray-300 dark:text-dark-600" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 hover:scale-110 transition-all border-2 border-white dark:border-dark-800"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <Input
                                                {...step1Form.register('full_name')}
                                                label={t.profile.fullName}
                                                placeholder={t.profile.fullNamePlaceholder}
                                                error={step1Form.formState.errors.full_name?.message}
                                                leftIcon={<User className="w-5 h-5" />}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Input
                                                {...step1Form.register('title')}
                                                label={t.profile.bio} /* Using Bio as generic label or create new key */
                                                placeholder={t.profile.bioPlaceholder}
                                                error={step1Form.formState.errors.title?.message}
                                                leftIcon={<Briefcase className="w-5 h-5" />}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Select
                                                {...step1Form.register('location')}
                                                label={t.profile.location}
                                                placeholder={t.profile.selectLocation}
                                                error={step1Form.formState.errors.location?.message}
                                                options={GOVERNORATES.map((gov) => ({ value: gov, label: gov }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            className="w-full"
                                            isLoading={isLoading}
                                            rightIcon={<ArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.next}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 2: Skills & Rate */}
                        {step === 2 && (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
                                        <Sparkles className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t.profile.skills} & {t.job.budget}</h2>
                                        <p className="text-muted text-sm">{t.onboarding.client.profileDesc}</p>
                                    </div>
                                </div>

                                <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-8">
                                    {/* Skills Selection */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="label mb-0">{t.profile.skills}</label>
                                            <span className="text-xs font-medium px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                                {selectedSkills.length}/5
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                            {PREDEFINED_SKILLS.map((skill) => {
                                                const isSelected = selectedSkills.find((s) => s.id === skill.id);
                                                return (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => toggleSkill(skill)}
                                                        className={`
                                                            p-3 rounded-xl border transition-all duration-200 text-start relative overflow-hidden group
                                                            ${isSelected
                                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md ring-1 ring-primary-500'
                                                                : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-primary-300 dark:hover:border-dark-500'
                                                            }
                                                        `}
                                                    >
                                                        <span className={`text-sm font-medium relative z-10 ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'}`}>
                                                            {getSkillName(skill)}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="absolute top-2 end-2">
                                                                <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            {...step2Form.register('hourly_rate')}
                                            type="number"
                                            label={`${t.job.budget} (${t.common.tnd})`}
                                            placeholder="50"
                                            min="0"
                                            leftIcon={<DollarSign className="w-5 h-5 text-success-600" />}
                                            hint={t.profile.optional}
                                        />

                                        <Select
                                            {...step2Form.register('availability')}
                                            label={t.publicProfile.available} /* Using 'Available' as label? No, 'Status' or 'Availability' key is missing. using publicProfile.available as label is weird. */
                                            options={AVAILABILITY_OPTIONS}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="lg"
                                            onClick={() => setStep(1)}
                                            leftIcon={<BackArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.back}
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            className="flex-1"
                                            isLoading={isLoading}
                                            rightIcon={<ArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.next}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Languages & Education */}
                        {step === 3 && (
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/30">
                                        <Languages className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t.profile.languages.title} & {t.profile.education.title}</h2>
                                        <p className="text-muted text-sm">{t.onboarding.freelancer.steps.experience}</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* Languages */}
                                    <div className="bg-gray-50 dark:bg-dark-800/50 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="label mb-0 text-lg">{t.profile.languages.title}</label>
                                            {languages.length < 5 && (
                                                <button
                                                    type="button"
                                                    onClick={addLanguage}
                                                    className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                                                >
                                                    <Plus className="w-4 h-4 me-1" />
                                                    {t.profile.languages.add}
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {languages.map((lang, index) => (
                                                <div key={index} className="flex gap-3 items-start animate-fade-in">
                                                    <Select
                                                        value={lang.language}
                                                        onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                                        options={LANGUAGES_OPTIONS}
                                                        placeholder={t.profile.languages.select}
                                                        className="flex-1"
                                                    />
                                                    <Select
                                                        value={lang.proficiency}
                                                        onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                                                        options={PROFICIENCY_LEVELS}
                                                        className="flex-1"
                                                    />
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLanguage(index)}
                                                            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Education */}
                                    <div className="bg-gray-50 dark:bg-dark-800/50 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="label mb-0 flex items-center gap-2 text-lg">
                                                <GraduationCap className="w-5 h-5 text-dark-400" />
                                                {t.profile.education.title}
                                            </label>
                                            {education.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={addEducation}
                                                    className="btn-ghost btn-sm text-primary-600 dark:text-primary-400"
                                                >
                                                    <Plus className="w-4 h-4 me-1" />
                                                    {t.common.next} {/* Reuse Next? No. Reuse 'Add' */}
                                                    {t.profile.education.add}
                                                </button>
                                            )}
                                        </div>
                                        {education.length === 0 ? (
                                            <div className="text-center py-8 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-200 dark:border-dark-600">
                                                <GraduationCap className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                                                <p className="text-muted text-sm px-4">{t.profile.education.noEducation}</p>
                                                <button
                                                    type="button"
                                                    onClick={addEducation}
                                                    className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-3 hover:underline"
                                                >
                                                    {t.profile.education.add}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {education.map((edu, index) => (
                                                    <div key={index} className="p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 relative animate-fade-in group">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEducation(index)}
                                                            className="absolute top-2 end-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="md:col-span-2">
                                                                <Input
                                                                    value={edu.institution}
                                                                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                                    placeholder={t.profile.education.institution}
                                                                />
                                                            </div>
                                                            <Input
                                                                value={edu.degree}
                                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                                placeholder={t.profile.education.degree}
                                                            />
                                                            <Input
                                                                value={edu.field}
                                                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                                                placeholder={t.profile.education.field}
                                                            />
                                                            <Input
                                                                value={edu.startYear}
                                                                onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                                                                placeholder={t.profile.education.startYear}
                                                                type="number"
                                                            />
                                                            <Input
                                                                value={edu.endYear}
                                                                onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                                                                placeholder={t.profile.education.endYear}
                                                                type="number"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            onClick={() => setStep(2)}
                                            leftIcon={<BackArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.back}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="flex-1"
                                            onClick={saveLanguagesAndEducation}
                                            isLoading={isLoading}
                                            rightIcon={<ArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.next}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Bio & Portfolio */}
                        {step === 4 && (
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
                                            onClick={() => setStep(3)}
                                            leftIcon={<BackArrowIcon className="w-5 h-5" />}
                                        >
                                            {t.common.back}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="flex-1 text-lg"
                                            onClick={completeOnboarding}
                                            isLoading={isLoading}
                                            rightIcon={<CheckCircle className="w-5 h-5" />}
                                        >
                                            {t.auth.completeProfile}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreelancerOnboarding;
