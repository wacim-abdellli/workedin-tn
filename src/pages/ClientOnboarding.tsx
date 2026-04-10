 import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, CheckCircle, FileText, Mail, MapPin, Phone, ShieldCheck, User, UserCheck } from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getStorageConfigErrorMessage, isMissingStorageBucketError, uploadFile } from '../lib/supabase';
import { GOVERNORATES } from '../types';
import type { Governorate } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CustomSelect from '../components/ui/CustomSelect';
import { FullScreenLoader } from '../components/ui';
import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { clientStep2Schema, type ClientStep2FormData } from '../components/onboarding/schemas';

function ClientOnboarding() {
    const { t, tx } = useTranslation();
    const { user, profile, refreshProfile, updateProfile, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const clientSchema = z.object({
        full_name: z.string().trim().min(3, 'Minimum 3 characters'),
        phone: z.string().trim().max(20, 'Maximum 20 characters').optional(),        
        location: z.string().trim().min(1, 'Required').refine(
            (val) => (GOVERNORATES as readonly string[]).includes(val),
            { message: 'Invalid location' }
        ),
        bio: z.string().trim().max(400, 'Maximum 400 characters').optional(),
    });

    type ClientFormData = z.infer<typeof clientSchema>;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
        },
    });

    const bio = watch('bio') || '';

    const {
        register: registerStep2,
        handleSubmit: handleSubmitStep2,
        reset: resetStep2,
        watch: watchStep2,
        formState: { errors: step2Errors },
    } = useForm<ClientStep2FormData>({
        resolver: zodResolver(clientStep2Schema),
        defaultValues: {
            company_name: profile?.company_name || '',
            company_website: profile?.company_website || '',
            company_industry: profile?.company_industry || '',
            company_size: profile?.company_size || '',
            company_role: profile?.company_role || '',
            hiring_needs: toCsv(profile?.hiring_needs),
            project_budget_preference: profile?.project_budget_preference || '',
            project_timeline_preference: profile?.project_timeline_preference || '',
            communication_preferences: stringifyRecord(profile?.communication_preferences),
            screening_preferences: stringifyRecord(profile?.screening_preferences),
            legal_preferences: stringifyRecord(profile?.legal_preferences),
        },
    });

    useEffect(() => {
        let values = {
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
        };

        let step2Values = {
            company_name: profile?.company_name || '',
            company_website: profile?.company_website || '',
            company_industry: profile?.company_industry || '',
            company_size: profile?.company_size || '',
            company_role: profile?.company_role || '',
            hiring_needs: toCsv(profile?.hiring_needs),
            project_budget_preference: profile?.project_budget_preference || '',
            project_timeline_preference: profile?.project_timeline_preference || '',
            communication_preferences: stringifyRecord(profile?.communication_preferences),
            screening_preferences: stringifyRecord(profile?.screening_preferences),
            legal_preferences: stringifyRecord(profile?.legal_preferences),
        };

        try {
            const draft1 = localStorage.getItem(`client_draft_1_${user?.id}`) || localStorage.getItem(`client_draft_${user?.id}`);
            const draft2 = localStorage.getItem(`client_draft_2_${user?.id}`);
            if (draft1) {
                values = { ...values, ...JSON.parse(draft1) };
            }
            if (draft2) {
                step2Values = { ...step2Values, ...JSON.parse(draft2) };
            }
        } catch (_e) {
            // Ignore invalid JSON in localStorage draft
        }
        reset(values);
        resetStep2(step2Values);
    }, [profile, reset, resetStep2, user?.id]);

    useEffect(() => {
        const sub1 = watch((value) => {
            if (user?.id) {
                localStorage.setItem(`client_draft_1_${user.id}`, JSON.stringify(value));
            }
        });
        const sub2 = watchStep2((value) => {
            if (user?.id) {
                localStorage.setItem(`client_draft_2_${user.id}`, JSON.stringify(value));
            }
        });
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
        };
    }, [watch, watchStep2, user?.id]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast(t.common.fileTooLarge || 'Image size should be less than 5MB', 'error');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onStep1Submit = async (data: ClientFormData) => {
        if (!user) {
            showToast(t.auth?.login || 'Please log in again', 'error');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        let shouldAdvance = false;

        try {
            let avatarUrl = undefined;
            if (avatarFile) {
                try {
                    avatarUrl = await uploadFile(
                        'avatars',
                        `${user.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`,
                        avatarFile
                    );
                } catch (avatarError) {
                    logger.warn('Client avatar upload failed, continuing without avatar:', avatarError);
                    showToast(
                        isMissingStorageBucketError(avatarError)
                            ? getStorageConfigErrorMessage('avatars')
                            : 'Avatar upload failed, but profile saved successfully',
                        'warning'
                    );
                }
            }

            const normalizedPhone = normalizeOptionalPhone(data.phone);
            const baseProfilePayload = {
                full_name: data.full_name,
                location: data.location,
                bio: data.bio,
                ...(avatarUrl ? {
                    avatar_url: profile?.avatar_url || avatarUrl,
                    avatar_url_client: avatarUrl,
                } : {}),
            };

            const trySaveProfile = async (payload: Record<string, unknown>) => {
                try {
                    await updateProfile({
                        ...payload,
                        phone: normalizedPhone,
                    });
                    return null;
                } catch (error) {
                    return error;
                }
            };

            let profileSaveError = await trySaveProfile(baseProfilePayload);

            if (profileSaveError && isSchemaCacheMissingColumnError(profileSaveError, 'profiles') && avatarUrl) {
                logger.warn('Client onboarding missing avatar mode columns, retrying with legacy avatar_url only.');
                profileSaveError = await trySaveProfile({
                    full_name: data.full_name,
                    location: data.location,
                    bio: data.bio,
                    avatar_url: avatarUrl,
                });
            }

            if (profileSaveError) {
                const profileUpdateError = profileSaveError;
                if (!isPhoneUniqueViolation(profileUpdateError)) {
                    throw profileUpdateError;
                }

                const phoneTakenMessage = tx(
                    'onboarding.client.phoneTaken',
                    undefined,
                    'This phone number is already in use by another account. Please use a different number.'
                );
                setError('phone', { type: 'server', message: phoneTakenMessage });
                showToast(phoneTakenMessage, 'error');
                return;
            }

            shouldAdvance = true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Client onboarding error:', error);

            if (msg.includes('timed out after')) {
                showToast(tx('onboarding.client.timeoutError', undefined, 'The request took too long. Please try again.'), 'error');
            } else {
                showToast(msg || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }

        if (shouldAdvance) {
            setStep(2);
            showToast(tx('onboarding.client.step1Saved', undefined, 'Basic details saved'), 'success');
        }
    };

    const onStep2Submit = async (data: ClientStep2FormData) => {
        if (!user) {
            showToast(t.auth?.login || 'Please log in again', 'error');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        let shouldNavigate = false;
        let skippedAdvancedFields = false;
        try {
            const missingColumnsCacheKey = 'schema_missing:profiles:client_advanced_fields';
            const skipAdvancedWrite = typeof window !== 'undefined' && sessionStorage.getItem(missingColumnsCacheKey) === '1';

            if (!skipAdvancedWrite) {
                try {
                    await updateProfile({
                        company_name: normalizeOptionalText(data.company_name),
                        company_website: normalizeOptionalText(data.company_website),
                        company_industry: normalizeOptionalText(data.company_industry),
                        company_size: normalizeOptionalText(data.company_size),
                        company_role: normalizeOptionalText(data.company_role),
                        hiring_needs: parseCsv(data.hiring_needs),
                        project_budget_preference: normalizeOptionalText(data.project_budget_preference),
                        project_timeline_preference: normalizeOptionalText(data.project_timeline_preference),
                        communication_preferences: { summary: normalizeOptionalText(data.communication_preferences) },
                        screening_preferences: { summary: normalizeOptionalText(data.screening_preferences) },
                        legal_preferences: { summary: normalizeOptionalText(data.legal_preferences) },
                        client_onboarding_completed: true,
                        onboarding_completed: true,
                    });
                    if (typeof window !== 'undefined') sessionStorage.removeItem(missingColumnsCacheKey);
                } catch (advancedFieldsError) {
                    if (!isSchemaCacheMissingColumnError(advancedFieldsError, 'profiles')) {
                        throw advancedFieldsError;
                    }

                    skippedAdvancedFields = true;
                    if (typeof window !== 'undefined') sessionStorage.setItem(missingColumnsCacheKey, '1');
                    logger.warn('Client advanced profile fields skipped (missing DB columns):', advancedFieldsError);

                    await updateProfile({
                        client_onboarding_completed: true,
                        onboarding_completed: true,
                    });
                }
            } else {
                skippedAdvancedFields = true;
                await updateProfile({
                    client_onboarding_completed: true,
                    onboarding_completed: true,
                });
            }

            void Promise.race([
                refreshProfile(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)),
            ]).catch((error) => logger.warn('Client profile refresh failed:', error));

            if (user?.id) {
                localStorage.removeItem(`client_draft_${user.id}`);
                localStorage.removeItem(`client_draft_1_${user.id}`);
                localStorage.removeItem(`client_draft_2_${user.id}`);
            }

            shouldNavigate = true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Client onboarding step 2 error:', error);
            showToast(msg || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }

        if (shouldNavigate) {
            if (skippedAdvancedFields) {
                showToast(
                    tx(
                        'onboarding.client.advancedFieldsPendingMigration',
                        undefined,
                        'Profile completed, but advanced company fields will sync after the latest database migration is applied.'
                    ),
                    'warning'
                );
            }
            showToast(tx('onboarding.client.welcomeToast', undefined, 'Welcome to WorkedIn!'), 'success');
            navigate('/client/dashboard');
        }
    };

    if (isAuthLoading) {
        return (
            <FullScreenLoader
                label={t.common.loading || 'Loading...'}
                hint={tx('onboarding.client.loadingHint', undefined, 'Preparing your client onboarding workspace')}
            />
        );
    }

    const steps = [
        {
            id: 1,
            title: tx('onboarding.client.stepTitle', undefined, 'Client profile'),
            description: tx('onboarding.client.stepDescription', undefined, 'Add the basics freelancers will rely on when they evaluate your brief.'),
        },
        {
            id: 2,
            title: tx('onboarding.client.step2Title', undefined, 'Company and hiring setup'),
            description: tx('onboarding.client.step2Description', undefined, 'Define who you are and how you hire so freelancers can tailor strong proposals.'),
        },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
            <SEO {...SEO_CONFIG.clientOnboarding} url="/onboarding/client" noIndex />
            <Header />

            <OnboardingShell
                role="client"
                badge="Client onboarding"
                title={t.onboarding.client.welcome}
                description="Complete your client profile with the information freelancers need before they decide to trust your project and submit a proposal."
                currentStep={step}
                totalSteps={2}
                steps={steps}
                main={
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E8820C]/10 to-amber-500/10 border border-[#E8820C]/30 rounded-full text-xs font-semibold uppercase tracking-wider text-[#E8820C]">
                                <User className="w-3.5 h-3.5" />
                                Client profile
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Give freelancers enough context to trust the brief.
                            </h2>
                            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                Use your real name, location, and a short intro so your profile feels credible before the first message is ever sent.
                            </p>
                        </div>

                        {step === 1 && (
                        <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-6">
                            {/* Avatar Upload */}
                <div className="flex flex-col items-center relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-8 shadow-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#E8820C]/5 rounded-full blur-3xl -z-10" />
                                
                                <div className="relative group">
                                    <div
                                        className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E8820C]/20 to-amber-500/20 dark:from-[#E8820C]/10 dark:to-amber-500/10 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-[#E8820C]/20 dark:border-[#E8820C]/30 shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                                        onClick={() => fileInputRef.current?.click()}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Upload profile photo"
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                    >
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-[#E8820C]" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-r from-[#E8820C] to-amber-500 text-white flex items-center justify-center shadow-lg shadow-[#E8820C]/30 hover:shadow-xl hover:shadow-[#E8820C]/40 hover:scale-110 transition-all duration-300 border-2 border-white dark:border-gray-800"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.gif"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                    A clear profile photo improves trust, but you can skip it for now.
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input
                                        {...register('full_name')}
                                        label={t.profile.fullName}
                                        placeholder={t.profile.fullNamePlaceholder}
                                        error={errors.full_name?.message}
                                        leftIcon={<User className="w-5 h-5" />}
                                    />
                                </div>

                                <div>
                                    <Input
                                        value={user?.email || ''}
                                        label="Email"
                                        leftIcon={<Mail className="w-5 h-5" />}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <Input
                                        {...register('phone')}
                                        label="Phone number"
                                        placeholder="Used for trust and follow-up"
                                        error={errors.phone?.message}
                                        leftIcon={<Phone className="w-5 h-5" />}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <CustomSelect
                                        name="location"
                                        label={t.profile.location}
                                        placeholder={t.profile.selectLocation}
                                        error={errors.location?.message}
                                        options={GOVERNORATES.map((gov: Governorate) => ({ value: gov, label: gov }))}
                                        variant="client"
                                        value={watch('location')}
                                        onChange={(value) => setValue('location', value, { shouldValidate: true })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Short introduction
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute left-0 top-0 flex items-center pl-4 pt-4 text-gray-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <textarea
                                            {...register('bio')}
                                            rows={5}
                                            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pl-11 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                            placeholder="Briefly explain what you build, your company context, or how you like to collaborate."
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>A short introduction helps freelancers understand the person behind the project.</span>
                                        <span>{bio.length}/400</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-[#E8820C] to-amber-500 hover:from-[#d4750a] hover:to-amber-600 shadow-lg shadow-[#E8820C]/30 hover:shadow-xl hover:shadow-[#E8820C]/40 transition-all duration-300 hover:scale-105"
                                    isLoading={isLoading}
                                    rightIcon={<CheckCircle className="w-5 h-5" />}
                                >
                                    {t.common.next}
                                </Button>
                            </div>
                        </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input {...registerStep2('company_name')} label={tx('profile.companyName', undefined, 'Company name')} error={step2Errors.company_name?.message} />
                                    <Input {...registerStep2('company_website')} label={tx('profile.companyWebsite', undefined, 'Company website')} placeholder="https://" error={step2Errors.company_website?.message} />
                                    <Input {...registerStep2('company_industry')} label={tx('profile.companyIndustry', undefined, 'Industry')} error={step2Errors.company_industry?.message} />
                                    <Input {...registerStep2('company_size')} label={tx('profile.companySize', undefined, 'Company size')} placeholder="1-10, 11-50, 51-200..." error={step2Errors.company_size?.message} />
                                    <Input {...registerStep2('company_role')} label={tx('profile.companyRole', undefined, 'Your role')} error={step2Errors.company_role?.message} />
                                    <Input {...registerStep2('hiring_needs')} label={tx('profile.hiringNeeds', undefined, 'Hiring needs (comma separated)')} placeholder="UI design, React development" error={step2Errors.hiring_needs?.message} />
                                    <Input {...registerStep2('project_budget_preference')} label={tx('profile.budgetPreference', undefined, 'Budget preference')} placeholder="Small tests first, then monthly retainer" error={step2Errors.project_budget_preference?.message} />
                                    <Input {...registerStep2('project_timeline_preference')} label={tx('profile.timelinePreference', undefined, 'Timeline preference')} placeholder="Need first draft in 7 days" error={step2Errors.project_timeline_preference?.message} />
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('profile.communicationPreferences', undefined, 'Communication preferences')}</label>
                                        <textarea {...registerStep2('communication_preferences')} rows={3} className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                                        {step2Errors.communication_preferences?.message && <p className="mt-1 text-xs text-red-500">{step2Errors.communication_preferences.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('profile.screeningPreferences', undefined, 'Screening preferences')}</label>
                                        <textarea {...registerStep2('screening_preferences')} rows={3} className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                                        {step2Errors.screening_preferences?.message && <p className="mt-1 text-xs text-red-500">{step2Errors.screening_preferences.message}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('profile.legalPreferences', undefined, 'Legal preferences')}</label>
                                        <textarea {...registerStep2('legal_preferences')} rows={3} className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                                        {step2Errors.legal_preferences?.message && <p className="mt-1 text-xs text-red-500">{step2Errors.legal_preferences.message}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" size="lg" className="px-8" onClick={() => setStep(1)}>{t.common.back}</Button>
                                    <Button type="submit" variant="primary" size="lg" className="flex-1 bg-gradient-to-r from-[#E8820C] to-amber-500 hover:from-[#d4750a] hover:to-amber-600" isLoading={isLoading}>{t.auth.completeProfile}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                }
                aside={
                    <div className="space-y-6">
                        <div className="relative bg-gradient-to-br from-[#E8820C]/10 to-amber-500/10 border border-[#E8820C]/30 rounded-2xl p-6">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8820C]/10 rounded-full blur-2xl -z-10" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#E8820C]">
                                Why this matters
                            </p>
                            <h3 className="mt-3 text-xl font-bold text-white">
                                Freelancers judge trust quickly
                            </h3>
                            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                                A complete first impression improves response quality before anyone even opens your full project brief.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { icon: UserCheck, title: 'Use a real visible name', description: 'A clear personal identity reduces hesitation from serious freelancers.' },
                                { icon: MapPin, title: 'Set your location', description: 'Helps with context, timezone expectations, and local trust.' },
                                { icon: FileText, title: 'Add a short intro', description: 'A brief note about your goals makes the brief feel more real and easier to answer.' },
                            ].map((item) => (
                                <div key={item.title} className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-xl p-4 hover:border-[#E8820C]/50 transition-all duration-300 group">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8820C] to-amber-500 shadow-lg shadow-[#E8820C]/30 group-hover:scale-110 transition-transform">
                                            <item.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white">{item.title}</p>
                                            <p className="mt-1 text-sm text-gray-400">{item.description}</p>
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

export default ClientOnboarding;

function normalizeOptionalPhone(phone: string | undefined): string | undefined {
    const trimmed = phone?.trim() || '';
    return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
    const trimmed = value?.trim() || '';
    return trimmed.length > 0 ? trimmed : undefined;
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

function stringifyRecord(value: unknown): string {
    if (!value || typeof value !== 'object') return '';
    const summary = 'summary' in value && typeof value.summary === 'string' ? value.summary : '';
    return summary;
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

