import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { User, Briefcase, Camera, ArrowRight, ArrowLeft } from 'lucide-react';
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
}

export default function OnboardingStep1({
    form,
    onSubmit,
    isLoading,
    avatarPreview,
    onAvatarChange,
}: OnboardingStep1Props) {
    const { t, dir } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { register, formState: { errors }, handleSubmit } = form;

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <User className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{t.settings.profile}</h2>
                    <p className="text-muted text-sm">{t.onboarding.client.profileDesc}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-8">
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

                    <div className="md:col-span-2">
                        <Input
                            {...register('title')}
                            label={t.profile.bio || 'المسمى الوظيفي'}
                            placeholder={t.profile.bioPlaceholder}
                            error={errors.title?.message}
                            leftIcon={<Briefcase className="w-5 h-5" />}
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
