import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, uploadFile } from '../lib/supabase';
import type { Skill } from '../types';
import { Header } from '../components/layout';

// Step Components
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
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

    // SIMPLIFIED: Only 2 steps now!
    const totalSteps = 2;

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

    // Helper: Remove avatar
    const removeAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
    };

    // STEP 1: Personal Info (name, title, location, avatar)
    const onStep1Submit = async (data: Step1FormData) => {
        setIsLoading(true);

        try {
            // Build profile data
            const profileData: Record<string, any> = {
                id: user!.id,
                full_name: data.full_name,
                location: data.location,
                user_type: 'freelancer',
                updated_at: new Date().toISOString()
            };

            // Upload avatar if selected (with timeout)
            if (avatarFile) {
                try {
                    const fileExt = avatarFile.name.split('.').pop();
                    const filePath = `${user!.id}/avatar-${Date.now()}.${fileExt}`;

                    const avatarUrl = await Promise.race([
                        uploadFile('avatars', filePath, avatarFile),
                        new Promise<string>((_, reject) =>
                            setTimeout(() => reject(new Error('Avatar upload timeout')), 10000)
                        )
                    ]);

                    if (avatarUrl) {
                        profileData.avatar_url = avatarUrl;
                        console.log('[Onboarding] Avatar uploaded:', avatarUrl);
                    }
                } catch (avatarErr) {
                    console.warn('[Onboarding] Avatar upload failed, continuing:', avatarErr);
                    // Continue without avatar - not critical
                }
            }

            // Save profile with 8s timeout
            console.log('[Onboarding] Saving profile...', profileData);

            try {
                const { error: profileError } = await Promise.race([
                    supabase.from('profiles').upsert(profileData, { onConflict: 'id' }),
                    new Promise<{ error: { message: string } }>((resolve) =>
                        setTimeout(() => resolve({ error: { message: 'TIMEOUT' } }), 8000)
                    )
                ]);

                if (profileError) {
                    console.warn('[Onboarding] Profile save issue:', profileError);
                    localStorage.setItem('pending_profile', JSON.stringify(profileData));
                } else {
                    console.log('[Onboarding] ✅ Profile saved!');
                }
            } catch (saveErr) {
                console.warn('[Onboarding] Profile save exception:', saveErr);
                localStorage.setItem('pending_profile', JSON.stringify(profileData));
            }

            // Create freelancer profile entry
            const freelancerData = {
                id: user!.id,
                title: data.title,
                updated_at: new Date().toISOString()
            };

            try {
                const { error: flError } = await Promise.race([
                    supabase.from('freelancer_profiles').upsert(freelancerData, { onConflict: 'id' }),
                    new Promise<{ error: { message: string } }>((resolve) =>
                        setTimeout(() => resolve({ error: { message: 'TIMEOUT' } }), 8000)
                    )
                ]);

                if (flError) {
                    console.warn('[Onboarding] Freelancer profile save issue:', flError);
                } else {
                    console.log('[Onboarding] ✅ Freelancer profile created!');
                }
            } catch (flErr) {
                console.warn('[Onboarding] Freelancer save exception:', flErr);
            }

            // Move to step 2
            showToast('تم حفظ البيانات الأساسية', 'success');
            setStep(2);
        } catch (error: any) {
            console.error('Step 1 error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // STEP 2: Skills & Availability - THEN COMPLETE ONBOARDING
    const onStep2Submit = async (data: Step2FormData) => {
        if (selectedSkills.length === 0) {
            showToast('يرجى اختيار مهارة واحدة على الأقل', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            console.log('[Onboarding] Saving skills and completing onboarding...');

            const skillsData = {
                skills: selectedSkills,
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
                availability: data.availability as 'available' | 'busy' | 'offline',
            };

            // Save skills with timeout
            try {
                await Promise.race([
                    updateFreelancerProfile(skillsData),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                ]);
                console.log('[Onboarding] ✅ Skills saved!');
            } catch (skillsErr) {
                console.warn('[Onboarding] Skills save failed:', skillsErr);
                localStorage.setItem('pending_skills', JSON.stringify(skillsData));
            }

            // Mark onboarding as complete!
            try {
                await Promise.race([
                    updateProfile({ onboarding_completed: true }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                ]);
                console.log('[Onboarding] ✅ Onboarding marked complete!');
            } catch (completeErr) {
                console.warn('[Onboarding] Could not mark complete:', completeErr);
                localStorage.setItem('pending_onboarding_complete', 'true');
            }

            // Refresh profile
            refreshProfile().catch(e => console.warn('Profile refresh failed:', e));

            // SUCCESS! Navigate to dashboard
            showToast('مرحباً بك في خدمة! 🎉', 'success');
            navigate('/freelancer/dashboard');

        } catch (error: any) {
            console.error('Step 2 error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden relative transition-colors duration-300">
            <Header />

            <div className="container-custom py-12 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="heading-md mb-2">{t.onboarding.freelancer.welcome}</h1>
                        <p className="text-muted">{t.onboarding.freelancer.welcomeDesc}</p>
                    </div>

                    {/* Simplified Progress Bar - 2 Steps Only */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-3 text-sm font-medium text-dark-500">
                            <span>الخطوة {step} من {totalSteps}</span>
                            <span className="text-primary-600 dark:text-primary-400">{Math.round((step / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary-500/30"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-muted">
                            <span className={`transition-colors duration-300 ${step >= 1 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}>
                                المعلومات الأساسية
                            </span>
                            <span className={`transition-colors duration-300 ${step >= 2 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}>
                                المهارات والخبرة
                            </span>
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
                    </div>

                    {/* Post-onboarding hint */}
                    {step === 2 && (
                        <div className="mt-6 text-center text-sm text-muted">
                            <p>💡 يمكنك إضافة الشهادات والمعرض ووسائل التعريف لاحقاً من الإعدادات</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FreelancerOnboarding;
