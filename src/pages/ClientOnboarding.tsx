import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, CheckCircle, FileText, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getStorageConfigErrorMessage, isMissingStorageBucketError, uploadFile } from '../lib/supabase';
import { GOVERNORATES } from '../types';
import type { Governorate } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import OnboardingShell from '../components/onboarding/OnboardingShell';

function ClientOnboarding() {
    const { t, tx } = useTranslation();
    const { user, profile, refreshProfile, updateProfile, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
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

    useEffect(() => {
        let values = {
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
        };
        try {
            const draft = localStorage.getItem(`client_draft_${user?.id}`);
            if (draft) {
                values = { ...values, ...JSON.parse(draft) };
            }
        } catch (e) {}
        reset(values);
    }, [profile, reset, user?.id]);

    useEffect(() => {
        const subscription = watch((value) => {
            if (user?.id) {
                localStorage.setItem(`client_draft_${user.id}`, JSON.stringify(value));
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, user?.id]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

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

    const onSubmit = async (data: ClientFormData) => {
        if (!user) {
            showToast(t.auth?.login || 'Please log in again', 'error');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        let shouldNavigate = false;

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

            await updateProfile({
                full_name: data.full_name,
                phone: data.phone,
                location: data.location,
                bio: data.bio,
                avatar_url: avatarUrl,
                client_onboarding_completed: true,
                onboarding_completed: true,
            });

            void Promise.race([
                refreshProfile(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)),
            ]).catch((error) => logger.warn('Client profile refresh failed:', error));

            if (user?.id) {
                localStorage.removeItem(`client_draft_${user.id}`);
            }

            shouldNavigate = true;
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

        if (shouldNavigate) {
            showToast(tx('onboarding.client.welcomeToast', undefined, 'Welcome to Khedma!'), 'success');
            navigate('/client/dashboard');
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
                <img src="/logos/logo-primary.svg" alt="Khedma TN" className="h-12 w-auto mb-6 animate-pulse" />
                <div className="w-12 h-12 border-4 border-secondary-100 border-t-secondary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-muted font-medium animate-pulse">{t.common.loading || 'Loading...'}</p>
            </div>
        );
    }

    const steps = [
        {
            id: 1,
            title: tx('onboarding.client.stepTitle', undefined, 'Client profile'),
            description: tx('onboarding.client.stepDescription', undefined, 'Add the basics freelancers will rely on when they evaluate your brief.'),
        },
    ];

    return (
        <div className="page-shell bg-[#f6f3ff] dark:bg-[#0b0a12] overflow-hidden relative transition-colors duration-300">
            <SEO {...SEO_CONFIG.clientOnboarding} url="/onboarding/client" noIndex />
            <Header />

            <OnboardingShell
                badge={tx('onboarding.client.badge', undefined, 'Client onboarding')}
                title={t.onboarding.client.welcome}
                description={tx('onboarding.client.heroDescription', undefined, 'Complete the client profile with the information freelancers need before they decide to trust your project and submit a proposal.')}
                currentStep={1}
                totalSteps={1}
                steps={steps}
                main={
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                                <User className="w-3.5 h-3.5" />
                                {tx('onboarding.client.profileTitle', undefined, 'Client profile')}
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                {tx('onboarding.client.profileHeadline', undefined, 'Give freelancers enough context to trust the brief.')}
                            </h2>
                            <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                                {tx('onboarding.client.profileSubheadline', undefined, 'Use your real name, location, and a short intro so your profile feels credible before the first message is ever sent.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="flex flex-col items-center rounded-[1.6rem] border border-primary-100/70 bg-primary-50/40 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                                <div className="relative group">
                                    <div
                                        className="w-28 h-28 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white dark:border-dark-700 shadow-xl group-hover:shadow-2xl transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={tx('onboarding.client.uploadAvatar', undefined, 'Upload profile photo')}
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
                                <p className="mt-3 text-xs text-muted">
                                    {tx('onboarding.client.avatarHint', undefined, 'A clear profile photo improves trust, but you can skip it for now.')}
                                </p>
                            </div>

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
                                        label={tx('profile.email', undefined, 'Email')}
                                        leftIcon={<Mail className="w-5 h-5" />}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <Input
                                        {...register('phone')}
                                        label={tx('profile.phone', undefined, 'Phone number')}
                                        placeholder={tx('profile.phonePlaceholder', undefined, 'Used for trust and follow-up')}
                                        error={errors.phone?.message}
                                        leftIcon={<Phone className="w-5 h-5" />}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Select
                                        {...register('location')}
                                        label={t.profile.location}
                                        placeholder={t.profile.selectLocation}
                                        error={errors.location?.message}
                                        options={GOVERNORATES.map((gov: Governorate) => ({ value: gov, label: gov }))}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {tx('profile.about', undefined, 'Short introduction')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute start-0 top-0 flex items-center ps-4 pt-4 text-gray-400 dark:text-gray-500">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <textarea
                                            {...register('bio')}
                                            rows={5}
                                            className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 ps-11 text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white dark:placeholder:text-gray-600"
                                            placeholder={tx('profile.aboutPlaceholder', undefined, 'Briefly explain what you build, your company context, or how you like to collaborate.')}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-[#8b8aa0]">
                                        <span>{tx('profile.bioHint', undefined, 'A short introduction helps freelancers understand the person behind the project.')}</span>
                                        <span>{bio.length}/400</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full rounded-2xl"
                                    isLoading={isLoading}
                                    rightIcon={<CheckCircle className="w-5 h-5" />}
                                >
                                    {t.auth.completeProfile}
                                </Button>
                            </div>
                        </form>
                    </div>
                }
                aside={
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                {tx('onboarding.client.summaryBadge', undefined, 'Why this matters')}
                            </p>
                            <h3 className="mt-3 text-xl font-semibold text-[#171420] dark:text-white">
                                {tx('onboarding.client.summaryTitle', undefined, 'Freelancers judge trust quickly')}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                {tx('onboarding.client.summaryDescription', undefined, 'A complete first impression improves response quality before anyone even opens your full project brief.')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { icon: User, title: tx('onboarding.client.checklistName', undefined, 'Use a real visible name'), description: tx('onboarding.client.checklistNameDesc', undefined, 'A clear personal identity reduces hesitation from serious freelancers.') },
                                { icon: MapPin, title: tx('onboarding.client.checklistLocation', undefined, 'Set your location'), description: tx('onboarding.client.checklistLocationDesc', undefined, 'Helps with context, timezone expectations, and local trust.'), },
                                { icon: ShieldCheck, title: tx('onboarding.client.checklistIntro', undefined, 'Add a short intro'), description: tx('onboarding.client.checklistIntroDesc', undefined, 'A brief note about your goals makes the brief feel more real and easier to answer.') },
                            ].map((item) => (
                                <div key={item.title} className="rounded-2xl border border-primary-100/70 bg-primary-50/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white">
                                            <item.icon className="h-4 w-4" />
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

export default ClientOnboarding;
