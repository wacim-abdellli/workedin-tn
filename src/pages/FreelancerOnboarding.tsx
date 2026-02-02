import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, uploadFile } from '../lib/supabase';
import type { Skill } from '../types';
import { Header } from '../components/layout';
import useVoiceRecording from '../hooks/useVoiceRecording';

// Step Components
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
import OnboardingStep3, { type LanguageEntry, type EducationEntry } from '../components/onboarding/OnboardingStep3';
import OnboardingStep4 from '../components/onboarding/OnboardingStep4';
import { step1Schema, type Step1FormData, step2Schema, type Step2FormData } from '../components/onboarding/schemas';

function FreelancerOnboarding() {
    const { t, language } = useTranslation();
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

    // Bio & Portfolio state
    const [bio, setBio] = useState('');
    const [workSamples, setWorkSamples] = useState<{ file: File; preview: string; title: string; description: string }[]>([]);

    // Voice Recording
    const voiceRecording = useVoiceRecording();
    const { audioBlob: voiceBlob, audioUrl } = voiceRecording;

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // Helper: Get skill name
    const getSkillName = (skill: Skill) => {
        switch (language) {
            case 'fr': return skill.name_fr;
            case 'en': return skill.name_en;
            default: return skill.name_ar;
        }
    };

    // Helper: Handle avatar
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showToast(t.common.invalidFileType, 'error');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast(t.common.fileTooLarge, 'error');
                return;
            }

            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Helper: Toggle skill
    const toggleSkill = (skill: Skill) => {
        if (selectedSkills.find((s) => s.id === skill.id)) {
            setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
        } else if (selectedSkills.length < 5) {
            setSelectedSkills([...selectedSkills, skill]);
        } else {
            showToast('Max 5 skills', 'warning');
        }
    };

    // Helper: Languages
    const addLanguage = () => {
        if (languages.length < 5) {
            setLanguages([...languages, { language: '', proficiency: 'conversational' }]);
        }
    };
    const removeLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };
    const updateLanguage = (index: number, field: keyof LanguageEntry, value: string) => {
        const newLanguages = [...languages];
        if (field === 'proficiency') {
            newLanguages[index].proficiency = value as LanguageEntry['proficiency'];
        } else {
            newLanguages[index].language = value;
        }
        setLanguages(newLanguages);
    };

    // Helper: Education
    const addEducation = () => {
        if (education.length < 3) {
            setEducation([...education, { institution: '', degree: '', field: '', startYear: '', endYear: '' }]);
        }
    };
    const removeEducation = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };
    const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
        const newEducation = [...education];
        newEducation[index][field] = value;
        setEducation(newEducation);
    };

    // Helper: Portfolio
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
            const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
            newSamples.push({ file, preview, title: file.name.split('.')[0], description: '' });
        }
        setWorkSamples([...workSamples, ...newSamples]);
    };
    const removeWorkSample = (index: number) => {
        const newSamples = [...workSamples];
        if (newSamples[index].preview) URL.revokeObjectURL(newSamples[index].preview);
        newSamples.splice(index, 1);
        setWorkSamples(newSamples);
    };
    const updateWorkSample = (index: number, field: 'title' | 'description', value: string) => {
        const newSamples = [...workSamples];
        newSamples[index][field] = value;
        setWorkSamples(newSamples);
    };

    // Helper: Play voice
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

    // Helper: Remove avatar
    const removeAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
    };

    // Step Submits
    const onStep1Submit = async (data: Step1FormData) => {
        setIsLoading(true);

        // Timeout wrapper to prevent infinite loading (30s for database, 20s for upload)
        const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((_, reject) =>
                    setTimeout(() => reject(new Error(`${label}: انتهت مهلة الطلب`)), ms)
                )
            ]);
        };

        try {
            let avatarUrl = undefined;

            // Try to upload avatar, but don't fail onboarding if it fails
            if (avatarFile && user) {
                try {
                    const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

                    // Upload file with 20s timeout
                    const { error: uploadError } = await withTimeout(
                        supabase.storage
                            .from('avatars')
                            .upload(fileName, avatarFile, {
                                cacheControl: '3600',
                                upsert: true
                            }),
                        20000,
                        'رفع الصورة'
                    );

                    if (uploadError) {
                        console.error('❌ Upload error details:', {
                            message: uploadError.message,
                            statusCode: uploadError.statusCode,
                            fullError: JSON.stringify(uploadError, null, 2)
                        });
                        throw uploadError;
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    avatarUrl = publicUrl;
                    console.log('✅ Avatar uploaded successfully:', publicUrl);
                } catch (uploadError: any) {
                    console.error('❌ Avatar upload failed - Full error:', {
                        message: uploadError?.message,
                        name: uploadError?.name,
                        stack: uploadError?.stack,
                        raw: uploadError
                    });
                    showToast(t.common.uploadFailed, 'warning');
                    // Continue without avatar
                }
            }

            // Save profile to Supabase with timeout
            console.log('[Onboarding] Saving profile to database...');
            const profileData = {
                id: user!.id,
                full_name: data.full_name,
                location: data.location,
                user_type: 'freelancer' as const,
                ...(avatarUrl && { avatar_url: avatarUrl }),
                updated_at: new Date().toISOString()
            };

            // Use Promise.race with timeout for profile save (30s for slow connections)
            const profileSavePromise = supabase.from('profiles').upsert(profileData);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            );

            try {
                const profileResult = await Promise.race([profileSavePromise, timeoutPromise]) as any;
                if (profileResult?.error) {
                    console.error('[Onboarding] Profile save error:', profileResult.error);
                    throw new Error(`فشل حفظ الملف الشخصي: ${profileResult.error.message}`);
                }
                console.log('[Onboarding] Profile saved successfully');
            } catch (saveError: any) {
                if (saveError.message === 'timeout') {
                    console.warn('[Onboarding] Profile save timed out, saving locally');
                    localStorage.setItem('pending_profile', JSON.stringify(profileData));
                    showToast('تم حفظ البيانات مؤقتاً', 'warning');
                } else {
                    throw saveError;
                }
            }

            // Save freelancer profile
            console.log('[Onboarding] Saving freelancer profile...');
            const freelancerData = {
                id: user!.id,
                title: data.title,
                updated_at: new Date().toISOString()
            };

            const freelancerSavePromise = supabase.from('freelancer_profiles').upsert(freelancerData);
            const freelancerTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            );
            try {
                const freelancerResult = await Promise.race([freelancerSavePromise, freelancerTimeout]) as any;
                if (freelancerResult?.error) {
                    console.error('[Onboarding] Freelancer profile save error:', freelancerResult.error);
                    // Non-critical, continue anyway
                } else {
                    console.log('[Onboarding] Freelancer profile saved successfully');
                }
            } catch (saveError: any) {
                if (saveError.message === 'timeout') {
                    console.warn('[Onboarding] Freelancer save timed out');
                    localStorage.setItem('pending_freelancer', JSON.stringify(freelancerData));
                }
            }

            // Refresh profile context (non-blocking)
            refreshProfile().catch(e => console.warn('Profile refresh failed:', e));

            showToast('تم حفظ البيانات بنجاح', 'success');
            setStep(2);
        } catch (error: any) {
            console.error('Step 1 error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const onStep2Submit = async (data: Step2FormData) => {
        if (selectedSkills.length === 0) {
            showToast(t.common.error, 'warning');
            return;
        }
        setIsLoading(true);
        try {
            console.log('[Onboarding] Saving skills and availability...');
            const skillsData = {
                skills: selectedSkills,
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
                availability: data.availability as 'available' | 'busy' | 'offline',
            };

            // Save with timeout (30s for slow connections)
            const savePromise = updateFreelancerProfile(skillsData);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            );

            try {
                await Promise.race([savePromise, timeoutPromise]);
                console.log('[Onboarding] Skills saved successfully');
                localStorage.removeItem('pending_onboarding_step2');
            } catch (saveError: any) {
                if (saveError.message === 'timeout') {
                    console.warn('[Onboarding] Skills save timed out, saving locally');
                    localStorage.setItem('pending_onboarding_step2', JSON.stringify(skillsData));
                    showToast('تم حفظ البيانات مؤقتاً', 'warning');
                } else {
                    throw saveError;
                }
            }

            showToast('تم حفظ المهارات بنجاح', 'success');
            setStep(3);
        } catch (error: any) {
            console.error('Step 2 error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const saveLanguagesAndEducation = async () => {
        setIsLoading(true);
        try {
            console.log('[Onboarding] Saving languages and education...');
            const validLanguages = languages.filter(l => l.language);
            const validEducation = education.filter(e => e.institution && e.degree);

            const savePromise = updateFreelancerProfile({
                languages: validLanguages,
                education: validEducation,
            });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 30000)
            );

            try {
                await Promise.race([savePromise, timeoutPromise]);
                console.log('[Onboarding] Languages/education saved successfully');
            } catch (saveError: any) {
                if (saveError.message === 'timeout') {
                    console.warn('[Onboarding] Languages/education save timed out');
                    localStorage.setItem('pending_step3', JSON.stringify({ languages: validLanguages, education: validEducation }));
                    showToast('تم حفظ البيانات مؤقتاً', 'warning');
                } else {
                    throw saveError;
                }
            }

            setStep(4);
        } catch (error: any) {
            console.error('Step 3 error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        setIsLoading(true);
        const errors: string[] = [];

        try {
            // Step 1: Save bio (optional, non-blocking)
            if (bio) {
                try {
                    await Promise.race([
                        updateProfile({ bio }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
                    ]);
                } catch (bioError: any) {
                    console.warn('[Onboarding] Bio save failed:', bioError);
                    localStorage.setItem('pending_bio', bio);
                    errors.push('حفظ نبذة عنك');
                }
            }

            // Step 2: Upload portfolio items (optional, non-blocking)
            for (const sample of workSamples) {
                try {
                    const path = `${user?.id}/${Date.now()}-${sample.file.name}`;
                    const url = await Promise.race([
                        uploadFile('portfolio', path, sample.file),
                        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
                    ]);
                    await supabase.from('portfolio_items').insert({
                        freelancer_id: user?.id,
                        title: sample.title,
                        description: sample.description,
                        thumbnail_url: sample.file.type.startsWith('image/') ? url : null,
                        media_urls: [url],
                    });
                } catch (portfolioError: any) {
                    console.warn('[Onboarding] Portfolio upload failed:', portfolioError);
                    errors.push(`رفع ${sample.title}`);
                }
            }

            // Step 3: Upload voice intro (optional, non-blocking)
            if (voiceBlob) {
                try {
                    const path = `${user?.id}/voice-intro-${Date.now()}.webm`;
                    const file = new File([voiceBlob], 'voice-intro.webm', { type: 'audio/webm' });
                    const url = await Promise.race([
                        uploadFile('voice_intros', path, file),
                        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
                    ]);
                    if (url) {
                        await updateFreelancerProfile({ voice_intro_url: url });
                    }
                } catch (voiceError: any) {
                    console.warn('[Onboarding] Voice intro upload failed:', voiceError);
                    errors.push('التسجيل الصوتي');
                }
            }

            // Step 4: Mark onboarding as complete (CRITICAL - must succeed)
            try {
                await Promise.race([
                    updateProfile({ onboarding_completed: true }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
                ]);
            } catch (completeError: any) {
                console.error('[Onboarding] Critical: Failed to mark onboarding complete:', completeError);
                // Try one more time directly
                const { error: directError } = await supabase
                    .from('profiles')
                    .update({ onboarding_completed: true })
                    .eq('id', user!.id);
                if (directError) throw directError;
            }

            // Refresh profile (non-blocking)
            refreshProfile().catch(e => console.warn('Profile refresh failed:', e));

            // Show appropriate success message
            if (errors.length > 0) {
                showToast(`تم إكمال التسجيل مع بعض الأخطاء: ${errors.join(', ')}`, 'warning');
            } else {
                showToast(t.payment.success || 'تم إكمال التسجيل بنجاح!', 'success');
            }
            navigate('/freelancer/dashboard');
        } catch (error: any) {
            console.error('Complete onboarding error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden relative transition-colors duration-300">
            {/* ... JSX ... */}
            <Header />

            <div className="container-custom py-12 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* ... Header ... */}
                    <div className="text-center mb-10">
                        <h1 className="heading-md mb-2">{t.onboarding.freelancer.welcome}</h1>
                        <p className="text-muted">{t.onboarding.freelancer.welcomeDesc}</p>
                    </div>

                    {/* ... Progress Bar ... */}
                    <div className="mb-10">
                        {/* ... */}
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
                                t.onboarding.freelancer.steps.skills,
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
                        {step === 1 && (
                            <OnboardingStep1
                                form={step1Form}
                                onSubmit={onStep1Submit}
                                isLoading={isLoading}
                                avatarPreview={avatarPreview}
                                onAvatarChange={handleAvatarChange}
                                onRemoveAvatar={removeAvatar}
                            />
                        )}
                        {step === 2 && (
                            <OnboardingStep2
                                form={step2Form}
                                onSubmit={onStep2Submit}
                                onBack={() => setStep(1)}
                                isLoading={isLoading}
                                selectedSkills={selectedSkills}
                                toggleSkill={toggleSkill}
                                getSkillName={getSkillName}
                            />
                        )}
                        {step === 3 && (
                            <OnboardingStep3
                                languages={languages}
                                addLanguage={addLanguage}
                                removeLanguage={removeLanguage}
                                updateLanguage={updateLanguage}
                                education={education}
                                addEducation={addEducation}
                                removeEducation={removeEducation}
                                updateEducation={updateEducation}
                                onNext={saveLanguagesAndEducation}
                                onBack={() => setStep(2)}
                                isLoading={isLoading}
                            />
                        )}
                        {step === 4 && (
                            <OnboardingStep4
                                bio={bio}
                                setBio={setBio}
                                workSamples={workSamples}
                                handleFileUpload={handleFileUpload}
                                removeWorkSample={removeWorkSample}
                                updateWorkSample={updateWorkSample}
                                voiceRecording={voiceRecording}
                                isPlaying={isPlaying}
                                playRecording={playRecording}
                                onComplete={completeOnboarding}
                                onBack={() => setStep(3)}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreelancerOnboarding;
