 import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { FullScreenLoader } from '../components/ui';
import {
    step1Schema,
    type Step1FormData,
    step2Schema,
    type Step2FormData,
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

        try {
            const draft1 = localStorage.getItem(`freelancer_draft_1_${user?.id}`);
            const draft2 = localStorage.getItem(`freelancer_draft_2_${user?.id}`);
            if (draft1) {
                step1Values = { ...step1Values, ...JSON.parse(draft1) };
            }
            if (draft2) {
                step2Values = { ...step2Values, ...JSON.parse(draft2) };
            }
        } catch {
            // Ignore invalid JSON in localStorage draft
        }

        step1Form.reset(step1Values);
        step2Form.reset(step2Values);
        const skillsMap = Object.fromEntries(PREDEFINED_SKILLS.map((skill) => [skill.id, skill]));
        const existingSkills = (freelancerProfile?.skills || [])
            .map((skill) => {
                if ('name_ar' in skill) return skill as Skill;
                return entryToSkill(skill as SkillEntry, skillsMap);
            })
            .filter(Boolean) as Skill[];

        setSelectedSkills(existingSkills);
    }, [freelancerProfile, profile, step1Form, step2Form]);

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

    const totalSteps = 2;

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

    useEffect(() => {
        const sub1 = step1Form.watch((value) => {
            if (user?.id) localStorage.setItem(`freelancer_draft_1_${user.id}`, JSON.stringify(value));
        });
        const sub2 = step2Form.watch((value) => {
            if (user?.id) localStorage.setItem(`freelancer_draft_2_${user.id}`, JSON.stringify(value));
        });
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
        };
    }, [step1Form.watch, step2Form.watch, user?.id]);

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
        } else if (selectedSkills.length < 5) {
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

                    const avatarUrl = await Promise.race([
                        uploadFile('avatars', filePath, avatarFile),
                        new Promise<string>((_, reject) =>
                            setTimeout(() => reject(new Error('Avatar upload timeout')), 10000)
                        ),
                    ]);

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
            await updateProfileWithTimeout(
                user.id,
                {
                    full_name: profileUpdate.full_name,
                    phone: data.phone,
                    location: profileUpdate.location,
                    bio: data.bio,
                    user_type: profileUpdate.user_type,
                    avatar_url: profileUpdate.avatar_url,
                    updated_at: new Date().toISOString(),
                }
            );
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
        let shouldNavigate = false;
        try {
            logger.log('[Onboarding] Step 2: Saving skills and completing onboarding...');

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

            logger.log('[Onboarding] Marking onboarding as complete...');
            await updateProfileWithTimeout(
                user.id,
                {
                    freelancer_onboarding_completed: true,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                }
            );
            logger.log('[Onboarding] Onboarding marked complete!');

            void Promise.race([
                refreshProfile(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)),
            ]).catch((e) => logger.warn('Profile refresh failed:', e));

            if (user?.id) {
                localStorage.removeItem(`freelancer_draft_1_${user.id}`);
                localStorage.removeItem(`freelancer_draft_2_${user.id}`);
            }

            shouldNavigate = true;
        } catch (error) {
            logger.error('Step 2 error:', error);
            const errorMessage = error instanceof Error ? error.message : t.common.error;
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }

        if (shouldNavigate) {
            showToast(t.onboarding.freelancer.welcomeToast || 'Welcome to WorkedIn!', 'success');
            navigate('/freelancer/dashboard');
        }
    };

    if (isAuthLoading) {
        return (
            <FullScreenLoader
                label={t.common?.loading || 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...'}
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
            title: t.onboarding.freelancer.stepSkillsExperience || 'Skills and experience',
            description: tx('onboarding.freelancer.step2Description', undefined, 'Choose the skills and availability clients will use to evaluate your fit.'),
        },
    ];

    return (
        <div className="page-shell bg-[var(--color-bg-subtle)] dark:bg-[var(--color-bg-base)] overflow-hidden relative transition-colors duration-300">
            <SEO {...SEO_CONFIG.freelancerOnboarding} url="/onboarding/freelancer" noIndex />
            <Header />

            <OnboardingShell
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
                                    toggleSkill={toggleSkill}
                                    getSkillName={getSkillName}
                                />
                                <div className="mt-6 text-center text-sm text-muted">
                                    <p>{t.onboarding.freelancer.completeLaterHint || 'You can add certificates, portfolio, and additional profile details later from Settings.'}</p>
                                </div>
                            </>
                        )}
                    </div>
                }
                aside={
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-brand-light">
                                {tx('onboarding.freelancer.summaryBadge', undefined, 'Why this matters')}
                            </p>
                            <h3 className="mt-3 text-xl font-semibold text-[#171420] dark:text-white">
                                {tx('onboarding.freelancer.summaryTitle', undefined, 'Clients decide in seconds')}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                {tx('onboarding.freelancer.summaryDescription', undefined, 'A stronger first profile creates better trust, better proposal odds, and cleaner matching before your portfolio is even explored.')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    title: tx('onboarding.freelancer.summaryPoint1', undefined, 'Use a clear professional title'),
                                    description: tx('onboarding.freelancer.summaryPoint1Desc', undefined, 'Your title is the fastest cue clients use to understand whether you fit the work.'),
                                },
                                {
                                    title: tx('onboarding.freelancer.summaryPoint2', undefined, 'Choose skills carefully'),
                                    description: tx('onboarding.freelancer.summaryPoint2Desc', undefined, 'A smaller, more relevant skill stack usually performs better than a noisy one.'),
                                },
                                {
                                    title: tx('onboarding.freelancer.summaryPoint3', undefined, 'Set a believable starting rate'),
                                    description: tx('onboarding.freelancer.summaryPoint3Desc', undefined, 'Your first rate should feel credible for your current profile depth and market position.'),
                                },
                            ].map((item, index) => (
                                <div key={item.title} className="rounded-2xl border border-brand-light/70 bg-brand-light/30 p-4 dark:border-[var(--color-border-subtle)]">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#171420] dark:text-white">{item.title}</p>
                                            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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

