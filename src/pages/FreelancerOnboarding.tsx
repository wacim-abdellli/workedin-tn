import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, uploadFile, withTimeout } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import type { Skill } from '../types';
import { skillToEntry } from '../types';
import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
import {
    step1Schema,
    type Step1FormData,
    step2Schema,
    type Step2FormData,
} from '../components/onboarding/schemas';

function FreelancerOnboarding() {
    const { t, language } = useTranslation();
    const { user, session, profile, freelancerProfile, refreshProfile, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    // Fallback timer to show page even if AuthContext is stuck reconciling
    const [forceShow, setForceShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setForceShow(true), 1500);
        return () => clearTimeout(timer);
    }, []);

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
        step1Form.reset({
            full_name: profile?.full_name || '',
            title: freelancerProfile?.title || '',
            location: profile?.location || '',
        });

        step2Form.reset({
            hourly_rate: freelancerProfile?.hourly_rate ? String(freelancerProfile.hourly_rate) : '',
            availability: freelancerProfile?.availability || 'available',
        });
    }, [freelancerProfile, profile, step1Form, step2Form]);

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

        const { data: liveSessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            logger.error('[Onboarding] Failed to refresh auth session before step 1:', sessionError);
            showToast(t.onboarding.freelancer.noAuthSession || 'No auth session - please login again', 'error');
            return;
        }

        if (!(liveSessionData.session ?? session)) {
            showToast(t.onboarding.freelancer.noAuthSession || 'No auth session - please login again', 'error');
            return;
        }

        setIsLoading(true);

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
                }
            }

            logger.log('[Onboarding] STEP 1: Updating profile via Supabase client...');
            await updateProfileWithTimeout(
                user.id,
                {
                    full_name: profileUpdate.full_name,
                    location: profileUpdate.location,
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

            showToast(t.onboarding.freelancer.basicInfoSaved || 'Basic info saved', 'success');
            setStep(2);
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

        const { data: liveSessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            logger.error('[Onboarding] Failed to refresh auth session before step 2:', sessionError);
            showToast(t.onboarding.freelancer.noAuthSession || 'No auth session - please login again', 'error');
            return;
        }

        if (!(liveSessionData.session ?? session)) {
            showToast(t.onboarding.freelancer.noAuthSession || 'No auth session - please login again', 'error');
            return;
        }

        setIsLoading(true);
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
            try {
                await updateProfileWithTimeout(
                    user.id,
                    {
                        ...(typeof profile?.freelancer_onboarding_completed === 'boolean'
                            ? { freelancer_onboarding_completed: true }
                            : {}),
                        onboarding_completed: profile?.user_type === 'both'
                            ? Boolean(profile?.client_onboarding_completed)
                            : true,
                        updated_at: new Date().toISOString(),
                    },
                    20000
                );
                logger.log('[Onboarding] Onboarding marked complete!');
            } catch (completeErr) {
                const msg = completeErr instanceof Error ? completeErr.message : String(completeErr);
                logger.error('[Onboarding] Failed to mark complete:', completeErr);
                if (msg === 'TIMEOUT') {
                    throw new Error(t.onboarding.freelancer.completionFailed || 'Failed to complete onboarding. Please try again.');
                }
                throw new Error(t.onboarding.freelancer.completionFailed || `Failed to complete onboarding: ${msg}`);
            }

            void Promise.race([
                refreshProfile(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)),
            ]).catch((e) => logger.warn('Profile refresh failed:', e));

            showToast(t.onboarding.freelancer.welcomeToast || 'Welcome to Khedma!', 'success');
            navigate('/freelancer/dashboard');
        } catch (error) {
            logger.error('Step 2 error:', error);
            const errorMessage = error instanceof Error ? error.message : t.common.error;
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // If auth is strictly loading, show our enhanced loading state unless fallback fired
    if (isAuthLoading && !forceShow) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
                <img
                    src="/logos/logo-primary.svg"
                    alt="Khedma TN"
                    className="h-12 w-auto mb-6 animate-pulse"
                />
                <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-muted font-medium animate-pulse">{t.common?.loading || 'جاري التحميل...'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden relative transition-colors duration-300">
            <SEO {...SEO_CONFIG.freelancerOnboarding} url="/onboarding/freelancer" noIndex />
            <Header />

            <div className="container-custom py-12 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <img
                            src="/logos/logo-primary.svg"
                            alt="Khedma TN"
                            style={{ height: '32px', width: 'auto', margin: '0 auto 1rem' }}
                        />
                        <h1 className="heading-md mb-2">{t.onboarding.freelancer.welcome}</h1>
                        <p className="text-muted">{t.onboarding.freelancer.welcomeDesc}</p>
                    </div>

                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-3 text-sm font-medium text-dark-500">
                            <span>{t.onboarding.freelancer.stepCounter?.replace('{{step}}', String(step)).replace('{{total}}', String(totalSteps)) || `Step ${step} of ${totalSteps}`}</span>
                            <span className="text-primary-600 dark:text-primary-400">
                                {Math.round((step / totalSteps) * 100)}%
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary-500/30"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-muted">
                            <span className={`transition-colors duration-300 ${step >= 1 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}>
                                {t.onboarding.freelancer.stepBasicInfo || 'Basic information'}
                            </span>
                            <span className={`transition-colors duration-300 ${step >= 2 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}>
                                {t.onboarding.freelancer.stepSkillsExperience || 'Skills and experience'}
                            </span>
                        </div>
                    </div>

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

                    {step === 2 && (
                        <div className="mt-6 text-center text-sm text-muted">
                            <p>{t.onboarding.freelancer.completeLaterHint || 'You can add certificates, portfolio, and additional profile details later from Settings.'}</p>
                        </div>
                    )}
                </div>
            </div>
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
