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

// Language options
const LANGUAGES = [
    { value: 'ar', label: 'العربية' },
    { value: 'fr', label: 'الفرنسية' },
    { value: 'en', label: 'الإنجليزية' },
    { value: 'de', label: 'الألمانية' },
    { value: 'it', label: 'الإيطالية' },
    { value: 'es', label: 'الإسبانية' },
];

const PROFICIENCY_LEVELS = [
    { value: 'native', label: 'اللغة الأم' },
    { value: 'fluent', label: 'طلاقة' },
    { value: 'conversational', label: 'محادثة' },
    { value: 'basic', label: 'أساسي' },
];

const AVAILABILITY_OPTIONS = [
    { value: 'available', label: 'متاح للعمل' },
    { value: 'busy', label: 'مشغول حالياً' },
    { value: 'offline', label: 'غير متاح' },
];

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

// Validation schemas
const step1Schema = z.object({
    full_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
    title: z.string().min(5, 'العنوان المهني يجب أن يكون 5 أحرف على الأقل'),
    location: z.string().min(1, 'اختر ولايتك'),
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
        uploadRecording,
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
                showToast('حجم الصورة يجب أن يكون أقل من 5 ميجا', 'error');
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
            showToast('يمكنك اختيار 5 مهارات كحد أقصى', 'warning');
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
                showToast('حجم الملف يجب أن يكون أقل من 10 ميجا', 'error');
                continue;
            }

            const preview = file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : '/file-icon.png';

            newSamples.push({ file, preview, title: file.name.split('.')[0], description: '' });
        }

        setWorkSamples([...workSamples, ...newSamples]);
    };

    // Remove work sample
    const removeWorkSample = (index: number) => {
        const newSamples = [...workSamples];
        URL.revokeObjectURL(newSamples[index].preview);
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
            showToast('حدث خطأ في حفظ البيانات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Skills & Rate
    const onStep2Submit = async (data: Step2FormData) => {
        if (selectedSkills.length === 0) {
            showToast('اختر مهارة واحدة على الأقل', 'warning');
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
            showToast('حدث خطأ في حفظ المهارات', 'error');
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
            showToast('حدث خطأ في حفظ البيانات', 'error');
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
                const uploadedRec = await uploadRecording(`${user?.id}`);
                if (uploadedRec) {
                    await updateFreelancerProfile({
                        voice_intro_url: uploadedRec.url,
                    });
                }
            }

            await refreshProfile();
            showToast('تم إكمال التسجيل بنجاح!', 'success');
            navigate('/freelancer/dashboard');
        } catch (error) {
            showToast('حدث خطأ في إكمال التسجيل', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Skip to dashboard
    const skipToEnd = () => {
        navigate('/freelancer/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted">
                                الخطوة {step} من {totalSteps}
                            </span>
                            <span className="text-sm font-medium text-primary-600">
                                {Math.round((step / totalSteps) * 100)}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted">
                            <span className={step >= 1 ? 'text-primary-600 font-medium' : ''}>المعلومات</span>
                            <span className={step >= 2 ? 'text-primary-600 font-medium' : ''}>المهارات</span>
                            <span className={step >= 3 ? 'text-primary-600 font-medium' : ''}>اللغات</span>
                            <span className={step >= 4 ? 'text-primary-600 font-medium' : ''}>البورتفوليو</span>
                        </div>
                    </div>

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
                                    <p className="text-muted text-sm">أخبرنا عنك</p>
                                </div>
                            </div>

                            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
                                {/* Avatar Upload */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div
                                            className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white shadow-lg"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-gray-400" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
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

                                <Input
                                    {...step1Form.register('full_name')}
                                    label={t.profile.fullName}
                                    placeholder={t.profile.fullNamePlaceholder}
                                    error={step1Form.formState.errors.full_name?.message}
                                    leftIcon={<User className="w-5 h-5" />}
                                />

                                <Input
                                    {...step1Form.register('title')}
                                    label="العنوان المهني"
                                    placeholder="مثال: مصمم جرافيك محترف"
                                    error={step1Form.formState.errors.title?.message}
                                    leftIcon={<Briefcase className="w-5 h-5" />}
                                />

                                <Select
                                    {...step1Form.register('location')}
                                    label={t.profile.location}
                                    placeholder={t.profile.selectLocation}
                                    error={step1Form.formState.errors.location?.message}
                                    options={GOVERNORATES.map((gov) => ({ value: gov, label: gov }))}
                                />

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
                            </form>
                        </div>
                    )}

                    {/* Step 2: Skills & Rate */}
                    {step === 2 && (
                        <div className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{t.profile.skills} والأسعار</h2>
                                    <p className="text-muted text-sm">حدد مهاراتك وسعر الساعة</p>
                                </div>
                            </div>

                            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
                                {/* Skills Selection */}
                                <div>
                                    <label className="label">{t.profile.skills} (اختر حتى 5)</label>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {PREDEFINED_SKILLS.map((skill) => {
                                            const isSelected = selectedSkills.find((s) => s.id === skill.id);
                                            return (
                                                <button
                                                    key={skill.id}
                                                    type="button"
                                                    onClick={() => toggleSkill(skill)}
                                                    className={`
                                                        p-3 rounded-xl border-2 text-start transition-all duration-200
                                                        ${isSelected
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200 hover:border-primary-300'
                                                        }
                                                    `}
                                                >
                                                    <span className="font-medium text-sm">{getSkillName(skill)}</span>
                                                    {isSelected && (
                                                        <CheckCircle className="w-4 h-4 text-primary-600 float-end" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-sm text-muted">المهارات المختارة: {selectedSkills.length}/5</p>
                                </div>

                                {/* Hourly Rate */}
                                <Input
                                    {...step2Form.register('hourly_rate')}
                                    type="number"
                                    label="سعر الساعة (دينار تونسي)"
                                    placeholder="مثال: 50"
                                    leftIcon={<DollarSign className="w-5 h-5" />}
                                />

                                {/* Availability */}
                                <Select
                                    {...step2Form.register('availability')}
                                    label="حالة التوفر"
                                    options={AVAILABILITY_OPTIONS}
                                />

                                <div className="flex gap-3">
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
                        <div className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <Languages className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">اللغات والتعليم</h2>
                                    <p className="text-muted text-sm">أضف لغاتك وخلفيتك التعليمية</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Languages */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="label mb-0">اللغات</label>
                                        {languages.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={addLanguage}
                                                className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                            >
                                                <Plus className="w-4 h-4" />
                                                إضافة لغة
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {languages.map((lang, index) => (
                                            <div key={index} className="flex gap-3 items-start">
                                                <Select
                                                    value={lang.language}
                                                    onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                                    options={LANGUAGES}
                                                    placeholder="اختر اللغة"
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
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="label mb-0 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5" />
                                            التعليم (اختياري)
                                        </label>
                                        {education.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={addEducation}
                                                className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                            >
                                                <Plus className="w-4 h-4" />
                                                إضافة
                                            </button>
                                        )}
                                    </div>
                                    {education.length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <GraduationCap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-muted text-sm">لم تضف أي تعليم بعد</p>
                                            <button
                                                type="button"
                                                onClick={addEducation}
                                                className="text-primary-600 text-sm font-medium mt-2 hover:underline"
                                            >
                                                إضافة تعليم
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {education.map((edu, index) => (
                                                <div key={index} className="p-4 bg-gray-50 rounded-xl relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEducation(index)}
                                                        className="absolute top-2 end-2 p-1 text-red-500 hover:bg-red-100 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input
                                                            value={edu.institution}
                                                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                            placeholder="اسم المؤسسة"
                                                            className="col-span-2"
                                                        />
                                                        <Input
                                                            value={edu.degree}
                                                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                            placeholder="الشهادة"
                                                        />
                                                        <Input
                                                            value={edu.field}
                                                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                                            placeholder="التخصص"
                                                        />
                                                        <Input
                                                            value={edu.startYear}
                                                            onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                                                            placeholder="سنة البداية"
                                                            type="number"
                                                        />
                                                        <Input
                                                            value={edu.endYear}
                                                            onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                                                            placeholder="سنة التخرج"
                                                            type="number"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
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
                        <div className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">النبذة والبورتفوليو</h2>
                                    <p className="text-muted text-sm">أضف نبذة عنك ونماذج من أعمالك</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Bio */}
                                <div>
                                    <label className="label">{t.profile.bio} (حتى 500 حرف)</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                                        placeholder={t.profile.bioPlaceholder}
                                        rows={4}
                                        className="input resize-none"
                                    />
                                    <p className="text-xs text-muted mt-1">{bio.length}/500</p>
                                </div>

                                {/* Portfolio Upload */}
                                <div>
                                    <label className="label">{t.profile.workSamples} (اختياري)</label>
                                    <label className="block mb-4">
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors">
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-muted text-sm mb-1">{t.profile.dragDrop}</p>
                                            <p className="text-primary-600 font-medium text-sm">{t.profile.browse}</p>
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
                                        <div className="space-y-3">
                                            {workSamples.map((sample, index) => (
                                                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <img
                                                        src={sample.preview}
                                                        alt={sample.title}
                                                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            value={sample.title}
                                                            onChange={(e) => updateWorkSample(index, 'title', e.target.value)}
                                                            placeholder="عنوان العمل"
                                                            className="text-sm"
                                                        />
                                                        <Input
                                                            value={sample.description}
                                                            onChange={(e) => updateWorkSample(index, 'description', e.target.value)}
                                                            placeholder="وصف مختصر"
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWorkSample(index)}
                                                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg self-start"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Voice Intro */}
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <Mic className="w-5 h-5" />
                                        {t.profile.voiceIntro} (اختياري)
                                    </label>
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                        {!voiceBlob ? (
                                            <>
                                                <div className={`
                                                    w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center transition-all duration-300
                                                    ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-primary-100'}
                                                `}>
                                                    <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : 'text-primary-600'}`} />
                                                </div>
                                                {isRecording && (
                                                    <p className="text-xl font-bold text-foreground mb-3">
                                                        {recordingTime}s / 30s
                                                    </p>
                                                )}
                                                <Button
                                                    variant={isRecording ? 'danger' : 'outline'}
                                                    size="md"
                                                    onClick={isRecording ? stopRecording : startRecording}
                                                >
                                                    {isRecording ? t.profile.stopRecording : 'بدء التسجيل'}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3">
                                                <Button
                                                    variant="primary"
                                                    size="md"
                                                    onClick={playRecording}
                                                    leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                >
                                                    {isPlaying ? 'إيقاف' : t.profile.playRecording}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="md"
                                                    onClick={deleteRecording}
                                                    leftIcon={<Trash2 className="w-4 h-4" />}
                                                >
                                                    حذف
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
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
                                        className="flex-1"
                                        onClick={completeOnboarding}
                                        isLoading={isLoading}
                                        rightIcon={<CheckCircle className="w-5 h-5" />}
                                    >
                                        {t.auth.completeProfile}
                                    </Button>
                                </div>

                                <button
                                    type="button"
                                    onClick={skipToEnd}
                                    className="w-full text-center text-muted hover:text-foreground py-2"
                                >
                                    تخطي وإكمال لاحقاً
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FreelancerOnboarding;
