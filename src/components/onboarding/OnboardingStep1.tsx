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
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
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
                <div className="flex flex-col items-center rounded-[1.6rem] border border-primary-100/70 bg-primary-50/40 p-6 dark:border-white/10 dark:bg-white/[0.03]">
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
                            onChange={onAvatarChange}
                        />
                    </div>
                    {avatarPreview && (
                        <button
                            type="button"
                            onClick={onRemoveAvatar}
                            className="mt-2 text-sm text-red-500 hover:text-red-600"
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
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t.profile.bio || 'Short bio'}
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute start-0 top-0 flex items-center ps-4 pt-4 text-gray-400 dark:text-gray-500">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                {...register('bio')}
                                rows={5}
                                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 ps-11 text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white dark:placeholder:text-gray-600"
                                placeholder={t.profile.bioPlaceholder || 'Tell clients what you do best, who you help, and how you usually work.'}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[#8b8aa0]">
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
