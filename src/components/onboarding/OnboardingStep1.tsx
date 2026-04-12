import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { User, Briefcase, Camera, ArrowRight, ArrowLeft, Phone, FileText } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import { getLocalizedGovernorateOptions } from '../../lib/governorates';
import { sanitizePhoneInput } from '../../lib/phone';
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
    const { t, tx, dir, language } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { register, formState: { errors }, handleSubmit, watch } = form;
    const bio = watch('bio') || '';
    const phoneField = register('phone');

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <User className="w-3.5 h-3.5" />
                    {t.settings.profile}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t.onboarding.freelancer.stepBasicInfo || 'Basic information'}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {tx('onboarding.freelancer.step1Description', undefined, 'Add the details clients will see first when deciding whether to trust your profile.')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-2xl p-8 shadow-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="relative group">
                        <div
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-500/10 dark:to-violet-500/10 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-purple-500/20 dark:border-purple-500/30 shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label={tx('onboarding.freelancer.uploadAvatar', undefined, 'Upload profile photo')}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt={tx('ui.avatar')} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-purple-400" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 border-2 border-white dark:border-gray-800"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.gif"
                            className="hidden"
                            onChange={onAvatarChange}
                        />
                    </div>
                    {avatarPreview && (
                        <button
                            type="button"
                            onClick={onRemoveAvatar}
                            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                            {t.common.removeImage}
                        </button>
                    )}
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
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
                            {...phoneField}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            onChange={(event) => {
                                event.target.value = sanitizePhoneInput(event.target.value);
                                phoneField.onChange(event);
                            }}
                            label={tx('profile.phone', undefined, 'Phone number')}
                            placeholder={tx('profile.phonePlaceholder', undefined, 'Used for trust and contact follow-up')}
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
                            options={getLocalizedGovernorateOptions(language)}
                            variant="freelancer"
                            value={watch('location')}
                            onChange={(value) => form.setValue('location', value)}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t.profile.bio || 'Short bio'}
                        </label>
                        <div className="relative group">
                            <div className="pointer-events-none absolute left-0 top-0 flex items-center pl-4 pt-4 text-gray-400 group-focus-within:text-purple-400 transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                {...register('bio')}
                                rows={5}
                                className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pl-11 text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder={t.profile.bioPlaceholder || 'Tell clients what you do best, who you help, and how you usually work.'}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{tx('profile.bioHint', undefined, 'A short summary improves credibility and response quality.')}</span>
                            <span className={`font-medium ${bio.length > 350 ? 'text-purple-400' : ''}`}>{bio.length}/400</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
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
