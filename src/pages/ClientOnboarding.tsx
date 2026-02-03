import { logger } from '@/lib/logger';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building, CheckCircle, Camera, Briefcase } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { uploadFile } from '../lib/supabase';
import { GOVERNORATES } from '../types';
import type { Governorate } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Header } from '../components/layout';

function ClientOnboarding() {
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validation schema inside component to access t for messages
    // Or just generic messages if t is not available in schema definition normally.
    // Ideally schemas are outside but messages inside. 
    // Simplified: generic messages for now or use useMemo.

    const clientSchema = z.object({
        full_name: z.string().min(3, 'Minimum 3 characters'),
        company_name: z.string().optional(),
        location: z.string().min(1, 'Required'),
    });

    type ClientFormData = z.infer<typeof clientSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
    });

    // Handle avatar upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size must be less than 5MB', 'error');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: ClientFormData) => {
        setIsLoading(true);
        try {
            // Upload avatar if exists
            let avatarUrl = undefined;
            if (avatarFile && user) {
                const path = `${user.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
                avatarUrl = await uploadFile('avatars', path, avatarFile);
            }

            await updateProfile({
                full_name: data.full_name,
                location: data.location,
                bio: data.company_name ? `Company: ${data.company_name}` : undefined,
                avatar_url: avatarUrl,
                onboarding_completed: true, // Mark onboarding as complete
            });

            showToast(t.payment.success || 'Success!', 'success');
            navigate('/client/dashboard');
        } catch (error: any) {
            logger.error('Client onboarding error:', error);
            showToast(error.message || t.common.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden relative transition-colors duration-300">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 start-0 w-[500px] h-[500px] bg-secondary-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-secondary-500/5 rounded-full blur-[100px]" />
            </div>

            <Header />

            <div className="container-custom py-12 relative z-10">
                <div className="max-w-lg mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="heading-md mb-2">{t.onboarding.client.welcome} {t.howItWorks.brandName}</h1>
                        <p className="text-muted">{t.onboarding.client.welcomeDesc}</p>
                    </div>

                    <div className="card-glass shadow-xl dark:shadow-black/20 animate-fade-in p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/30">
                                <Briefcase className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t.onboarding.client.profileTitle}</h2>
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
                                        className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-secondary-600 text-white flex items-center justify-center shadow-lg hover:bg-secondary-700 hover:scale-110 transition-all border-2 border-white dark:border-dark-800"
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
                            </div>

                            <Input
                                {...register('full_name')}
                                label={t.profile.fullName}
                                placeholder={t.profile.fullNamePlaceholder}
                                error={errors.full_name?.message}
                                leftIcon={<User className="w-5 h-5" />}
                            />

                            <Input
                                {...register('company_name')}
                                label={`${t.profile.companyName} (${t.profile.optional})`}
                                placeholder={t.profile.companyNamePlaceholder}
                                leftIcon={<Building className="w-5 h-5" />}
                            />

                            <Select
                                {...register('location')}
                                label={t.profile.location}
                                placeholder={t.profile.selectLocation}
                                error={errors.location?.message}
                                options={GOVERNORATES.map((gov: Governorate) => ({ value: gov, label: gov }))}
                            />

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isLoading}
                                    rightIcon={<CheckCircle className="w-5 h-5" />}
                                >
                                    {t.auth.completeProfile}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientOnboarding;
