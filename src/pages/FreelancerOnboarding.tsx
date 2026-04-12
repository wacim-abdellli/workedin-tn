 import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Zap, DollarSign } from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getStorageConfigErrorMessage, isMissingStorageBucketError, supabase, uploadFile, withTimeout } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import type { Skill, SkillEntry } from '../types';
import { PREDEFINED_SKILLS, entryToSkill, skillToEntry } from '../types';
import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
import OnboardingStep3 from '../components/onboarding/OnboardingStep3';
import { FullScreenLoader } from '../components/ui';
import { normalizeOptionalPhone } from '@/lib/phone';
import {
    step1Schema,
    type Step1FormData,
    step2Schema,
    type Step2FormData,
    freelancerStep3Schema,
    type FreelancerStep3FormData,
} from '../components/onboarding/schemas';

function FreelancerOnboarding() {
    const { t, tx, language } = useTranslation();
    const { user, profile, freelancerProfile, refreshProfile, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const step1Form = useForm<Step1FormData>({
        resolver: zodResolver(step1Schema),
    });

    const step2Form = useForm<Step2FormData>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            hourly_rate: '',
            availability: 'available',
        },
    });

    const step3Form = useForm<FreelancerStep3FormData>({
        resolver: zodResolver(freelancerStep3Schema),
        defaultValues: {
            years_experience: '',
            tools: '',
            industries: '',
            portfolio_links: '',
            weekly_availability_hours: '',
            revision_policy: '',
            project_preferences: '',
        },
    });

    useEffect(() => {
        let step1Values = {
            full_name: profile?.full_name || '',
            title: freelancerProfile?.title || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
        };

        let step2Values = {
            hourly_rate: freelancerProfile?.hourly_rate ? String(freelancerProfile.hourly_rate) : '',
            availability: freelancerProfile?.availability || 'available',
        };

        let step3Values = {
            years_experience: freelancerProfile?.years_experience ? String(freelancerProfile.years_experience) : '',
            tools: toCsv(freelancerProfile?.tools),
            industries: toCsv(freelancerProfile?.industries),
            portfolio_links: toCsv(freelancerProfile?.portfolio_links),
            weekly_availability_hours: freelancerProfile?.weekly_availability_hours ? String(freelancerProfile.weekly_availability_hours) : '',
            revision_policy: freelancerProfile?.revision_policy || '',
            project_preferences: typeof freelancerProfile?.project_preferences?.summary === 'string'
                ? freelancerProfile.project_preferences.summary
                : '',
        };

        let draftStep2SkillIds: string[] = [];

        try {
            const draft1 = localStorage.getItem(`freelancer_draft_1_${user?.id}`);
            const draft2 = localStorage.getItem(`freelancer_draft_2_${user?.id}`);
            const draft3 = localStorage.getItem(`freelancer_draft_3_${user?.id}`);
            const draft2Skills = localStorage.getItem(`freelancer_draft_2_skills_${user?.id}`);
            if (draft1) {
                step1Values = { ...step1Values, ...JSON.parse(draft1) };
            }
            if (draft2) {
                step2Values = { ...step2Values, ...JSON.parse(draft2) };
            }
            if (draft3) {
                step3Values = { ...step3Values, ...JSON.parse(draft3) };
            }
            if (draft2Skills) {
                const parsed = JSON.parse(draft2Skills);
                if (Array.isArray(parsed)) {
                    draftStep2SkillIds = parsed.filter((item) => typeof item === 'string');
                }
            }
        } catch {
            // Ignore invalid JSON in localStorage draft
        }

        step1Form.reset(step1Values);
        const skillsMap = Object.fromEntries(PREDEFINED_SKILLS.map((skill) => [skill.id, skill]));
        const predefinedSkillIds = new Set(PREDEFINED_SKILLS.map((skill) => skill.id));
        const existingSkills = (freelancerProfile?.skills || [])
            .map((skill) => {
                if ('name_ar' in skill) return skill as Skill;

                const entry = skill as SkillEntry;
                const mappedSkill = entryToSkill(entry, skillsMap);
                if (mappedSkill) return mappedSkill;

                // Ignore custom skills - only restore predefined ones
                return null;
            })
            .filter(Boolean) as Skill[];

        const restoredPredefinedSkills: Skill[] = existingSkills.filter(skill => 
            predefinedSkillIds.has(skill.id)
        );

        const draftPredefinedSkills = draftStep2SkillIds
            .map((skillId) => skillsMap[skillId])
            .filter(Boolean) as Skill[];

        const preferredSkills = draftPredefinedSkills.length > 0
            ? draftPredefinedSkills
            : restoredPredefinedSkills;

        step2Form.reset(step2Values);
        step3Form.reset(step3Values);
        setSelectedSkills(uniqueSkills(preferredSkills));
    }, [freelancerProfile, profile, step1Form, step2Form, step3Form, user?.id]);

    // Block navigation away from onboarding until complete
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const totalSteps = 3;

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

    const selectedSkillCount = selectedSkills.length;

    useEffect(() => {
        const sub1 = step1Form.watch((value) => {
            if (user?.id) localStorage.setItem(`freelancer_draft_1_${user.id}`, JSON.stringify(value));
        });
        const sub2 = step2Form.watch((value) => {
            if (user?.id) localStorage.setItem(`freelancer_draft_2_${user.id}`, JSON.stringify(value));
        });
        const sub3 = step3Form.watch((value) => {
            if (user?.id) localStorage.setItem(`freelancer_draft_3_${user.id}`, JSON.stringify(value));
        });
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
            sub3.unsubscribe();
        };
    }, [step1Form.watch, step2Form.watch, step3Form.watch, user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        localStorage.setItem(
            `freelancer_draft_2_skills_${user.id}`,
            JSON.stringify(selectedSkills.map((skill) => skill.id))
        );
    }, [selectedSkills, user?.id]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showToast(t.common.invalidFileType, 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(t.common.fileTooLarge, 'error');
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const toggleSkill = (skill: Skill) => {
        if (selectedSkills.find((s) => s.id === skill.id)) {
            setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
        } else if (selectedSkills.length < 15) {
            setSelectedSkills([...selectedSkills, skill]);
        } else {
            showToast(t.onboarding.freelancer.maxSkills || 'Max 5 skills', 'warning');
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
    };

    const onStep1Submit = async (data: Step1FormData) => {
        if (!user) {
            showToast(t.common.error, 'error');
            return;
        }

        setIsLoading(true);
        let shouldAdvance = false;

        try {
            const profileUpdate: {
                full_name: string;
                location: string;
                user_type: 'freelancer' | 'both';
                avatar_url?: string;
            } = {
                full_name: data.full_name,
                location: data.location,
                user_type: profile?.user_type === 'client' || profile?.user_type === 'both' ? 'both' : 'freelancer',
            };

            if (avatarFile) {
                try {
                    const fileExt = avatarFile.name.split('.').pop();
                    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

                    const avatarUrl = await uploadFile('avatars', filePath, avatarFile);

                    profileUpdate.avatar_url = avatarUrl;
                    logger.log('[Onboarding] Avatar uploaded:', avatarUrl);
                } catch (avatarErr) {
                    logger.warn('[Onboarding] Avatar upload failed, continuing:', avatarErr);
                    showToast(
                        isMissingStorageBucketError(avatarErr)
                            ? getStorageConfigErrorMessage('avatars')
                            : t.common.uploadFailed || 'Avatar upload failed',
                        'warning'
                    );
                }
            }

            logger.log('[Onboarding] STEP 1: Updating profile via Supabase client...');
            const normalizedPhone = normalizeOptionalPhone(data.phone);
            const baseProfilePayload = {
                full_name: profileUpdate.full_name,
                location: profileUpdate.location,
                bio: data.bio,
                user_type: profileUpdate.user_type,
                ...(profileUpdate.avatar_url ? {
                    avatar_url: profile?.avatar_url || profileUpdate.avatar_url,
                    avatar_url_freelancer: profileUpdate.avatar_url,
                } : {}),
                updated_at: new Date().toISOString(),
            };

            const trySaveProfile = async (payload: Record<string, unknown>) => {
                try {
                    await updateProfileWithTimeout(
                        user.id,
                        {
                            ...payload,
                            phone: normalizedPhone,
                        }
                    );
                    return null;
                } catch (error) {
                    return error;
                }
            };

            let profileSaveError = await trySaveProfile(baseProfilePayload);

            if (
                profileSaveError
                && isSchemaCacheMissingColumnError(profileSaveError, 'profiles')
                && profileUpdate.avatar_url
            ) {
                logger.warn('[Onboarding] Missing avatar mode columns, retrying with legacy avatar_url only.');
                profileSaveError = await trySaveProfile({
                    full_name: profileUpdate.full_name,
                    location: profileUpdate.location,
                    bio: data.bio,
                    user_type: profileUpdate.user_type,
                    avatar_url: profileUpdate.avatar_url,
                    updated_at: new Date().toISOString(),
                });
            }

            if (profileSaveError) {
                const profileUpdateError = profileSaveError;
                if (!isPhoneUniqueViolation(profileUpdateError)) {
                    throw profileUpdateError;
                }

                const phoneTakenMessage = tx(
                    'onboarding.freelancer.phoneTaken',
                    undefined,
                    'This phone number is already in use by another account. Please use a different number.'
                );
                step1Form.setError('phone', { type: 'server', message: phoneTakenMessage });
                showToast(phoneTakenMessage, 'error');
                return;
            }
            logger.log('[Onboarding] Profile saved to Supabase!');

            logger.log('[Onboarding] Saving freelancer profile via Supabase client upsert...');
            try {
                await upsertFreelancerProfileWithTimeout(
                    {
                        id: user.id,
                        title: data.title,
                        updated_at: new Date().toISOString(),
                    }
                );
            } catch (freelancerUpsertErr) {
                if (!isRlsInsertViolation(freelancerUpsertErr)) throw freelancerUpsertErr;

                logger.warn('[Onboarding] Upsert blocked by RLS; retrying via RPC bootstrap + PATCH update...');
                await ensureFreelancerProfileExists(
                    profile?.user_type === 'both' ? 'both' : 'freelancer'
                );
                await updateFreelancerProfileWithTimeout(
                    user.id,
                    {
                        title: data.title,
                        updated_at: new Date().toISOString(),
                    }
                );
            }
            logger.log('[Onboarding] Freelancer profile saved!');

            shouldAdvance = true;
        } catch (error) {
            logger.error('Step 1 error:', error);
            const message =
                error instanceof Error && error.message === 'TIMEOUT'
                    ? (t.onboarding.freelancer.serverConnectionFailed || 'Failed to connect to server. Check your internet connection and try again.')
                    : error instanceof Error
                        ? error.message
                        : t.common.error;
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }

        if (shouldAdvance) {
            showToast(t.onboarding.freelancer.basicInfoSaved || 'Basic info saved', 'success');
            setStep(2);
        }
    };

    const onStep2Submit = async (data: Step2FormData) => {
        if (selectedSkills.length === 0) {
            showToast(t.onboarding.freelancer.selectAtLeastOneSkill || 'Please select at least one skill', 'warning');
            return;
        }

        if (!user) {
            showToast(t.common.error, 'error');
            return;
        }

        setIsLoading(true);
        let shouldAdvance = false;
        try {
            logger.log('[Onboarding] Step 2: Saving core freelancer setup...');

            const skillsData = {
                skills: selectedSkills.map((s) => skillToEntry(s)),
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
                availability: data.availability as 'available' | 'busy' | 'offline',
            };

            try {
                try {
                    await upsertFreelancerProfileWithTimeout(
                        {
                            id: user.id,
                            skills: skillsData.skills,
                            hourly_rate: skillsData.hourly_rate,
                            availability: skillsData.availability,
                            updated_at: new Date().toISOString(),
                        }
                    );
                } catch (freelancerUpsertErr) {
                    if (!isRlsInsertViolation(freelancerUpsertErr)) throw freelancerUpsertErr;

                    logger.warn('[Onboarding] Step 2 upsert blocked by RLS; retrying via RPC bootstrap + PATCH update...');
                    await ensureFreelancerProfileExists(
                        profile?.user_type === 'both' ? 'both' : 'freelancer'
                    );
                    await updateFreelancerProfileWithTimeout(
                        user.id,
                        {
                            skills: skillsData.skills,
                            hourly_rate: skillsData.hourly_rate,
                            availability: skillsData.availability,
                            updated_at: new Date().toISOString(),
                        }
                    );
                }
                logger.log('[Onboarding] Skills saved!');
            } catch (skillsErr) {
                const msg = skillsErr instanceof Error ? skillsErr.message : String(skillsErr);
                logger.error('[Onboarding] Skills save FAILED:', skillsErr);
                if (msg === 'TIMEOUT') {
                    throw new Error(t.onboarding.freelancer.connectionFailed || 'Connection failed. Check your internet connection and try again.');
                }
                throw new Error(t.onboarding.freelancer.skillsSaveFailed || `Failed to save skills: ${msg}`);
            }
            shouldAdvance = true;
        } catch (error) {
            logger.error('Step 2 error:', error);
            const errorMessage = error instanceof Error ? error.message : t.common.error;
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }

        if (shouldAdvance) {
            setStep(3);
            showToast(tx('onboarding.freelancer.step2Saved', undefined, 'Skills and rate saved'), 'success');
        }
    };

    const onStep3Submit = async (data: FreelancerStep3FormData) => {
        if (!user) {
            showToast(t.common.error, 'error');
            return;
        }

        setIsLoading(true);
        let shouldNavigate = false;
        let skippedAdvancedFields = false;
        try {
            const missingColumnsCacheKey = 'schema_missing:freelancer_profiles:advanced_fields';
            const skipAdvancedWrite = typeof window !== 'undefined' && sessionStorage.getItem(missingColumnsCacheKey) === '1';

            const detailsPayload = {
                years_experience: parseOptionalNumber(data.years_experience),
                tools: parseCsv(data.tools),
                industries: parseCsv(data.industries),
                portfolio_links: parseCsv(data.portfolio_links),
                weekly_availability_hours: parseOptionalNumber(data.weekly_availability_hours),
                revision_policy: normalizeOptionalText(data.revision_policy),
                project_preferences: {
                    summary: normalizeOptionalText(data.project_preferences),
                },
                updated_at: new Date().toISOString(),
            };

            if (skipAdvancedWrite) {
                skippedAdvancedFields = true;
            } else {
                try {
                    await upsertFreelancerProfileWithTimeout({
                        id: user.id,
                        ...detailsPayload,
                    });
                    if (typeof window !== 'undefined') sessionStorage.removeItem(missingColumnsCacheKey);
                } catch (freelancerUpsertErr) {
                    if (isSchemaCacheMissingColumnError(freelancerUpsertErr, 'freelancer_profiles')) {
                        logger.warn('[Onboarding] Step 3 advanced fields skipped (missing DB columns):', freelancerUpsertErr);
                        skippedAdvancedFields = true;
                        if (typeof window !== 'undefined') sessionStorage.setItem(missingColumnsCacheKey, '1');
                    } else if (isRlsInsertViolation(freelancerUpsertErr)) {
                        await ensureFreelancerProfileExists(
                            profile?.user_type === 'both' ? 'both' : 'freelancer'
                        );
                        try {
                            await updateFreelancerProfileWithTimeout(
                                user.id,
                                detailsPayload
                            );
                            if (typeof window !== 'undefined') sessionStorage.removeItem(missingColumnsCacheKey);
                        } catch (freelancerUpdateErr) {
                            if (isSchemaCacheMissingColumnError(freelancerUpdateErr, 'freelancer_profiles')) {
                                logger.warn('[Onboarding] Step 3 advanced fields skipped after RLS fallback (missing DB columns):', freelancerUpdateErr);
                                skippedAdvancedFields = true;
                                if (typeof window !== 'undefined') sessionStorage.setItem(missingColumnsCacheKey, '1');
                            } else {
                                throw freelancerUpdateErr;
                            }
                        }
                    } else {
                        throw freelancerUpsertErr;
                    }
                }
            }

            await updateProfileWithTimeout(
                user.id,
                {
                    freelancer_onboarding_completed: true,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                }
            );

            void Promise.race([
                refreshProfile(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)),
            ]).catch((e) => logger.warn('Profile refresh failed:', e));

            if (user?.id) {
                localStorage.removeItem(`freelancer_draft_1_${user.id}`);
                localStorage.removeItem(`freelancer_draft_2_${user.id}`);
                localStorage.removeItem(`freelancer_draft_3_${user.id}`);
                localStorage.removeItem(`freelancer_draft_2_skills_${user.id}`);
            }

            shouldNavigate = true;
        } catch (error) {
            logger.error('Step 3 error:', error);
            const errorMessage = error instanceof Error ? error.message : t.common.error;
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }

        if (shouldNavigate) {
            if (skippedAdvancedFields) {
                showToast(
                    tx(
                        'onboarding.freelancer.advancedFieldsPendingMigration',
                        undefined,
                        'Profile completed, but advanced fields will sync after the latest database migration is applied.'
                    ),
                    'warning'
                );
            }
            showToast(t.onboarding.freelancer.welcomeToast || 'Welcome to WorkedIn!', 'success');
            navigate('/freelancer/dashboard');
        }
    };

    if (isAuthLoading) {
        return (
            <FullScreenLoader
                label={t.common?.loading || 'جاري التحميل...'}
                hint={tx('onboarding.freelancer.loadingHint', undefined, 'Preparing your freelancer onboarding workspace')}
            />
        );
    }

    const steps = [
        {
            id: 1,
            title: t.onboarding.freelancer.stepBasicInfo || 'Basic information',
            description: tx('onboarding.freelancer.step1Description', undefined, 'Create a stronger first impression with your headline, location, phone, and intro.'),
        },
        {
            id: 2,
            title: tx('onboarding.freelancer.step2TitleUpdated', undefined, 'Skills, hourly rate, and availability'),
            description: tx('onboarding.freelancer.step2Description', undefined, 'Choose clear services, set a realistic hourly rate, and define your current availability.'),
        },
        {
            id: 3,
            title: tx('onboarding.freelancer.step3Title', undefined, 'Profile details and proof'),
            description: tx('onboarding.freelancer.step3Description', undefined, 'Select tools and industries, then add portfolio links and delivery terms clients care about before hiring.'),
        },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
            <SEO {...SEO_CONFIG.freelancerOnboarding} url="/onboarding/freelancer" noIndex />
            <Header />

            <OnboardingShell
                role="freelancer"
                badge={tx('onboarding.freelancer.badge', undefined, 'Freelancer onboarding')}
                title={t.onboarding.freelancer.welcome}
                description={tx('onboarding.freelancer.heroDescription', undefined, 'Build a profile clients can trust quickly: start with your visible identity, then define the skills and availability that shape your first opportunities.')}
                currentStep={step}
                totalSteps={totalSteps}
                steps={steps}
                main={
                    <div className="animate-fade-in">
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
                            <>
                                <OnboardingStep2
                                    form={step2Form}
                                    onSubmit={onStep2Submit}
                                    onBack={() => setStep(1)}
                                    isLoading={isLoading}
                                    selectedSkills={selectedSkills}
                                    selectedSkillCount={selectedSkillCount}
                                    toggleSkill={toggleSkill}
                                    getSkillName={getSkillName}
                                    maxSkills={15}
                                />
                            </>
                        )}
                        {step === 3 && (
                            <OnboardingStep3
                                form={step3Form}
                                onSubmit={onStep3Submit}
                                onBack={() => setStep(2)}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                }
                aside={
                    <div className="space-y-6">
                        <div className="relative bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-2xl p-6">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -z-10" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                                {tx('onboarding.freelancer.summaryBadge', undefined, 'Why this matters')}
                            </p>
                            <h3 className="mt-3 text-xl font-bold text-white">
                                {tx('onboarding.freelancer.summaryTitle', undefined, 'Clients decide in seconds')}
                            </h3>
                            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                                {tx('onboarding.freelancer.summaryDescription', undefined, 'A stronger first profile creates better trust, better proposal odds, and cleaner matching before your portfolio is even explored.')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    icon: 'Briefcase',
                                    title: tx('onboarding.freelancer.summaryPoint1', undefined, 'Use a clear professional title'),
                                    description: tx('onboarding.freelancer.summaryPoint1Desc', undefined, 'Your title is the fastest cue clients use to understand whether you fit the work.'),
                                },
                                {
                                    icon: 'Zap',
                                    title: tx('onboarding.freelancer.summaryPoint2', undefined, 'Choose skills carefully'),
                                    description: tx('onboarding.freelancer.summaryPoint2Desc', undefined, 'A smaller, more relevant skill stack usually performs better than a noisy one.'),
                                },
                                {
                                    icon: 'DollarSign',
                                    title: tx('onboarding.freelancer.summaryPoint3', undefined, 'Set a believable starting rate'),
                                    description: tx('onboarding.freelancer.summaryPoint3Desc', undefined, 'Your first rate should feel credible for your current profile depth and market position.'),
                                },
                            ].map((item) => {
                                const IconComponent = item.icon === 'Briefcase' ? Briefcase : item.icon === 'Zap' ? Zap : DollarSign;
                                return (
                                    <div key={item.title} className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 group">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                                <IconComponent className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                                <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                }
            />
        </div>
    );
}

async function runTimedSupabaseOperation<T>(
    operation: Promise<T>,
    operationName: string,
    timeoutMs: number = 15000
) {
    try {
        return await withTimeout(operation, timeoutMs, operationName);
    } catch (error) {
        if (error instanceof Error && error.message.includes('timed out after')) {
            throw new Error('TIMEOUT');
        }
        throw error;
    }
}

async function updateProfileWithTimeout(
    userId: string,
    body: Record<string, unknown>,
    timeoutMs: number = 15000
) {
    await runTimedSupabaseOperation(
        supabaseWithRetry(() =>
            supabase
                .from('profiles')
                .update(body)
                .eq('id', userId)
        ),
        'freelancer onboarding profile update',
        timeoutMs
    );
}

async function updateFreelancerProfileWithTimeout(
    userId: string,
    body: Record<string, unknown>,
    timeoutMs: number = 15000
) {
    await runTimedSupabaseOperation(
        supabaseWithRetry(() =>
            supabase
                .from('freelancer_profiles')
                .update(body)
                .eq('id', userId)
        ),
        'freelancer onboarding freelancer profile update',
        timeoutMs
    );
}

async function upsertFreelancerProfileWithTimeout(
    body: Record<string, unknown>,
    timeoutMs: number = 15000
) {
    await runTimedSupabaseOperation(
        supabaseWithRetry(() =>
            supabase.from('freelancer_profiles').upsert(body, {
                onConflict: 'id',
            })
        ),
        'freelancer onboarding freelancer profile upsert',
        timeoutMs
    );
}

function isRlsInsertViolation(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
    return code === '42501' || error.message.includes('42501') || error.message.includes('row-level security policy');
}

function normalizeOptionalText(value: string | undefined): string | undefined {
    const trimmed = value?.trim() || '';
    return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function uniqueSkills(skills: Skill[]): Skill[] {
    const seen = new Set<string>();
    const unique: Skill[] = [];

    for (const skill of skills) {
        if (seen.has(skill.id)) continue;
        seen.add(skill.id);
        unique.push(skill);
    }

    return unique;
}

function parseCsv(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function toCsv(value: unknown): string {
    if (!Array.isArray(value)) return '';
    return value.filter((item) => typeof item === 'string').join(', ');
}

function isPhoneUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeCode = 'code' in error && typeof error.code === 'string' ? error.code : '';
    const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';
    return maybeCode === '23505'
        && (maybeMessage.includes('profiles_phone_key') || maybeMessage.includes('phone'));
}

function isSchemaCacheMissingColumnError(error: unknown, tableName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return maybeMessage.includes('could not find')
        && maybeMessage.includes('column')
        && maybeMessage.includes('schema cache')
        && maybeMessage.includes(tableName.toLowerCase());
}

async function ensureFreelancerProfileExists(
    userType: 'freelancer' | 'both'
) {
    await runTimedSupabaseOperation(
        supabaseWithRetry(() =>
            supabase.rpc('set_user_type_rpc', {
                p_user_type: userType,
                p_active_mode: 'freelancer',
            })
        ),
        'freelancer onboarding bootstrap freelancer profile'
    );
}

export default FreelancerOnboarding;

