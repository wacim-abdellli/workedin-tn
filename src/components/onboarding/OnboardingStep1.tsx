import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { User, Briefcase, Camera, ArrowRight, ArrowLeft, Phone, FileText } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { GOVERNORATES } from '../../types';
import type { Step1FormData } from './schemas';

interface OnboardingStep1Props {
    form: UseFormReturn<Step1FormData>;
    onSubmit: (data: Step1FormData) => void;
    isLoading: boolean;
    avatarPreview: string | null;
    onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAvatar: () => void;
}

export default function OnboardingStep1({
    form,
    onSubmit,
    isLoading,
    avatarPreview,
    onAvatarChange,
    onRemoveAvatar,
}: OnboardingStep1Props) {
    const { t, tx, dir } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { register, formState: { errors }, handleSubmit, watch } = form;
    const bio = watch('bio') || '';

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-[var(--color-border-subtle)] dark:text-primary-200">
                    <User className="w-3.5 h-3.5" />
                    {t.settings.profile}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                    {t.onboarding.freelancer.stepBasicInfo || 'Basic information'}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                    {tx('onboarding.freelancer.step1Description', undefined, 'Add the details clients will see first when deciding whether to trust your profile.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center rounded-[1.6rem] border border-primary-100/70 bg-primary-50/40 p-6 dark:border-[var(--color-border-subtle)]">
                    <div className="relative group">
                        <div
                            className="w-28 h-28 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center overflow-hidden cursor-pointer border-4 border-[var(--color-bg-elevated)] shadow-xl group-hover:shadow-2xl transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-[var(--color-text-disabled)]" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--color-brand-primary-hover)] hover:scale-110 transition-all border-2 border-[var(--color-bg-elevated)]"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onAvatarChange}
                        />
                    </div>
                    {avatarPreview && (
                        <button
                            type="button"
                            onClick={onRemoveAvatar}
                            className="mt-2 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-sm text-[var(--color-error)] hover:text-[var(--color-error-dark)]"
                        >
                            {t.common.removeImage}
                        </button>
                    )}
                    <p className="mt-2 text-xs text-muted">
                        {t.common.skipForNow}
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

                    <div className="md:col-span-1">
                        <Input
                            {...register('title')}
                            label={tx('profile.headline', undefined, 'Professional title')}
                            placeholder={tx('profile.headlinePlaceholder', undefined, 'UI/UX Designer, Full-stack Developer...')}
                            error={errors.title?.message}
                            leftIcon={<Briefcase className="w-5 h-5" />}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <Input
                            {...register('phone')}
                            label={tx('profile.phone', undefined, 'Phone number')}
                            placeholder={tx('profile.phonePlaceholder', undefined, 'Used for trust and contact follow-up')}
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
                            options={GOVERNORATES.map((gov) => ({ value: gov, label: gov }))}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                            {t.profile.bio || 'Short bio'}
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute start-0 top-0 flex items-center ps-4 pt-4 text-[var(--color-text-disabled)]">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                {...register('bio')}
                                rows={5}
                                className="w-full resize-none rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-4 py-3 ps-11 text-[var(--color-text-primary)] shadow-sm transition-all duration-200 placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                                placeholder={t.profile.bioPlaceholder || 'Tell clients what you do best, who you help, and how you usually work.'}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                            <span>{tx('profile.bioHint', undefined, 'A short summary improves credibility and response quality.')}</span>
                            <span>{bio.length}/400</span>
                        </div>
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
    );
}
